// Voltcare — 360° Customer profile
// Adds: WhatsApp/Call quick actions, editable notes, work status,
// visit/service charges, and site photos (persisted as data URLs in the
// zustand store → localStorage). Lists all quotations, material lists,
// invoices and payments linked to the customer with financial summary.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
// The /customers layout wraps this route in AppShell + ClientGate already.
import {
  useVoltcare,
  quotationTotals,
  invoiceTotals,
  type CustomerWorkStatus,
  type CustomerCommunication,
  type Quotation,
} from "@/store/voltcare";
import { inr, shortDate } from "@/lib/format";
import {
  ArrowLeft,
  FileText,
  Receipt,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ImagePlus,
  Trash2,
  Save,
  Pencil,
  Plus,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type CustomerContactType = "call" | "message" | "visit";

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
}

export const Route = createFileRoute("/customers/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Customer ${params.id} — Voltcare OS` },
      {
        name: "description",
        content:
          "Customer profile with all quotations, material lists, invoices and payments.",
      },
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
  const customerId = useVoltcare(
    (s) => s.customers.find((c) => c.id === id)?.id,
  );
  return <CustomerProfileContent key={`${id}:${customerId ?? ""}`} id={id} />;
}

function CustomerProfileContent({ id }: { id: string }) {
  const customer = useVoltcare((s) => s.customers.find((c) => c.id === id));
  const updateCustomer = useVoltcare((s) => s.updateCustomer);
  const addCustomerNote = useVoltcare((s) => s.addCustomerNote);
  const addCustomerExpense = useVoltcare((s) => s.addCustomerExpense);
  const deleteCustomerExpense = useVoltcare((s) => s.deleteCustomerExpense);
  const addCustomerCommunication = useVoltcare(
    (s) => s.addCustomerCommunication,
  );
  const newBlankQuotation = useVoltcare((s) => s.newBlankQuotation);
  const generateInvoiceFromQuotation = useVoltcare(
    (s) => s.generateInvoiceFromQuotation,
  );
  const navigate = useNavigate();
  // Select the raw arrays (a selector that returns a fresh array each render
  // makes Zustand's store snapshot unstable → infinite re-render) and derive
  // this customer's records with useMemo.
  const allQuotations = useVoltcare((s) => s.quotations);
  const allInvoices = useVoltcare((s) => s.invoices);
  const allMaterialLists = useVoltcare((s) => s.materialLists);
  const allPayments = useVoltcare((s) => s.payments);
  const setQuoteStatus = useVoltcare((s) => s.setQuotationStatus);

  const quotations = useMemo(
    () =>
      allQuotations
        .filter((q) => q.customerId === id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allQuotations, id],
  );
  const invoices = useMemo(
    () =>
      allInvoices
        .filter((i) => i.customerId === id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allInvoices, id],
  );
  const materialLists = useMemo(
    () =>
      allMaterialLists
        .filter((m) => m.customerId === id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allMaterialLists, id],
  );
  const payments = useMemo(() => {
    const invoiceIds = new Set(invoices.map((i) => i.id));
    return allPayments.filter((p) => invoiceIds.has(p.invoiceId));
  }, [allPayments, invoices]);

  const fileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState(customer?.notes ?? "");
  const [visitCharge, setVisitCharge] = useState(customer?.visitCharge ?? 0);
  const [serviceCharge, setServiceCharge] = useState(
    customer?.serviceCharge ?? 0,
  );
  const [status, setStatus] = useState<CustomerWorkStatus>(
    customer?.workStatus ?? "new",
  );
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<
    "Machinery" | "Labour" | "Order"
  >("Machinery");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseDate, setExpenseDate] = useState(() =>
    localDateValue(new Date()),
  );
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactDate, setContactDate] = useState<Date>(new Date());
  const [contactType, setContactType] = useState<CustomerContactType>("call");
  const [contactNote, setContactNote] = useState("");
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceQuoteId, setSelectedInvoiceQuoteId] = useState("");
  const [viewMaterialListId, setViewMaterialListId] = useState<string | null>(
    null,
  );

  if (!customer)
    return <div className="p-8 text-muted-foreground">Customer not found.</div>;

  const onAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for the customer photo.");
      return;
    }

    try {
      const avatarUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("The selected image could not be read."));
        };
        reader.onerror = () =>
          reject(
            reader.error ?? new Error("The selected image could not be read."),
          );
        reader.readAsDataURL(file);
      });
      updateCustomer(customer.id, { avatarUrl });
      toast.success("Customer photo updated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not read the customer photo.",
      );
    }
  };

  const qTotal = quotations.reduce((s, q) => s + quotationTotals(q).grand, 0);
  const invTotal = invoices.reduce((s, i) => s + invoiceTotals(i).grand, 0);
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, invTotal - paidTotal);
  const pendingInvoiceCount = invoices.filter(
    (invoice) => invoiceTotals(invoice).balance > 0,
  ).length;
  const expenseTypeTotals = (["Machinery", "Labour", "Order"] as const).map(
    (type) => {
      const entries = (customer.expenses ?? []).filter(
        (expense) =>
          expense.expenseType === type ||
          (!expense.expenseType &&
            type === "Labour" &&
            expense.category === "labor"),
      );
      return {
        type,
        count: entries.length,
        total: entries.reduce((sum, expense) => sum + expense.amount, 0),
      };
    },
  );
  const contactHistory = [...(customer.communications ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const customerNotes = [...(customer.notesHistory ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const selectedMaterialList = materialLists.find(
    (list) => list.id === viewMaterialListId,
  );

  const savePanel = () => {
    updateCustomer(customer.id, {
      notes,
      visitCharge,
      serviceCharge,
      workStatus: status,
    });
    toast.success("Customer updated");
  };

  const saveCustomerNote = () => {
    const content = noteDraft.trim();
    if (!content) return;
    addCustomerNote(customer.id, {
      content,
      createdAt: new Date().toISOString(),
    });
    setNoteDraft("");
    setNoteEditorOpen(false);
    toast.success("Note added");
  };

  const saveCustomerExpense = () => {
    const amount = Number(expenseAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !expenseDate) {
      toast.error("Enter a valid amount and date.");
      return;
    }
    addCustomerExpense(customer.id, {
      amount,
      category: expenseType === "Labour" ? "labor" : "other",
      date: expenseDate,
      description: expenseNote.trim(),
      expenseType,
    });
    setExpenseDialogOpen(false);
    setExpenseAmount("");
    setExpenseNote("");
    setExpenseType("Machinery");
    setExpenseDate(localDateValue(new Date()));
    toast.success("Expense added");
  };

  const saveContactHistory = () => {
    const message = contactNote.trim();
    if (!message) {
      toast.error("Enter a note for this contact.");
      return;
    }
    const channel: CustomerCommunication["channel"] = contactType;
    addCustomerCommunication(customer.id, {
      channel,
      date: localDateValue(contactDate),
      message,
    });
    setContactDialogOpen(false);
    setContactDate(new Date());
    setContactType("call");
    setContactNote("");
    toast.success("Contact history added");
  };

  const createCustomerQuotation = () => {
    const quotationId = newBlankQuotation(customer.id);
    navigate({ to: "/quotations/$id", params: { id: quotationId } });
  };

  const createCustomerInvoice = () => {
    const invoice = generateInvoiceFromQuotation(selectedInvoiceQuoteId);
    if (!invoice) {
      toast.error("Could not create an invoice from that quotation.");
      return;
    }
    setInvoiceDialogOpen(false);
    toast.success(`Invoice ${invoice.number} created`);
    navigate({ to: "/invoices/$id", params: { id: invoice.id } });
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
      updateCustomer(customer.id, {
        photos: [...(customer.photos ?? []), ...imgs],
      });
      toast.success(`${imgs.length} photo${imgs.length > 1 ? "s" : ""} added`);
    });
  };

  const removePhoto = (i: number) => {
    const next = (customer.photos ?? []).filter((_, idx) => idx !== i);
    updateCustomer(customer.id, { photos: next });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <Link
        to="/customers"
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      {/* Identity */}
      <div className="card-surface p-5 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                aria-label={`Change ${customer.name}'s profile photo`}
                title="Change profile photo"
                className="group h-full w-full rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {customer.avatarUrl ? (
                  <img
                    src={customer.avatarUrl}
                    alt={`${customer.name}'s profile`}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-xl font-black text-primary">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-emerald-600 text-white">
                  <Pencil className="h-2.5 w-2.5" />
                </span>
              </button>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  void onAvatarChange(file);
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black truncate">
                  {customer.name}
                </h1>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    STATUS_TONE[status],
                  )}
                >
                  {STATUS_LABEL[status]}
                </span>
                {customer.recordKind === "illustrative" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    Illustrative profile
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Customer since {shortDate(customer.createdAt)}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                )}
                {customer.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.city}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href={
                customer.recordKind === "illustrative"
                  ? undefined
                  : `tel:${customer.phone}`
              }
              aria-disabled={customer.recordKind === "illustrative"}
              title={
                customer.recordKind === "illustrative"
                  ? "Placeholder contact number"
                  : undefined
              }
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border hover:border-primary/50 text-sm font-semibold",
                customer.recordKind === "illustrative" &&
                  "pointer-events-none opacity-50",
              )}
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            <a
              href={
                customer.recordKind === "illustrative"
                  ? undefined
                  : `https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`
              }
              target="_blank"
              rel="noreferrer"
              aria-disabled={customer.recordKind === "illustrative"}
              title={
                customer.recordKind === "illustrative"
                  ? "Placeholder contact number"
                  : undefined
              }
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[oklch(0.55_0.16_150)] text-white hover:opacity-90 text-sm font-semibold",
                customer.recordKind === "illustrative" &&
                  "pointer-events-none opacity-50",
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
        <Stat
          label="Received"
          value={payments.length}
          sub={inr(paidTotal)}
          tone="ok"
        />
        <Stat
          label="Pending"
          value={pendingInvoiceCount}
          sub={inr(pending)}
          tone={pending > 0 ? "warn" : "ok"}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {expenseTypeTotals.map((expense) => (
          <Stat
            key={expense.type}
            label={`${expense.type} Expenses`}
            value={expense.count}
            sub={inr(expense.total)}
          />
        ))}
      </div>

      {/* Editable panel: charges + notes + status */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Customer Details</h2>
          <Button size="sm" className="gap-1.5" onClick={savePanel}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Visit Charge (₹)</Label>
            <Input
              type="number"
              value={visitCharge}
              onChange={(e) => setVisitCharge(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label className="text-xs">Service Charge (₹)</Label>
            <Input
              type="number"
              value={serviceCharge}
              onChange={(e) =>
                setServiceCharge(parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div>
            <Label className="text-xs">Work Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as CustomerWorkStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as CustomerWorkStatus[]).map(
                  (k) => (
                    <SelectItem key={k} value={k}>
                      {STATUS_LABEL[k]}
                    </SelectItem>
                  ),
                )}
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

      <Section
        title="Notes"
        icon={<ClipboardList className="h-4 w-4" />}
        action={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Add note"
            onClick={() => setNoteEditorOpen((open) => !open)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      >
        {noteEditorOpen && (
          <div className="space-y-3 p-3 border-b border-border">
            <Textarea
              autoFocus
              rows={3}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Write a note..."
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNoteDraft("");
                  setNoteEditorOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveCustomerNote}
                disabled={!noteDraft.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}
        {customerNotes.length === 0 ? (
          <Empty text="No notes yet." />
        ) : (
          customerNotes.map((note) => (
            <div
              key={note.id}
              className="p-3 border-b border-border last:border-0"
            >
              <div className="text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm">
                {note.content}
              </div>
            </div>
          ))
        )}
      </Section>

      <Section
        title="Expenses"
        icon={<Receipt className="h-4 w-4" />}
        action={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Add expense"
            onClick={() => setExpenseDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      >
        {(customer.expenses?.length ?? 0) === 0 ? (
          <Empty text="No expenses recorded." />
        ) : (
          customer.expenses?.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-wrap items-center gap-3 p-3 border-b border-border last:border-0"
            >
              <div className="text-xs text-muted-foreground">
                {shortDate(expense.date)}
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {expense.expenseType ??
                  (expense.category === "labor"
                    ? "Labour"
                    : expense.category === "material"
                      ? "Machinery"
                      : "Order")}
              </span>
              <div className="font-bold tabular-nums">
                {inr(expense.amount)}
              </div>
              <div className="min-w-[120px] flex-1 text-sm">
                {expense.description}
                {expense.recordKind === "illustrative" && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    Illustrative expense
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Delete expense"
                onClick={() => deleteCustomerExpense(customer.id, expense.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </Section>

      <Section
        title="Contact History"
        icon={<MessageCircle className="h-4 w-4" />}
        action={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Add contact history"
            onClick={() => setContactDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
      >
        {contactHistory.length === 0 ? (
          <Empty text="No history" />
        ) : (
          contactHistory.map((communication) => (
            <div
              key={communication.id}
              className="p-3 border-b border-border last:border-0"
            >
              <div className="font-semibold">
                {communication.channel === "call"
                  ? "Call Kiya"
                  : communication.channel === "visit"
                    ? "Visit Kiya"
                    : communication.channel === "message" ||
                        communication.channel === "whatsapp"
                      ? "Message Kiya"
                      : "Note"}
              </div>
              <div className="text-xs text-muted-foreground">
                {shortDate(communication.date)}
              </div>
              <div className="mt-1 text-sm">{communication.message}</div>
            </div>
          ))
        )}
      </Section>

      {/* Site photos */}
      <div className="card-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Site Photos</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" /> Add photos
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onAddPhoto(e.target.files)}
          />
        </div>
        {(customer.photos?.length ?? 0) === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            No site photos yet. Add pictures to keep visual records for future
            work.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {customer.photos!.map((src, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-md overflow-hidden border border-border group"
              >
                <img
                  src={src}
                  alt={`site-${i}`}
                  className="h-full w-full object-cover"
                />
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
      <Section
        title="Quotations"
        icon={<FileText className="h-4 w-4" />}
        action={
          <Button type="button" size="sm" onClick={createCustomerQuotation}>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
        }
      >
        {quotations.length === 0 ? (
          <Empty text="No quotations yet." />
        ) : (
          quotations.map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border last:border-0"
            >
              <Link
                to="/quotations/$id"
                params={{ id: q.id }}
                className="flex-1 min-w-0 hover:text-primary"
              >
                <div className="font-semibold">
                  {shortDate(q.createdAt)} · {q.number}
                </div>
                <div className="text-xs text-muted-foreground">
                  {q.rooms.length} rooms · {q.status}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Select
                  value={q.status}
                  onValueChange={(value) => {
                    setQuoteStatus(q.id, value as Quotation["status"]);
                    toast.success("Status updated");
                  }}
                >
                  <SelectTrigger className="h-8 w-[130px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
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
                  <div className="font-bold text-primary tabular-nums w-24 text-right">
                    {inr(quotationTotals(q).grand)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </Section>

      <Section
        title="Material Lists"
        icon={<ClipboardList className="h-4 w-4" />}
        action={
          <Button
            type="button"
            size="sm"
            onClick={() =>
              navigate({ to: "/products", search: { customerId: customer.id } })
            }
          >
            <Plus className="h-4 w-4" /> New Material List
          </Button>
        }
      >
        {materialLists.length === 0 ? (
          <Empty text="No material lists yet." />
        ) : (
          materialLists.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setViewMaterialListId(m.id)}
              className="flex w-full items-center justify-between p-3 text-left hover:bg-muted border-b border-border last:border-0"
            >
              <div>
                <div className="font-semibold">Material List {m.number}</div>
                <div className="text-xs text-muted-foreground">
                  {shortDate(m.createdAt)} · {m.items.length} items
                </div>
              </div>
              <div className="font-bold text-primary">View</div>
            </button>
          ))
        )}
      </Section>

      <Section
        title="Invoices"
        icon={<Receipt className="h-4 w-4" />}
        action={
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setSelectedInvoiceQuoteId(quotations[0]?.id ?? "");
              setInvoiceDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        }
      >
        {invoices.length === 0 ? (
          <Empty text="No invoices yet." />
        ) : (
          invoices.map((i) => {
            const totals = invoiceTotals(i);
            const due = Math.max(0, totals.balance);
            const paid = Math.max(0, totals.grand - due);
            return (
              <Link
                key={i.id}
                to="/invoices/$id"
                params={{ id: i.id }}
                className="flex items-center justify-between p-3 hover:bg-muted border-b border-border last:border-0"
              >
                <div className="min-w-0">
                  <div className="font-semibold">
                    {shortDate(i.createdAt)} · {i.number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {i.status} · Paid {inr(paid)} · Due {inr(due)}
                    {i.recordKind === "illustrative"
                      ? " · Illustrative balance"
                      : ""}
                  </div>
                </div>
                <div className="font-bold text-primary tabular-nums">
                  {inr(totals.grand)}
                </div>
              </Link>
            );
          })
        )}
      </Section>

      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={expenseType}
                onValueChange={(value) =>
                  setExpenseType(value as "Machinery" | "Labour" | "Order")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Machinery">Machinery</SelectItem>
                  <SelectItem value="Labour">Labour</SelectItem>
                  <SelectItem value="Order">Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-expense-amount">Amount (₹)</Label>
              <Input
                id="customer-expense-amount"
                type="number"
                min="0"
                step="0.01"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-expense-note">Note</Label>
              <Textarea
                id="customer-expense-note"
                rows={3}
                value={expenseNote}
                onChange={(event) => setExpenseNote(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-expense-date">Date</Label>
              <Input
                id="customer-expense-date"
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveCustomerExpense}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="h-4 w-4" />
                    {contactDate.toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={contactDate}
                    onSelect={(date) => date && setContactDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={contactType}
                onValueChange={(value) =>
                  setContactType(value as CustomerContactType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call Kiya</SelectItem>
                  <SelectItem value="message">Message Kiya</SelectItem>
                  <SelectItem value="visit">Visit Kiya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-contact-note">Note</Label>
              <Input
                id="customer-contact-note"
                value={contactNote}
                onChange={(event) => setContactNote(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setContactDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveContactHistory}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          {quotations.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create a quotation for this customer before creating an invoice.
              </p>
              <Button
                type="button"
                onClick={() => {
                  setInvoiceDialogOpen(false);
                  createCustomerQuotation();
                }}
              >
                <Plus className="h-4 w-4" /> New Quotation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Quotation</Label>
              <Select
                value={selectedInvoiceQuoteId}
                onValueChange={setSelectedInvoiceQuoteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotations.map((quotation) => (
                    <SelectItem key={quotation.id} value={quotation.id}>
                      {quotation.number} · {shortDate(quotation.createdAt)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {quotations.length > 0 && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInvoiceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createCustomerInvoice}
                disabled={!selectedInvoiceQuoteId}
              >
                Create Invoice
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedMaterialList}
        onOpenChange={(open) => !open && setViewMaterialListId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMaterialList
                ? `Material List ${selectedMaterialList.number}`
                : "Material List"}
            </DialogTitle>
          </DialogHeader>
          {selectedMaterialList && (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                {shortDate(selectedMaterialList.createdAt)} ·{" "}
                {selectedMaterialList.items.length} items
              </p>
              {selectedMaterialList.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm"
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.brand} · {item.sku}
                    </div>
                  </div>
                  <div className="shrink-0 tabular-nums">
                    {item.qty} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="card-surface p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-black tabular-nums mt-1">{value}</div>
      {sub && (
        <div
          className={cn(
            "text-xs font-semibold tabular-nums mt-0.5",
            tone === "warn"
              ? "text-amber-600"
              : tone === "ok"
                ? "text-emerald-600"
                : "text-primary",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-border font-semibold flex items-center gap-2">
        {icon}
        {title}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="p-6 text-center text-sm text-muted-foreground">{text}</div>
  );
}
