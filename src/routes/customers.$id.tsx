// Voltcare — 360° Customer profile
// Adds: WhatsApp/Call quick actions, editable notes, work status,
// visit/service charges, and site photos (persisted as data URLs in the
// zustand store → localStorage). Lists all quotations, material lists,
// invoices and payments linked to the customer with financial summary.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
// The /customers layout wraps this route in AppShell + ClientGate already.
import {
  useVoltcare,
  quotationTotals,
  invoiceTotals,
  type CustomerWorkStatus,
  type Quotation,
} from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import {
  ArrowLeft, FileText, Receipt, ClipboardList, Phone, Mail, MapPin,
  MessageCircle, ImagePlus, Trash2, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Customer ${params.id} — Voltcare OS` },
      { name: "description", content: "Customer profile with all quotations, material lists, invoices and payments." },
    ],
  }),
  // The /customers layout already provides AppShell + ClientGate, so this
  // child route only renders the profile content itself.
  component: CustomerProfile,
});

const STATUS_LABEL: Record<CustomerWorkStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
  on_hold: "On Hold",
};
const STATUS_TONE: Record<CustomerWorkStatus, string> = {
  new: "bg-blue-500/15 text-blue-600",
  in_progress: "bg-amber-500/15 text-amber-600",
  completed: "bg-emerald-500/15 text-emerald-600",
  on_hold: "bg-slate-500/15 text-slate-600",
};

function CustomerProfile() {
  const { id } = Route.useParams();
  const customer = useVoltcare((s) => s.customers.find((c) => c.id === id));
  const updateCustomer = useVoltcare((s) => s.updateCustomer);
  // Select the raw arrays (a selector that returns a fresh array each render
  // makes Zustand's store snapshot unstable → infinite re-render) and derive
  // this customer's records with useMemo.
  const allQuotations = useVoltcare((s) => s.quotations);
  const allInvoices = useVoltcare((s) => s.invoices);
  const allMaterialLists = useVoltcare((s) => s.materialLists);
  const allPayments = useVoltcare((s) => s.payments);
  const setQuoteStatus = useVoltcare((s) => s.setQuotationStatus);

  const quotations = useMemo(() => allQuotations.filter((q) => q.customerId === id), [allQuotations, id]);
  const invoices = useMemo(() => allInvoices.filter((i) => i.customerId === id), [allInvoices, id]);
  const materialLists = useMemo(() => allMaterialLists.filter((m) => m.customerId === id), [allMaterialLists, id]);
  const payments = useMemo(() => {
    const invoiceIds = new Set(invoices.map((i) => i.id));
    return allPayments.filter((p) => invoiceIds.has(p.invoiceId));
  }, [allPayments, invoices]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [visitCharge, setVisitCharge] = useState(customer?.visitCharge ?? 0);
  const [serviceCharge, setServiceCharge] = useState(customer?.serviceCharge ?? 0);
  const [status, setStatus] = useState<CustomerWorkStatus>(customer?.workStatus ?? "new");

  if (!customer) return <div className="p-8 text-muted-foreground">Customer not found.</div>;

  const qTotal = quotations.reduce((s, q) => s + quotationTotals(q).grand, 0);
  const invTotal = invoices.reduce((s, i) => s + invoiceTotals(i).grand, 0);
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, invTotal - paidTotal);
  const pendingInvoiceCount = invoices.filter((invoice) => invoiceTotals(invoice).balance > 0).length;

  const savePanel = () => {
    updateCustomer(customer.id, { notes, visitCharge, serviceCharge, workStatus: status });
    toast.success("Customer updated");
  };

  const onAddPhoto = (files: FileList | null) => {
    if (!files || !files.length) return;
    const readers = Array.from(files).map(
      (f) =>
        new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(f);
        }),
    );
    Promise.all(readers).then((imgs) => {
      updateCustomer(customer.id, { photos: [...(customer.photos ?? []), ...imgs] });
      toast.success(`${imgs.length} photo${imgs.length > 1 ? "s" : ""} added`);
    });
  };

  const removePhoto = (i: number) => {
    const next = (customer.photos ?? []).filter((_, idx) => idx !== i);
    updateCustomer(customer.id, { photos: next });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <Link to="/customers" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      {/* Identity */}
      <div className="card-surface p-5 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xl">{customer.name[0]}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black truncate">{customer.name}</h1>
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_TONE[status])}>
                  {STATUS_LABEL[status]}
                </span>
                {customer.recordKind === "illustrative" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    Illustrative profile
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Customer since {shortDate(customer.createdAt)}</div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{customer.phone}</span>
                {customer.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{customer.email}</span>}
                {customer.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{customer.city}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href={customer.recordKind === "illustrative" ? undefined : `tel:${customer.phone}`}
              aria-disabled={customer.recordKind === "illustrative"}
              title={customer.recordKind === "illustrative" ? "Placeholder contact number" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border hover:border-primary/50 text-sm font-semibold",
                customer.recordKind === "illustrative" && "pointer-events-none opacity-50",
              )}
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={customer.recordKind === "illustrative" ? undefined : `https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
              target="_blank" rel="noreferrer"
              aria-disabled={customer.recordKind === "illustrative"}
              title={customer.recordKind === "illustrative" ? "Placeholder contact number" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[oklch(0.55_0.16_150)] text-white hover:opacity-90 text-sm font-semibold",
                customer.recordKind === "illustrative" && "pointer-events-none opacity-50",
              )}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Quotations" value={quotations.length} sub={inr(qTotal)} />
        <Stat label="Material Lists" value={materialLists.length} />
        <Stat label="Invoiced" value={invoices.length} sub={inr(invTotal)} />
        <Stat label="Received" value={payments.length} sub={inr(paidTotal)} tone="ok" />
        <Stat label="Pending" value={pendingInvoiceCount} sub={inr(pending)} tone={pending > 0 ? "warn" : "ok"} />
      </div>

      {/* Editable panel: charges + notes + status */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Customer Details</h2>
          <Button size="sm" className="gap-1.5" onClick={savePanel}><Save className="h-3.5 w-3.5" /> Save</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Visit Charge (₹)</Label>
            <Input type="number" value={visitCharge} onChange={(e) => setVisitCharge(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs">Service Charge (₹)</Label>
            <Input type="number" value={serviceCharge} onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="text-xs">Work Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CustomerWorkStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as CustomerWorkStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Site access notes, preferred brands, warranty notes, follow-ups…"
          />
        </div>
      </div>

      <Section title="Service Visits" icon={<ClipboardList className="h-4 w-4" />}>
        {(customer.visits?.length ?? 0) === 0 ? (
          <Empty text="No service visits recorded." />
        ) : (
          customer.visits?.map((visit) => (
            <div key={visit.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border last:border-0">
              <div>
                <div className="font-semibold">{visit.service}</div>
                <div className="text-xs text-muted-foreground">
                  {shortDate(visit.date)} · {visit.serviceCount} service{visit.serviceCount === 1 ? "" : "s"}
                  {visit.notes ? ` · ${visit.notes}` : ""}
                </div>
              </div>
              <div className="font-bold tabular-nums">{inr(visit.charge)}</div>
            </div>
          ))
        )}
      </Section>

      <Section title="Expenses" icon={<Receipt className="h-4 w-4" />}>
        {(customer.expenses?.length ?? 0) === 0 ? (
          <Empty text="No expenses recorded." />
        ) : (
          customer.expenses?.map((expense) => (
            <div key={expense.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border last:border-0">
              <div>
                <div className="font-semibold">{expense.description}</div>
                <div className="text-xs text-muted-foreground">
                  {shortDate(expense.date)} · {expense.category ?? "other"}
                  {expense.recordKind === "illustrative" ? " · Illustrative expense" : ""}
                </div>
              </div>
              <div className="font-bold tabular-nums">{inr(expense.amount)}</div>
            </div>
          ))
        )}
      </Section>

      <Section title="Contact History" icon={<MessageCircle className="h-4 w-4" />}>
        {(customer.communications?.length ?? 0) === 0 ? (
          <Empty text="No follow-ups recorded." />
        ) : (
          customer.communications?.map((communication) => (
            <div key={communication.id} className="p-3 border-b border-border last:border-0">
              <div className="font-semibold capitalize">{communication.channel}</div>
              <div className="text-xs text-muted-foreground">
                {shortDate(communication.date)} · {communication.message}
              </div>
            </div>
          ))
        )}
      </Section>

      {/* Site photos */}
      <div className="card-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Site Photos</h2>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Add photos
          </Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onAddPhoto(e.target.files)} />
        </div>
        {(customer.photos?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No site photos yet. Add pictures to keep visual records for future work.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {customer.photos!.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-border group">
                <img src={src} alt={`site-${i}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 flex items-center justify-center text-primary"
                  aria-label="Remove photo"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quotations */}
      <Section title="Quotations" icon={<FileText className="h-4 w-4" />}>
        {quotations.length === 0 ? <Empty text="No quotations yet." /> : quotations.map((q) => (
          <div key={q.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border last:border-0">
            <Link to="/quotations/$id" params={{ id: q.id }} className="flex-1 min-w-0 hover:text-primary">
              <div className="font-semibold">{q.number}</div>
              <div className="text-xs text-muted-foreground">{shortDate(q.createdAt)} · {q.rooms.length} rooms · {q.status}</div>
            </Link>
            <div className="flex items-center gap-2">
              <Select value={q.status} onValueChange={(value) => { setQuoteStatus(q.id, value as Quotation["status"]); toast.success("Status updated"); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                {q.recordKind === "illustrative" && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Illustrative
                  </span>
                )}
                <div className="font-bold text-primary tabular-nums w-24 text-right">{inr(quotationTotals(q).grand)}</div>
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Material Lists" icon={<ClipboardList className="h-4 w-4" />}>
        {materialLists.length === 0 ? <Empty text="No material lists yet." /> : materialLists.map((m) => (
          <div key={m.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
            <div>
              <div className="font-semibold">{m.number}</div>
              <div className="text-xs text-muted-foreground">{shortDate(m.createdAt)} · {m.items.length} items</div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Invoices" icon={<Receipt className="h-4 w-4" />}>
        {invoices.length === 0 ? <Empty text="No invoices yet." /> : invoices.map((i) => (
          <Link key={i.id} to="/invoices/$id" params={{ id: i.id }} className="flex items-center justify-between p-3 hover:bg-muted border-b border-border last:border-0">
            <div>
              <div className="font-semibold">{i.number}</div>
              <div className="text-xs text-muted-foreground">
                {shortDate(i.createdAt)} · {i.status}
                {i.recordKind === "illustrative" ? " · Illustrative balance" : ""}
              </div>
            </div>
            <div className="font-bold text-primary tabular-nums">{inr(invoiceTotals(i).grand)}</div>
          </Link>
        ))}
      </Section>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: number; sub?: string; tone?: "ok" | "warn" }) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-black tabular-nums mt-1">{value}</div>
      {sub && (
        <div
          className={cn(
            "text-xs font-semibold tabular-nums mt-0.5",
            tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "text-primary",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border font-semibold flex items-center gap-2">{icon}{title}</div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>;
}
