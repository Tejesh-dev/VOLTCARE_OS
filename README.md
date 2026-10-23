# Voltcare OS

**ERP + CRM for Voltcare Electrical Solutions — Nagpur, Maharashtra**

A single-page business operating system for an Indian electrical contractor. It replaces the
scattered notebooks, WhatsApp chats and Excel sheets with one connected flow:

> Customer → Product catalogue + Material Cart → Floor/Room service builder → Quotation →
> Material list → Invoice → Payment → Profit / expense reporting

Everything the user types is stored locally and survives refreshes, so the app is usable on a
shop counter laptop or an 11-inch tablet on site without any account, server or internet dependency.

- Live app: https://voltcare-flow.lovable.app
- Preview build: https://id-preview--e2c6918a-b779-4da4-8c3d-a1b6bb0e9fa8.lovable.app
- Owner / single active session: **Tejesh — Owner**

---

## 1. Tech stack

The project is already built on **React 19** — React is the view layer everywhere; the framework
around it is TanStack Start, which is React-first (JSX components, hooks, `<Outlet />` routing).

| Layer | Choice | Where |
| --- | --- | --- |
| UI library | React 19.2 (`react`, `react-dom`) | all of `src/` |
| Full-stack framework | TanStack Start v1 (`@tanstack/react-start`) | `src/server.ts`, `src/start.ts` |
| Routing | TanStack Router v1, file-based | `src/routes/`, `src/router.tsx` |
| Server state / cache | TanStack Query v5 | `src/routes/__root.tsx` (QueryClientProvider) |
| Client state (the ERP backbone) | Zustand v5 + `persist` middleware | `src/store/voltcare.ts` |
| Build tool | Vite 8 + `@lovable.dev/vite-tanstack-config` | `vite.config.ts` |
| Deployment bundler | Nitro 3 → Cloudflare Workers target | `vite.config.ts` (build-only) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), native `@theme` tokens | `src/styles.css` |
| Component primitives | shadcn/ui on Radix UI (46 components) | `src/components/ui/` |
| Charts | Recharts 2 | dashboard, reports |
| Forms | react-hook-form + zod + `@hookform/resolvers` | product/customer dialogs |
| Dates | date-fns 4, react-day-picker 9 | pickers, formatting |
| Icons | lucide-react | everywhere |
| Toasts | sonner (`<Toaster />` mounted in `AppShell`) | all mutations |
| Type safety | TypeScript 5.8 (strict) | `tsconfig.json` |
| Quality | ESLint 9 + Prettier 3 | `eslint.config.js`, `.prettierrc` |
| Package manager | Bun (`bun.lock`, `bunfig.toml`) | repo root |

There is **no** `react-router-dom`, no Redux, no Next.js, no separate API server. Adding any of
them would break the fixed TanStack Start bootstrap.

---

## 2. Architecture

