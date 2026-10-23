import { useVoltcare, invoiceTotals, quotationTotals } from "@/store/voltcare";
import { inr, inrCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ClipboardList, FileText, IndianRupee, Receipt, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

export function BusinessSummaryCards({ customerId }: { customerId?: string }) {
  const [profitPeriod, setProfitPeriod] = useState("all");
  const customers = useVoltcare((s) => s.customers);
  const quotations = useVoltcare((s) => s.quotations);
  const invoices = useVoltcare((s) => s.invoices);
  const payments = useVoltcare((s) => s.payments);
  const materialLists = useVoltcare((s) => s.materialLists);

  const customerIds = new Set(customerId ? [customerId] : customers.map((customer) => customer.id));
  const scopedQuotes = quotations.filter((quotation) => customerIds.has(quotation.customerId));
  const scopedInvoices = invoices.filter((invoice) => customerIds.has(invoice.customerId));
  const scopedInvoiceIds = new Set(scopedInvoices.map((invoice) => invoice.id));
  const illustrativeInvoiceIds = new Set(
    scopedInvoices.filter((invoice) => invoice.recordKind === "illustrative").map((invoice) => invoice.id),
  );
  const scopedPayments = payments.filter((payment) =>
    scopedInvoiceIds.has(payment.invoiceId) &&
    !illustrativeInvoiceIds.has(payment.invoiceId) &&
    (profitPeriod === "all"
      ? new Date(payment.createdAt).getFullYear() >= 2019
      : new Date(payment.createdAt).getFullYear() === Number(profitPeriod)),
  );
  const scopedMaterials = materialLists.filter((list) => !customerId || list.customerId === customerId);
  const scopedExpenses = customers
    .filter((customer) => customerIds.has(customer.id))
    .flatMap((customer) => customer.expenses ?? [])
    .filter((expense) =>
      profitPeriod === "all"
        ? new Date(expense.date).getFullYear() >= 2019
        : new Date(expense.date).getFullYear() === Number(profitPeriod),
    );
  const expenses = scopedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const actualExpenses = scopedExpenses
    .filter((expense) => expense.recordKind !== "illustrative")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const illustrativeExpenses = expenses - actualExpenses;
  const received = scopedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const profit = received - actualExpenses;
  const pendingPayments = scopedInvoices.reduce((sum, invoice) => sum + Math.max(0, invoiceTotals(invoice).balance), 0);
  const quotationValue = scopedQuotes.reduce((sum, quotation) => sum + quotationTotals(quotation).grand, 0);
  const pendingMaterials = scopedMaterials.filter((list) => list.status !== "sent").length;
  const draftQuotes = scopedQuotes.filter((quotation) => quotation.status === "draft").length;
  const illustrativeBalances = scopedInvoices.filter(
    (invoice) => invoice.recordKind === "illustrative" && invoiceTotals(invoice).balance > 0,
  ).length;
  const profitGoal = 2514687;
  const profitYears = Array.from(
    { length: Math.max(1, new Date().getFullYear() - 2019 + 1) },
    (_, index) => 2019 + index,
  );

  const items = [
    {
      label: customerId ? "Actual Profit" : "Profit Target",
      value: customerId ? inrCompact(profit) : inr(profitGoal).replace(/\.00$/, ""),
      detail: customerId
        ? `${profitPeriod === "all" ? "Actual since 2019" : `Actual in ${profitPeriod}`}: ${inrCompact(profit)}`
        : `Goal · not actual profit · Actual since ${profitPeriod === "all" ? "2019" : profitPeriod}: ${inrCompact(profit)}`,
      icon: TrendingUp,
      tone: "text-primary",
    },
    {
      label: "Total Expense",
      value: inr(expenses),
      detail: `${inr(actualExpenses)} recorded · ${inr(illustrativeExpenses)} illustrative`,
      icon: TrendingDown,
      tone: "text-amber-600",
    },
    {
      label: "Pending Payments",
      value: inr(pendingPayments),
      detail: `${scopedInvoices.filter((invoice) => invoiceTotals(invoice).balance > 0).length} open · ${illustrativeBalances} illustrative`,
      icon: IndianRupee,
      tone: "text-primary",
    },
    {
      label: "Quotations",
      value: String(scopedQuotes.length),
      detail: `${inr(quotationValue)} · illustrative records included`,
      icon: FileText,
      tone: "text-blue-600",
    },
    { label: "Pending Material Sending", value: String(pendingMaterials), detail: "Not marked as sent", icon: ClipboardList, tone: "text-orange-600" },
    { label: "Pending Quotation Sending", value: String(draftQuotes), detail: "Draft quotations", icon: Receipt, tone: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
      {items.map(({ label, value, detail, icon: Icon, tone }) => (
        <div
          key={label}
          className={cn(
            "card-surface min-w-0 p-4",
            (label === "Profit Target" || label === "Actual Profit") && "col-span-full xl:col-span-2",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium leading-snug text-muted-foreground">{label}</div>
            {label === "Profit Target" || label === "Actual Profit" ? (
              <select
                aria-label="Filter profit by year"
                value={profitPeriod}
                onChange={(event) => setProfitPeriod(event.target.value)}
                className="max-w-[108px] rounded-md border border-border bg-background px-1.5 py-1 text-[11px] font-medium"
              >
                <option value="all">Since 2019</option>
                {profitYears.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            ) : (
              <Icon className={cn("h-4 w-4 shrink-0", tone)} aria-hidden="true" />
            )}
          </div>
          <div
            className={cn(
              "mt-3 truncate whitespace-nowrap text-lg font-bold tabular-nums",
              (label === "Profit Target" || label === "Actual Profit") && "text-primary",
            )}
            title={value}
          >
            {value}
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground" title={detail}>{detail}</div>
        </div>
      ))}
    </div>
  );
}