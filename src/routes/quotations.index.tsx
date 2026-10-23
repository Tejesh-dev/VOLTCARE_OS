import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, quotationTotals } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quotations/")({
  head: () => ({
    meta: [
      { title: "Quotations — Voltcare OS" },
      { name: "description", content: "All quotations across Voltcare Electrical Solutions — draft, sent, accepted and expired." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <QuotationsListPage />
      </ClientGate>
    </AppShell>
  ),
});

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-[oklch(0.95_0.09_75)] text-[oklch(0.5_0.16_75)]",
  accepted: "bg-[oklch(0.94_0.07_150)] text-[oklch(0.4_0.15_150)]",
  rejected: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground",
};

function QuotationsListPage() {
  const quotations = useVoltcare((s) => s.quotations);
  const customers = useVoltcare((s) => s.customers);
  const newBlank = useVoltcare((s) => s.newBlankQuotation);
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const list = quotations.filter((x) => {
    if (!q) return true;
    const c = customers.find((c) => c.id === x.customerId);
    return x.number.toLowerCase().includes(q.toLowerCase()) || c?.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {quotations.length} quotations · Illustrative records are labeled; verify prices and customer details before use.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/services"><Button variant="outline" className="gap-2">Open Builder</Button></Link>
          <Button className="gap-2" onClick={() => { const id = newBlank(); nav({ to: "/services" }); }}>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        </div>
      </div>

      <div className="card-surface p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number or customer…" className="pl-9 h-10" />
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Number</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3">Project</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Rooms</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Grand Total</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((q) => {
              const c = customers.find((c) => c.id === q.customerId);
              const t = quotationTotals(q);
              return (
                <tr key={q.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => nav({ to: "/quotations/$id", params: { id: q.id } })}>
                  <td className="px-4 py-3 font-bold">{q.number}</td>
                  <td className="px-4 py-3">
                    {c?.name ?? "—"}
                    {q.recordKind === "illustrative" && (
                      <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Illustrative
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{q.projectName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{shortDate(q.createdAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{q.rooms.length}</td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-1 rounded-full text-[11px] font-semibold uppercase", statusColor[q.status])}>{q.status}</span></td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-primary">{inr(t.grand)}</td>
                  <td className="px-4"><FileText className="h-4 w-4 text-muted-foreground" /></td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted-foreground py-12">No quotations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
