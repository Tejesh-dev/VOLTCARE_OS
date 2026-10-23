import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, invoiceTotals } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, IndianRupee, MessageCircle } from "lucide-react";
import { VoltcareLogoLight } from "@/components/voltcare/logo";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/invoices/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Invoice ${params.id} — Voltcare OS` },
      { name: "description", content: "Voltcare Electrical Solutions invoice." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <InvoiceDetail />
      </ClientGate>
    </AppShell>
  ),
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const inv = useVoltcare((s) => s.invoices.find((i) => i.id === id));
  const customer = useVoltcare((s) => inv && s.customers.find((c) => c.id === inv.customerId));
  const settings = useVoltcare((s) => s.settings);
  const record = useVoltcare((s) => s.recordPayment);
  const nav = useNavigate();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "upi" | "bank" | "cheque">("upi");
  const [open, setOpen] = useState(false);

  if (!inv) return <div className="p-8 text-muted-foreground">Invoice not found.</div>;
  const t = invoiceTotals(inv);

  return (
    <div className="p-6 md:p-8 max-w-[900px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <Link to="/invoices" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary"><ArrowLeft className="h-4 w-4" /> All invoices</Link>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
          <Button variant="outline" className="gap-2" onClick={() => {
            const phone = customer?.phone.replace(/\D/g, "") ?? "";
            const msg = encodeURIComponent(`Hi ${customer?.name ?? ""}, please find invoice ${inv.number} from Voltcare — total ${inr(t.grand)}.`);
            window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
          }}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><IndianRupee className="h-4 w-4" /> Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Payment — {inv.number}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Amount</div>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Balance: ${inr(t.balance)}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Method</div>
                  <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  const amt = parseFloat(amount);
                  if (!amt || amt <= 0) return toast.error("Enter a valid amount");
                  record({ invoiceId: inv.id, amount: amt, method });
                  toast.success("Payment recorded");
                  setOpen(false);
                  setAmount("");
                }}>Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Document — matches uploaded invoice template */}
      <div className="print-page card-surface p-10 md:p-14 bg-white">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <VoltcareLogoLight />
          <div className="text-right text-[13px] text-muted-foreground">
            <div className="font-semibold text-foreground">{settings.company.website}</div>
            <div>{settings.company.phone}</div>
            <div>{settings.company.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-10">
          <div>
            <div className="text-[10px] text-muted-foreground font-semibold tracking-[0.25em] uppercase">Bill To</div>
            <div className="mt-2 font-bold">{customer?.name ?? "—"}</div>
            {customer?.phone && <div className="text-muted-foreground text-sm">{customer.phone}</div>}
            {customer?.email && <div className="text-muted-foreground text-sm">{customer.email}</div>}
            {customer?.address && <div className="text-muted-foreground text-sm">{customer.address}</div>}
            {customer?.city && <div className="text-muted-foreground text-sm">{customer.city}</div>}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground font-semibold tracking-[0.25em] uppercase">Invoice Details</div>
            <div className="mt-2 text-sm"><span className="text-muted-foreground">No: </span><span className="font-bold">{inv.number}</span></div>
            <div className="text-sm"><span className="text-muted-foreground">Date: </span><span className="font-semibold">{shortDate(inv.createdAt)}</span></div>
          </div>
        </div>

        <table className="w-full mt-10 text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-b border-secondary">
              <th className="text-left py-2 font-bold">Description</th>
              <th className="text-center py-2 font-bold w-20">Qty</th>
              {!inv.hidePrices && <th className="text-right py-2 font-bold w-24">Rate</th>}
              {!inv.hidePrices && <th className="text-right py-2 font-bold w-28">Total</th>}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((it, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-4">
                  <div className="font-semibold">{it.name}</div>
                  {it.description && <div className="text-[11px] text-muted-foreground mt-0.5">{it.description}</div>}
                </td>
                <td className="py-4 text-center tabular-nums">{it.qty}</td>
                {!inv.hidePrices && <td className="py-4 text-right tabular-nums">₹{it.rate}</td>}
                {!inv.hidePrices && <td className="py-4 text-right font-semibold tabular-nums">₹{(it.qty * it.rate).toFixed(2)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!inv.hidePrices && <div className="mt-10 flex justify-end">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Grand Total</div>
            <div className="text-3xl font-black tabular-nums mt-1">₹{t.grand.toFixed(2)}</div>
            {inv.paidAmount > 0 && (
              <div className="text-[12px] text-muted-foreground mt-2 tabular-nums">Paid: {inr(inv.paidAmount)} · Balance: <b className="text-primary">{inr(t.balance)}</b></div>
            )}
          </div>
        </div>}

        {inv.terms && inv.terms.length > 0 && (
          <div className="mt-8 text-sm">
            <h2 className="font-semibold mb-2">Terms &amp; Conditions</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              {inv.terms.map((term, index) => <li key={index}>{term}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-16 pt-6 text-center text-muted-foreground text-[12px]">
          <div className="italic">"{settings.company.tagline}"</div>
          <div className="mt-4 font-semibold tracking-[0.3em] text-[11px]">VOLTCARE ELECTRICAL SOLUTIONS</div>
          <div className="font-semibold tracking-[0.3em] text-[10px] text-muted-foreground">{settings.company.city.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
}