```
src/
├── router.tsx                 createRouter + routeTree (auto-generated) + QueryClient context
├── server.ts                  SSR error wrapper (Nitro/Vite server entry)
├── start.ts                   Start bootstrap: server-fn middleware (auth header hook-up)
├── styles.css                 Tailwind v4 @import + @theme design tokens + print + utility classes
├── store/
│   ├── voltcare.ts            ★ the whole domain model: types, seed data, selectors, actions
│   └── hydrator.tsx           <StoreHydrator/> → rehydrate() once on mount (SSR-safe)
├── routes/                    file-based routes, each with its own head() metadata
│   ├── __root.tsx             <html> shell, fonts, meta, 404 + error boundaries
│   ├── index.tsx              /            Dashboard
│   ├── customers.tsx          /customers   layout (AppShell + <Outlet />)
│   ├── customers.index.tsx    /customers   Customer list + summary boxes
│   ├── customers.$id.tsx      /customers/:id  360° profile
│   ├── products.tsx           /products    Catalogue + Material Cart
│   ├── services.tsx           /services    Floor → Room → Service-point builder
│   ├── quotations.index.tsx   /quotations  Quotation list
│   ├── quotations.$id.tsx     /quotations/:id  Print-ready quotation
│   ├── material-lists.tsx     /material-lists  BOM lists
│   ├── invoices.index.tsx     /invoices    Invoice list
│   ├── invoices.$id.tsx       /invoices/:id  Invoice (matches the official Voltcare layout)
│   ├── payments.tsx           /payments    Payment ledger
│   ├── reports.tsx            /reports     Sales / GST / outstanding
│   ├── settings.tsx           /settings    Company, GST, terms, defaults
│   └── sitemap[.]xml.ts       /sitemap.xml (server route)
├── components/
│   ├── voltcare/              app-specific pieces
│   │   ├── shell.tsx          AppShell (sidebar+header+main+Toaster) and ClientGate
│   │   ├── app-sidebar.tsx    collapsible nav, icon rail on collapse, sheet on mobile
│   │   ├── app-header.tsx     logo, search box, Quick Add, WhatsApp, notifications, profile
│   │   ├── logo.tsx           multi-colour VOLTCARE wordmark (SVG, crisp at any size)
│   │   ├── document.tsx       shared print/document chrome for quotation / BOM / invoice
│   │   ├── business-summary-cards.tsx  the six KPI boxes (profit, expense, pending…)
│   │   └── sidebar-context.tsx          collapse state shared shell-wide
│   └── ui/                    shadcn primitives (button, dialog, select, table, tabs…)
├── hooks/use-mobile.tsx       viewport hook driving the mobile drawer
└── lib/                       format.ts (inr/shortDate/timeAgo/uid), utils.ts (cn),
                               error reporting helpers
```

### The store is the backbone

`src/store/voltcare.ts` (≈1,030 lines) is the only source of truth. Every screen reads from it and
every button writes to it, which is what makes the flow "connected" rather than a set of demo pages.

```
create<State & Actions>()(persist(...))
```

- **Persistence key:** `voltcare-os-v5` (bump the version when the shape changes so stale
  localStorage is discarded instead of crashing the app).
- **Storage:** `createJSONStorage(() => localStorage)` guarded by a `typeof window` check, plus
  `<StoreHydrator />` calling `useVoltcare.persist.rehydrate()` once after mount — this keeps SSR
  and hydration mismatch-free.
- **Screens never mutate arrays directly**; they call actions (`addCustomerVisit`, `setPointQtyInRoom`,
  `recordPayment`, `updateCharges`, …) and components re-render from narrow selectors
  (`useVoltcare((s) => s.quotations.filter(...))`).
- **`ClientGate`** delays rendering until hydration, so persisted numbers never flash empty values.

### Pure calculation helpers

Totals are computed, never stored, so editing a line updates every downstream document:

```ts
roomSubtotal(room)                     // Σ qty × rate over the room's lines
roomsSubtotal(rooms)
quotationTotals(q)                     // material + labour + transport + other
                                       // → − discount% → + GST% → grand
                                       //   (grand can be replaced by charges.grandOverride)
invoiceTotals(inv, gstRate = 18)       // subtotal → GST → grand → balance (grand − paidAmount)
```

`quotationTotals` returns `{ material, subtotal, discount, taxable, gst, grand, computedGrand }`,
so the UI can show both the computed grand and the manually overridden one.

---

## 3. Data model

