# Voltcare OS — Build Plan

A complete production-styled ERP frontend, matching the four reference screenshots exactly (sidebar, header, product grid + material cart, service/room builder, dashboard, invoice PDF). No dummy pages — every screen is connected through one shared data store so the full workflow works.

## Design System

- **Colors**: Voltcare Red `#E11D2E` (primary), Black `#0A0A0A` (secondary), White background, neutral grays for borders/muted, semantic green/amber/red for status. No gradients, no purple/blue accents.
- **Logo**: multi-color "VOLTCARE" wordmark (V red, O yellow, L green, T red, C blue, A yellow, R red, E blue) with "ELECTRICAL SOLUTIONS" tagline — recreated as an SVG component so it renders crisp at any size and in the collapsed sidebar.
- **Typography**: Inter for UI (clean, ERP-standard), tabular numerics for money columns.
- **Components**: rounded-xl cards, 1px neutral borders, generous spacing, subtle hover states, no motion beyond 150ms color/opacity.
- All tokens in `src/styles.css` (`@theme` + oklch vars). Shadcn components restyled via variants — no ad‑hoc color classes in components.

## Shared State (the "ERP backbone")

Single Zustand store `src/store/voltcare.ts` holds:
`customers, products, services, rooms (per active quotation), materialCart, quotations, materialLists, invoices, payments, activities, settings`.
Persisted to `localStorage` so refresh keeps state. Seeded with realistic data pulled from your screenshots (Polycab wires, Anchor switches, Havells MCBs, AKG conduit; Light/Fan/Socket/AC/TV/Geyser/Bell service points; sample customers Tejesh, Atharva, Shivam Electricals, Omkarr Enterprises).

Selectors compute totals live: subtotal → GST 18% → grand total; quotation → material list → invoice → payment all read/write the same records so status flows: `Draft → Sent → Accepted → Invoiced → Paid`.

## Layout Shell

- **Fixed collapsible sidebar** (Linear/Odoo style): logo, company block, nav (Dashboard, Customers, Products, Services, Quotation Builder, Material Lists, Quotations, Invoices, Payments, Reports, Settings), bottom user card + collapse button. Active route highlighted red. Collapses to icon rail.
- **Sticky top header**: command-K search, red "Quick Add" menu (Customer / Product / Service / Quotation / Invoice), WhatsApp shortcut (opens wa.me), notifications popover, profile dropdown.
- Responsive: sidebar becomes a sheet on mobile, right summary panels become bottom drawers, tables become stacked cards.

## Pages (all functional, all connected)

1. **Dashboard** — greeting, 4 KPI cards (Quotations / Pending / Invoices / Payments) computed from store, sales overview line chart (Recharts), Recent Activities feed, Top Services bar list, Quotation Status donut, Quick Actions grid — every action navigates to the real create flow.
2. **Customers** — searchable table + drawer, create/edit, links to their quotations/invoices/payments with totals.
3. **Products** — exact layout from screenshot 1: category chips, search + brand/unit/sort + grid/list toggle, product cards with image, brand, name, SKU, unit dropdown, stock, price, qty stepper, Add to Cart, edit/duplicate/menu, favorite star, hide-price toggle. **Right-side Material Cart panel** live-updates with subtotal, GST 18%, total, "Hide Prices in PDF", and three CTAs → Generate Material List / Quotation / Invoice. Cart persists across pages.
4. **Services** — exact layout from screenshot 2: service points library (left), **Room-wise Service Builder** (center) with expandable rooms (Living Room, Bedroom, Kitchen, Bathroom, Dining, Balcony, Office, Terrace, Store, Custom), inline-editable qty/rate/description/unit, add/delete/duplicate rows, drag to reorder rows and rooms, Add Point to Room, Add New Room. **Sticky right Quotation Summary**: Material Total, Labour, Transport, Other, Discount %, GST, Grand Total, Show/Hide Prices toggle, Payment Terms select, Terms & Conditions, Generate Quotation / Save Draft / Preview.
5. **Quotation Builder / Quotations list** — list of all quotations with status pills; opening one shows the full print-preview with the "Hide Prices" logic (when ON: hide Rate & Amount columns, hide subtotals, show only final total — the way electricians actually deliver quotations). "Send via WhatsApp" deep-links wa.me with a prefilled message + PDF link placeholder.
6. **Material Lists** — generated from Product Cart or a Quotation; editable qty/brand/rate; Print / Download PDF; marks source quotation as "material list generated".
7. **Invoices** — generated from a Quotation with one click; layout matches screenshot 4 (Voltcare wordmark top-left, contact top-right, Bill To / Invoice details, description table, Grand Total, footer tagline). Print-ready via `window.print()` + print stylesheet.
8. **Payments** — record payment against invoice, updates invoice balance and status; ledger view per customer.
9. **Reports** — sales by period, top services/products, outstanding invoices, GST summary (Recharts).
10. **Settings** — company profile, GST %, labour/transport defaults, payment terms presets, T&C presets, unit list, room list — all feed the builders.

## Technical Notes

- TanStack Start file-based routes under `src/routes/` (dashboard as `/`, plus `/customers`, `/products`, `/services`, `/quotations`, `/quotations/$id`, `/material-lists`, `/material-lists/$id`, `/invoices`, `/invoices/$id`, `/payments`, `/reports`, `/settings`). Each route has its own `head()` with proper title/description.
- Zustand + `persist` middleware for the store; Recharts for charts; lucide-react icons; react-hook-form + zod for forms; react-day-picker for dates; sonner for toasts.
- Print styles for Quotation / Material List / Invoice give clean PDFs via browser print.
- Keyboard: `⌘K` search, `⌘N` new quotation, `⌘/` shortcuts help.
- Sitemap.xml + robots.txt included.
- No backend yet — everything is local. When you're ready I can add Lovable Cloud (Postgres + auth + PDF generation) as a follow-up without changing the UI.

## Out of Scope (this pass)

- Real auth / multi-user roles (single "Tejesh — Owner" session).
- Server-side PDF rendering (uses browser print, which matches your invoice screenshot).
- WhatsApp Business API integration (uses `wa.me` deep-links).

Reply "go" to build, or tell me what to change.
