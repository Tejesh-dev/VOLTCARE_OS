import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, invoiceTotals } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Receipt } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/invoices/")({
  head: () => ({
    meta: [
      { title: "Invoices — Voltcare OS" },
      { name: "description", content: "Invoices raised across Voltcare Electrical Solutions with paid, partial and overdue status." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <InvoicesList />
      </ClientGate>
    </AppShell>
  ),
});

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[oklch(0.95_0.09_75)] text-[oklch(0.5_0.16_75)]",
  paid: "bg-[oklch(0.94_0.07_150)] text-[oklch(0.4_0.15_150)]",
  partial: "bg-[oklch(0.94_0.05_240)] text-[oklch(0.4_0.15_240)]",
  overdue: "bg-primary/10 text-primary",
};

function InvoicesList() {
  const invoices = useVoltcare((s) => s.invoices);
  const customers = useVoltcare((s) => s.customers);
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const list = invoices.filter((i) => {
    if (!q) return true;
    const c = customers.find((c) => c.id === i.customerId);
    return i.number.toLowerCase().includes(q.toLowerCase()) || c?.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Bill customers, record payments and track outstanding balances.</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> New Invoice</Button>
      </div>

      <div className="card-surface p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoices…" className="pl-9 h-10" />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Number</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Due</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-right px-4 py-3">Balance</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv) => {
              const c = customers.find((c) => c.id === inv.customerId);
              const t = invoiceTotals(inv);
              return (
                <tr key={inv.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => nav({ to: "/invoices/$id", params: { id: inv.id } })}>
                  <td className="px-4 py-3 font-bold">{inv.number}</td>
                  <td className="px-4 py-3">{c?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shortDate(inv.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shortDate(inv.dueDate)}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-1 rounded-full text-[11px] font-semibold uppercase", statusColor[inv.status])}>{inv.status}</span></td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{inr(t.grand)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-primary font-semibold">{inr(t.balance)}</td>
                  <td className="px-4"><Receipt className="h-4 w-4 text-muted-foreground" /></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground py-12">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
