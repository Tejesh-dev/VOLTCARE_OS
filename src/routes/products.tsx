// Voltcare — Product Catalogue
// Compact commerce-style cards (7–8 per row on wide screens), color variants
// added as separate cart lines, product image upload (stored as data URL in
// localStorage via the Voltcare store), inline preview modal, and a
// collapsible filter row. The cart uses the new item-id based store API.
import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ClientGate } from "@/components/voltcare/shell";
import {
  useVoltcare,
  type Product,
  type ProductVariant,
} from "@/store/voltcare";
import { inr } from "@/lib/format";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  X,
  LayoutGrid,
  List,
  FileText,
  ClipboardList,
  Receipt,
  Package,
  Eye,
  ImagePlus,
  Filter,
  ChevronDown,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProductSearch = { q?: string; customerId?: string };
type GeneratedDocument = "material" | "quotation" | "invoice";

export const Route = createFileRoute("/products")({
  validateSearch: (s: Record<string, unknown>): ProductSearch => ({
    q: typeof s.q === "string" ? s.q : undefined,
    customerId: typeof s.customerId === "string" ? s.customerId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Product Catalogue — Voltcare OS" },
      {
        name: "description",
        content:
          "Manage electrical materials — wires, switches, MCBs, pipes and more with color-variant selection.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientGate>
        <ProductsPage />
      </ClientGate>
    </AppShell>
  ),
});

const CATS = [
  "All",
  "Wires & Cables",
  "Boxes & Plates",
  "Switches & Sockets",
  "MCB & DB",
  "Pipes & Accessories",
  "Lighting",
  "Appliances",
];

function matchesProductQuery(product: Product, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const keywords = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (keywords.length === 0) return true;

  const haystacks = [
    product.name,
    product.brand,
    product.sku,
    product.category,
    product.unit,
    product.subUnit ?? "",
  ].map((value) => value.toLowerCase());

  return keywords.every((keyword) =>
    haystacks.some((value) => value.includes(keyword)),
  );
}

// Small tone map for wire color swatches
const COLOR_SWATCH: Record<string, string> = {
  Red: "#dc2626",
  Black: "#111827",
  Yellow: "#eab308",
  Blue: "#2563eb",
  Green: "#16a34a",
  White: "#f3f4f6",
  Grey: "#6b7280",
};

const COIL_COLORS = ["Red", "Black", "Blue", "Yellow", "Green"];
const HOUSE_WIRE_SIZES = [
  "0.75 sq. mm",
  "1.0 sq. mm",
  "1.5 sq. mm",
  "2.5 sq. mm",
  "4.0 sq. mm",
  "6.0 sq. mm",
  "10.0 sq. mm",
  "16.0 sq. mm",
];
const SERVICE_WIRE_SIZES = [
  "4.0 sq. mm",
  "6.0 sq. mm",
  "10.0 sq. mm",
  "16.0 sq. mm",
];
const TWO_CORE_THICKNESSES = [
  "1.0 sq. mm",
  "1.5 sq. mm",
  "2.5 sq. mm",
  "4.0 sq. mm",
  "6.0 sq. mm",
];
const FLEXIBLE_THICKNESSES = [
  "1.0 sq. mm",
  "1.5 sq. mm",
  "2.5 sq. mm",
  "4.0 sq. mm",
  "6.0 sq. mm",
  "10.0 sq. mm",
  "16.0 sq. mm",
];
const SUBMERSIBLE_THICKNESSES = [
  "1.5 sq. mm",
  "2.5 sq. mm",
  "4.0 sq. mm",
  "6.0 sq. mm",
];
const WIRE_TYPE_OPTIONS = [
  { value: "coil", label: "House wire - 90m coil" },
  { value: "service", label: "Service wire - per foot" },
  { value: "two-core", label: "2-Core wire - per foot" },
  { value: "three-core", label: "3-Core wire - per foot" },
  { value: "four-core", label: "4-Core wire - per foot" },
  { value: "flexible", label: "Flexible wire - per foot" },
  { value: "submersible", label: "3-Core submersible - per foot" },
  { value: "specialty", label: "LED / speaker wire - per foot" },
] as const;

type WireType = NonNullable<Product["wireType"]>;
type WireSelection = {
  lengthFeet: number;
  thickness: string;
  unitPrice: number;
  colorCounts: Record<string, number>;
};

function getWireType(product: Product): WireType | null {
  if (product.wireType) return product.wireType;
  const name = product.name.toLowerCase();
  if (name.includes("submersible")) return "submersible";
  if (name.includes("2-core")) return "two-core";
  if (name.includes("3-core")) return "three-core";
  if (name.includes("4-core")) return "four-core";
  if (name.includes("flexible wire")) return "flexible";
  if (name.includes("service wire")) return "service";
  if (name.includes("led strip wire") || name.includes("speaker wire"))
    return "specialty";
  if (
    /\d+(?:\.\d+)?\s*sq\.?\s*mm.*wire/i.test(product.name) &&
    /coil|roll|bundle/i.test(`${product.unit} ${product.stockUnit}`)
  )
    return "coil";
  return null;
}

function thicknessOptions(wireType: WireType) {
  if (
    wireType === "two-core" ||
    wireType === "three-core" ||
    wireType === "four-core"
  )
    return TWO_CORE_THICKNESSES;
  if (wireType === "flexible") return FLEXIBLE_THICKNESSES;
  if (wireType === "submersible") return SUBMERSIBLE_THICKNESSES;
  return [];
}

function getWireSelection(product: Product): WireSelection {
  const thickness =
    thicknessOptions(getWireType(product) ?? "two-core")[0] ?? "1.0 sq. mm";
  const variant = product.variants?.find((item) => item.label === thickness);
  return {
    lengthFeet: 1,
    thickness,
    unitPrice: variant?.price ?? product.price,
    colorCounts: Object.fromEntries(COIL_COLORS.map((color) => [color, 0])),
  };
}

function ProductsPage() {
  const products = useVoltcare((s) => s.products);
  const cart = useVoltcare((s) => s.cart);
  const hideCartPrices = useVoltcare((s) => s.hideCartPrices);
  const addToCart = useVoltcare((s) => s.addToCart);
  const setCartQty = useVoltcare((s) => s.setCartQty);
  const removeFromCart = useVoltcare((s) => s.removeFromCart);
  const clearCart = useVoltcare((s) => s.clearCart);
  const toggleHide = useVoltcare((s) => s.toggleHideCartPrices);
  const addProduct = useVoltcare((s) => s.addProduct);
  const updateProduct = useVoltcare((s) => s.updateProduct);
  const customers = useVoltcare((s) => s.customers);
  const settings = useVoltcare((s) => s.settings);
  const updateSettings = useVoltcare((s) => s.updateSettings);
  const generateML = useVoltcare((s) => s.generateMaterialListFromCart);
  const generateInv = useVoltcare((s) => s.generateInvoiceFromCart);
  const generateQuotation = useVoltcare((s) => s.generateQuotationFromCart);
  const nav = useNavigate();
  const { q: urlQ, customerId: searchCustomerId } = useSearch({
    from: "/products",
  }) as ProductSearch;

  const [cat, setCat] = useState("All");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("name");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showCart, setShowCart] = useState(false);
  const [variantMap, setVariantMap] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [wireProduct, setWireProduct] = useState<Product | null>(null);
  const [wireSelections, setWireSelections] = useState<
    Record<string, WireSelection>
  >({});
  const [priceProduct, setPriceProduct] = useState<Product | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [priceVariantId, setPriceVariantId] = useState<string | undefined>();
  const [documentKind, setDocumentKind] = useState<GeneratedDocument | null>(
    null,
  );
  const [documentCustomerId, setDocumentCustomerId] = useState(
    searchCustomerId ?? "",
  );
  const [documentTerms, setDocumentTerms] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [saveTermsAsDefaults, setSaveTermsAsDefaults] = useState(false);

  const q = (urlQ ?? "").trim();
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products.slice();
    if (cat !== "All") list = list.filter((p) => p.category === cat);
    if (brand !== "all") list = list.filter((p) => p.brand === brand);
    if (q) {
      list = list.filter((p) => matchesProductQuery(p, q));
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "stock") list.sort((a, b) => b.stock - a.stock);
    return list;
  }, [products, cat, brand, q, sort]);

  // Cart rows — resolve product per item; support variants
  const cartRows = cart
    .map((c) => {
      const product = products.find((p) => p.id === c.productId);
      if (!product) return null;
      const variant = product.variants?.find((v) => v.id === c.variantId);
      const rate = variant?.price ?? product.price;
      return { ...c, product, variant, rate };
    })
    .filter(Boolean) as Array<{
    id: string;
    productId: string;
    qty: number;
    variantId?: string;
    variantLabel?: string;
    product: Product;
    variant?: ProductVariant;
    rate: number;
  }>;
  const subtotal = cartRows.reduce((s, r) => s + r.rate * r.qty, 0);
  const gst = cartRows.reduce(
    (s, r) => s + (r.rate * r.qty * r.product.gstRate) / 100,
    0,
  );
  const total = subtotal + gst;

  const handleAdd = (p: Product) => {
    if (getWireType(p)) {
      setWireProduct(p);
      setWireSelections((current) => ({
        ...current,
        [p.id]: current[p.id] ?? getWireSelection(p),
      }));
      return;
    }

    // Resolve selected variant for this product (color / size)
    const selectedVariantId = variantMap[p.id] ?? p.variants?.[0]?.id;
    const variant = p.variants?.find((v) => v.id === selectedVariantId);
    if ((variant?.price ?? p.price) <= 0) {
      setPriceProduct(p);
      setPriceInput("");
      setPriceVariantId(variant?.id);
      return;
    }
    addToCart(
      p.id,
      1,
      variant ? { id: variant.id, label: variant.label } : undefined,
    );
    toast.success(
      variant ? `${p.name} — ${variant.label} added` : `${p.name} added`,
    );
  };

  const submitProductPrice = () => {
    if (!priceProduct) return;
    const price = Number(priceInput);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a price greater than zero.");
      return;
    }

    const variant = priceProduct.variants?.find(
      (item) => item.id === priceVariantId,
    );
    if (variant) {
      updateProduct(priceProduct.id, {
        variants: priceProduct.variants?.map((item) =>
          item.id === variant.id ? { ...item, price } : item,
        ),
      });
      addToCart(priceProduct.id, 1, { id: variant.id, label: variant.label });
    } else {
      updateProduct(priceProduct.id, { price });
      addToCart(priceProduct.id, 1);
    }
    toast.success(
      `${priceProduct.name} added at ${inr(price)} per ${priceProduct.unit}`,
    );
    setPriceProduct(null);
  };

  const submitWireSelection = () => {
    if (!wireProduct) return;
    const wireType = getWireType(wireProduct);
    const selection =
      wireSelections[wireProduct.id] ?? getWireSelection(wireProduct);

    if (wireType === "coil") {
      const selectedColors = COIL_COLORS.filter(
        (color) => (selection.colorCounts[color] ?? 0) > 0,
      );
      if (selectedColors.length === 0) {
        toast.error("Enter at least one coil count.");
        return;
      }
      if (selection.unitPrice <= 0) {
        toast.error("Enter a price per coil before adding this wire.");
        return;
      }
      updateProduct(wireProduct.id, { price: selection.unitPrice });
      selectedColors.forEach((color) => {
        addToCart(wireProduct.id, selection.colorCounts[color], {
          id: `${wireProduct.id}-coil-${color.toLowerCase()}`,
          label: `${color} · 90m coil`,
        });
      });
      toast.success(`${wireProduct.name} coil selection added`);
      setWireProduct(null);
      return;
    }

    if (!Number.isFinite(selection.lengthFeet) || selection.lengthFeet <= 0) {
      toast.error("Enter a length greater than zero feet.");
      return;
    }
    if (selection.unitPrice <= 0) {
      toast.error("Enter a price per foot before adding this wire.");
      return;
    }

    const hasThickness =
      wireType === "two-core" ||
      wireType === "three-core" ||
      wireType === "four-core" ||
      wireType === "flexible" ||
      wireType === "submersible";
    const variant = hasThickness
      ? wireProduct.variants?.find((item) => item.label === selection.thickness)
      : undefined;
    const variantId =
      variant?.id ??
      (hasThickness
        ? `${wireProduct.id}-${selection.thickness.replace(/\s+/g, "-")}`
        : undefined);
    const label = hasThickness ? selection.thickness : undefined;

    updateProduct(wireProduct.id, {
      price: selection.unitPrice,
      ...(hasThickness && variantId
        ? {
            variants: (wireProduct.variants ?? []).map((item) =>
              item.id === variantId
                ? { ...item, price: selection.unitPrice }
                : item,
            ),
          }
        : {}),
    });
    addToCart(
      wireProduct.id,
      selection.lengthFeet,
      variantId && label ? { id: variantId, label } : undefined,
    );
    toast.success(
      `${wireProduct.name}${label ? ` · ${label}` : ""} (${selection.lengthFeet} ft) added`,
    );
    setWireProduct(null);
  };

  const openDocumentDialog = (kind: GeneratedDocument) => {
    if (cart.length === 0) {
      toast.error("Add products to the cart first.");
      return;
    }
    setDocumentCustomerId(searchCustomerId ?? "");
    setDocumentTerms(settings.defaults.terms.join("\n"));
    setPaymentTerms(settings.defaults.paymentTerms);
    setSaveTermsAsDefaults(false);
    setDocumentKind(kind);
  };

  const generateSelectedDocument = () => {
    if (!documentKind) return;
    if (!documentCustomerId) {
      toast.error("Select a customer first.");
      return;
    }

    const terms = documentTerms
      .split(/\r?\n/)
      .map((term) => term.trim())
      .filter(Boolean);
    if (saveTermsAsDefaults) {
      updateSettings({ defaults: { ...settings.defaults, terms } });
    }

    if (documentKind === "material") {
      const materialList = generateML(documentCustomerId, terms);
      if (!materialList) {
        toast.error("The cart is empty.");
        return;
      }
      toast.success(`Material List ${materialList.number} generated`);
      setDocumentKind(null);
      nav({ to: "/material-lists" });
      return;
    }

    if (documentKind === "invoice") {
      const invoice = generateInv(documentCustomerId, terms);
      if (!invoice) {
        toast.error("The cart is empty.");
        return;
      }
      toast.success(`Invoice ${invoice.number} created`);
      setDocumentKind(null);
      nav({ to: "/invoices/$id", params: { id: invoice.id } });
      return;
    }

    const quotationId = generateQuotation(documentCustomerId, {
      terms,
      paymentTerms,
      hidePrices: hideCartPrices,
    });
    if (!quotationId) {
      toast.error("The cart is empty.");
      return;
    }
    toast.success("Quotation created");
    setDocumentKind(null);
    nav({ to: "/quotations/$id", params: { id: quotationId } });
  };

  const previewProduct = previewId
    ? products.find((p) => p.id === previewId)
    : null;

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <div className="flex-1 min-w-0 p-3 sm:p-5 md:p-6 space-y-4">
        {/* Header */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-black tracking-tight truncate">
              Products
            </h1>
            {/* <p className="text-muted-foreground text-xs mt-0.5">Compact e-commerce style · variants (colors/sizes) get their own cart line.</p> */}
          </div>
          <div className="flex gap-2 shrink-0">
            {!showCart && (
              <Button
                onClick={() => setShowCart(true)}
                variant="outline"
                className="gap-2 h-9"
              >
                <ShoppingCart className="h-4 w-4" /> Cart ({cart.length})
              </Button>
            )}
            <AddProductDialog
              open={addOpen}
              setOpen={setAddOpen}
              onSave={(p) => {
                addProduct(p);
                toast.success("Product added");
              }}
            />
          </div>
        </div>

        {/* Category chips (compact) */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors whitespace-nowrap shrink-0",
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:border-primary/40",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Compressed filter row */}
        <div className="card-surface p-2.5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) =>
                nav({
                  to: "/products",
                  search: { q: e.target.value, customerId: searchCustomerId },
                })
              }
              placeholder="Search by name, brand, SKU, or keyword…"
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter className="h-3.5 w-3.5" /> Filters
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                filtersOpen && "rotate-180",
              )}
            />
          </Button>
          <div className="flex rounded-md border border-border overflow-hidden ml-auto">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "h-9 w-9 flex items-center justify-center",
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "h-9 w-9 flex items-center justify-center",
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="card-surface p-3 flex flex-wrap gap-2">
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[170px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-asc">Price ↑</SelectItem>
                <SelectItem value="price-desc">Price ↓</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Grid / List */}
        {filtered.length === 0 ? (
          <div className="card-surface p-16 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No products match your search.
          </div>
        ) : view === "grid" ? (
          // Small cards: aim for 7–8 per row on xl/2xl
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                variantId={variantMap[p.id] ?? p.variants?.[0]?.id}
                onVariant={(v) => setVariantMap((m) => ({ ...m, [p.id]: v }))}
                onAdd={() => handleAdd(p)}
                onPreview={() => setPreviewId(p.id)}
                cartRowsForProduct={cartRows.filter(
                  (r) => r.productId === p.id,
                )}
                onQty={(itemId, qty) => setCartQty(itemId, qty)}
              />
            ))}
          </div>
        ) : (
          <div className="card-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 w-14"></th>
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-left px-3 py-2 w-28 hidden sm:table-cell">
                      Brand
                    </th>
                    <th className="text-left px-3 py-2 w-28 hidden md:table-cell">
                      Unit
                    </th>
                    <th className="text-right px-3 py-2 w-24">Price</th>
                    <th className="text-center px-3 py-2 w-20 hidden sm:table-cell">
                      Stock
                    </th>
                    <th className="px-3 py-2 w-40"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex items-center justify-center text-[9px] text-muted-foreground font-bold">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "VC"
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-[13px]">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {p.sku}
                        </div>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        {p.brand}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">
                        {p.subUnit ?? p.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">
                        {p.price > 0 ? (
                          `₹${p.price.toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-muted-foreground">
                            Set price
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-[oklch(0.55_0.16_150)] font-semibold hidden sm:table-cell">
                        {p.stock}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewId(p.id)}
                            className="h-8 w-8 rounded-md border border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleAdd(p)}
                            className="text-[11px] font-bold tracking-wider text-white bg-primary rounded-md px-3 py-1.5 hover:opacity-90"
                          >
                            ADD
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cart panel */}
      {showCart && (
        <aside className="fixed inset-y-16 right-0 z-40 flex w-[min(360px,100vw)] shrink-0 flex-col border-l border-border bg-background shadow-xl lg:sticky lg:inset-y-auto lg:right-auto lg:top-16 lg:h-[calc(100vh-64px)] lg:shadow-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="font-semibold text-sm">Material Cart</span>
              <span className="h-5 min-w-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center px-1.5">
                {cart.length}
              </span>
            </div>
            <button
              onClick={() => setShowCart(false)}
              className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {cartRows.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                Your cart is empty
              </div>
            )}
            {cartRows.map((r) => (
              <div
                key={r.id}
                className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/40"
              >
                <div className="h-12 w-12 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-muted-foreground font-semibold">
                  {r.product.image ? (
                    <img
                      src={r.product.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "VC"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[12.5px] font-semibold truncate">
                      {r.product.name}
                      {r.variantLabel && (
                        <span className="ml-1.5 text-[11px] font-bold text-primary">
                          · {r.variantLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      ₹{r.rate.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {r.qty} {r.product.stockUnit}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <QtyPill
                      value={r.qty}
                      onChange={(v) => setCartQty(r.id, v)}
                      size="sm"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold tabular-nums text-primary">
                        ₹{(r.rate * r.qty).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => removeFromCart(r.id)}
                        className="text-muted-foreground hover:text-primary"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums font-semibold">
                {inr(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GST</span>
              <span className="tabular-nums">{inr(gst)}</span>
            </div>
            <div className="flex justify-between text-base pt-2 border-t border-border">
              <span className="font-bold">Total</span>
              <span className="tabular-nums font-black text-primary text-lg">
                {inr(total)}
              </span>
            </div>
            <label className="flex items-center gap-2 pt-1 text-xs cursor-pointer">
              <Checkbox
                checked={hideCartPrices}
                onCheckedChange={() => toggleHide()}
              />
              <span>Hide Prices in PDF</span>
            </label>
            <div className="space-y-2 pt-1">
              <Button
                className="w-full gap-2 h-10"
                onClick={() => openDocumentDialog("material")}
              >
                <ClipboardList className="h-4 w-4" /> Generate Material List
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2 h-10 bg-secondary text-white hover:opacity-90"
                onClick={() => openDocumentDialog("quotation")}
              >
                <FileText className="h-4 w-4" /> Generate Quotation
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 h-10"
                onClick={() => openDocumentDialog("invoice")}
              >
                <Receipt className="h-4 w-4" /> Generate Invoice
              </Button>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="w-full text-xs text-muted-foreground hover:text-primary pt-1"
                >
                  Clear cart
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      <Dialog
        open={!!documentKind}
        onOpenChange={(open) => !open && setDocumentKind(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {documentKind === "material"
                ? "Generate Material List"
                : documentKind === "quotation"
                  ? "Generate Quotation"
                  : "Generate Invoice"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={documentCustomerId}
                onValueChange={setDocumentCustomerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an existing customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} · {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(() => {
              const customer = customers.find(
                (item) => item.id === documentCustomerId,
              );
              if (!customer) return null;
              return (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-0.5">
                  <div className="font-semibold">{customer.name}</div>
                  {customer.phone && (
                    <div className="text-muted-foreground">
                      {customer.phone}
                    </div>
                  )}
                  {customer.email && (
                    <div className="text-muted-foreground">
                      {customer.email}
                    </div>
                  )}
                  {customer.address && (
                    <div className="text-muted-foreground">
                      {customer.address}
                    </div>
                  )}
                  {customer.city && (
                    <div className="text-muted-foreground">{customer.city}</div>
                  )}
                </div>
              );
            })()}

            {documentKind === "quotation" && (
              <div className="space-y-2">
                <Label>Payment terms</Label>
                <Input
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Terms &amp; Conditions</Label>
              <Textarea
                rows={6}
                value={documentTerms}
                onChange={(event) => setDocumentTerms(event.target.value)}
                placeholder="Enter one term per line"
              />
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={saveTermsAsDefaults}
                  onCheckedChange={(checked) =>
                    setSaveTermsAsDefaults(checked === true)
                  }
                />
                <span>Save these terms as defaults for future documents</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDocumentKind(null)}>
              Cancel
            </Button>
            <Button
              onClick={generateSelectedDocument}
              disabled={!documentCustomerId}
            >
              Create{" "}
              {documentKind === "material"
                ? "Material List"
                : documentKind === "quotation"
                  ? "Quotation"
                  : "Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog
        open={!!previewProduct}
        onOpenChange={(v) => !v && setPreviewId(null)}
      >
        <DialogContent className="max-w-lg">
          {previewProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{previewProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-[140px_1fr] gap-4">
                <div className="aspect-square rounded-md bg-muted overflow-hidden flex items-center justify-center text-muted-foreground text-xs font-bold">
                  {previewProduct.image ? (
                    <img
                      src={previewProduct.image}
                      alt={previewProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "VoltCare"
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
                  <div>
                    <span className="text-muted-foreground">Brand:</span>{" "}
                    <span className="font-semibold">
                      {previewProduct.brand}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>{" "}
                    <span className="font-semibold">
                      {previewProduct.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SKU:</span>{" "}
                    <span className="font-semibold">{previewProduct.sku}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit:</span>{" "}
                    <span className="font-semibold">
                      {previewProduct.subUnit ?? previewProduct.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>{" "}
                    <span className="font-black text-primary text-base">
                      {previewProduct.price > 0
                        ? inr(previewProduct.price)
                        : "Set price when selecting"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span>{" "}
                    <span className="font-semibold">
                      {previewProduct.stock} {previewProduct.stockUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">GST:</span>{" "}
                    <span className="font-semibold">
                      {previewProduct.gstRate}%
                    </span>
                  </div>
                  {previewProduct.variants &&
                    previewProduct.variants.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                          Variants
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {previewProduct.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-[11px] px-2 py-0.5 rounded-full border border-border"
                            >
                              {v.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewId(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleAdd(previewProduct);
                    setPreviewId(null);
                  }}
                >
                  Add to Cart
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!wireProduct}
        onOpenChange={(open) => !open && setWireProduct(null)}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {wireProduct &&
            (() => {
              const wireType = getWireType(wireProduct);
              const selection =
                wireSelections[wireProduct.id] ?? getWireSelection(wireProduct);
              const options = wireType ? thicknessOptions(wireType) : [];
              const unitRate = selection.unitPrice;
              const coilCount = COIL_COLORS.reduce(
                (sum, color) => sum + (selection.colorCounts[color] ?? 0),
                0,
              );
              const coilTotal = coilCount * unitRate;
              const feetTotal = selection.lengthFeet * unitRate;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle>{wireProduct.name}</DialogTitle>
                  </DialogHeader>

                  {wireType === "coil" ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        90m coil · enter the required coil count for each color.
                      </p>
                      <div className="space-y-2">
                        <Label>Price per 90m coil (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={selection.unitPrice}
                          onChange={(event) =>
                            setWireSelections((current) => ({
                              ...current,
                              [wireProduct.id]: {
                                ...selection,
                                unitPrice: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left">Color</th>
                              <th className="px-3 py-2 text-right">Coils</th>
                            </tr>
                          </thead>
                          <tbody>
                            {COIL_COLORS.map((color) => (
                              <tr
                                key={color}
                                className="border-t border-border"
                              >
                                <td className="px-3 py-2 font-medium">
                                  {color}
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={selection.colorCounts[color] ?? 0}
                                    onChange={(event) =>
                                      setWireSelections((current) => ({
                                        ...current,
                                        [wireProduct.id]: {
                                          ...selection,
                                          colorCounts: {
                                            ...selection.colorCounts,
                                            [color]: Math.max(
                                              0,
                                              Math.floor(
                                                Number(event.target.value) || 0,
                                              ),
                                            ),
                                          },
                                        },
                                      }))
                                    }
                                    className="ml-auto h-9 w-28"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between rounded-md bg-muted/50 p-3 text-sm">
                        <span>
                          {coilCount} coils × {inr(unitRate)} per coil
                        </span>
                        <strong className="text-primary">
                          {inr(coilTotal)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {options.length > 0 && (
                        <div className="space-y-2">
                          <Label>Thickness</Label>
                          <Select
                            value={selection.thickness}
                            onValueChange={(thickness) => {
                              const variant = wireProduct.variants?.find(
                                (item) => item.label === thickness,
                              );
                              setWireSelections((current) => ({
                                ...current,
                                [wireProduct.id]: {
                                  ...selection,
                                  thickness,
                                  unitPrice:
                                    variant?.price ?? wireProduct.price,
                                },
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {options.map((thickness) => (
                                <SelectItem key={thickness} value={thickness}>
                                  {thickness}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Price per foot (₹)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={selection.unitPrice}
                          onChange={(event) =>
                            setWireSelections((current) => ({
                              ...current,
                              [wireProduct.id]: {
                                ...selection,
                                unitPrice: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Length in feet</Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={selection.lengthFeet}
                          onChange={(event) =>
                            setWireSelections((current) => ({
                              ...current,
                              [wireProduct.id]: {
                                ...selection,
                                lengthFeet: Math.max(
                                  0,
                                  Number(event.target.value) || 0,
                                ),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="flex justify-between rounded-md bg-muted/50 p-3 text-sm">
                        <span>
                          {selection.lengthFeet} ft × {inr(unitRate)} per foot
                        </span>
                        <strong className="text-primary">
                          {inr(feetTotal)}
                        </strong>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setWireProduct(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={submitWireSelection}>Add to Cart</Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!priceProduct}
        onOpenChange={(open) => !open && setPriceProduct(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set product price</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm font-medium">{priceProduct?.name}</div>
            <Label htmlFor="product-unit-price">
              Price per {priceProduct?.unit} (₹)
            </Label>
            <Input
              id="product-unit-price"
              type="number"
              min={0}
              step="any"
              autoFocus
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              onKeyDown={(event) =>
                event.key === "Enter" && submitProductPrice()
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceProduct(null)}>
              Cancel
            </Button>
            <Button onClick={submitProductPrice}>Set Price &amp; Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -- Product card (compact) ------------------------------------------------
function ProductCard({
  product,
  variantId,
  onVariant,
  onAdd,
  onPreview,
  cartRowsForProduct,
  onQty,
}: {
  product: Product;
  variantId?: string;
  onVariant: (id: string) => void;
  onAdd: () => void;
  onPreview: () => void;
  cartRowsForProduct: Array<{ id: string; qty: number; variantId?: string }>;
  onQty: (itemId: string, qty: number) => void;
}) {
  const variant = product.variants?.find((v) => v.id === variantId);
  const rate = variant?.price ?? product.price;
  // Cart row for the currently-selected variant (if any) — enables inline qty
  const activeRow = cartRowsForProduct.find((r) => r.variantId === variantId);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col group hover:border-primary/40 transition-colors">
      <button
        onClick={onPreview}
        className="aspect-square bg-muted/40 flex items-center justify-center border-b border-border relative"
        aria-label="Preview"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground text-[10px] font-semibold">
            VoltCare
          </div>
        )}
        <span className="absolute top-1 right-1 h-6 w-6 rounded-md bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Eye className="h-3 w-3" />
        </span>
      </button>
      <div className="p-2 flex-1 flex flex-col">
        <div className="text-[10px] text-muted-foreground truncate">
          {product.brand}
        </div>
        <div className="text-[11.5px] font-semibold leading-tight line-clamp-2 min-h-[28px]">
          {product.name}
        </div>

        {!getWireType(product) &&
          product.variants &&
          product.variants.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {product.variants.map((v) => {
                const active = v.id === variantId;
                const swatch = COLOR_SWATCH[v.label];
                return (
                  <button
                    key={v.id}
                    onClick={() => onVariant(v.id)}
                    title={v.label}
                    className={cn(
                      "h-5 min-w-5 px-1 rounded-full border text-[9px] font-bold flex items-center gap-1",
                      active
                        ? "border-primary ring-1 ring-primary/40"
                        : "border-border",
                    )}
                  >
                    {swatch && (
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                        style={{ background: swatch }}
                      />
                    )}
                    {!swatch && <span className="truncate">{v.label}</span>}
                  </button>
                );
              })}
            </div>
          )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
          <div className="text-[13px] font-black tabular-nums leading-none">
            {rate > 0 ? (
              `₹${rate.toLocaleString("en-IN")}`
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Set price
              </span>
            )}
          </div>
          {activeRow ? (
            <QtyPill
              value={activeRow.qty}
              onChange={(v) => onQty(activeRow.id, v)}
              size="xs"
            />
          ) : (
            <button
              onClick={onAdd}
              className="text-[10px] font-bold tracking-wider text-white bg-primary rounded-md px-2.5 py-1 hover:opacity-90"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Modern responsive +/- pill --------------------------------------------
function QtyPill({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "xs" | "sm" | "md";
}) {
  const h = size === "xs" ? "h-6" : size === "sm" ? "h-7" : "h-8";
  const w = size === "xs" ? "w-6" : size === "sm" ? "w-7" : "w-8";
  const num =
    size === "xs"
      ? "text-[11px] w-6"
      : size === "sm"
        ? "text-[12px] w-7"
        : "text-[13px] w-8";
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border overflow-hidden bg-background shadow-sm",
        h,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className={cn(
          "flex items-center justify-center hover:bg-muted transition-colors",
          h,
          w,
        )}
        aria-label="Decrease"
      >
        <Minus className="h-3 w-3" />
      </button>
      <div
        className={cn("text-center font-bold tabular-nums select-none", num)}
      >
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={cn(
          "flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors",
          h,
          w,
        )}
        aria-label="Increase"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

// -- Add Product dialog (with image upload → data URL / local storage) -----
function AddProductDialog({
  open,
  setOpen,
  onSave,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onSave: (
    p: Parameters<ReturnType<typeof useVoltcare.getState>["addProduct"]>[0],
  ) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    brand: "VoltCare",
    category: "Wires & Cables",
    sku: "",
    unit: "piece",
    subUnit: "",
    price: 0,
    gstRate: 18,
    stock: 0,
    stockUnit: "pcs",
    image: undefined as string | undefined,
    variantsText: "", // comma separated labels (Red, Black, Blue…)
    wireType: "" as "" | WireType,
    variantRates: {} as Record<string, number>,
  });
  const [coilGauge, setCoilGauge] = useState("0.75 sq. mm");
  const [serviceGauge, setServiceGauge] = useState(SERVICE_WIRE_SIZES[0]);
  const [specialtyName, setSpecialtyName] = useState("LED Strip Wire");
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickImage = (file: File) => {
    // Store as data URL (persisted via zustand → localStorage)
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({ ...f, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-9">
          <Plus className="h-4 w-4" />
          New Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>

        {/* Image picker */}
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 rounded-md bg-muted overflow-hidden flex items-center justify-center border border-border shrink-0">
            {form.image ? (
              <img
                src={form.image}
                alt="preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && onPickImage(e.target.files[0])
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              {form.image ? "Change image" : "Upload image"}
            </Button>
            {form.image && (
              <button
                className="text-[11px] text-muted-foreground hover:text-primary text-left"
                onClick={() => setForm({ ...form, image: undefined })}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs">Wire behavior</Label>
            <Select
              value={form.wireType || "standard"}
              onValueChange={(value) => {
                const wireType =
                  value === "standard" ? "" : (value as WireType);
                const defaultName =
                  wireType === "coil"
                    ? `${coilGauge} Wire`
                    : wireType === "service"
                      ? `${serviceGauge} Service Wire`
                      : wireType === "two-core"
                        ? "2-Core Wire"
                        : wireType === "three-core"
                          ? "3-Core Wire"
                          : wireType === "four-core"
                            ? "4-Core Wire"
                            : wireType === "flexible"
                              ? "Flexible Wire"
                              : wireType === "submersible"
                                ? "3-Core Submersible Cable"
                                : wireType === "specialty"
                                  ? specialtyName
                                  : "";
                setForm((current) => ({
                  ...current,
                  wireType,
                  name: defaultName || current.name,
                  category: wireType ? "Wires & Cables" : current.category,
                  unit:
                    wireType === "coil"
                      ? "Coil (90m)"
                      : wireType
                        ? "Feet"
                        : "piece",
                  stockUnit:
                    wireType === "coil" ? "coils" : wireType ? "ft" : "pcs",
                  variantRates: {},
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard product</SelectItem>
                {WIRE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.wireType === "coil" && (
            <div className="col-span-2">
              <Label className="text-xs">House wire thickness</Label>
              <Select
                value={coilGauge}
                onValueChange={(value) => {
                  setCoilGauge(value);
                  setForm((current) => ({ ...current, name: `${value} Wire` }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUSE_WIRE_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.wireType === "service" && (
            <div className="col-span-2">
              <Label className="text-xs">Service wire size</Label>
              <Select
                value={serviceGauge}
                onValueChange={(value) => {
                  setServiceGauge(value);
                  setForm((current) => ({
                    ...current,
                    name: `${value} Service Wire`,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_WIRE_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.wireType === "specialty" && (
            <div className="col-span-2">
              <Label className="text-xs">Specialty wire</Label>
              <Select
                value={specialtyName}
                onValueChange={(value) => {
                  setSpecialtyName(value);
                  setForm((current) => ({ ...current, name: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LED Strip Wire">LED Strip Wire</SelectItem>
                  <SelectItem value="Speaker Wire">Speaker Wire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="col-span-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 1.5 sq.mm Copper Wire"
            />
          </div>
          <div>
            <Label className="text-xs">Brand</Label>
            <Input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATS.slice(1).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">SKU</Label>
            <Input
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Unit</Label>
            <Input
              value={form.unit}
              disabled={!!form.wireType}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="piece / roll (90m)"
            />
          </div>
          <div>
            <Label className="text-xs">
              {form.wireType === "coil"
                ? "Price per coil (₹)"
                : form.wireType
                  ? "Price per foot (₹)"
                  : "Price (₹)"}
            </Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label className="text-xs">GST %</Label>
            <Input
              type="number"
              value={form.gstRate}
              onChange={(e) =>
                setForm({ ...form, gstRate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Stock</Label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Stock Unit</Label>
            <Input
              value={form.stockUnit}
              disabled={!!form.wireType}
              onChange={(e) => setForm({ ...form, stockUnit: e.target.value })}
            />
          </div>
          {form.wireType && thicknessOptions(form.wireType).length > 0 && (
            <div className="col-span-2 space-y-2">
              <Label className="text-xs">Price per foot by thickness</Label>
              <div className="grid grid-cols-2 gap-2">
                {thicknessOptions(form.wireType).map((thickness) => (
                  <div key={thickness} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      {thickness}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.variantRates[thickness] ?? form.price}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          variantRates: {
                            ...current.variantRates,
                            [thickness]: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {!form.wireType && (
            <div className="col-span-2">
              <Label className="text-xs">
                Variants (comma separated — e.g. Red, Black, Blue)
              </Label>
              <Textarea
                rows={2}
                value={form.variantsText}
                onChange={(e) =>
                  setForm({ ...form, variantsText: e.target.value })
                }
                placeholder="Leave empty if the product has no color/size variants."
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!form.name) {
                toast.error("Name is required");
                return;
              }
              // Parse variants
              const productKey = (form.sku || form.name)
                .toLowerCase()
                .replace(/\s+/g, "-");
              const variants: ProductVariant[] =
                form.wireType && thicknessOptions(form.wireType).length > 0
                  ? thicknessOptions(form.wireType).map((label) => ({
                      id: `${productKey}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
                      label,
                      price: form.variantRates[label] ?? form.price,
                    }))
                  : form.variantsText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((label) => ({
                        id: `${productKey}-${label.toLowerCase()}`,
                        label,
                      }));
              const firstThickness = form.wireType
                ? thicknessOptions(form.wireType)[0]
                : undefined;
              onSave({
                name: form.name,
                brand: form.brand,
                category: form.category,
                wireType: form.wireType || undefined,
                sku: form.sku,
                unit: form.unit,
                subUnit: form.subUnit || undefined,
                price: firstThickness
                  ? (form.variantRates[firstThickness] ?? form.price)
                  : form.price,
                gstRate: form.gstRate,
                stock: form.stock,
                stockUnit: form.stockUnit,
                // Static image example: "/products/wire-15mm.jpg"; uploaded files use a data URL.
                image: form.image,
                variants: variants.length ? variants : undefined,
              });
              setOpen(false);
              setForm({
                name: "",
                brand: "VoltCare",
                category: "Wires & Cables",
                sku: "",
                unit: "piece",
                subUnit: "",
                price: 0,
                gstRate: 18,
                stock: 0,
                stockUnit: "pcs",
                image: undefined,
                variantsText: "",
                wireType: "",
                variantRates: {},
              });
              setCoilGauge(HOUSE_WIRE_SIZES[0]);
              setServiceGauge(SERVICE_WIRE_SIZES[0]);
              setSpecialtyName("LED Strip Wire");
            }}
          >
            Save Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
