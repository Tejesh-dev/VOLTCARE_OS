import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, quotationTotals } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Printer, MessageCircle, Receipt, Pencil, ArrowLeft, Check, X } from "lucide-react";
import { VoltcareLogoLight } from "@/components/voltcare/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/quotations/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Quotation ${params.id} — Voltcare OS` },
      { name: "description", content: "Voltcare Electrical Solutions quotation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <QuotationDetail />
      </ClientGate>
    </AppShell>
  ),
});

function QuotationDetail() {
  const { id } = Route.useParams();
  const quotation = useVoltcare((s) => s.quotations.find((q) => q.id === id));
  const customer = useVoltcare((s) => quotation && s.customers.find((c) => c.id === quotation.customerId));
  const settings = useVoltcare((s) => s.settings);
  const genInvoice = useVoltcare((s) => s.generateInvoiceFromQuotation);
  const setGrand = useVoltcare((s) => s.setQuotationGrandOverride);
  const nav = useNavigate();

  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState<string>("");

  if (!quotation) return <div className="p-8 text-muted-foreground">Quotation not found.</div>;
  const t = quotationTotals(quotation);
  const hide = quotation.hidePrices;
  const isOverridden = typeof quotation.charges.grandOverride === "number";

  // Build a flat, floor→room grouped list for a single continuous table
  const groups = (quotation.floors.length ? quotation.floors : [undefined]).flatMap((floor) => {
    const roomsHere = quotation.rooms.filter((r) => (r.floor ?? undefined) === floor);
    if (roomsHere.length === 0) return [] as Array<{ floor?: string; room: (typeof roomsHere)[number] }>;
    return roomsHere.map((room) => ({ floor, room }));
  });

  const saveGrand = () => {
    const n = parseFloat(editVal);
    if (isNaN(n) || n < 0) return toast.error("Enter a valid amount");
    setGrand(quotation.id, n);
    setEditing(false);
    toast.success("Grand total updated");
  };
  const resetGrand = () => {
    setGrand(quotation.id, undefined);
    setEditing(false);
    toast.success("Grand total reset");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1000px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <Link to="/quotations" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary"><ArrowLeft className="h-4 w-4" /> All quotations</Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => nav({ to: "/services" })}><Pencil className="h-4 w-4" /> Edit</Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
          <Button variant="outline" className="gap-2" onClick={() => {
            const phone = customer?.phone.replace(/\D/g, "") ?? "";
            const msg = encodeURIComponent(`Hi ${customer?.name ?? ""}, please find the quotation ${quotation.number} from Voltcare Electrical Solutions. Grand Total: ${inr(t.grand)}.`);
            window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
          }}><MessageCircle className="h-4 w-4" /> Send via WhatsApp</Button>
          <Button className="gap-2" onClick={() => {
            const inv = genInvoice(quotation.id);
            if (inv) { toast.success("Invoice " + inv.number + " created"); nav({ to: "/invoices/$id", params: { id: inv.id } }); }
          }}><Receipt className="h-4 w-4" /> Convert to Invoice</Button>
        </div>
      </div>

      {/* Document */}
      <div className="print-page card-surface p-6 sm:p-8 md:p-12 bg-white">
        <div className="flex items-start justify-between border-b border-border pb-6 gap-4 flex-wrap">
          <VoltcareLogoLight />
          <div className="text-right text-[13px] text-muted-foreground">
            <div className="font-semibold text-foreground">{settings.company.website}</div>
            <div>{settings.company.phone}</div>
            <div>{settings.company.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
          <div>
            <div className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">Prepared For</div>
            <div className="mt-2 font-bold text-lg">{customer?.name ?? "—"}</div>
            <div className="text-muted-foreground text-sm">{customer?.phone}</div>
            {customer?.email && <div className="text-muted-foreground text-sm">{customer.email}</div>}
            {customer?.address && <div className="text-muted-foreground text-sm">{customer.address}</div>}
            {customer?.city && <div className="text-muted-foreground text-sm">{customer.city}</div>}
            {quotation.projectName && <div className="mt-2 text-sm"><span className="text-muted-foreground">Project: </span><span className="font-semibold">{quotation.projectName}</span></div>}
          </div>
          <div className="sm:text-right">
            <div className="text-[11px] text-muted-foreground font-semibold tracking-widest uppercase">Quotation Details</div>
            <div className="mt-2"><span className="text-muted-foreground text-sm">No: </span><span className="font-bold">{quotation.number}</span></div>
            <div><span className="text-muted-foreground text-sm">Date: </span><span className="font-semibold">{shortDate(quotation.createdAt)}</span></div>
            <div><span className="text-muted-foreground text-sm">Valid Till: </span><span className="font-semibold">{shortDate(new Date(quotation.createdAt).getTime() + 15 * 86400000)}</span></div>
          </div>
        </div>

        {/* Single continuous table with floor/room subheaders — column headers appear only once */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b-2 border-secondary">
                <th className="text-left py-2 w-8">#</th>
                <th className="text-left py-2">Service Point</th>
                <th className="text-center py-2 w-16">Qty</th>
                <th className="text-left py-2 w-20">Unit</th>
                {!hide && <th className="text-right py-2 w-24">Rate</th>}
                {!hide && <th className="text-right py-2 w-28">Amount</th>}
              </tr>
            </thead>
            <tbody>
              {(() => {
                let lastFloor: string | undefined | null = null;
                let counter = 0;
                const cols = hide ? 4 : 6;
                const rows: React.ReactNode[] = [];
                for (const { floor, room } of groups) {
                  if (floor !== lastFloor) {
                    rows.push(
                      <tr key={`f-${floor ?? "_"}`} className="bg-secondary/90 text-secondary-foreground">
                        <td colSpan={cols} className="px-2 py-1.5 font-black uppercase tracking-wide text-[11px]">
                          {floor ?? "Ground Level"}
                        </td>
                      </tr>,
                    );
                    lastFloor = floor;
                  }
                  const sub = room.lines.reduce((s, l) => s + l.qty * l.rate, 0);
                  rows.push(
                    <tr key={`r-${room.id}`} className="bg-muted/60">
                      <td colSpan={hide ? 4 : 5} className="px-2 py-1.5 font-bold text-[12px]">{room.name}</td>
                      {!hide && (
                        <td className="px-2 py-1.5 text-right tabular-nums text-[12px] font-semibold">{inr(sub)}</td>
                      )}
                    </tr>,
                  );
                  for (const l of room.lines) {
                    counter += 1;
                    rows.push(
                      <tr key={l.id} className="border-b border-border align-top">
                        <td className="py-2 pl-2 text-muted-foreground">{counter}</td>
                        <td className="py-2 font-semibold">{l.name}</td>
                        <td className="py-2 text-center tabular-nums">{l.qty}</td>
                        <td className="py-2 text-muted-foreground">{l.unit}</td>
                        {!hide && <td className="py-2 text-right tabular-nums">{l.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>}
                        {!hide && <td className="py-2 text-right font-semibold tabular-nums">{(l.qty * l.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>}
                      </tr>,
                    );
                  }
                }
                if (rows.length === 0) {
                  rows.push(
                    <tr key="empty"><td colSpan={cols} className="py-8 text-center text-muted-foreground">No service points added yet.</td></tr>,
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        {!hide && <div className="mt-10 flex justify-end">
          <div className="w-full max-w-sm space-y-1.5 text-sm">
            {!hide && (
              <>
                <Row label="Material Total" value={inr(t.material)} />
                <Row label="Labour" value={inr(quotation.charges.labour)} />
                <Row label="Transport" value={inr(quotation.charges.transport)} />
                {quotation.charges.other > 0 && <Row label="Other" value={inr(quotation.charges.other)} />}
                {t.discount > 0 && <Row label={`Discount (${quotation.charges.discountPct}%)`} value={"- " + inr(t.discount)} />}
                <Row label={`GST (${quotation.charges.gstRate}%)`} value={inr(t.gst)} />
                {isOverridden && (
                  <Row label="Computed Total" value={inr(t.computedGrand)} muted />
                )}
                <div className="border-t border-border pt-2" />
              </>
            )}
            <div className="flex justify-between items-center pt-2 border-t-2 border-secondary gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Grand Total</span>
                {isOverridden && <span className="text-[9px] uppercase tracking-wider bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded font-bold no-print">Manual</span>}
              </div>
              {editing ? (
                <div className="flex items-center gap-1 no-print">
                  <Input
                    autoFocus type="number" value={editVal}
                    onChange={(e) => setEditVal(e.target.value)}
                    className="h-9 w-32 text-right font-bold tabular-nums"
                  />
                  <button onClick={saveGrand} className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center" aria-label="Save"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditing(false)} className="h-8 w-8 rounded-md border border-border flex items-center justify-center" aria-label="Cancel"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-primary tabular-nums">{inr(t.grand)}</span>
                  <button
                    onClick={() => { setEditVal(String(Math.round(t.grand))); setEditing(true); }}
                    className="no-print h-7 w-7 rounded-md border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary"
                    aria-label="Edit grand total"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            {isOverridden && !editing && (
              <button onClick={resetGrand} className="no-print text-[11px] text-muted-foreground hover:text-primary block ml-auto">
                Reset to computed total
              </button>
            )}
          </div>
        </div>}

        {/* Terms */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[12px]">
          <div>
            <div className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">Payment Terms</div>
            <div className="text-muted-foreground">{quotation.paymentTerms}</div>
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">Terms &amp; Conditions</div>
            <ul className="text-muted-foreground space-y-0.5 list-disc pl-4">
              {quotation.terms.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-muted-foreground text-[12px]">
          <div className="italic">"{settings.company.tagline}"</div>
          <div className="mt-2 font-semibold tracking-widest text-[11px]">VOLTCARE ELECTRICAL SOLUTIONS · {settings.company.city.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={"flex justify-between " + (muted ? "text-muted-foreground text-xs" : "")}>
      <span className={muted ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums font-semibold">{value}</span>
    </div>
  );
}

