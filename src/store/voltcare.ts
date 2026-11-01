import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid } from "@/lib/format";

// ---------- Types ----------
export type CustomerWorkStatus =
  "new" | "in_progress" | "completed" | "on_hold";
export type CustomerVisit = {
  id: string;
  date: string;
  service: string;
  serviceCount: number;
  charge: number;
  notes?: string;
  workSummary?: string;
};
export type CustomerNote = {
  id: string;
  text: string;
  isTask: boolean;
  dueDate: string;
  isDone: boolean;
  createdAt: string;
  doneAt: string | null;
};
export type CustomerExpense = {
  id: string;
  date: string;
  description: string;
  amount: number;
  expenseType?: "Machinery" | "Labour" | "Order";
  category?: "material" | "labor" | "other";
  recordKind?: "illustrative";
};
export type CustomerCommunication = {
  id: string;
  date: string;
  channel: "note" | "call" | "message" | "visit" | "whatsapp";
  message: string;
};
export type CustomerManualPayment = {
  id: string;
  date: string;
  amount: number;
  method: "cash" | "upi" | "bank" | "cheque";
  reference?: string;
};
export type CustomerPhoto = {
  id: string;
  dataUrl: string;
  caption: string;
  date: string;
  kind: "site" | "completion";
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  createdAt: string;
  notes?: string;
  avatarUrl?: string;
  photos?: string[]; // data URLs (site photos)
  visitCharge?: number;
  serviceCharge?: number;
  workStatus?: CustomerWorkStatus;
  notesHistory?: CustomerNote[];
  tags?: string[];
  visits?: CustomerVisit[];
  expenses?: CustomerExpense[];
  communications?: CustomerCommunication[];
  completionPhotos?: string[];
  googleMapsLink?: string;
  manualPayments?: CustomerManualPayment[];
  photoRecords?: CustomerPhoto[];
  recordKind?: "illustrative";
};

export type ProductVariant = {
  id: string;
  label: string;
  price?: number;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  wireType?:
    | "coil"
    | "service"
    | "two-core"
    | "three-core"
    | "four-core"
    | "flexible"
    | "submersible"
    | "specialty";
  sku: string;
  unit: string;
  subUnit?: string;
  price: number;
  gstRate: number;
  stock: number;
  stockUnit: string;
  image?: string;
  favorite?: boolean;
  hidden?: boolean;
  variants?: ProductVariant[];
};

export type ServicePoint = {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  basePrice: number;
  icon: string; // lucide name
  tone: "red" | "yellow" | "green" | "blue" | "slate" | "orange" | "pink";
};

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  variantLabel?: string;
  qty: number;
};

export type RoomLine = {
  id: string;
  pointId?: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  rate: number;
};

export type Room = {
  id: string;
  name: string;
  floor?: string;
  note?: string;
  icon?: string;
  lines: RoomLine[];
  expanded?: boolean;
};

export type QuotationCharges = {
  labour: number;
  transport: number;
  other: number;
  discountPct: number;
  gstRate: number;
  grandOverride?: number; // manual grand total override
};

export type Quotation = {
  id: string;
  number: string;
  customerId: string;
  projectName?: string;
  floors: string[];
  createdAt: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  rooms: Room[];
  charges: QuotationCharges;
  hidePrices: boolean;
  paymentTerms: string;
  terms: string[];
  recordKind?: "illustrative";
};

export type MaterialListItem = {
  id: string;
  productId?: string;
  name: string;
  brand: string;
  sku: string;
  qty: number;
  unit: string;
  rate: number;
};

export type MaterialList = {
  id: string;
  number: string;
  customerId?: string;
  quotationId?: string;
  createdAt: string;
  items: MaterialListItem[];
  hidePrices: boolean;
  terms?: string[];
  status?: "pending" | "sent" | "approved";
};

export type Invoice = {
  id: string;
  number: string;
  customerId: string;
  quotationId?: string;
  createdAt: string;
  dueDate: string;
  items: { name: string; description?: string; qty: number; rate: number }[];
  hidePrices?: boolean;
  terms?: string[];
  status: "draft" | "sent" | "paid" | "partial" | "overdue";
  paidAmount: number;
  recordKind?: "illustrative";
};

export type Payment = {
  id: string;
  invoiceId: string;
  amount: number;
  method: "cash" | "upi" | "bank" | "cheque";
  reference?: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  kind: "quotation" | "material" | "invoice" | "payment" | "customer";
  title: string;
  subtitle?: string;
  amount?: number;
  createdAt: string;
};

export type Settings = {
  company: {
    name: string;
    tagline: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    website: string;
    gstin: string;
  };
  defaults: {
    gstRate: number;
    labour: number;
    transport: number;
    paymentTerms: string;
    terms: string[];
  };
  user: { name: string; role: string };
};

// ---------- Seed ----------
const now = Date.now();
const iso = (offsetDays = 0) =>
  new Date(now - offsetDays * 86400000).toISOString();
const illustrativeDate = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day, 12)).toISOString();

const seedCustomers: Customer[] = [
  {
    id: "cus-1",
    name: "Tejesh Meshram",
    phone: "8459718594",
    email: "tejesh@voltcare.in",
    city: "Nagpur",
    address: "Plot 12, Sadar",
    createdAt: iso(30),
  },
  {
    id: "cus-2",
    name: "Atharva Constructions",
    phone: "9970174508",
    city: "Nagpur",
    address: "Wardha Rd",
    createdAt: iso(20),
  },
  {
    id: "cus-3",
    name: "Shivam Electricals",
    phone: "9021123344",
    city: "Nagpur",
    createdAt: iso(12),
  },
  {
    id: "cus-4",
    name: "Omkarr Enterprises",
    phone: "9822011122",
    city: "Nagpur",
    createdAt: iso(1),
  },
];

const illustrativeCustomerNames = [
  "Aarav Deshmukh",
  "Aditi Gawande",
  "Aditya Joshi",
  "Ananya Kale",
  "Aniket Kamble",
  "Anjali Kulkarni",
  "Arjun Mahajan",
  "Bhavna More",
  "Chetan Patil",
  "Deepa Raut",
  "Devendra Shah",
  "Gauri Sharma",
  "Harish Shinde",
  "Isha Thakur",
  "Kavita Tiwari",
  "Kunal Wankhede",
  "Madhav Yadav",
  "Meera Borkar",
  "Neha Chaudhari",
  "Nikhil Meshram",
  "Pooja Deshpande",
  "Rahul Sahu",
  "Rohan Kapse",
  "Sakshi Kharbade",
  "Sanjay Narnaware",
  "Sneha Pande",
  "Suresh Dhurve",
  "Tanvi Bawankar",
  "Vijay Zade",
  "Yash Kothari",
];
const illustrativeSurnames = [
  "Agarwal",
  "Bansod",
  "Bisen",
  "Chawla",
  "Chopra",
  "Dewangan",
  "Fadnavis",
  "Fulzele",
  "Gajbhiye",
  "Gaikwad",
  "Gokhale",
  "Gupta",
  "Hingne",
  "Jaiswal",
  "Khandare",
  "Lanjewar",
  "Lohar",
  "Mankar",
  "Mishra",
  "Nikam",
];
const illustrativeCities = [
  "Nagpur",
  "Wardha",
  "Amravati",
  "Bhandara",
  "Chandrapur",
];
const illustrativeStatuses: CustomerWorkStatus[] = [
  "new",
  "in_progress",
  "completed",
  "on_hold",
];
const illustrativeNamedCustomers: Pick<Customer, "id" | "name" | "phone">[] = [
  {
    id: "illustrative-cus-nitin",
    name: "Nitin Manishnagar",
    phone: "0000000001",
  },
  {
    id: "illustrative-cus-vivek",
    name: "Vivek Mahatpure",
    phone: "0000000002",
  },
  {
    id: "illustrative-cus-gavrav",
    name: "Gavrav Shribhatre",
    phone: "0000000003",
  },
];
const illustrativeCustomers: Customer[] = [
  ...illustrativeNamedCustomers,
  ...Array.from({ length: 200 }, (_, index) => {
    const firstName =
      illustrativeCustomerNames[index % illustrativeCustomerNames.length].split(
        " ",
      )[0];
    const surname =
      illustrativeSurnames[
        Math.floor(index / illustrativeCustomerNames.length)
      ];
    return {
      id: `illustrative-cus-${String(index + 1).padStart(3, "0")}`,
      name: `${firstName} ${surname}`,
      phone: `00000${String(index + 4).padStart(5, "0")}`,
    };
  }),
].map((customer, index) => {
  const status = illustrativeStatuses[index % illustrativeStatuses.length];
  const createdAt = illustrativeDate(
    2019 + (index % 8),
    index % 12,
    (index % 27) + 1,
  );
  return {
    ...customer,
    email: `customer${index + 1}@example.com`,
    address: `House ${index + 1}, Sample Colony`,
    city: illustrativeCities[index % illustrativeCities.length],
    createdAt,
    notes:
      "Illustrative customer profile. Replace with verified customer details.",
    workStatus: status,
    tags: ["Illustrative", index % 3 === 0 ? "Commercial" : "Residential"],
    visits: [
      {
        id: `illustrative-visit-${index + 1}`,
        date: createdAt,
        service: [
          "Wiring inspection",
          "Lighting installation",
          "Switchboard repair",
          "New connection",
        ][index % 4],
        serviceCount: (index % 5) + 1,
        charge: 1800 + (index % 8) * 650,
        notes: "Illustrative service history",
      },
    ],
    communications: [
      {
        id: `illustrative-communication-${index + 1}`,
        date: createdAt,
        channel: (["call", "whatsapp", "note"] as const)[index % 3],
        message: "Illustrative follow-up record",
      },
    ],
    recordKind: "illustrative",
  };
});

const illustrativeExpenses: CustomerExpense[] = Array.from(
  { length: 25 },
  (_, index) => ({
    id: `illustrative-expense-${index + 1}`,
    date: illustrativeDate(
      2019 + Math.floor(index / 4),
      index % 12,
      (index % 27) + 1,
    ),
    description: [
      "Illustrative cable and wiring materials",
      "Illustrative site transport",
      "Illustrative electrical fittings",
      "Illustrative technician labour",
      "Illustrative safety supplies",
    ][index % 5],
    amount: [8500, 6200, 12400, 9600, 4300][index % 5],
    category: (["material", "other", "material", "labor", "other"] as const)[
      index % 5
    ],
    recordKind: "illustrative",
  }),
);
const illustrativeCustomersWithExpenses = illustrativeCustomers.map(
  (customer, index) => ({
    ...customer,
    expenses: illustrativeExpenses.filter(
      (_, expenseIndex) =>
        expenseIndex % illustrativeCustomers.length === index,
    ),
  }),
);

