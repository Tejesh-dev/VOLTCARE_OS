import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, quotationTotals, invoiceTotals, type Activity } from "@/store/voltcare";
import { inr, inrCompact, shortDate, timeAgo } from "@/lib/format";
import {
  FileText,
  Clock,
  Receipt,
  IndianRupee,
  TrendingUp,
  UserPlus,
  Package,
  Wrench,
  ClipboardList,
  FilePlus2,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar } from "lucide-react";
import { BusinessSummaryCards } from "@/components/voltcare/business-summary-cards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Voltcare OS" },
      { name: "description", content: "Daily overview of quotations, invoices, payments and activity across Voltcare Electrical Solutions." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <Dashboard />
      </ClientGate>
    </AppShell>
  ),
});

function Dashboard() {
  const settings = useVoltcare((s) => s.settings);
  const quotations = useVoltcare((s) => s.quotations);
  const invoices = useVoltcare((s) => s.invoices);
  const payments = useVoltcare((s) => s.payments);
  const activities = useVoltcare((s) => s.activities);

  // Compare invoiced work for the current and preceding weeks.
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), thisWeek: 0, lastWeek: 0 };
  });
  invoices.forEach((inv) => {
    if (inv.recordKind === "illustrative") return;
    const t = invoiceTotals(inv);
    const ageInDays = Math.floor((Date.now() - new Date(inv.createdAt).getTime()) / 86400000);
    if (ageInDays >= 0 && ageInDays < 7) {
      days[6 - ageInDays].thisWeek += t.grand;
    } else if (ageInDays >= 7 && ageInDays < 14) {
      days[13 - ageInDays].lastWeek += t.grand;
    }
  });

  const statusCounts = ["draft", "sent", "accepted", "rejected", "expired"].map((s) => ({
    name: s,
    value: quotations.filter((q) => q.status === s).length,
  }));
  const statusColors: Record<string, string> = {
    draft: "oklch(0.7 0.02 285)",
    sent: "oklch(0.78 0.16 75)",
    accepted: "oklch(0.6 0.15 240)",
    rejected: "var(--brand-red)",
    expired: "oklch(0.6 0.03 285)",
  };
  const totalStatus = statusCounts.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px]">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
            Good morning, {settings.user.name}! <span>👋</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* KPIs */}
      <BusinessSummaryCards />

      {/* Sales + Activities */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-surface p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">Sales Overview</div>
            <select className="text-sm border border-border rounded-md px-2 py-1 bg-background">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-red)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--brand-red)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "K"} />
                <Tooltip
                  formatter={(v: number) => inr(v)}
                  contentStyle={{ border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="lastWeek" stroke="oklch(0.75 0.01 285)" strokeDasharray="4 4" fill="none" />
                <Area type="monotone" dataKey="thisWeek" stroke="var(--brand-red)" strokeWidth={2.5} fill="url(#sales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">Recent Activities</div>
            <button className="text-sm text-primary font-semibold">View All</button>
          </div>
          <div className="space-y-3">
            {activities.slice(0, 5).map((a) => {
              const iconMap: Record<Activity["kind"], LucideIcon> = {
                quotation: FileText,
                material: ClipboardList,
                invoice: Receipt,
                payment: IndianRupee,
                customer: UserPlus,
              };
              const Icon = iconMap[a.kind];
              return (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold truncate">{a.title}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {a.subtitle}{a.amount ? ` • ${inr(a.amount)}` : ""}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground shrink-0">{timeAgo(a.createdAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top services + status + quick actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-lg">Top Services</div>
            <select className="text-sm border border-border rounded-md px-2 py-1 bg-background">
              <option>This Week</option>
            </select>
          </div>
          {[
            { name: "Light Point", count: 18, color: "var(--brand-red)" },
            { name: "Fan Point", count: 12, color: "var(--brand-yellow)" },
            { name: "6A Socket Point", count: 10, color: "var(--brand-green)" },
            { name: "AC Point", count: 8, color: "var(--brand-blue)" },
            { name: "16A Socket Point", count: 6, color: "oklch(0.65 0.15 320)" },
          ].map((s, i) => (
            <div key={s.name} className="flex items-center gap-3 py-2">
              <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold">{s.name}</div>
                <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(s.count / 18) * 100}%`, background: s.color }} />
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums w-6 text-right">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="card-surface p-5">
          <div className="font-semibold text-lg mb-4">Quotation Status</div>
          <div className="flex items-center gap-4">
            <div className="h-40 w-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2}>
                    {statusCounts.map((s) => <Cell key={s.name} fill={statusColors[s.name]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-black tabular-nums">{totalStatus}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              {statusCounts.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[s.name] }} />
                    <span className="capitalize text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="tabular-nums font-semibold">
                    {String(s.value).padStart(2, "0")} ({Math.round((s.value / totalStatus) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="font-semibold text-lg mb-4">Quick Actions</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: "/quotations", label: "New Quotation", icon: FilePlus2, tone: "text-primary" },
              { to: "/customers", label: "Add Customer", icon: UserPlus, tone: "text-[oklch(0.5_0.15_240)]" },
              { to: "/products", label: "Add Product", icon: Package, tone: "text-[oklch(0.55_0.16_75)]" },
              { to: "/services", label: "Add Service", icon: Wrench, tone: "text-[oklch(0.6_0.18_320)]" },
              { to: "/material-lists", label: "Material List", icon: ClipboardList, tone: "text-[oklch(0.5_0.15_150)]" },
              { to: "/invoices", label: "Create Invoice", icon: Receipt, tone: "text-primary" },
            ].map((a) => {
              const I = a.icon;
              return (
                <Link
                  key={a.label}
                  to={a.to}
                  className="rounded-xl border border-border p-4 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors flex flex-col items-center text-center gap-2"
                >
                  <I className={`h-5 w-5 ${a.tone}`} />
                  <span className="text-[12px] font-semibold leading-tight">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
