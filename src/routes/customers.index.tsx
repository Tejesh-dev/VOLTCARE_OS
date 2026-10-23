// Voltcare — Customers list (child route "/" of /customers)
// Lives as an index route so /customers/:id can render as a sibling child of
// the /customers layout instead of being swallowed by this page.
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
// AppShell + ClientGate come from the /customers layout.
import { useVoltcare } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  MapPin,
  Trash2,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BusinessSummaryCards } from "@/components/voltcare/business-summary-cards";

// The header search box deep-links /customers?q=… — keep it in the URL so a
// filtered view can be shared or re-opened.
export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "Customers — Voltcare OS" },
      { name: "description", content: "All Voltcare customers with contact info, quotations, invoices and payments in one place." },
      { property: "og:title", content: "Customers — Voltcare OS" },
      { property: "og:description", content: "Every Voltcare customer with their quotations, invoices and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  // The /customers layout already provides AppShell + ClientGate, so this
  // index route renders the list content only (a second shell here would
  // duplicate the sidebar and header).
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useVoltcare((s) => s.customers);
  const quotations = useVoltcare((s) => s.quotations);
  const invoices = useVoltcare((s) => s.invoices);
  const add = useVoltcare((s) => s.addCustomer);
  const del = useVoltcare((s) => s.deleteCustomer);
  const { q: urlQuery } = useSearch({ from: "/customers/" });
  const [localQuery, setLocalQuery] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "Nagpur", address: "" });

  // The header writes the query into the URL; the on-page box is local state.
  const q = urlQuery ?? localQuery;
  const setQ = (v: string) => {
    setLocalQuery(v);
    setPage(1);
  };

  const list = customers.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
  const pageSize = 30;
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const visibleCustomers = list.slice((activePage - 1) * pageSize, activePage * pageSize);
  const rangeStart = list.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(activePage * pageSize, list.length);

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-[1400px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {customers.length} customer records · Illustrative profiles are labeled and use placeholder contacts.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Customer</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <DialogFooter>
              <Button onClick={() => {
                if (!form.name || !form.phone) return toast.error("Name and phone required");
                add(form);
                toast.success("Customer added");
                setOpen(false);
                setForm({ name: "", phone: "", email: "", city: "Nagpur", address: "" });
              }}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <BusinessSummaryCards />

      <div className="card-surface p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q ?? ""} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone…" className="pl-9 h-10" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{rangeStart}–{rangeEnd}</span> of{" "}
          <span className="font-semibold text-foreground">{list.length}</span> customers
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={activePage <= 1}
            onClick={() => setPage(activePage - 1)}
            aria-label="Previous customer page"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="tabular-nums text-muted-foreground">{activePage} / {pageCount}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={activePage >= pageCount}
            onClick={() => setPage(activePage + 1)}
            aria-label="Next customer page"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-5 py-3 font-semibold">Location</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date added</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleCustomers.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <Link to="/customers/$id" params={{ id: c.id }} className="font-semibold hover:text-primary">
                      {c.name}
                    </Link>
                    {c.recordKind === "illustrative" && (
                      <span className="mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Illustrative profile
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {[c.address, c.city].filter(Boolean).join(", ") || "Location not provided"}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">{shortDate(c.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to="/customers/$id"
                        params={{ id: c.id }}
                        aria-label={`Open ${c.name} profile`}
                        title="Open profile"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => { del(c.id); toast.success("Deleted"); }}
                        aria-label={`Delete ${c.name}`}
                        title="Delete customer"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                    No customer matches “{q}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