const illustrativeQuotationAmounts = [
  250000,
  80000,
  40000,
  ...Array.from({ length: 32 }, (_, index) => 52000 + (index % 9) * 8500),
];
const illustrativeQuotations: Quotation[] = illustrativeQuotationAmounts.map(
  (amount, index) => {
    const customer = illustrativeCustomers[index];
    return {
      id: `illustrative-quo-${String(index + 1).padStart(3, "0")}`,
      number: `VC-Q-${String(2019 + (index % 8)).slice(-2)}-${String(index + 1).padStart(4, "0")}`,
      customerId: customer.id,
      projectName: `Illustrative electrical work · ${customer.name}`,
      floors: ["Ground Floor"],
      createdAt: illustrativeDate(
        2019 + (index % 8),
        index % 12,
        (index % 27) + 1,
      ),
      status: (
        [
          "accepted",
          "sent",
          "draft",
          "accepted",
          "expired",
          "rejected",
        ] as const
      )[index % 6],
      rooms: [
        {
          id: `illustrative-room-${index + 1}`,
          name: "Main Work Area",
          floor: "Ground Floor",
          expanded: true,
          lines: [
            {
              id: `illustrative-line-${index + 1}`,
              name: "Electrical installation package",
              description:
                "Illustrative quotation line; confirm scope and pricing before use.",
              qty: 1,
              unit: "Project",
              rate: amount / 1.18,
            },
          ],
        },
      ],
      charges: {
        labour: 0,
        transport: 0,
        other: 0,
        discountPct: 0,
        gstRate: 18,
      },
      hidePrices: false,
      paymentTerms: "Illustrative terms; confirm before acceptance.",
      terms: [
        "Illustrative record only. Verify scope, rates and customer details before use.",
      ],
      recordKind: "illustrative",
    };
  },
);

const illustrativeInvoices: Invoice[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `illustrative-invoice-${String(index + 1).padStart(3, "0")}`,
    number: `VC-I-${String(2026).slice(-2)}-${String(index + 1).padStart(4, "0")}`,
    customerId: illustrativeCustomers[index].id,
    createdAt: iso(15 + index * 9),
    dueDate: index < 4 ? iso(-15) : iso(15 + (index - 4) * 7),
    items: [
      {
        name: "Illustrative electrical work package",
        description: "Illustrative balance; not a verified receivable.",
        qty: 1,
        rate: (85000 + index * 7500) / 1.18,
      },
    ],
    status: index < 4 ? "sent" : "overdue",
    paidAmount: 0,
    recordKind: "illustrative",
  }),
);

