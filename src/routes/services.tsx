import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import { useVoltcare, quotationTotals, roomSubtotal } from "@/store/voltcare";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import {
  Search, Plus, Minus, ChevronDown, ChevronUp, Trash2,
  Home as HomeIcon, Building2, Tv, Wind, Zap, Snowflake,
  Lightbulb, Fan, Plug, PlugZap, Bell, Droplets, FileText,
  Save, Eye, X, Layers, ShoppingCart, Wifi, Cable, Camera,
  Cpu, ScanEye, Flame, Siren, ToggleRight, Cog, Battery,
  BatteryCharging, Shield, Sun, Lamp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Room Builder — Voltcare OS" },
      { name: "description", content: "Add electrical service points floor-wise with room details — build multi-floor quotations like an e-commerce cart." },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <ServicesPage />
      </ClientGate>
    </AppShell>
  ),
});

const ICONS: Record<string, any> = {
  Lightbulb, Fan, Plug, PlugZap, Snowflake, Tv, Droplets, Bell, Wind, Zap,
  Wifi, Cable, Camera, Cpu, ScanEye, Flame, Siren, ToggleRight, Cog,
  Battery, BatteryCharging, Shield, Sun, Lamp,
};

const FLOOR_ICONS: Record<string, any> = {
  "Ground Floor": HomeIcon,
  "First Floor": Building2,
  "Second Floor": Building2,
  "Third Floor": Building2,
  "Terrace Floor": Layers,
};

const ROOM_PRESETS = ["Living Room", "Kitchen", "Bedroom 1", "Bedroom 2", "Master Bedroom", "Toilet", "Bathroom", "Dining", "Balcony", "Store Room", "Puja Room", "Study"];

function iconTone(tone: string) {
  const map: Record<string, string> = {
    yellow: "bg-[oklch(0.95_0.09_75)] text-[oklch(0.55_0.16_75)]",
    blue: "bg-[oklch(0.94_0.05_240)] text-[oklch(0.5_0.15_240)]",
    green: "bg-[oklch(0.94_0.07_150)] text-[oklch(0.5_0.15_150)]",
    orange: "bg-[oklch(0.94_0.09_50)] text-[oklch(0.55_0.16_50)]",
    slate: "bg-muted text-muted-foreground",
    pink: "bg-[oklch(0.94_0.05_10)] text-[oklch(0.55_0.16_10)]",
    red: "bg-primary/10 text-primary",
  };
  return map[tone] ?? map.slate;
}

