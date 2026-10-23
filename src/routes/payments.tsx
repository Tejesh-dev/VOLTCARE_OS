import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, invoiceTotals } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { IndianRupee, Receipt } from "lucide-react";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Voltcare OS" },
      { name: "description", content: "Track payments received against invoices and outstanding customer balances." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <PaymentsPage />
      </ClientGate>
    </AppShell>
  ),
});

function PaymentsPage() {
  const payments = useVoltcare((s) => s.payments);
  const invoices = useVoltcare((s) => s.invoices);
  const customers = useVoltcare((s) => s.customers);

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceTotals(i).balance, 0);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record payments on invoices to track outstanding balances. Illustrative invoices are labeled and are not verified receivables.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <div className="text-sm text-muted-foreground">Total Received</div>
          <div className="text-3xl font-black text-[oklch(0.5_0.15_150)] tabular-nums mt-1">{inr(totalReceived)}</div>
        </div>
        <div className="card-surface p-5">
          <div className="text-sm text-muted-foreground">Outstanding</div>
          <div className="text-3xl font-black text-primary tabular-nums mt-1">{inr(outstanding)}</div>
        </div>
        <div className="card-surface p-5">
          <div className="text-sm text-muted-foreground">Total Invoices</div>
          <div className="text-3xl font-black tabular-nums mt-1">{invoices.length}</div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border font-bold">Payment History</div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No payments yet. Record a payment from any invoice.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Invoice</th>
                <th className="text-left px-4 py-2">Customer</th>
                <th className="text-left px-4 py-2">Method</th>
                <th className="text-right px-4 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const inv = invoices.find((i) => i.id === p.invoiceId);
                const c = inv ? customers.find((c) => c.id === inv.customerId) : null;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">{shortDate(p.createdAt)}</td>
                    <td className="px-4 py-2 font-semibold">{inv ? <Link to="/invoices/$id" params={{ id: inv.id }} className="hover:text-primary">{inv.number}</Link> : "—"}</td>
                    <td className="px-4 py-2">{c?.name ?? "—"}</td>
                    <td className="px-4 py-2 uppercase text-xs text-muted-foreground">{p.method}</td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums text-[oklch(0.5_0.15_150)]">{inr(p.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="px-5 py-3 border-b border-border font-bold">Outstanding Invoices</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Invoice</th>
              <th className="text-left px-4 py-2">Customer</th>
              <th className="text-left px-4 py-2">Due</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-right px-4 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {invoices.filter((i) => invoiceTotals(i).balance > 0).map((inv) => {
              const c = customers.find((c) => c.id === inv.customerId);
              const t = invoiceTotals(inv);
              return (
                <tr key={inv.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2 font-semibold">
                    <Link to="/invoices/$id" params={{ id: inv.id }} className="hover:text-primary">{inv.number}</Link>
                    {inv.recordKind === "illustrative" && (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Illustrative
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{c?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground">{shortDate(inv.dueDate)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{inr(t.grand)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-primary font-bold">{inr(t.balance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