const seedProducts: Product[] = [
  ...["0.75", "1.0", "1.5", "2.5", "4.0", "6.0", "10.0", "16.0"].map(
    (size) => ({
      id: `wire-coil-${size.replace(".", "-")}`,
      name: `${size} sq. mm Wire`,
      image: "/products/wire.jpg",
      brand: "VoltCare",
      category: "Wires & Cables",
      wireType: "coil" as const,
      sku: `VC-COIL-${size.replace(".", "")}`,
      unit: "Coil (90m)",
      price: 0,
      gstRate: 18,
      stock: 0,
      stockUnit: "coils",
    }),
  ),
  ...["4.0", "6.0", "10.0", "16.0"].map((size) => ({
    id: `wire-service-${size.replace(".", "-")}`,
    name: `${size} sq. mm Service Wire`,
    image: "/products/service%20wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "service" as const,
    sku: `VC-SERVICE-${size.replace(".", "")}`,
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
  })),
  {
    id: "wire-two-core",
    name: "2-Core Wire",
    image: "/products/2%20core%20wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "two-core",
    sku: "VC-2CORE",
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
    variants: ["1.0", "1.5", "2.5", "4.0", "6.0"].map((size) => ({
      id: `wire-two-core-${size.replace(".", "-")}`,
      label: `${size} sq. mm`,
      price: 0,
    })),
  },
  {
    id: "wire-three-core",
    name: "3-Core Wire",
    image: "/products/3%20core%20wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "three-core",
    sku: "VC-3CORE",
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
    variants: ["1.0", "1.5", "2.5", "4.0", "6.0"].map((size) => ({
      id: `wire-three-core-${size.replace(".", "-")}`,
      label: `${size} sq. mm`,
      price: 0,
    })),
  },
  {
    id: "wire-four-core",
    name: "4-Core Wire",
    image: "/products/wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "four-core",
    sku: "VC-4CORE",
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
    variants: ["1.0", "1.5", "2.5", "4.0", "6.0"].map((size) => ({
      id: `wire-four-core-${size.replace(".", "-")}`,
      label: `${size} sq. mm`,
      price: 0,
    })),
  },
  {
    id: "wire-flexible",
    name: "Flexible Wire",
    image: "/products/Flexible%20Wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "flexible",
    sku: "VC-FLEXIBLE",
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
    variants: ["1.0", "1.5", "2.5", "4.0", "6.0", "10.0", "16.0"].map(
      (size) => ({
        id: `wire-flexible-${size.replace(".", "-")}`,
        label: `${size} sq. mm`,
        price: 0,
      }),
    ),
  },
  {
    id: "wire-submersible",
    name: "3-Core Submersible Cable",
    image: "/products/wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "submersible",
    sku: "VC-SUBMERSIBLE",
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
    variants: ["1.5", "2.5", "4.0", "6.0"].map((size) => ({
      id: `wire-submersible-${size.replace(".", "-")}`,
      label: `${size} sq. mm`,
      price: 0,
    })),
  },
  ...["LED Strip Wire", "Speaker Wire"].map((name, index) => ({
    id: index === 0 ? "wire-led-strip" : "wire-speaker",
    name,
    image:
      index === 0
        ? "/products/strip%20light%20wire.jpg"
        : "/products/spekar%20wire.jpg",
    brand: "VoltCare",
    category: "Wires & Cables",
    wireType: "specialty" as const,
    sku: index === 0 ? "VC-LED-WIRE" : "VC-SPEAKER-WIRE",
    unit: "Feet",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "ft",
  })),
  ...[
    {
      id: "switch-1m-2way-6a",
      name: "1M 2 Way Switch 6A",
      sku: "VC-SW-1M-2W-6A",
      image: "/products/1M%202%20Way%20Switch.jpg",
    },
    {
      id: "switch-1m-1way-6a",
      name: "1M 1 Way Switch 6A",
      sku: "VC-SW-1M-1W-6A",
      image: "/products/1M%201%20Way%20Switch.jpg",
    },
    {
      id: "switch-1m-bell-push-6a",
      name: "1M Bell Push 6A",
      sku: "VC-SW-1M-BELL-6A",
      image: "/products/1M%20Bell%20Push.jpg",
    },
    {
      id: "switch-2m-2way-16a",
      name: "2M 2 Way Switch 16A",
      sku: "VC-SW-2M-2W-16A",
      image: "/products/2M%202%20Way%20Switch%2016A.jpg",
    },
    {
      id: "switch-2m-bell-push-ind",
      name: "2M Bell Push with Ind.",
      sku: "VC-SW-2M-BELL-IND",
      image: "/products/2M%20Bell%20Push%20with%20Ind.jpg",
    },
    {
      id: "switch-1m-16a-ind",
      name: "1M 16A Switch with Indicator",
      sku: "VC-SW-1M-16A-IND",
      image: "/products/1M%2016A%20Switch%20with%20Indicator.jpg",
    },
    {
      id: "switch-2m-16a-ind",
      name: "2M 16A Switch with Indicator",
      sku: "VC-SW-2M-16A-IND",
      image: "/products/2M%2016A%20%20Switch%20with%20Indicator.jpg",
    },
    {
      id: "switch-32a-dp-2m-ind",
      name: "32A D. P. SWITCH (2M) with Ind",
      sku: "VC-SW-32A-DP-2M-IND",
      image: "/products/32A%20D.%20P.%20SWITCH%20%282M%29%20with%20Ind.jpg",
    },
  ].map((product) => ({
    ...product,
    brand: "VoltCare",
    category: "Switches & Sockets",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  })),
  ...[
    {
      id: "catalog-6a-3pin-socket",
      name: "6A 3 Pin Socket",
      sku: "VC-6A-3PIN-SOCKET",
      image: "/products/6A%203%20Pin%20Socket.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-16a-socket",
      name: "16A Socket",
      sku: "VC-16A-SOCKET",
      image: "/products/16A%20Socket.png",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-plate-1m",
      name: "1 Module Cover Plate",
      sku: "VC-PLATE-1M",
      image: "/products/1M%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-2m",
      name: "2 Module Cover Plate",
      sku: "VC-PLATE-2M",
      image: "/products/2%20Module%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-3m",
      name: "3 Module Cover Plate",
      sku: "VC-PLATE-3M",
      image: "/products/3Module%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-4m",
      name: "4 Module Cover Plate",
      sku: "VC-PLATE-4M",
      image: "/products/4%20Module%20Cover%20Plate.png",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-6m",
      name: "6 Module Cover Plate",
      sku: "VC-PLATE-6M",
      image: "/products/6Module%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-8m",
      name: "8 Module Cover Plate",
      sku: "VC-PLATE-8M",
      image: "/products/8Module%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-8m-square",
      name: "8 Module Square Cover Plate",
      sku: "VC-PLATE-8M-SQ",
      image: "/products/8%20Module%20Square%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-12m",
      name: "12 Module Cover Plate",
      sku: "VC-PLATE-12M",
      image: "/products/12%20Module%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-plate-18m",
      name: "18 Module Cover Plate",
      sku: "VC-PLATE-18M",
      image: "/products/18%20Module%20Cover%20Plate.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-1m",
      name: "1 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-1M",
      image: "/products/1%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-2m",
      name: "2 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-2M",
      image: "/products/2Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-3m",
      name: "3 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-3M",
      image: "/products/3%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-4m",
      name: "4 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-4M",
      image: "/products/4%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-6m",
      name: "6 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-6M",
      image: "/products/6%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-8m",
      name: "8 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-8M",
      image: "/products/8%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-8m-square",
      name: "8 Module Square GANG BOX COVER WITH BASE",
      sku: "VC-GANG-8M-SQ",
      image:
        "/products/8%20Module%20square%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-12m",
      name: "12 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-12M",
      image: "/products/12%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-gang-box-18m",
      name: "18 Module GANG BOX COVER WITH BASE",
      sku: "VC-GANG-18M",
      image: "/products/18%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-step-regulator-1m",
      name: "1 Module Step Regulator",
      sku: "VC-STEP-REG-1M",
      image: "/products/1%20Module%20Step%20Regulator.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-step-regulator-2m",
      name: "2 Module Step Regulator",
      sku: "VC-STEP-REG-2M",
      image: "/products/2%20module%20Step%20Regulator.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-tv-antenna-1m",
      name: "T.V. Antenna Outlet 1M",
      sku: "VC-TV-ANT-1M",
      image: "/products/T.V.%20Antenna%20Outlet%201M.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-batten-holder",
      name: "Batten Holder",
      sku: "VC-BATTEN-HOLDER",
      image: "/products/Batten%20Holder.jpg",
      category: "Lighting",
    },
    {
      id: "catalog-dp-switch-keytag-2m",
      name: "D.P Switch (with KeyTag) 2M",
      sku: "VC-DP-KEYTAG-2M",
      image: "/products/32A%20D.P%20Switch%20%28with%20KeyTag%29.%20jpg.png",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-blank-plate-1m",
      name: "Blank Plate 1M",
      sku: "VC-BLANK-PLATE-1M",
      image: "/products/Blank%20Plate%201M.jpg",
      category: "Boxes & Plates",
    },
    {
      id: "catalog-ding-dong-bell",
      name: "Ding Dong Bell",
      sku: "VC-DING-DONG-BELL",
      image: "/products/Ding%20Dong%20Bell.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-universal-3in1-16a",
      name: "16A 3-in-1 Universal S. S. Combined",
      sku: "VC-16A-UNIV-3IN1",
      image: "/products/16A%203-in-1%20Universal%20S.%20S.%20Combined.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-6a-3pin-top",
      name: "6A 3 Pin Top",
      sku: "VC-6A-3PIN-TOP",
      image: "/products/6A%203%20Pin%20Top.jpg",
      category: "Switches & Sockets",
    },
    {
      id: "catalog-universal-5in1-16a",
      name: "16A Universal 5-in-1 With Fuse & Indi",
      sku: "VC-16A-UNIV-5IN1-FUSE-IND",
      image:
        "/products/16A%20Universal%205-in-1%20With%20Fuse%20and%20Indi.jpg",
      category: "Switches & Sockets",
    },
  ].map((product) => ({
    ...product,
    brand: "VoltCare",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  })),
  ...[
    {
      id: "catalog-mcb-1m",
      name: "1 Module MCB",
      sku: "VC-MCB-1M",
      image: "/products/1%20Module%20MCB.jpg",
    },
    {
      id: "catalog-mcb-2m",
      name: "2 Module MCB",
      sku: "VC-MCB-2M",
      image: "/products/2%20Module%20MCB.png",
    },
  ].map((product) => ({
    ...product,
    brand: "VoltCare",
    category: "MCB & DB",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
    variants: ["10A", "16A", "25A"].map((amp) => ({
      id: `${product.id}-${amp.toLowerCase()}`,
      label: amp,
      price: 0,
    })),
  })),
  ...[
    {
      id: "catalog-mcb-single-pole",
      name: "MCB Single Pole",
      sku: "VC-MCB-SP",
      image: "/products/16A%20MCB%20SINGLE%20POLE.jpg",
    },
    {
      id: "catalog-mcb-single-pole-neutral",
      name: "MCB Single Pole + Neutral",
      sku: "VC-MCB-SPN",
      image: "/products/32A%20SINGLE%20POLE%20and%20NEUTRAL.jpg",
    },
    {
      id: "catalog-mcb-double-pole",
      name: "MCB Double Pole",
      sku: "VC-MCB-DP",
      image: "/products/MCB%20DOUBLE%20POLE.jpg",
    },
    {
      id: "catalog-mcb-triple-pole",
      name: "MCB Triple Pole",
      sku: "VC-MCB-TP",
      image: "/products/MCB%20TRIPLE%20POLE.jpg",
    },
    {
      id: "catalog-mcb-triple-pole-neutral",
      name: "MCB Triple Pole + Neutral",
      sku: "VC-MCB-TPN",
      image: "/products/TRIPLE%20POLE%20and%20NEUTRAL.jpg",
    },
    {
      id: "catalog-mcb-four-pole",
      name: "MCB Four Pole",
      sku: "VC-MCB-4P",
      image: "/products/MCB%20FOUR%20POLE.jpg",
    },
  ].map((product) => ({
    ...product,
    brand: "VoltCare",
    category: "MCB & DB",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
    variants: ["10A", "16A", "25A", "32A", "40A"].map((amp) => ({
      id: `${product.id}-${amp.toLowerCase()}`,
      label: amp,
      price: 0,
    })),
  })),
  {
    id: "catalog-dp-isolator-40a",
    name: "DP Isolator (40A)",
    sku: "VC-DP-ISOLATOR-40A",
    image: "/products/DP%20ISOLATOR.jpg",
    brand: "VoltCare",
    category: "MCB & DB",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  },
  {
    id: "catalog-fp-isolator-40a",
    name: "FP Isolator (40A)",
    sku: "VC-FP-ISOLATOR-40A",
    image: "/products/FP%20ISOLATOR.jpg",
    brand: "VoltCare",
    category: "MCB & DB",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  },
  {
    id: "catalog-rccb",
    name: "RCCB",
    sku: "VC-RCCB",
    image: "/products/RCCB.jpg",
    brand: "VoltCare",
    category: "MCB & DB",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
    variants: ["32A", "40A"].map((amp) => ({
      id: `catalog-rccb-${amp.toLowerCase()}`,
      label: amp,
      price: 0,
    })),
  },
  {
    id: "catalog-double-pole-changeover-40a",
    name: "Double Pole Changeover (40A)",
    sku: "VC-DP-CHANGEOVER-40A",
    image: "/products/DOUBLE%20POLE%20CHANGEOVER.jpg",
    brand: "VoltCare",
    category: "MCB & DB",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  },
  {
    id: "catalog-round-plate",
    name: "Round Plate",
    sku: "VC-ROUND-PLATE",
    image: "/products/round%20plate.jpg",
    brand: "VoltCare",
    category: "Boxes & Plates",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
    variants: ["4 inch", "5 inch"].map((size) => ({
      id: `catalog-round-plate-${size.replace(" ", "-")}`,
      label: size,
      price: 0,
    })),
  },
  {
    id: "catalog-fan-plate",
    name: "Fan Plate",
    sku: "VC-FAN-PLATE",
    image: "/products/fan%20plate.jpg",
    brand: "VoltCare",
    category: "Boxes & Plates",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  },
  ...[
    {
      id: "catalog-conduit-pipe",
      name: "Conduit Pipe",
      sku: "VC-CONDUIT-PIPE",
      image: "/products/Conduit%20Pipe.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-bend",
      name: "Conduit Bend",
      sku: "VC-CONDUIT-BEND",
      image: "/products/Conduit%20Bend.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-junction-1way",
      name: "Conduit Jun.Box 1 Way",
      sku: "VC-CONDUIT-JB-1W",
      image: "/products/Conduit%20Jun.Box%201%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-junction-2way",
      name: "Conduit Jun.Box 2 Way",
      sku: "VC-CONDUIT-JB-2W",
      image: "/products/Conduit%20Jun.Box%202%20way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-junction-3way",
      name: "Conduit Jun.Box 3 Way",
      sku: "VC-CONDUIT-JB-3W",
      image: "/products/Conduit%20Jun.Box%203%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-junction-4way",
      name: "Conduit Jun.Box 4 Way",
      sku: "VC-CONDUIT-JB-4W",
      image: "/products/Conduit%20Jun.Box%204%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-deep-junction-1way",
      name: "Conduit Deep Jun.Box 1 Way",
      sku: "VC-CONDUIT-DEEP-JB-1W",
      image: "/products/Conduit%20Deep%20Jun.Box%201%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-deep-junction-2way",
      name: "Conduit Deep Jun.Box 2 Way",
      sku: "VC-CONDUIT-DEEP-JB-2W",
      image: "/products/Conduit%20Deep%20Jun.Box%202%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-deep-junction-3way",
      name: "Conduit Deep Jun.Box 3 Way",
      sku: "VC-CONDUIT-DEEP-JB-3W",
      image: "/products/Conduit%20Deep%20Jun.Box%203%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-conduit-deep-junction-4way",
      name: "Conduit Deep Jun.Box 4 Way",
      sku: "VC-CONDUIT-DEEP-JB-4W",
      image: "/products/Conduit%20Deep%20Jun.Box%204%20Way.jpg",
      sizes: ["16mm", "25mm"],
    },
    {
      id: "catalog-flexible-pipe",
      name: "Flexible Pipe",
      sku: "VC-FLEXIBLE-PIPE",
      image: "/products/Flexible%20pipe.jpg",
      sizes: ["10mm", "16mm", "25mm"],
    },
  ].map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    image: product.image,
    brand: "VoltCare",
    category: "Pipes & Accessories",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
    variants: product.sizes.map((size) => ({
      id: `${product.id}-${size.toLowerCase()}`,
      label: size,
      price: 0,
    })),
  })),
  {
    id: "catalog-conduit-branch-h-4w",
    name: "Conduit Branch Jun.Box H 4W",
    sku: "VC-CONDUIT-BRANCH-H-4W",
    image: "/products/Conduit%20Branch%20Jun.Box%20H%204W.jpg",
    brand: "VoltCare",
    category: "Pipes & Accessories",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  },
  {
    id: "catalog-conduit-branch-y-3w",
    name: "Conduit Branch Jun.Box Y 3W",
    sku: "VC-CONDUIT-BRANCH-Y-3W",
    image: "/products/Conduit%20Branch%20Jun.Box%20Y%203W.jpg",
    brand: "VoltCare",
    category: "Pipes & Accessories",
    unit: "piece",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
  },
];

