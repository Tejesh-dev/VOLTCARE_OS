import { z } from "zod";

export const CustomerTypeSchema = z.enum([
  "Lead",
  "One-time",
  "Repeat",
  "Contract",
]);

export const SourceSchema = z.enum([
  "Google Maps",
  "Referral",
  "Direct",
  "Social",
  "Other",
]);

export const WorkStatusSchema = z.enum([
  "Completed",
  "Pending Follow-up",
  "In Progress",
  "Draft",
]);

export const ProjectStatusSchema = z.enum([
  "Draft",
  "Quoted",
  "Approved",
  "In Progress",
  "Completed",
  "Declined",
]);

export const PricingModeSchema = z.enum([
  "BHK Flat Rate",
  "Point-based Rate",
]);

export const PaymentModeSchema = z.enum([
  "UPI",
  "Cash",
  "Bank Transfer",
  "Cheque",
]);

export const ExpenseCategorySchema = z.enum([
  "Material Purchase",
  "Employee Payout",
  "Travel",
  "Tools",
  "Other",
]);

export type CustomerType = z.infer<typeof CustomerTypeSchema>;
export type SourceType = z.infer<typeof SourceSchema>;
export type WorkStatus = z.infer<typeof WorkStatusSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type PricingMode = z.infer<typeof PricingModeSchema>;
export type PaymentMode = z.infer<typeof PaymentModeSchema>;
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  source: SourceType;
  customerType: CustomerType;
  createdAt: string;
  notes?: string;
  tags?: string[];
};

export type SmallRepairVisit = {
  id: string;
  customerId: string;
  visitDate: string;
  workDone: string;
  laborCharged: number;
  materialExpense: number;
  netProfit: number;
  notes?: string;
  status: WorkStatus;
  createdAt: string;
};

export type Project = {
  id: string;
  customerId: string;
  propertyType: string;
  pricingMode: PricingMode;
  totalQuotationAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: ProjectStatus;
  upcomingTasks?: string[];
  createdAt: string;
  approvedAt?: string;
};

export type QuotationLineItem = {
  id: string;
  room?: string;
  point?: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
  category: "Labor" | "Material" | "Point" | "Other";
};

export type Quotation = {
  id: string;
  projectId: string;
  customerId: string;
  number: string;
  lineItems: QuotationLineItem[];
  discount: number;
  taxRate: number;
  totalAmount: number;
  pdfUrl?: string;
  status: "Draft" | "Sent" | "Approved" | "Rejected";
  createdAt: string;
};

export type SiteDocument = {
  id: string;
  projectId: string;
  kind: "Photo" | "Circuit Diagram" | "Invoice" | "Contract" | "Receipt";
  fileName: string;
  url: string;
  uploadedAt: string;
};

export type Payment = {
  id: string;
  customerId: string;
  projectId?: string;
  visitId?: string;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  receiptUrl?: string;
  notes?: string;
};

export type EmployeePayout = {
  id: string;
  employeeName: string;
  siteId: string;
  date: string;
  amount: number;
  notes?: string;
};

export type CompanyExpense = {
  id: string;
  category: ExpenseCategory;
  siteId?: string;
  amount: number;
  date: string;
  description: string;
};

export type FinancialSnapshot = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingCollections: number;
  laborCost: number;
  materialExpense: number;
};

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  source: SourceSchema,
  customerType: CustomerTypeSchema,
  createdAt: z.string(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const QuotationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  customerId: z.string(),
  number: z.string().min(3),
  lineItems: z.array(
    z.object({
      id: z.string(),
      room: z.string().optional(),
      point: z.string().optional(),
      description: z.string().min(2),
      qty: z.number().min(0),
      unit: z.string().min(1),
      rate: z.number().min(0),
      category: z.enum(["Labor", "Material", "Point", "Other"]),
    }),
  ),
  discount: z.number().min(0),
  taxRate: z.number().min(0),
  totalAmount: z.number().min(0),
  pdfUrl: z.string().url().optional(),
  status: z.enum(["Draft", "Sent", "Approved", "Rejected"]),
  createdAt: z.string(),
});

export const calculateRepairNetProfit = (visit: SmallRepairVisit) =>
  visit.laborCharged + visit.materialExpense > 0 ? visit.laborCharged - visit.materialExpense : visit.netProfit;

export const calculateProjectLedger = (
  payments: Payment[],
  employeeCosts: EmployeePayout[],
  companyExpenses: CompanyExpense[],
  repairs: SmallRepairVisit[],
): FinancialSnapshot => {
  const totalRevenue =
    payments.reduce((sum, p) => sum + p.amount, 0) +
    repairs.reduce((sum, v) => sum + v.laborCharged, 0);

  const totalExpenses =
    employeeCosts.reduce((sum, item) => sum + item.amount, 0) +
    companyExpenses.reduce((sum, item) => sum + item.amount, 0) +
    repairs.reduce((sum, v) => sum + v.materialExpense, 0);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    pendingCollections: Math.max(0, totalRevenue - payments.reduce((sum, p) => sum + p.amount, 0)),
    laborCost: employeeCosts.reduce((sum, item) => sum + item.amount, 0),
    materialExpense: repairs.reduce((sum, v) => sum + v.materialExpense, 0),
  };
};

export const createQuotationFromRoomPoints = (
  rooms: Array<{ name: string; points: Array<{ name: string; qty: number; rate: number }> }>,
  laborRate = 0,
): QuotationLineItem[] =>
  rooms.flatMap((room) =>
    room.points.map((point) => ({
      id: `${room.name}-${point.name}`,
      room: room.name,
      point: point.name,
      description: `${room.name} · ${point.name}`,
      qty: point.qty,
      unit: "point",
      rate: point.rate + laborRate,
      category: "Point",
    })),
  );

export const validateCustomer = (data: unknown) => CustomerSchema.parse(data);
export const validateQuotation = (data: unknown) => QuotationSchema.parse(data);
