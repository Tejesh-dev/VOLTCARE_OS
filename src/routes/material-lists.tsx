import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare } from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eye,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentHeader, DocumentFooter } from "@/components/voltcare/document";

export const Route = createFileRoute("/material-lists")({
  head: () => ({
    meta: [
      { title: "Material Lists — Voltcare OS" },
      {
        name: "description",
        content: "View, create, and share customer material lists.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <MaterialListsPage />
      </ClientGate>
    </AppShell>
  ),
});

function MaterialListsPage() {
  const lists = useVoltcare((s) => s.materialLists);
  const cart = useVoltcare((s) => s.cart);
  const generate = useVoltcare((s) => s.generateMaterialListFromCart);
  const update = useVoltcare((s) => s.updateMaterialListItem);
  const delItem = useVoltcare((s) => s.deleteMaterialListItem);
  const setStatus = useVoltcare((s) => s.setMaterialListStatus);
  const customers = useVoltcare((s) => s.customers);
  const nav = useNavigate();

  const [customerQuery, setCustomerQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [viewListId, setViewListId] = useState<string | null>(null);

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const filteredLists = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    return lists.filter(
      (list) =>
        !query ||
        (customerNames.get(list.customerId ?? "") ?? "No customer linked")
          .toLowerCase()
          .includes(query),
    );
  }, [lists, customerNames, customerQuery]);
  const customerGroups = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    const groups = customers
      .filter(
        (customer) => !query || customer.name.toLowerCase().includes(query),
      )
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        lists: filteredLists.filter((list) => list.customerId === customer.id),
      }));
    const unlinkedLists = filteredLists.filter(
      (list) => !list.customerId || !customerNames.has(list.customerId),
    );
    if (
      (!query || "no customer linked".includes(query)) &&
      unlinkedLists.length > 0
    ) {
      groups.push({ id: "", name: "No customer linked", lists: unlinkedLists });
    }
    return groups;
  }, [customers, filteredLists, customerNames, customerQuery]);
  const viewedList = lists.find((list) => list.id === viewListId);

  const openCreateDialog = () => {
    setSelectedCustomerId("");
    setCreateOpen(true);
  };

  const createFromCart = () => {
    if (!selectedCustomerId) {
      toast.error("Select a customer first.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add materials to the cart first.");
      nav({ to: "/products", search: { customerId: selectedCustomerId } });
      setCreateOpen(false);
      return;
    }

    const list = generate(selectedCustomerId);
    if (!list) {
      toast.error("The cart is empty. Add materials before creating a list.");
      return;
    }
    toast.success(`Material List ${list.number} created`);
    setCreateOpen(false);
  };

  const shareList = async (list: (typeof lists)[number]) => {
    const customerName =
      customerNames.get(list.customerId ?? "") ?? "No customer linked";
    const lines = list.items.map(
      (item) => `• ${item.name} — ${item.qty} ${item.unit}`,
    );
    const subtotal = list.items.reduce(
      (sum, item) => sum + item.qty * item.rate,
      0,
    );
    const text = [
      `Material List ${list.number}`,
      `Customer: ${customerName}`,
      `Date: ${shortDate(list.createdAt)}`,
      "",
      ...lines,
      ...(!list.hidePrices
        ? [
            "",
            `Subtotal: ${inr(subtotal)}`,
            `GST (18%): ${inr(subtotal * 0.18)}`,
            `Total: ${inr(subtotal * 1.18)}`,
          ]
        : []),
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: `Material List ${list.number}`, text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Material list copied. You can now share it.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Unable to share this material list.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 max-w-[1000px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            {viewedList
              ? `Material List ${viewedList.number}`
              : "Material Lists"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {viewedList
              ? `For ${customerNames.get(viewedList.customerId ?? "") ?? "No customer linked"} · ${shortDate(viewedList.createdAt)}`
              : "Browse customers and open a material list to view or update it."}
          </p>
        </div>
        <div className="flex gap-2">
          {viewedList && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setViewListId(null)}
            >
              <ArrowLeft className="h-4 w-4" /> Customer List
            </Button>
          )}
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" /> Create Material List
          </Button>
        </div>
      </div>

      {!viewedList && (
        <>
          <div className="relative max-w-sm no-print">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Search customer name"
              className="pl-9"
              aria-label="Search customers"
            />
          </div>

          {lists.length === 0 && customers.length === 0 && (
            <div className="card-surface p-12 text-center text-muted-foreground no-print">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
              No customers yet. Add a customer before creating a material list.
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => nav({ to: "/customers" })}
                >
                  Go to Customers
                </Button>
              </div>
            </div>
          )}

          {customerGroups.length === 0 &&
            (customers.length > 0 || customerQuery.trim().length > 0) && (
              <div className="card-surface p-10 text-center text-muted-foreground no-print">
                No customers found for “{customerQuery}”.
              </div>
            )}

          <div className="space-y-5">
            {customerGroups.map((group) => (
              <section
                key={group.id || "unlinked"}
                className="card-surface overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <h2 className="font-bold">{group.name}</h2>
                  <span className="text-sm text-muted-foreground">
                    {group.lists.length}{" "}
                    {group.lists.length === 1
                      ? "material list"
                      : "material lists"}
                  </span>
                </div>
                {group.lists.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground">
                    No material lists for this customer yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {group.lists.map((ml) => (
                      <div
                        key={ml.id}
                        className="flex flex-wrap items-center gap-3 px-4 py-3"
                      >
                        <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold">{ml.number}</div>
                          <div className="text-sm text-muted-foreground">
                            {shortDate(ml.createdAt)} · {ml.items.length}{" "}
                            {ml.items.length === 1 ? "material" : "materials"}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            ml.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ml.status === "approved"
                            ? "Approved"
                            : ml.status === "sent"
                              ? "Sent"
                              : "Pending"}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setViewListId(ml.id)}
                        >
                          <Eye className="h-4 w-4" /> View Material List
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}

      {viewedList &&
        (() => {
          const ml = viewedList;
          const subtotal = ml.items.reduce(
            (sum, item) => sum + item.qty * item.rate,
            0,
          );
          const gst = subtotal * 0.18;
          return (
            <article className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 no-print">
                <span className="mr-auto text-sm text-muted-foreground">
                  Status:{" "}
                  <span className="font-semibold text-foreground">
                    {ml.status === "approved"
                      ? "Approved"
                      : ml.status === "sent"
                        ? "Sent"
                        : "Pending"}
                  </span>
                </span>
                {ml.status !== "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatus(ml.id, "pending")}
                  >
                    Mark pending
                  </Button>
                )}
                {ml.status !== "sent" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatus(ml.id, "sent")}
                  >
                    Mark as sent
                  </Button>
                )}
                {ml.status !== "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStatus(ml.id, "approved")}
                  >
                    Approve
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.print()}
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => void shareList(ml)}
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
              <div className="print-page card-surface p-6 md:p-10 bg-white">
                <DocumentHeader
                  title="Material List"
                  customerId={ml.customerId}
                  meta={[
                    { label: "No", value: ml.number },
                    { label: "Generated", value: shortDate(ml.createdAt) },
                  ]}
                />
                <div className="overflow-x-auto mt-8">
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-secondary">
                      <tr>
                        <th className="text-left py-2 w-8">#</th>
                        <th className="text-left py-2">Material</th>
                        <th className="text-left py-2 w-28">Brand</th>
                        <th className="text-center py-2 w-16">Qty</th>
                        <th className="text-left py-2 w-16">Unit</th>
                        {!ml.hidePrices && (
                          <th className="text-right py-2 w-24">Rate</th>
                        )}
                        {!ml.hidePrices && (
                          <th className="text-right py-2 w-28">Amount</th>
                        )}
                        <th className="w-8 no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ml.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-t border-border align-top"
                        >
                          <td className="py-2 text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2 font-semibold">
                            {item.name}
                            <div className="text-[11px] text-muted-foreground font-normal">
                              {item.sku}
                            </div>
                          </td>
                          <td className="py-2">
                            <input
                              className="w-full bg-transparent hover:bg-muted rounded px-1 py-0.5 text-sm outline-none focus:bg-muted print:hover:bg-transparent"
                              defaultValue={item.brand}
                              onBlur={(event) =>
                                update(ml.id, item.id, {
                                  brand: event.target.value,
                                })
                              }
                            />
                          </td>
                          <td className="py-2 text-center">
                            <input
                              type="number"
                              defaultValue={item.qty}
                              className="w-14 text-center bg-transparent hover:bg-muted rounded px-1 outline-none focus:bg-muted tabular-nums"
                              onBlur={(event) =>
                                update(ml.id, item.id, {
                                  qty: parseFloat(event.target.value) || 0,
                                })
                              }
                            />
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {item.unit}
                          </td>
                          {!ml.hidePrices && (
                            <td className="py-2 text-right">
                              <input
                                type="number"
                                defaultValue={item.rate}
                                className="w-20 text-right bg-transparent hover:bg-muted rounded px-1 outline-none focus:bg-muted tabular-nums"
                                onBlur={(event) =>
                                  update(ml.id, item.id, {
                                    rate: parseFloat(event.target.value) || 0,
                                  })
                                }
                              />
                            </td>
                          )}
                          {!ml.hidePrices && (
                            <td className="py-2 text-right font-semibold tabular-nums">
                              {(item.qty * item.rate).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          )}
                          <td className="no-print">
                            <button
                              onClick={() => delItem(ml.id, item.id)}
                              className="text-muted-foreground hover:text-primary"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!ml.hidePrices && (
                  <div className="mt-8 flex justify-end">
                    <div className="w-full max-w-sm space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums font-semibold">
                          {inr(subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span className="tabular-nums">{inr(gst)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t-2 border-secondary">
                        <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Grand Total
                        </span>
                        <span className="text-2xl font-black text-primary tabular-nums">
                          {inr(subtotal + gst)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {ml.terms && ml.terms.length > 0 && (
                  <div className="mt-8 text-sm">
                    <h2 className="font-semibold mb-2">
                      Terms &amp; Conditions
                    </h2>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      {ml.terms.map((term, index) => (
                        <li key={index}>{term}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <DocumentFooter />
              </div>
            </article>
          );
        })()}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Material List</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="material-list-customer">Customer</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
            >
              <SelectTrigger id="material-list-customer">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} · {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {cart.length > 0
                ? `${cart.length} cart ${cart.length === 1 ? "item is" : "items are"} ready to add.`
                : "Your cart is empty. You can select a customer now and add materials next."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createFromCart} disabled={!selectedCustomerId}>
              {cart.length > 0 ? "Create from Cart" : "Choose Materials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