type SP = [string, string, number, string, string, ServicePoint["tone"]];
// [name, category, price, unit, icon, tone]
const _sp: SP[] = [
  ["Light Point", "Lighting", 550, "Per Point", "Lightbulb", "yellow"],
  ["Fan Point", "Wiring Points", 750, "Per Point", "Fan", "blue"],
  ["Exhaust Fan Point", "Wiring Points", 700, "Per Point", "Wind", "green"],
  ["Wall Fan Point", "Wiring Points", 800, "Per Point", "Fan", "blue"],
  [
    "Ceiling Fan Installation",
    "Wiring Points",
    650,
    "Per Point",
    "Fan",
    "blue",
  ],
  ["Chandelier Point", "Lighting", 2500, "Per Point", "Lightbulb", "yellow"],
  ["LED Strip Point", "Lighting", 400, "Per Point", "Lightbulb", "yellow"],
  ["Night Lamp Point", "Lighting", 350, "Per Point", "Lightbulb", "yellow"],
  ["6A Socket Point", "Switches & Sockets", 450, "Per Point", "Plug", "green"],
  [
    "16A Socket Point",
    "Switches & Sockets",
    950,
    "Per Point",
    "PlugZap",
    "orange",
  ],
  [
    "25A Power Point",
    "Switches & Sockets",
    1400,
    "Per Point",
    "PlugZap",
    "orange",
  ],
  [
    "32A Power Point",
    "Switches & Sockets",
    1800,
    "Per Point",
    "PlugZap",
    "orange",
  ],
  ["TV Point", "Wiring Points", 600, "Per Point", "Tv", "slate"],
  ["Data Point (LAN)", "Wiring Points", 650, "Per Point", "Cable", "slate"],
  ["Telephone Point", "Wiring Points", 500, "Per Point", "Cable", "slate"],
  ["WiFi Access Point", "Automation", 700, "Per Point", "Wifi", "blue"],
  ["Door Bell Point", "Wiring Points", 400, "Per Point", "Bell", "yellow"],
  ["Video Door Phone Point", "Automation", 1500, "Per Point", "Bell", "pink"],
  [
    "AC Point (1-1.5 Ton)",
    "Appliances",
    1200,
    "Per Point",
    "Snowflake",
    "blue",
  ],
  ["AC Point (2 Ton+)", "Appliances", 1600, "Per Point", "Snowflake", "blue"],
  ["Geyser Point", "Appliances", 1100, "Per Point", "Droplets", "pink"],
  ["Washing Machine Point", "Appliances", 900, "Per Point", "Droplets", "pink"],
  ["Refrigerator Point", "Appliances", 850, "Per Point", "Snowflake", "blue"],
  ["Microwave Point", "Appliances", 800, "Per Point", "Flame", "orange"],
  ["Chimney Point", "Appliances", 1000, "Per Point", "Flame", "orange"],
  ["Hob Point", "Appliances", 950, "Per Point", "Flame", "orange"],
  ["Water Purifier Point", "Appliances", 700, "Per Point", "Droplets", "pink"],
  ["Dishwasher Point", "Appliances", 950, "Per Point", "Droplets", "pink"],
  ["Induction Point", "Appliances", 850, "Per Point", "Zap", "red"],
  ["Cooker Hood Point", "Appliances", 950, "Per Point", "Wind", "green"],
  ["DP Switch", "Switches & Sockets", 550, "Per Point", "ToggleRight", "slate"],
  ["Changeover Switch", "DB & MCB", 2500, "Per Unit", "ToggleRight", "slate"],
  ["MCB Installation", "DB & MCB", 450, "Per Pole", "Shield", "red"],
  ["RCCB Installation", "DB & MCB", 1200, "Per Unit", "Shield", "red"],
  ["RCBO Installation", "DB & MCB", 1300, "Per Unit", "Shield", "red"],
  ["SPD Installation", "DB & MCB", 1500, "Per Unit", "Shield", "red"],
  ["Distribution Board (DB)", "DB & MCB", 4500, "Per Unit", "Zap", "red"],
  ["Main Panel Installation", "DB & MCB", 12000, "Per Unit", "Zap", "red"],
  ["Meter Board Installation", "DB & MCB", 2000, "Per Unit", "Zap", "red"],
  ["Earthing", "DB & MCB", 4500, "Per Pit", "Zap", "green"],
  ["Lightning Arrestor", "DB & MCB", 18000, "Per Unit", "Zap", "yellow"],
  ["Inverter Wiring", "DB & MCB", 3500, "Per Unit", "Battery", "green"],
  ["UPS Wiring", "DB & MCB", 4000, "Per Unit", "Battery", "green"],
  ["Generator Changeover", "DB & MCB", 7500, "Per Unit", "Zap", "orange"],
  ["Solar ACDB/DCDB", "DB & MCB", 5500, "Per Unit", "Sun", "yellow"],
  ["CCTV Camera Point", "Automation", 1200, "Per Point", "Camera", "slate"],
  ["Biometric Point", "Automation", 1500, "Per Point", "Cpu", "slate"],
  ["Motion Sensor Point", "Automation", 950, "Per Point", "ScanEye", "blue"],
  ["Smoke Detector Point", "Automation", 850, "Per Point", "Flame", "orange"],
  ["Fire Alarm Point", "Automation", 950, "Per Point", "Siren", "red"],
  [
    "Smart Switch Point",
    "Automation",
    1400,
    "Per Point",
    "ToggleRight",
    "blue",
  ],
  ["Curtain Motor Point", "Automation", 1600, "Per Point", "Cog", "slate"],
  ["Gate Motor Point", "Automation", 2500, "Per Point", "Cog", "slate"],
  [
    "EV Charger Point",
    "Automation",
    6500,
    "Per Point",
    "BatteryCharging",
    "green",
  ],
  ["Garden Light Point", "Lighting", 800, "Per Point", "Lamp", "green"],
  ["Pole Light Point", "Lighting", 2000, "Per Point", "Lamp", "yellow"],
  ["Flood Light Point", "Lighting", 1500, "Per Point", "Lamp", "yellow"],
  ["Sign Board Point", "Lighting", 2000, "Per Point", "Lamp", "orange"],
];
const seedServices: ServicePoint[] = _sp.map(
  ([name, category, basePrice, unit, icon, tone], i) => ({
    id: `sp-${i + 1}`,
    name,
    category,
    description: "",
    unit,
    basePrice,
    icon,
    tone,
  }),
);

const defaultTerms = [
  "This quotation is valid for 15 days.",
  "Material rates may change as per market.",
  "Any extra work will be charged separately.",
  "Civil work, painting, POP not included.",
  "Payment once made is non-refundable.",
];

const defaultSettings: Settings = {
  company: {
    name: "Voltcare Electrical Solutions",
    tagline: "Powering your trust with quality service.",
    address: "Sadar",
    city: "Nagpur, Maharashtra",
    phone: "+91 9970174508",
    email: "info@voltcare.in",
    website: "www.voltcare.in",
    gstin: "27ABCDE1234F1Z5",
  },
  defaults: {
    gstRate: 18,
    labour: 8000,
    transport: 500,
    paymentTerms: "Standard (10% - 50% - 40%)",
    terms: defaultTerms,
  },
  user: { name: "Tejesh", role: "Owner" },
};

const seedRoom = (name: string, floor: string, lines: RoomLine[]): Room => ({
  id: uid("room"),
  name,
  floor,
  lines,
  expanded: name === "Living Room" && floor === "Ground Floor",
});

const line = (
  name: string,
  description: string,
  qty: number,
  rate: number,
): RoomLine => ({
  id: uid("ln"),
  name,
  description,
  qty,
  unit: "Point",
  rate,
});

const defaultFloors = [
  "Ground Floor",
  "First Floor",
  "Second Floor",
  "Terrace Floor",
];

const seedQuotation: Quotation = {
  id: "quo-1",
  number: "VC-Q-11947",
  customerId: "cus-2",
  projectName: "G + 3 Building",
  floors: defaultFloors,
  createdAt: iso(0),
  status: "sent",
  hidePrices: false,
  paymentTerms: "Standard (10% - 50% - 40%)",
  terms: defaultTerms,
  charges: {
    labour: 8000,
    transport: 500,
    other: 350,
    discountPct: 0,
    gstRate: 18,
  },
  rooms: [
    seedRoom("Living Room", "Ground Floor", [
      line(
        "Light Point",
        "Concealed wiring with 1.5 sq mm copper, switch and light fixture.",
        4,
        550,
      ),
      line(
        "Fan Point",
        "Concealed wiring with fan regulator, hook box and switch.",
        2,
        750,
      ),
      line(
        "6A Socket Point",
        "6A modular socket with 1.5 sq mm wiring and switch.",
        3,
        500,
      ),
      line(
        "16A Socket Point",
        "16A modular socket with 2.5 sq mm wiring and switch.",
        1,
        700,
      ),
      line("TV Point", "TV point with coaxial cable and 6A socket.", 1, 850),
      line(
        "Bell Point",
        "Door bell point with wiring and push button.",
        1,
        450,
      ),
    ]),
    seedRoom("Kitchen", "Ground Floor", [
      line("Light Point", "Kitchen lights.", 2, 550),
      line("16A Socket Point", "Chimney / microwave sockets.", 3, 700),
      line("Exhaust Fan Point", "Exhaust wiring.", 1, 650),
    ]),
    seedRoom("Living Room", "First Floor", [
      line("Light Point", "Concealed wiring with 1.5 sq mm copper.", 4, 550),
      line("Fan Point", "Fan wiring with regulator.", 2, 750),
    ]),
    seedRoom("Kitchen", "First Floor", [
      line("Light Point", "Kitchen lights.", 2, 550),
      line("16A Socket Point", "Chimney / microwave sockets.", 3, 700),
      line("Fan Point", "Fan regulator with hook box.", 2, 750),
      line("6A Socket Point", "6A socket with 3 pin plug point.", 3, 450),
      line("AC Point", "AC point with DP isolator.", 1, 1200),
      line("Exhaust Fan Point", "Exhaust fan point with regulator.", 1, 700),
    ]),
    seedRoom("Bedroom 1", "First Floor", [
      line("Light Point", "Concealed wiring with 1.5 sq mm copper.", 3, 550),
      line("Fan Point", "Fan wiring with regulator.", 1, 750),
      line("AC Point", "AC point with dedicated circuit.", 1, 2200),
      line("6A Socket Point", "Bedside sockets.", 2, 500),
    ]),
    seedRoom("Toilet", "First Floor", [
      line("Light Point", "Bathroom light.", 1, 550),
      line("Geyser Point", "Geyser wiring with MCB.", 1, 1600),
      line("Exhaust Fan Point", "Exhaust wiring.", 1, 650),
    ]),
    seedRoom("Living Room", "Second Floor", [
      line("Light Point", "Living lights.", 4, 550),
      line("Fan Point", "Fan wiring.", 2, 750),
    ]),
    seedRoom("Terrace Utility", "Terrace Floor", [
      line("Light Point", "Terrace lights.", 4, 550),
      line("16A Socket Point", "Utility socket.", 2, 700),
    ]),
  ],
};