| Type | Purpose | Notable fields |
| --- | --- | --- |
| `Customer` | CRM record | `notes`, `workStatus` (`new`/`in_progress`/`completed`/`on_hold`), `visitCharge`, `serviceCharge`, `address`, `googleMapsLink`, `visits[]`, `expenses[]`, `communications[]`, `manualPayments[]`, `photos` / `photoRecords[]` (site + completion, data URLs) |
| `Product` | Catalogue SKU | `brand`, `category`, `sku`, `unit`, `price`, `gstRate`, `stock`, `favorite`, `image`, `variants[]` |
| `ProductVariant` | e.g. wire colour | adding a variant to the cart creates a **separate cart line** so the quotation shows "Red 1.5 sq.mm" |
| `CartItem` | Material Cart line | `{ productId, variantId?, variantLabel?, qty }` |
| `ServicePoint` | 58-point labour library | Light/Fan/Socket/AC/Geyser… with `basePrice`, `unit`, `icon`, `tone` |
| `Room` / `RoomLine` | A room on a floor | `floor`, `lines[]` (qty, rate, unit, description), collapsed flag |
| `Quotation` | The central document | `number`, `customerId`, `projectName`, `floors[]`, `rooms[]`, `charges`, `hidePrices`, `paymentTerms`, `terms[]`, `status` |
| `QuotationCharges` | Editable money | `labour`, `transport`, `other`, `discountPct`, `gstRate`, `grandOverride` |
| `MaterialList` / `MaterialListItem` | BOM handed to the customer | `status: pending \| sent`, links to `customerId` and `quotationId` |
| `Invoice` | Tax invoice | `items[]`, `dueDate`, `paidAmount`, `status: draft\|sent\|paid\|partial\|overdue` |
| `Payment` | Receipt | `invoiceId`, `amount`, `method` (`cash`/`upi`/`bank`/`cheque`), `reference` |
| `Activity` | Dashboard feed | audit-style log of what happened |
| `Settings` | Company + defaults | GST %, labour/transport defaults, payment-term and T&C presets, unit and room lists |

Status lifecycle that the UI drives: `draft → sent → accepted/rejected → invoiced → paid/partial`.

---

## 4. Workflow (what the app actually does)

1. **Capture the customer** — Quick Add or `/customers`. The list shows the six summary boxes; the
   profile page (`/customers/:id`) is the "wheel": Call / WhatsApp quick actions, work status,
   notes, visiting and service charges, site + completion photos, visit log, expenses, and every
   quotation, material list, invoice and payment that belongs to that customer.
2. **Pick material** — `/products`: category chips, search, brand/unit/sort filters, grid/list
   toggle, compact cards with `+`/`−` steppers and variant chips (wire colours become their own
   cart lines). The **Material Cart** panel on the right keeps subtotal, GST 18 %, total, a
   "hide prices" toggle, and three CTAs → Generate Material List / Quotation / Invoice. Cart
   persists while you navigate.
3. **Build the job** — `/services`: one-row header (Customer · Project · Floor · Room), an
   e-commerce style library of 58 service points as small icon cards with `+`/`−` steppers, and a
   right-hand **Quotation Summary** that lists only the points actually selected, grouped
   Floor → Room → Service, with per-floor subtotals, editable labour/transport/other/discount/GST,
   an editable grand total, Show/Hide Prices, payment terms, then Preview / Save / Drop / Generate.
   Floors repeat room templates (G+2, G+1, 3rd floor…), so rooms can be duplicated and renamed.
4. **Send the quotation** — `/quotations/:id` prints a full page (the app chrome is hidden by the
   print stylesheet, not just the PDF frame). Usage columns (Service point, Qty, Unit) appear once
   per floor block instead of being repeated on every row. When **Hide Prices** is on, rate and
   amount columns drop out and only the final total survives — how quotations are actually handed
   over. "Send via WhatsApp" opens a `wa.me` deep link with a prefilled message.
5. **Issue the BOM** — `/material-lists` (same document template as quotations/payment slips),
   editable qty/brand/rate, Print / Download, and a pending → sent marker.
6. **Invoice** — one click turns an accepted quotation into an invoice laid out like the official
   Voltcare document: wordmark top-left, contact block top-right, Bill To, invoice details,
   description table, grand total, footer tagline.
7. **Collect** — `/payments` records a receipt against an invoice, which moves the invoice to
   `partial` or `paid` and updates the balance everywhere.
8. **Review** — `/reports` and the dashboard's six boxes (Total Profit, Total Expense, Pending
   Payments, Quotations, Pending Material Sending, Pending Quotation Sending) read the same store,
   scoped to one customer or the whole book.

---

## 5. Getting started

```bash
# install (Bun is the package manager for this repo)
bun install

# dev server with HMR — http://localhost:8080
bun run dev

# production bundle (Nitro → Cloudflare Workers target)
bun run build

# serve the built output
bun run preview

# code quality
bun run lint
bun run format
```