function ServicesPage() {
  const services = useVoltcare((s) => s.services);
  const activeId = useVoltcare((s) => s.ensureActiveQuotation());
  const quotation = useVoltcare((s) => s.quotations.find((q) => q.id === activeId));
  const customers = useVoltcare((s) => s.customers);
  const nav = useNavigate();

  const updateLine = useVoltcare((s) => s.updateLine);
  const deleteLine = useVoltcare((s) => s.deleteLine);
  const setPointQtyInRoom = useVoltcare((s) => s.setPointQtyInRoom);
  const ensureRoom = useVoltcare((s) => s.ensureRoom);
  const addFloor = useVoltcare((s) => s.addFloor);
  const updateCharges = useVoltcare((s) => s.updateCharges);
  const setStatus = useVoltcare((s) => s.setQuotationStatus);
  const setQuotationCustomer = useVoltcare((s) => s.setQuotationCustomer);
  const setQuotationProject = useVoltcare((s) => s.setQuotationProject);
  const setHidePrices = useVoltcare((s) => s.setHidePrices);

  const [q, setQ] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [expandedFloor, setExpandedFloor] = useState<string | null>(null);

  const floors = quotation?.floors ?? [];
  const [selectedFloor, setSelectedFloor] = useState<string>(floors[0] ?? "Ground Floor");
  const roomsOnFloor = useMemo(
    () => (quotation?.rooms ?? []).filter((r) => r.floor === selectedFloor),
    [quotation?.rooms, selectedFloor],
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const currentRoomId = selectedRoomId && roomsOnFloor.find((r) => r.id === selectedRoomId) ? selectedRoomId : roomsOnFloor[0]?.id ?? "";
  const currentRoom = quotation?.rooms.find((r) => r.id === currentRoomId);

  const filtered = useMemo(() => {
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  }, [services, q]);

  if (!quotation) return null;
  const totals = quotationTotals(quotation);

  const qtyForPoint = (spId: string) => {
    if (!currentRoom) return 0;
    return currentRoom.lines.find((l) => l.pointId === spId)?.qty ?? 0;
  };

  const changeQty = (sp: (typeof services)[number], delta: number) => {
    if (!currentRoomId) {
      toast.error("Select a room first");
      return;
    }
    const cur = qtyForPoint(sp.id);
    setPointQtyInRoom(currentRoomId, sp, Math.max(0, cur + delta));
  };

  const handleAddRoom = () => {
    const name = window.prompt("Room name (e.g. Bedroom 2)");
    if (!name) return;
    const id = ensureRoom(name, selectedFloor);
    setSelectedRoomId(id);
    toast.success(`${name} added to ${selectedFloor}`);
  };

  const handleAddFloor = () => {
    const name = window.prompt("Floor name (e.g. Third Floor)");
    if (!name) return;
    addFloor(name);
    setSelectedFloor(name);
    toast.success(`${name} added`);
  };

  const floorGroups = useMemo(() => {
    return floors.map((f) => {
      const rooms = quotation.rooms.filter((r) => r.floor === f);
      const sub = rooms.reduce((s, r) => s + roomSubtotal(r), 0);
      const items = rooms.reduce((s, r) => s + r.lines.reduce((x, l) => x + l.qty, 0), 0);
      return { floor: f, rooms, sub, items };
    });
  }, [floors, quotation.rooms]);

  const hide = quotation.hidePrices;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Main */}
      <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 space-y-4">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="hover:text-primary cursor-pointer" onClick={() => nav({ to: "/" })}>Home</span>
          <span>/</span>
          <span className="text-foreground font-medium">Services</span>
        </div>

        {/* Title + summary toggle */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight truncate">Services</h1>
            <p className="text-muted-foreground text-sm mt-1">Pick customer, floor & room — then tap + to add points.</p>
          </div>
          <Button className="gap-2 h-10 relative shrink-0" onClick={() => setSummaryOpen((v) => !v)}>
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Quotation Summary</span>
            <span className="ml-1 h-5 min-w-5 px-1 rounded-full bg-white text-primary text-[11px] font-bold flex items-center justify-center">
              {quotation.rooms.reduce((s, r) => s + r.lines.reduce((x, l) => x + l.qty, 0), 0)}
            </span>
          </Button>
        </div>

        {/* Single-row selectors: Customer | Project | Floor | Room */}
        <div className="card-surface p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Field label="Customer">
            <Select value={quotation.customerId} onValueChange={setQuotationCustomer}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Project">
            <Input
              defaultValue={quotation.projectName ?? ""}
              placeholder="e.g. G + 3 Building"
              className="h-10"
              onBlur={(e) => setQuotationProject(e.target.value)}
            />
          </Field>
          <Field label="Floor">
            <Select
              value={selectedFloor}
              onValueChange={(v) => {
                if (v === "__add__") { handleAddFloor(); return; }
                setSelectedFloor(v);
                setSelectedRoomId("");
              }}
            >
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {floors.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                <SelectItem value="__add__" className="text-primary font-semibold">+ Add Floor…</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Room">
            <Select
              value={currentRoomId}
              onValueChange={(v) => {
                if (v === "__add__") { handleAddRoom(); return; }
                if (v.startsWith("__preset__")) {
                  const name = v.replace("__preset__", "");
                  const id = ensureRoom(name, selectedFloor);
                  setSelectedRoomId(id);
                  return;
                }
                setSelectedRoomId(v);
              }}
            >
              <SelectTrigger className="h-10"><SelectValue placeholder="Select or add room" /></SelectTrigger>
              <SelectContent>
                {roomsOnFloor.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                {roomsOnFloor.length > 0 && <div className="my-1 border-t border-border" />}
                <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">Quick Add</div>
                {ROOM_PRESETS.filter((p) => !roomsOnFloor.some((r) => r.name === p)).slice(0, 6).map((p) => (
                  <SelectItem key={p} value={`__preset__${p}`}>+ {p}</SelectItem>
                ))}
                <SelectItem value="__add__" className="text-primary font-semibold">+ Custom Room…</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Service points — compact grid */}
        <div className="card-surface p-3 md:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-bold text-[15px]">
              Service Points
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                Adding to <span className="text-primary font-semibold">{selectedFloor}</span>
                {currentRoom && <> · <span className="text-primary font-semibold">{currentRoom.name}</span></>}
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search points…" className="pl-9 h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {filtered.map((s) => {
              const Icon = ICONS[s.icon] ?? Zap;
              const qty = qtyForPoint(s.id);
              return (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-lg border p-2.5 flex flex-col gap-2 transition-colors",
                    qty > 0 ? "border-primary/60 bg-primary/[0.03]" : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", iconTone(s.tone))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[12.5px] leading-tight line-clamp-2">{s.name}</div>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="text-[13px] font-black tabular-nums">₹{s.basePrice.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] text-muted-foreground">{s.unit}</div>
                  </div>
                  <div className="flex items-center rounded-md border border-border overflow-hidden">
                    <button
                      className="h-7 flex-1 flex items-center justify-center hover:bg-muted disabled:opacity-40"
                      onClick={() => changeQty(s, -1)}
                      disabled={qty === 0}
                      aria-label="Decrease"
                    ><Minus className="h-3 w-3" /></button>
                    <div className="h-7 w-8 flex items-center justify-center text-[12.5px] font-bold tabular-nums border-x border-border">{qty}</div>
                    <button
                      className="h-7 flex-1 flex items-center justify-center hover:bg-primary hover:text-primary-foreground"
                      onClick={() => changeQty(s, +1)}
                      aria-label="Increase"
                    ><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-sm text-muted-foreground py-10">No service points match.</div>
            )}
          </div>
        </div>

        {/* Selected points table for current room */}
        {currentRoom && currentRoom.lines.length > 0 && (
          <div className="card-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center gap-2 justify-between">
              <div className="font-bold text-sm flex items-center gap-2 min-w-0">
                <span className="truncate">{selectedFloor}</span>
                <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground shrink-0" />
                <span className="text-primary truncate">{currentRoom.name}</span>
                <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                  {currentRoom.lines.reduce((s, l) => s + l.qty, 0)} Items
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] text-muted-foreground uppercase tracking-wide bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 w-8">#</th>
                    <th className="text-left px-3 py-2">Service Point</th>
                    <th className="text-center px-3 py-2 w-16">Qty</th>
                    <th className="text-left px-3 py-2 w-20 hidden sm:table-cell">Unit</th>
                    <th className="text-right px-3 py-2 w-24">Rate (₹)</th>
                    <th className="text-right px-3 py-2 w-28">Amount (₹)</th>
                    <th className="px-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {currentRoom.lines.map((l, i) => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-semibold">{l.name}</td>
                      <td className="px-3 py-2 text-center font-bold tabular-nums">{l.qty}</td>
                      <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{l.unit}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={l.rate}
                          onChange={(e) => updateLine(currentRoom.id, l.id, { rate: parseFloat(e.target.value) || 0 })}
                          className="h-8 w-20 text-right bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 text-sm font-semibold tabular-nums outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">{(l.qty * l.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2 text-right">
                        <button className="h-7 w-7 rounded hover:bg-muted hover:text-primary flex items-center justify-center text-muted-foreground" onClick={() => deleteLine(currentRoom.id, l.id)} title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/30">
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-bold">Total (This Room)</td>
                    <td className="px-3 py-2 text-center font-bold tabular-nums">{currentRoom.lines.reduce((s, l) => s + l.qty, 0)}</td>
                    <td className="px-3 py-2 hidden sm:table-cell" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 text-right font-black text-primary tabular-nums">{inr(roomSubtotal(currentRoom)).replace(".00", "")}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Summary Sidebar */}
      {summaryOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSummaryOpen(false)} />
          <aside className="fixed lg:sticky top-0 lg:top-16 right-0 z-50 lg:z-auto h-screen lg:h-[calc(100vh-64px)] w-[min(92vw,400px)] shrink-0 border-l border-border bg-background flex flex-col shadow-2xl lg:shadow-none">
            <div className="px-4 lg:px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="font-bold text-lg">Quotation Summary</div>
              <button onClick={() => setSummaryOpen(false)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Prices View toggle */}
            <div className="px-4 lg:px-5 py-3 border-b border-border">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Pricing View</div>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setHidePrices(false)}
                  className={cn("h-8 text-xs font-semibold rounded-md transition-colors", !hide ? "bg-background shadow-sm" : "text-muted-foreground")}
                >Show Prices</button>
                <button
                  onClick={() => setHidePrices(true)}
                  className={cn("h-8 text-xs font-semibold rounded-md transition-colors", hide ? "bg-background shadow-sm" : "text-muted-foreground")}
                >Hide Prices</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-y-2 text-[13px]">
                <div className="text-muted-foreground">Project</div>
                <div className="font-semibold text-right truncate">{quotation.projectName || "—"}</div>
                <div className="text-muted-foreground">Customer</div>
                <div className="font-semibold text-right truncate">{customers.find((c) => c.id === quotation.customerId)?.name ?? "—"}</div>
                <div className="text-muted-foreground">Quotation No.</div>
                <div className="font-semibold text-right">{quotation.number}</div>
              </div>

              {/* Floor → Room → services tree */}
              <div className="space-y-2">
                {floorGroups.map((g) => {
                  const isOpen = expandedFloor === g.floor || floorGroups.length <= 2;
                  const FloorIcon = FLOOR_ICONS[g.floor] ?? Building2;
                  return (
                    <div key={g.floor} className="rounded-lg border border-border overflow-hidden">
                      <button
                        onClick={() => setExpandedFloor(isOpen ? "__none__" : g.floor)}
                        className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-muted/40"
                      >
                        <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FloorIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-[13px] truncate">{g.floor}</div>
                          <div className="text-[11px] text-muted-foreground">{g.items} Items · {g.rooms.length} Rooms</div>
                        </div>
                        {!hide && <div className="font-bold tabular-nums text-[13px] shrink-0">{inr(g.sub).replace(".00", "")}</div>}
                        {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                      {isOpen && g.rooms.length > 0 && (
                        <div className="border-t border-border bg-muted/20 divide-y divide-border">
                          {g.rooms.map((r) => {
                            const rSub = roomSubtotal(r);
                            const rItems = r.lines.reduce((s, l) => s + l.qty, 0);
                            const isActive = r.id === currentRoomId && r.floor === selectedFloor;
                            return (
                              <div key={r.id}>
                                <button
                                  onClick={() => { setSelectedFloor(r.floor ?? g.floor); setSelectedRoomId(r.id); }}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/5",
                                    isActive && "bg-primary/10",
                                  )}
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[12.5px] font-semibold truncate">{r.name}</div>
                                    <div className="text-[10.5px] text-muted-foreground">{rItems} Items</div>
                                  </div>
                                  {!hide && <div className="text-[12.5px] font-bold tabular-nums shrink-0">{inr(rSub).replace(".00", "")}</div>}
                                </button>
                                {r.lines.length > 0 && (
                                  <ul className="px-3 pb-2 pl-8 space-y-0.5">
                                    {r.lines.map((l) => (
                                      <li key={l.id} className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                                        <span className="truncate">{l.name} × {l.qty}</span>
                                        {!hide && <span className="tabular-nums shrink-0 ml-2">{inr(l.qty * l.rate).replace(".00", "")}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="pt-2 space-y-2 text-sm border-t border-border">
                {!hide && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums font-semibold">{inr(totals.material)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={quotation.charges.discountPct}
                          onChange={(e) => updateCharges({ discountPct: parseFloat(e.target.value) || 0 })}
                          className="h-7 w-14 rounded border border-border text-center text-xs font-semibold outline-none focus:border-primary"
                        />
                        <span className="text-xs">%</span>
                        <span className="tabular-nums text-primary w-20 text-right">- {inr(totals.discount).replace(".00", "")}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST ({quotation.charges.gstRate}%)</span>
                      <span className="tabular-nums font-semibold">{inr(totals.gst)}</span>
                    </div>
                  </>
                )}
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="font-black text-base">Grand Total</span>
                  <span className="text-xl font-black text-primary tabular-nums">{inr(totals.grand)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-3 lg:p-4 space-y-2">
              <Button variant="outline" className="w-full h-10 gap-2" onClick={() => toast.success("Draft saved")}>
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
              <Button className="w-full h-10 gap-2 font-semibold" onClick={() => { setStatus(quotation.id, "sent"); nav({ to: "/quotations/$id", params: { id: quotation.id } }); }}>
                <FileText className="h-4 w-4" /> Generate Quotation
              </Button>
              <Button variant="ghost" className="w-full h-10 gap-2 text-muted-foreground" onClick={() => nav({ to: "/quotations/$id", params: { id: quotation.id } })}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">{label}</div>
      {children}
    </div>
  );
}