const seedInvoice: Invoice = {
  id: "inv-1",
  number: "VC-I-0034",
  customerId: "cus-3",
  createdAt: iso(1),
  dueDate: iso(-14),
  status: "sent",
  paidAmount: 0,
  items: [
    {
      name: "1.5 sq. mm Copper Wire",
      description: "1.5 sq mm Red",
      qty: 2,
      rate: 1300,
    },
    { name: "6A Switch 1M 1 Way Switch", qty: 1, rate: 45 },
    { name: "Step Regulator 2M", qty: 1, rate: 380 },
  ],
};

const seedActivities: Activity[] = [
  {
    id: "a1",
    kind: "quotation",
    title: "Quotation VC-Q-11947 created",
    subtitle: "Atharva",
    amount: 48620,
    createdAt: iso(0),
  },
  {
    id: "a2",
    kind: "material",
    title: "Material list generated",
    subtitle: "VC-ML-0098",
    createdAt: iso(0),
  },
  {
    id: "a3",
    kind: "invoice",
    title: "Invoice VC-I-0034 created",
    subtitle: "Shivam Electricals",
    amount: 22450,
    createdAt: iso(1),
  },
  {
    id: "a4",
    kind: "payment",
    title: "Payment received",
    subtitle: "Atharva",
    amount: 15000,
    createdAt: iso(1),
  },
  {
    id: "a5",
    kind: "customer",
    title: "New customer added",
    subtitle: "Omkarr Enterprises",
    createdAt: iso(1),
  },
];

// ---------- Selectors / helpers ----------
export const roomSubtotal = (r: Room) =>
  r.lines.reduce((s, l) => s + l.qty * l.rate, 0);

export const roomsSubtotal = (rooms: Room[]) =>
  rooms.reduce((s, r) => s + roomSubtotal(r), 0);

export const quotationTotals = (q: Quotation) => {
  const material = roomsSubtotal(q.rooms);
  const subtotal =
    material + q.charges.labour + q.charges.transport + q.charges.other;
  const discount = (subtotal * (q.charges.discountPct || 0)) / 100;
  const taxable = subtotal - discount;
  const gst = (taxable * q.charges.gstRate) / 100;
  const computedGrand = taxable + gst;
  const grand =
    typeof q.charges.grandOverride === "number"
      ? q.charges.grandOverride
      : computedGrand;
  return { material, subtotal, discount, taxable, gst, grand, computedGrand };
};

export const invoiceTotals = (inv: Invoice, gstRate = 18) => {
  const subtotal = inv.items.reduce((s, i) => s + i.qty * i.rate, 0);
  const gst = (subtotal * gstRate) / 100;
  const grand = subtotal + gst;
  const balance = grand - inv.paidAmount;
  return { subtotal, gst, grand, balance };
};

// ---------- Store ----------
type State = {
  customers: Customer[];
  products: Product[];
  services: ServicePoint[];
  cart: CartItem[];
  hideCartPrices: boolean;
  quotations: Quotation[];
  activeQuotationId: string | null;
  materialLists: MaterialList[];
  invoices: Invoice[];
  payments: Payment[];
  activities: Activity[];
  settings: Settings;
};