Requirements: Node 20+ / Bun 1.2+. No environment variables, no database, no API keys — the app
runs entirely in the browser.

### Resetting demo data

All state lives in `localStorage` under `voltcare-os-v5`. DevTools → Application → Local Storage →
delete that key (or bump the persist `version` in `src/store/voltcare.ts`) and the seed data —
VoltCare copper wires 1.0–4.0 sq.mm, Anchor switches, Havells MCBs, AKG conduit, 58 service points,
sample Nagpur customers — is re-seeded on the next load.

---

## 6. Design system

- **Colour:** Voltcare Red `oklch(0.585 0.223 25.5)` primary, near-black secondary, white surfaces;
  semantic `--success` / `--warning` / `--destructive`. No gradients, no purple/blue accents.
- **Tokens:** all colour, radius and shadow values live in `src/styles.css` under Tailwind v4's
  `@theme`, so components use semantic classes (`bg-primary`, `card-surface`) instead of hard-coded
  hex utilities.
- **Logo:** per-letter SVG wordmark — V red, O yellow, L green, T red, C blue, A yellow, R red,
  E blue — with the "ELECTRICAL SOLUTIONS" tagline; renders in the sidebar, header and printed docs.
- **Type:** Inter (400–900) loaded via `<link>` in `__root.tsx`; `tabular-nums` on every money column.
- **Shape:** `rounded-xl` cards, 1 px neutral borders, generous spacing, ≤150 ms hover transitions.
- **Responsive:** sidebar collapses to an icon rail and becomes a sheet on mobile; catalogue grid
  scales 7–8 cards per row on wide screens; the Quotation Summary is collapsible from the header;
  layouts are tuned for the 11-inch tablet used on site.
- **Print:** a print stylesheet turns quotation / material list / invoice pages into clean PDFs via
  `window.print()`, hiding nav, search and buttons.

### Search & quick actions

- **Header search box** filters the current area: on `/customers` it narrows customers, on
  `/quotations` quotations, on `/invoices` invoices, and anywhere else it searches the product
  catalogue. The query travels in the URL (`?q=…`), so a filtered view can be bookmarked or shared.
- **Quick Add** (red button) creates a Customer, Product, Service point, Quotation or Invoice from
  any screen without losing your place.
- **WhatsApp** opens a `wa.me` deep link for the current customer with a prefilled message.
- **Call** uses a plain `tel:` link, so it works from the tablet on site.

---

## 7. Current limits and next steps

Deliberate scope choices for this pass:

- **Local-first storage.** No auth, no multi-user roles; data is per-browser. The UI was built so a
  Lovable Cloud backend (Postgres + auth + server-side PDF) can be dropped in behind the same
  store actions without redesigning screens.
- **PDFs via browser print** rather than server rendering — the output matches the official
  Voltcare document.
- **WhatsApp via `wa.me` deep links**, not the WhatsApp Business API.
- Photo uploads are kept as data URLs in localStorage, which caps out around a few MB — worth
  moving to object storage once a backend exists.
- The quotation-status picker on the customer profile offers `approved`, while the store's
  quotation status union uses `accepted`; that vocabulary should be reconciled.
- Customer-profile entry forms (visit log, expense, manual payment, photo caption/location editing)
  are still being finished — see `roadmap.md`.

---

## 8. Repo conventions

- `routeTree.gen.ts` is generated — never hand-edit it; a `FileRoutesByPath` type error means a
  route file is missing or misnamed, so create/rename the file.
- Every route owns its `head()` with a unique title/description; the root layout does not cover
  `index.tsx`.
- Shared layout lives in `__root.tsx` / `AppShell`, never in a duplicate `/_app` route.
- Keep `@import` rules at the top of `src/styles.css`; load web fonts with a `<link>` tag.
- Commits sync back to Lovable — don't rewrite published history (no force-push, rebase or amend of
  pushed commits). See the notice at the top of `AGENTS.md`.
