import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, quotationTotals, invoiceTotals } from "@/store/voltcare";
import { inr, inrCompact } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Voltcare OS" },
      { name: "description", content: "Sales, top products & services, outstanding invoices and GST summary for Voltcare." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <ReportsPage />
      </ClientGate>
    </AppShell>
  ),
});

function ReportsPage() {
  const invoices = useVoltcare((s) => s.invoices);
  const quotations = useVoltcare((s) => s.quotations);
  const products = useVoltcare((s) => s.products);
  const services = useVoltcare((s) => s.services);

  const revenue = invoices.reduce((s, i) => s + invoiceTotals(i).grand, 0);
  const quoValue = quotations.reduce((s, q) => s + quotationTotals(q).grand, 0);
  const outstanding = invoices.reduce((s, i) => s + invoiceTotals(i).balance, 0);
  const gst = invoices.reduce((s, i) => s + invoiceTotals(i).gst, 0);

  const brandRev: Record<string, number> = {};
  products.forEach((p) => { brandRev[p.brand] = (brandRev[p.brand] ?? 0) + p.price * p.stock; });
  const brandData = Object.entries(brandRev).map(([name, value]) => ({ name, value })).slice(0, 6);

  const servRev = services.slice(0, 6).map((s) => ({ name: s.name, value: s.basePrice }));

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Financial and operational snapshot across the business.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: inrCompact(revenue) },
          { label: "Quotation Pipeline", value: inrCompact(quoValue) },
          { label: "Outstanding", value: inrCompact(outstanding), tone: "text-primary" },
          { label: "GST Collected", value: inrCompact(gst) },
        ].map((k) => (
          <div key={k.label} className="card-surface p-5">
            <div className="text-sm text-muted-foreground">{k.label}</div>
            <div className={`text-2xl font-black tabular-nums mt-1 ${k.tone ?? ""}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <div className="font-bold mb-4">Inventory Value by Brand</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "K"} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--brand-red)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="font-bold mb-4">Top Service Points by Rate</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servRev} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + v} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => inr(v)} contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {servRev.map((_, i) => (
                    <Cell key={i} fill={["var(--brand-red)", "var(--brand-yellow)", "var(--brand-green)", "var(--brand-blue)", "oklch(0.6 0.15 320)", "oklch(0.6 0.18 40)"][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