type Actions = {
  // customers
  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomerSitePhotos: (customerId: string, photos: string[]) => void;
  addCustomerVisit: (
    customerId: string,
    visit: Omit<CustomerVisit, "id">,
  ) => void;
  addCustomerNote: (customerId: string, note: CustomerNote) => void;
  updateCustomerNote: (
    customerId: string,
    noteId: string,
    patch: Partial<CustomerNote>,
  ) => void;
  addCustomerExpense: (
    customerId: string,
    expense: Omit<CustomerExpense, "id">,
  ) => void;
  addCustomerCommunication: (
    customerId: string,
    communication: Omit<CustomerCommunication, "id">,
  ) => void;
  updateCustomerVisit: (
    customerId: string,
    visitId: string,
    patch: Partial<CustomerVisit>,
  ) => void;
  updateCustomerExpense: (
    customerId: string,
    expenseId: string,
    patch: Partial<CustomerExpense>,
  ) => void;
  deleteCustomerVisit: (customerId: string, visitId: string) => void;
  deleteCustomerExpense: (customerId: string, expenseId: string) => void;
  addCustomerManualPayment: (
    customerId: string,
    payment: Omit<CustomerManualPayment, "id">,
  ) => void;
  updateCustomerManualPayment: (
    customerId: string,
    paymentId: string,
    patch: Partial<CustomerManualPayment>,
  ) => void;
  deleteCustomerManualPayment: (customerId: string, paymentId: string) => void;
  addCustomerPhoto: (
    customerId: string,
    photo: Omit<CustomerPhoto, "id">,
  ) => void;
  deleteCustomerPhoto: (customerId: string, photoId: string) => void;
  deleteCustomer: (id: string) => void;

  // products
  addProduct: (p: Omit<Product, "id">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // cart (keyed by item id; supports variants)
  addToCart: (
    productId: string,
    qty?: number,
    variant?: { id: string; label: string },
  ) => void;
  setCartQty: (itemId: string, qty: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  toggleHideCartPrices: () => void;

  // services
  addService: (s: Omit<ServicePoint, "id">) => ServicePoint;

  // active quotation (services page)
  ensureActiveQuotation: () => string;
  setActiveQuotation: (id: string | null) => void;
  addRoom: (name: string, floor?: string) => string;
  ensureRoom: (name: string, floor: string) => string;
  setRoomNote: (roomId: string, note: string) => void;
  setQuotationFloors: (floors: string[]) => void;
  addFloor: (name: string) => void;
  setPointQtyInRoom: (roomId: string, sp: ServicePoint, qty: number) => void;

  removeRoom: (roomId: string) => void;
  duplicateRoom: (roomId: string) => void;
  toggleRoom: (roomId: string) => void;
  renameRoom: (roomId: string, name: string) => void;
  addLineToRoom: (roomId: string, line: Omit<RoomLine, "id">) => void;
  updateLine: (
    roomId: string,
    lineId: string,
    patch: Partial<RoomLine>,
  ) => void;
  deleteLine: (roomId: string, lineId: string) => void;
  duplicateLine: (roomId: string, lineId: string) => void;
  updateCharges: (patch: Partial<QuotationCharges>) => void;
  setQuotationCustomer: (customerId: string) => void;
  setQuotationProject: (name: string) => void;
  setHidePrices: (v: boolean) => void;
  setPaymentTerms: (v: string) => void;
  setQuotationStatus: (id: string, status: Quotation["status"]) => void;
  setQuotationGrandOverride: (id: string, grand: number | undefined) => void;
  newBlankQuotation: (customerId?: string) => string;
  generateQuotationFromCart: (
    customerId: string,
    options?: { terms?: string[]; paymentTerms?: string; hidePrices?: boolean },
  ) => string | null;

  // material lists
  createCustomerMaterialList: (
    customerId: string,
    items: Omit<MaterialListItem, "id">[],
  ) => MaterialList;
  addCustomerMaterialListItem: (
    listId: string,
    item: Omit<MaterialListItem, "id">,
  ) => void;
  generateMaterialListFromCart: (
    customerId?: string,
    terms?: string[],
  ) => MaterialList | null;
  updateMaterialListItem: (
    mlId: string,
    itemId: string,
    patch: Partial<MaterialListItem>,
  ) => void;
  deleteMaterialListItem: (mlId: string, itemId: string) => void;
  setMaterialListStatus: (
    mlId: string,
    status: "pending" | "sent" | "approved",
  ) => void;

  // invoices
  generateInvoiceFromQuotation: (quotationId: string) => Invoice | null;
  generateInvoiceFromCart: (
    customerId?: string,
    terms?: string[],
  ) => Invoice | null;

  // payments
  recordPayment: (p: Omit<Payment, "id" | "createdAt">) => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;

  _pushActivity: (a: Omit<Activity, "id" | "createdAt">) => void;
};

export const useVoltcare = create<State & Actions>()(
  persist(
    (set, get) => ({
      customers: [...seedCustomers, ...illustrativeCustomersWithExpenses],
      products: seedProducts,
      services: seedServices,
      cart: [],
      hideCartPrices: false,
      quotations: [seedQuotation, ...illustrativeQuotations],
      activeQuotationId: null,
      materialLists: [],
      invoices: [seedInvoice, ...illustrativeInvoices],
      payments: [],
      activities: seedActivities,
      settings: defaultSettings,

      _pushActivity: (a) =>
        set((s) => ({
          activities: [
            { ...a, id: uid("act"), createdAt: new Date().toISOString() },
            ...s.activities,
          ].slice(0, 50),
        })),

      addCustomer: (c) => {
        const nc: Customer = {
          ...c,
          id: uid("cus"),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ customers: [nc, ...s.customers] }));
        get()._pushActivity({
          kind: "customer",
          title: "New customer added",
          subtitle: nc.name,
        });
        return nc;
      },
      updateCustomer: (id, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      addCustomerSitePhotos: (customerId, photos) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? { ...c, photos: [...(c.photos ?? []), ...photos] }
              : c,
          ),
        })),
      addCustomerVisit: (customerId, visit) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  visits: [{ ...visit, id: uid("visit") }, ...(c.visits ?? [])],
                }
              : c,
          ),
        })),
      addCustomerNote: (customerId, note) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  notesHistory: [note, ...(c.notesHistory ?? [])],
                }
              : c,
          ),
        })),
      updateCustomerNote: (customerId, noteId, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  notesHistory: (c.notesHistory ?? []).map((note) =>
                    note.id === noteId ? { ...note, ...patch } : note,
                  ),
                }
              : c,
          ),
        })),
      addCustomerExpense: (customerId, expense) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  expenses: [
                    { ...expense, id: uid("expense") },
                    ...(c.expenses ?? []),
                  ],
                }
              : c,
          ),
        })),
      addCustomerCommunication: (customerId, communication) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  communications: [
                    { ...communication, id: uid("comm") },
                    ...(c.communications ?? []),
                  ],
                }
              : c,
          ),
        })),
      updateCustomerVisit: (customerId, visitId, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  visits: (c.visits ?? []).map((v) =>
                    v.id === visitId ? { ...v, ...patch } : v,
                  ),
                }
              : c,
          ),
        })),
      updateCustomerExpense: (customerId, expenseId, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  expenses: (c.expenses ?? []).map((e) =>
                    e.id === expenseId ? { ...e, ...patch } : e,
                  ),
                }
              : c,
          ),
        })),
      deleteCustomerVisit: (customerId, visitId) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  visits: (c.visits ?? []).filter((v) => v.id !== visitId),
                }
              : c,
          ),
        })),
      deleteCustomerExpense: (customerId, expenseId) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  expenses: (c.expenses ?? []).filter(
                    (e) => e.id !== expenseId,
                  ),
                }
              : c,
          ),
        })),
      addCustomerManualPayment: (customerId, payment) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  manualPayments: [
                    { ...payment, id: uid("receipt") },
                    ...(c.manualPayments ?? []),
                  ],
                }
              : c,
          ),
        })),
      updateCustomerManualPayment: (customerId, paymentId, patch) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  manualPayments: (c.manualPayments ?? []).map((p) =>
                    p.id === paymentId ? { ...p, ...patch } : p,
                  ),
                }
              : c,
          ),
        })),
      deleteCustomerManualPayment: (customerId, paymentId) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  manualPayments: (c.manualPayments ?? []).filter(
                    (p) => p.id !== paymentId,
                  ),
                }
              : c,
          ),
        })),
      addCustomerPhoto: (customerId, photo) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  photoRecords: [
                    { ...photo, id: uid("photo") },
                    ...(c.photoRecords ?? []),
                  ],
                }
              : c,
          ),
        })),
      deleteCustomerPhoto: (customerId, photoId) =>
        set((s) => ({
          customers: s.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  photoRecords: (c.photoRecords ?? []).filter(
                    (p) => p.id !== photoId,
                  ),
                }
              : c,
          ),
        })),
      deleteCustomer: (id) =>
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      addProduct: (p) => {
        const np: Product = { ...p, id: uid("prd") };
        set((s) => ({ products: [np, ...s.products] }));
        return np;
      },
      updateProduct: (id, patch) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),
      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          cart: s.cart.filter((c) => c.productId !== id),
        })),
      duplicateProduct: (id) =>
        set((s) => {
          const src = s.products.find((p) => p.id === id);
          if (!src) return s;
          return {
            products: [
              {
                ...src,
                id: uid("prd"),
                sku: src.sku + "-COPY",
                name: src.name + " (Copy)",
              },
              ...s.products,
            ],
          };
        }),
      toggleFavorite: (id) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, favorite: !p.favorite } : p,
          ),
        })),

      addToCart: (productId, qty = 1, variant) =>
        set((s) => {
          const ex = s.cart.find(
            (c) => c.productId === productId && c.variantId === variant?.id,
          );
          if (ex)
            return {
              cart: s.cart.map((c) =>
                c.id === ex.id ? { ...c, qty: c.qty + qty } : c,
              ),
            };
          return {
            cart: [
              ...s.cart,
              {
                id: uid("ci"),
                productId,
                qty,
                variantId: variant?.id,
                variantLabel: variant?.label,
              },
            ],
          };
        }),
      setCartQty: (itemId, qty) =>
        set((s) => ({
          cart: s.cart
            .map((c) => (c.id === itemId ? { ...c, qty: Math.max(0, qty) } : c))
            .filter((c) => c.qty > 0),
        })),
      removeFromCart: (itemId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.id !== itemId) })),
      clearCart: () => set({ cart: [] }),
      toggleHideCartPrices: () =>
        set((s) => ({ hideCartPrices: !s.hideCartPrices })),

      addService: (svc) => {
        const ns: ServicePoint = { ...svc, id: uid("sp") };
        set((s) => ({ services: [ns, ...s.services] }));
        return ns;
      },

      ensureActiveQuotation: () => {
        const s = get();
        if (
          s.activeQuotationId &&
          s.quotations.find((q) => q.id === s.activeQuotationId)
        )
          return s.activeQuotationId;
        return get().newBlankQuotation();
      },
      setActiveQuotation: (id) => set({ activeQuotationId: id }),
      newBlankQuotation: (customerId) => {
        const s = get();
        const num = "VC-Q-" + (11947 + s.quotations.length + 1);
        const q: Quotation = {
          id: uid("quo"),
          number: num,
          customerId: customerId ?? s.customers[0]?.id ?? "",
          projectName: "",
          floors: ["Ground Floor"],
          createdAt: new Date().toISOString(),
          status: "draft",
          hidePrices: false,
          paymentTerms: s.settings.defaults.paymentTerms,
          terms: s.settings.defaults.terms,
          charges: {
            labour: s.settings.defaults.labour,
            transport: s.settings.defaults.transport,
            other: 0,
            discountPct: 0,
            gstRate: s.settings.defaults.gstRate,
          },
          rooms: [seedRoom("Living Room", "Ground Floor", [])],
        };
        set((st) => ({
          quotations: [q, ...st.quotations],
          activeQuotationId: q.id,
        }));
        return q.id;
      },
      generateQuotationFromCart: (customerId, options = {}) => {
        const s = get();
        if (
          s.cart.length === 0 ||
          !s.customers.some((customer) => customer.id === customerId)
        )
          return null;
        const lines = s.cart.flatMap((item) => {
          const product = s.products.find(
            (candidate) => candidate.id === item.productId,
          );
          if (!product) return [];
          const variant = product.variants?.find(
            (candidate) => candidate.id === item.variantId,
          );
          return [
            {
              id: uid("ln"),
              name: item.variantLabel
                ? `${product.name} — ${item.variantLabel}`
                : product.name,
              description: `${product.brand} • ${product.sku}`,
              qty: item.qty,
              unit: product.stockUnit,
              rate: variant?.price ?? product.price,
            },
          ];
        });
        const quotation: Quotation = {
          id: uid("quo"),
          number: "VC-Q-" + (11947 + s.quotations.length + 1),
          customerId,
          projectName: "Material Supply",
          floors: ["Ground Floor"],
          createdAt: new Date().toISOString(),
          status: "draft",
          rooms: [
            {
              id: uid("room"),
              name: "Materials",
              floor: "Ground Floor",
              lines,
              expanded: true,
            },
          ],
          charges: {
            labour: 0,
            transport: 0,
            other: 0,
            discountPct: 0,
            gstRate: s.settings.defaults.gstRate,
          },
          hidePrices: options.hidePrices ?? s.hideCartPrices,
          paymentTerms:
            options.paymentTerms ?? s.settings.defaults.paymentTerms,
          terms: options.terms ?? s.settings.defaults.terms,
        };
        set((state) => ({
          quotations: [quotation, ...state.quotations],
          activeQuotationId: quotation.id,
        }));
        get()._pushActivity({
          kind: "quotation",
          title: `Quotation ${quotation.number} created`,
          subtitle: s.customers.find((customer) => customer.id === customerId)
            ?.name,
          amount: quotationTotals(quotation).grand,
        });
        return quotation.id;
      },
      addRoom: (name, floor) => {
        const qid = get().ensureActiveQuotation();
        const newId = uid("room");
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === qid
              ? {
                  ...q,
                  rooms: [
                    ...q.rooms,
                    {
                      id: newId,
                      name,
                      floor: floor ?? q.floors[0],
                      lines: [],
                      expanded: true,
                    },
                  ],
                }
              : q,
          ),
        }));
        return newId;
      },
      ensureRoom: (name, floor) => {
        const qid = get().ensureActiveQuotation();
        const q = get().quotations.find((q) => q.id === qid)!;
        const existing = q.rooms.find(
          (r) => r.name === name && r.floor === floor,
        );
        if (existing) return existing.id;
        return get().addRoom(name, floor);
      },
      setRoomNote: (roomId, note) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) =>
                    r.id === roomId ? { ...r, note } : r,
                  ),
                }
              : q,
          ),
        }));
      },
      setQuotationFloors: (floors) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, floors } : q,
          ),
        }));
      },
      addFloor: (name) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id && !q.floors.includes(name)
              ? { ...q, floors: [...q.floors, name] }
              : q,
          ),
        }));
      },
      setPointQtyInRoom: (roomId, sp, qty) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) => {
            if (q.id !== id) return q;
            return {
              ...q,
              rooms: q.rooms.map((r) => {
                if (r.id !== roomId) return r;
                const existing = r.lines.find((l) => l.pointId === sp.id);
                if (qty <= 0)
                  return {
                    ...r,
                    lines: r.lines.filter((l) => l.pointId !== sp.id),
                  };
                if (existing)
                  return {
                    ...r,
                    lines: r.lines.map((l) =>
                      l.pointId === sp.id ? { ...l, qty } : l,
                    ),
                  };
                return {
                  ...r,
                  lines: [
                    ...r.lines,
                    {
                      id: uid("ln"),
                      pointId: sp.id,
                      name: sp.name,
                      description: sp.description,
                      qty,
                      unit: sp.unit,
                      rate: sp.basePrice,
                    },
                  ],
                };
              }),
            };
          }),
        }));
      },

      removeRoom: (roomId) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? { ...q, rooms: q.rooms.filter((r) => r.id !== roomId) }
              : q,
          ),
        }));
      },
      duplicateRoom: (roomId) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) => {
            if (q.id !== id) return q;
            const src = q.rooms.find((r) => r.id === roomId);
            if (!src) return q;
            const idx = q.rooms.findIndex((r) => r.id === roomId);
            const copy: Room = {
              ...src,
              id: uid("room"),
              name: src.name + " (Copy)",
              expanded: true,
              lines: src.lines.map((l) => ({ ...l, id: uid("ln") })),
            };
            const rooms = [...q.rooms];
            rooms.splice(idx + 1, 0, copy);
            return { ...q, rooms };
          }),
        }));
      },
      toggleRoom: (roomId) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) =>
                    r.id === roomId ? { ...r, expanded: !r.expanded } : r,
                  ),
                }
              : q,
          ),
        }));
      },
      renameRoom: (roomId, name) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) =>
                    r.id === roomId ? { ...r, name } : r,
                  ),
                }
              : q,
          ),
        }));
      },
      addLineToRoom: (roomId, ln) => {
        const id = get().ensureActiveQuotation();
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) =>
                    r.id === roomId
                      ? {
                          ...r,
                          expanded: true,
                          lines: [...r.lines, { ...ln, id: uid("ln") }],
                        }
                      : r,
                  ),
                }
              : q,
          ),
        }));
      },
      updateLine: (roomId, lineId, patch) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) =>
                    r.id === roomId
                      ? {
                          ...r,
                          lines: r.lines.map((l) =>
                            l.id === lineId ? { ...l, ...patch } : l,
                          ),
                        }
                      : r,
                  ),
                }
              : q,
          ),
        }));
      },
      deleteLine: (roomId, lineId) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) =>
                    r.id === roomId
                      ? { ...r, lines: r.lines.filter((l) => l.id !== lineId) }
                      : r,
                  ),
                }
              : q,
          ),
        }));
      },
      duplicateLine: (roomId, lineId) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? {
                  ...q,
                  rooms: q.rooms.map((r) => {
                    if (r.id !== roomId) return r;
                    const src = r.lines.find((l) => l.id === lineId);
                    if (!src) return r;
                    return {
                      ...r,
                      lines: [...r.lines, { ...src, id: uid("ln") }],
                    };
                  }),
                }
              : q,
          ),
        }));
      },
      updateCharges: (patch) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, charges: { ...q.charges, ...patch } } : q,
          ),
        }));
      },
      setQuotationCustomer: (customerId) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, customerId } : q,
          ),
        }));
      },
      setQuotationProject: (name) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, projectName: name } : q,
          ),
        }));
      },
      setHidePrices: (v) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, hidePrices: v } : q,
          ),
        }));
      },
      setPaymentTerms: (v) => {
        const id = get().activeQuotationId;
        if (!id) return;
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, paymentTerms: v } : q,
          ),
        }));
      },
      setQuotationStatus: (id, status) =>
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id ? { ...q, status } : q,
          ),
        })),
      setQuotationGrandOverride: (id, grand) =>
        set((s) => ({
          quotations: s.quotations.map((q) =>
            q.id === id
              ? { ...q, charges: { ...q.charges, grandOverride: grand } }
              : q,
          ),
        })),

      createCustomerMaterialList: (customerId, items) => {
        const s = get();
        const ml: MaterialList = {
          id: uid("ml"),
          number:
            "VC-ML-" + String(98 + s.materialLists.length + 1).padStart(4, "0"),
          customerId,
          createdAt: new Date().toISOString(),
          items: items.map((item) => ({ ...item, id: uid("mli") })),
          hidePrices: false,
          status: "pending",
        };
        set((st) => ({ materialLists: [ml, ...st.materialLists] }));
        get()._pushActivity({
          kind: "material",
          title: `Material list ${ml.number} created`,
          subtitle: s.customers.find((c) => c.id === customerId)?.name,
        });
        return ml;
      },
      addCustomerMaterialListItem: (listId, item) =>
        set((s) => ({
          materialLists: s.materialLists.map((list) =>
            list.id === listId
              ? { ...list, items: [...list.items, { ...item, id: uid("mli") }] }
              : list,
          ),
        })),
      generateMaterialListFromCart: (customerId, terms) => {
        const s = get();
        if (s.cart.length === 0) return null;
        const items: MaterialListItem[] = s.cart.map((c) => {
          const p = s.products.find((p) => p.id === c.productId)!;
          const variant = p.variants?.find((v) => v.id === c.variantId);
          return {
            id: uid("mli"),
            productId: p.id,
            name: c.variantLabel ? `${p.name} — ${c.variantLabel}` : p.name,
            brand: p.brand,
            sku:
              p.sku + (c.variantId ? `/${c.variantId.split("-").pop()}` : ""),
            qty: c.qty,
            unit: p.stockUnit,
            rate: variant?.price ?? p.price,
          };
        });
        const ml: MaterialList = {
          id: uid("ml"),
          number:
            "VC-ML-" + String(98 + s.materialLists.length + 1).padStart(4, "0"),
          createdAt: new Date().toISOString(),
          items,
          hidePrices: s.hideCartPrices,
          customerId:
            customerId ??
            s.quotations.find(
              (quotation) => quotation.id === s.activeQuotationId,
            )?.customerId,
          quotationId: s.activeQuotationId ?? undefined,
          terms: terms ?? s.settings.defaults.terms,
          status: "pending",
        };
        set((st) => ({ materialLists: [ml, ...st.materialLists] }));
        get()._pushActivity({
          kind: "material",
          title: "Material list generated",
          subtitle:
            s.customers.find((customer) => customer.id === ml.customerId)
              ?.name ?? ml.number,
        });
        return ml;
      },
      updateMaterialListItem: (mlId, itemId, patch) =>
        set((s) => ({
          materialLists: s.materialLists.map((m) =>
            m.id === mlId
              ? {
                  ...m,
                  items: m.items.map((i) =>
                    i.id === itemId ? { ...i, ...patch } : i,
                  ),
                }
              : m,
          ),
        })),
      deleteMaterialListItem: (mlId, itemId) =>
        set((s) => ({
          materialLists: s.materialLists.map((m) =>
            m.id === mlId
              ? { ...m, items: m.items.filter((i) => i.id !== itemId) }
              : m,
          ),
        })),
      setMaterialListStatus: (mlId, status) =>
        set((s) => ({
          materialLists: s.materialLists.map((list) =>
            list.id === mlId ? { ...list, status } : list,
          ),
        })),

      generateInvoiceFromQuotation: (quotationId) => {
        const s = get();
        const q = s.quotations.find((q) => q.id === quotationId);
        if (!q) return null;
        const items = q.rooms.flatMap((r) =>
          r.lines.map((l) => ({
            name: `${r.name} — ${l.name}`,
            description: l.description,
            qty: l.qty,
            rate: l.rate,
          })),
        );
        const inv: Invoice = {
          id: uid("inv"),
          number: "VC-I-" + String(34 + s.invoices.length + 1).padStart(4, "0"),
          customerId: q.customerId,
          quotationId: q.id,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          items,
          hidePrices: q.hidePrices,
          terms: q.terms,
          status: "sent",
          paidAmount: 0,
        };
        set((st) => ({ invoices: [inv, ...st.invoices] }));
        const cust = s.customers.find((c) => c.id === q.customerId);
        get()._pushActivity({
          kind: "invoice",
          title: `Invoice ${inv.number} created`,
          subtitle: cust?.name,
          amount: quotationTotals(q).grand,
        });
        return inv;
      },
      generateInvoiceFromCart: (customerId, terms) => {
        const s = get();
        if (s.cart.length === 0) return null;
        const items = s.cart.map((c) => {
          const p = s.products.find((p) => p.id === c.productId)!;
          const variant = p.variants?.find((v) => v.id === c.variantId);
          return {
            name: c.variantLabel ? `${p.name} — ${c.variantLabel}` : p.name,
            description: `${p.brand} • ${p.sku}`,
            qty: c.qty,
            rate: variant?.price ?? p.price,
          };
        });
        const inv: Invoice = {
          id: uid("inv"),
          number: "VC-I-" + String(34 + s.invoices.length + 1).padStart(4, "0"),
          customerId: customerId ?? s.customers[0]?.id ?? "",
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          items,
          hidePrices: s.hideCartPrices,
          terms: terms ?? s.settings.defaults.terms,
          status: "sent",
          paidAmount: 0,
        };
        set((st) => ({ invoices: [inv, ...st.invoices] }));
        get()._pushActivity({
          kind: "invoice",
          title: `Invoice ${inv.number} created`,
          subtitle: s.customers.find(
            (customer) => customer.id === inv.customerId,
          )?.name,
          amount: items.reduce((s, i) => s + i.qty * i.rate, 0),
        });
        return inv;
      },

      recordPayment: (p) => {
        const np: Payment = {
          ...p,
          id: uid("pay"),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          payments: [np, ...s.payments],
          invoices: s.invoices.map((inv) =>
            inv.id === np.invoiceId
              ? (() => {
                  const paid = inv.paidAmount + np.amount;
                  const t = invoiceTotals(inv);
                  const status: Invoice["status"] =
                    paid >= t.grand - 0.01 ? "paid" : "partial";
                  return { ...inv, paidAmount: paid, status };
                })()
              : inv,
          ),
        }));
        get()._pushActivity({
          kind: "payment",
          title: "Payment received",
          amount: np.amount,
        });
      },

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "voltcare-os-v5",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : (undefined as unknown as Storage),
      ),
      version: 16,
      migrate: (persistedState, version) => {
        type PersistedVoltcareData = {
          [key: string]: unknown;
          state?: PersistedVoltcareData;
        };
        const raw = (persistedState ?? {}) as PersistedVoltcareData;
        const base = raw.state ?? raw;
        const mergeById = <T extends { id: string }>(
          existing: unknown,
          additions: T[],
        ) => {
          const records = Array.isArray(existing) ? (existing as T[]) : [];
          const existingIds = new Set(records.map((record) => record.id));
          return [
            ...records,
            ...additions.filter((record) => !existingIds.has(record.id)),
          ];
        };
        const customersToMigrate = Array.isArray(base.customers)
          ? (base.customers as Customer[])
              .filter((customer) => !customer.id.startsWith("demo-cus-"))
              .map((customer) => {
                const illustrativeCustomer =
                  illustrativeCustomersWithExpenses.find(
                    (candidate) => candidate.id === customer.id,
                  );
                const existingExpenseIds = new Set(
                  (customer.expenses ?? []).map((expense) => expense.id),
                );
                const expenses =
                  illustrativeCustomer?.expenses?.filter(
                    (expense) => !existingExpenseIds.has(expense.id),
                  ) ?? [];
                return customer.expenses || expenses.length > 0
                  ? {
                      ...customer,
                      expenses: [
                        ...(customer.expenses ?? []).filter(
                          (expense) => !expense.id.startsWith("demo-exp-"),
                        ),
                        ...expenses,
                      ],
                    }
                  : customer;
              })
          : base.customers;
        const customersWithIllustrativeRecords =
          version < 15 && Array.isArray(customersToMigrate)
            ? mergeById(customersToMigrate, illustrativeCustomersWithExpenses)
            : customersToMigrate;
        const customersWithMigratedNotes = Array.isArray(
          customersWithIllustrativeRecords,
        )
          ? (customersWithIllustrativeRecords as Customer[]).map(
              (customer) => ({
                ...customer,
                notesHistory: (customer.notesHistory ?? []).map((note) => {
                  const legacyNote = note as CustomerNote & {
                    content?: string;
                  };
                  return {
                    id: note.id,
                    text: legacyNote.text ?? legacyNote.content ?? "",
                    isTask: legacyNote.isTask ?? false,
                    dueDate: legacyNote.dueDate ?? "",
                    isDone: legacyNote.isDone ?? false,
                    createdAt: note.createdAt,
                    doneAt: note.doneAt ?? null,
                  };
                }),
              }),
            )
          : customersWithIllustrativeRecords;
        const quotationsWithoutLegacySamples = Array.isArray(base.quotations)
          ? base.quotations.filter(
              (quotation: Quotation) => !quotation.id.startsWith("demo-quo-"),
            )
          : base.quotations;
        const quotationsToMigrate =
          version < 15 && Array.isArray(quotationsWithoutLegacySamples)
            ? mergeById(quotationsWithoutLegacySamples, illustrativeQuotations)
            : quotationsWithoutLegacySamples;
        const invoicesToMigrate =
          version < 15 && Array.isArray(base.invoices)
            ? mergeById(
                base.invoices.filter(
                  (invoice: Invoice) =>
                    !invoice.id.startsWith("demo-paid-inv-") &&
                    !invoice.id.startsWith("demo-pending-inv-"),
                ),
                illustrativeInvoices,
              )
            : Array.isArray(base.invoices)
              ? base.invoices.filter(
                  (invoice: Invoice) =>
                    !invoice.id.startsWith("demo-paid-inv-") &&
                    !invoice.id.startsWith("demo-pending-inv-"),
                )
              : base.invoices;
        const paymentsToMigrate = Array.isArray(base.payments)
          ? base.payments.filter(
              (payment: Payment) => !payment.id.startsWith("demo-payment-"),
            )
          : base.payments;
        const products = Array.isArray(base.products) ? base.products : [];
        const migratedProducts =
          products.length > 0 || version >= 3 ? products : seedProducts;
        const addedCatalogProducts =
          version < 12
            ? seedProducts.filter(
                (product) =>
                  (product.id === "wire-three-core" ||
                    product.id === "wire-four-core" ||
                    product.id.startsWith("switch-") ||
                    product.id.startsWith("catalog-")) &&
                  !migratedProducts.some(
                    (existing: Product) => existing.id === product.id,
                  ),
              )
            : [];
        const productsToMigrate = [
          ...migratedProducts,
          ...addedCatalogProducts,
        ];
        const defaultProductImages: Record<string, string> = {
          "wire-coil-0-75": "/products/wire.jpg",
          "wire-coil-1-0": "/products/wire.jpg",
          "wire-coil-1-5": "/products/wire.jpg",
          "wire-coil-2-5": "/products/wire.jpg",
          "wire-coil-4-0": "/products/wire.jpg",
          "wire-coil-6-0": "/products/wire.jpg",
          "wire-coil-10-0": "/products/wire.jpg",
          "wire-coil-16-0": "/products/wire.jpg",
          "wire-service-4-0": "/products/service%20wire.jpg",
          "wire-service-6-0": "/products/service%20wire.jpg",
          "wire-service-10-0": "/products/service%20wire.jpg",
          "wire-service-16-0": "/products/service%20wire.jpg",
          "wire-two-core": "/products/2%20core%20wire.jpg",
          "wire-three-core": "/products/3%20core%20wire.jpg",
          "wire-four-core": "/products/wire.jpg",
          "wire-flexible": "/products/Flexible%20Wire.jpg",
          "wire-submersible": "/products/wire.jpg",
          "wire-led-strip": "/products/strip%20light%20wire.jpg",
          "wire-speaker": "/products/spekar%20wire.jpg",
          "switch-1m-2way-6a": "/products/1M%202%20Way%20Switch.jpg",
          "switch-1m-1way-6a": "/products/1M%201%20Way%20Switch.jpg",
          "switch-1m-bell-push-6a": "/products/1M%20Bell%20Push.jpg",
          "switch-2m-2way-16a": "/products/2M%202%20Way%20Switch%2016A.jpg",
          "switch-2m-bell-push-ind":
            "/products/2M%20Bell%20Push%20with%20Ind.jpg",
          "switch-1m-16a-ind":
            "/products/1M%2016A%20Switch%20with%20Indicator.jpg",
          "switch-2m-16a-ind":
            "/products/2M%2016A%20%20Switch%20with%20Indicator.jpg",
          "switch-32a-dp-2m-ind":
            "/products/32A%20D.%20P.%20SWITCH%20%282M%29%20with%20Ind.jpg",
          "catalog-6a-3pin-socket": "/products/6A%203%20Pin%20Socket.jpg",
          "catalog-16a-socket": "/products/16A%20Socket.png",
          "catalog-plate-1m": "/products/1M%20Cover%20Plate.jpg",
          "catalog-plate-2m": "/products/2%20Module%20Cover%20Plate.jpg",
          "catalog-plate-3m": "/products/3Module%20Cover%20Plate.jpg",
          "catalog-plate-4m": "/products/4%20Module%20Cover%20Plate.png",
          "catalog-plate-6m": "/products/6Module%20Cover%20Plate.jpg",
          "catalog-plate-8m": "/products/8Module%20Cover%20Plate.jpg",
          "catalog-plate-8m-square":
            "/products/8%20Module%20Square%20Cover%20Plate.jpg",
          "catalog-plate-12m": "/products/12%20Module%20Cover%20Plate.jpg",
          "catalog-plate-18m": "/products/18%20Module%20Cover%20Plate.jpg",
          "catalog-gang-box-1m":
            "/products/1%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-2m":
            "/products/2Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-3m":
            "/products/3%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-4m":
            "/products/4%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-6m":
            "/products/6%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-8m":
            "/products/8%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-8m-square":
            "/products/8%20Module%20square%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-12m":
            "/products/12%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-gang-box-18m":
            "/products/18%20Module%20GANG%20BOX%20COVER%20WITH%20BASE.jpg",
          "catalog-step-regulator-1m":
            "/products/1%20Module%20Step%20Regulator.jpg",
          "catalog-step-regulator-2m":
            "/products/2%20module%20Step%20Regulator.jpg",
          "catalog-tv-antenna-1m": "/products/T.V.%20Antenna%20Outlet%201M.jpg",
          "catalog-batten-holder": "/products/Batten%20Holder.jpg",
          "catalog-dp-switch-keytag-2m":
            "/products/32A%20D.P%20Switch%20%28with%20KeyTag%29.%20jpg.png",
          "catalog-blank-plate-1m": "/products/Blank%20Plate%201M.jpg",
          "catalog-ding-dong-bell": "/products/Ding%20Dong%20Bell.jpg",
          "catalog-universal-3in1-16a":
            "/products/16A%203-in-1%20Universal%20S.%20S.%20Combined.jpg",
          "catalog-6a-3pin-top": "/products/6A%203%20Pin%20Top.jpg",
          "catalog-universal-5in1-16a":
            "/products/16A%20Universal%205-in-1%20With%20Fuse%20and%20Indi.jpg",
          "catalog-mcb-1m": "/products/1%20Module%20MCB.jpg",
          "catalog-mcb-2m": "/products/2%20Module%20MCB.png",
          "catalog-mcb-single-pole": "/products/16A%20MCB%20SINGLE%20POLE.jpg",
          "catalog-mcb-single-pole-neutral":
            "/products/32A%20SINGLE%20POLE%20and%20NEUTRAL.jpg",
          "catalog-mcb-double-pole": "/products/MCB%20DOUBLE%20POLE.jpg",
          "catalog-mcb-triple-pole": "/products/MCB%20TRIPLE%20POLE.jpg",
          "catalog-mcb-triple-pole-neutral":
            "/products/TRIPLE%20POLE%20and%20NEUTRAL.jpg",
          "catalog-mcb-four-pole": "/products/MCB%20FOUR%20POLE.jpg",
          "catalog-dp-isolator-40a": "/products/DP%20ISOLATOR.jpg",
          "catalog-fp-isolator-40a": "/products/FP%20ISOLATOR.jpg",
          "catalog-rccb": "/products/RCCB.jpg",
          "catalog-double-pole-changeover-40a":
            "/products/DOUBLE%20POLE%20CHANGEOVER.jpg",
          "catalog-round-plate": "/products/round%20plate.jpg",
          "catalog-fan-plate": "/products/fan%20plate.jpg",
          "catalog-conduit-pipe": "/products/Conduit%20Pipe.jpg",
          "catalog-conduit-bend": "/products/Conduit%20Bend.jpg",
          "catalog-conduit-branch-h-4w":
            "/products/Conduit%20Branch%20Jun.Box%20H%204W.jpg",
          "catalog-conduit-branch-y-3w":
            "/products/Conduit%20Branch%20Jun.Box%20Y%203W.jpg",
          "catalog-conduit-junction-1way":
            "/products/Conduit%20Jun.Box%201%20Way.jpg",
          "catalog-conduit-junction-2way":
            "/products/Conduit%20Jun.Box%202%20way.jpg",
          "catalog-conduit-junction-3way":
            "/products/Conduit%20Jun.Box%203%20Way.jpg",
          "catalog-conduit-junction-4way":
            "/products/Conduit%20Jun.Box%204%20Way.jpg",
          "catalog-conduit-deep-junction-1way":
            "/products/Conduit%20Deep%20Jun.Box%201%20Way.jpg",
          "catalog-conduit-deep-junction-2way":
            "/products/Conduit%20Deep%20Jun.Box%202%20Way.jpg",
          "catalog-conduit-deep-junction-3way":
            "/products/Conduit%20Deep%20Jun.Box%203%20Way.jpg",
          "catalog-conduit-deep-junction-4way":
            "/products/Conduit%20Deep%20Jun.Box%204%20Way.jpg",
          "catalog-flexible-pipe": "/products/Flexible%20pipe.jpg",
        };
        return {
          ...(raw ?? {}),
          ...(base ?? {}),
          ...(Array.isArray(base.customers)
            ? { customers: customersWithMigratedNotes }
            : {}),
          ...(Array.isArray(base.quotations)
            ? { quotations: quotationsToMigrate }
            : {}),
          ...(Array.isArray(base.invoices)
            ? { invoices: invoicesToMigrate }
            : {}),
          ...(Array.isArray(base.payments)
            ? { payments: paymentsToMigrate }
            : {}),
          products: productsToMigrate.map((product: Product) => {
            const defaultImage = defaultProductImages[product.id];
            const replaceLegacyUniversalImage =
              product.id === "catalog-universal-5in1-16a" &&
              product.image?.includes("Fuse%20%26%20Indi");
            const replaceLegacyMcbImage =
              (product.id === "catalog-mcb-single-pole-neutral" ||
                product.id === "catalog-mcb-triple-pole-neutral") &&
              product.image?.includes("%2B");
            const replaceLegacyFlexibleWireImage =
              product.id === "wire-flexible" &&
              product.image === "/products/wire.jpg";
            return defaultImage &&
              (!product.image ||
                replaceLegacyUniversalImage ||
                replaceLegacyMcbImage ||
                replaceLegacyFlexibleWireImage)
              ? { ...product, image: defaultImage }
              : product;
          }),
          cart: Array.isArray(base.cart) ? base.cart : [],
        };
      },
      skipHydration: true,
    },
  ),
);
