# Redesign Implementation Plan: "Northstar" Design System

Source: `invoice_design/` (25 PNG boards: foundations, tokens, components, 9 app
screens, mobile/tablet/dark variants, edge cases).

## Ground rule from the user

Only two things are real data today:
- **Invoice editor + PDF export/print** (`InvoiceEditor`, `InvoicePreview`, print pipeline) — works, keep functional.
- **Invoice list** (`/dashboard/invoices`) — reads from Supabase, keep dynamic.

Everything else in the new design (Dashboard Overview, Invoice Detail's audit log,
Customers, Products, Settings, sidebar "Automated Modules") has **no backend today**.
Per instructions: build it **static** (hardcoded/mock data, no Supabase calls) so the
UI matches the design 1:1, without inventing new backend features. This keeps scope
bounded — wiring these to real data is a separate, later phase.

---

## Phase 0 — Design tokens & foundations (touches everything, do first)

Current theme is shadcn default blue (`--primary: 221.2 83.2% 53.3%`). Design uses a
distinct token set ("Northstar"):

- **Colors** (from `02 — Color Tokens.png`): add as new CSS vars in `globals.css`,
  replacing current HSL palette:
  - Light: `bg-canvas #FAFAFA`, `bg-surface #FFFFFF`, `bg-card #F4F4F5`, `border-subtle #E4E4E7`, `text-primary`/`text-secondary #52525B`, `brand-accent #4F46E5`
  - Dark: `bg-canvas #09090B`, `bg-surface #121214`, `bg-card #18181B`, `border-subtle #27272A`, `brand-accent #6366F1`
  - Semantic: `state-success` (green), `state-warning` (amber), `state-danger` (red) — each with light/dark values from the board.
  - Map these onto the existing shadcn variable names (`--background`, `--card`, `--border`, `--primary`, etc.) so all shadcn/ui primitives (`button`, `badge`, `input`, `select`, `dialog`, `table`, `sheet`) restyle automatically without touching their code.
- **Typography** (`03 — Typography.png`): Geist Sans stays for UI; add **Geist Mono** for
  all numeric/tabular values (amounts, invoice IDs, dates in tables) via the `geist`
  npm package (`GeistMono` export) or `next/font`. Add a `font-mono` utility usage
  convention: every currency/number cell in tables and KPI cards gets `font-mono tabular-nums`.
  Scale: Display 48/800, H1 32/700, H2 24/600, H3 18/600, Body 14/400, Body Small 12/400 — encode as Tailwind `fontSize` extensions.
- **Spacing**: confirm existing Tailwind 4/8px scale already matches `sp-4…sp-64`; no change needed, just stop using arbitrary values.
- **Radius/borders**: card corner radius and `border-subtle` 1px — align `--radius`.

Deliverable: updated `globals.css` + `tailwind.config.ts`, no visual regression check needed yet (component-level QA happens per phase below).

---

## Phase 1 — App shell (Sidebar, TopNavbar, mobile nav)

Reference: `05 — Navigation/App Shell.png`, `12B — Mobile Dashboard.png`.

- **Sidebar** (`src/components/layout/Sidebar.tsx`): rebuild to match Northstar shell:
  - Logo block: compass icon + "NORTHSTAR" wordmark (static rename or configurable app name).
  - Section "PRIMARY OPERATING REGISTER": Overview, Invoices, Customers, Products — **real links**, wired to routes below.
  - Section "AUTOMATED MODULES (N active)": Payments, Expenses, Estimates, Reports, Subscriptions, Payroll, Tax Engine, Audit Log, Workflows, Treasury — these map to explicitly **out-of-scope** features (`project_overview.md`). Render as **static, visually-disabled nav items** (muted, `cursor-not-allowed`, no `href` or a disabled `<span>`) — do not create empty routes for them. Optionally a small "Coming soon" tooltip.
  - Footer: Help & System Status, System Settings (→ `/dashboard/settings`), workspace/org card ("Acme Corp / Administrator") — static, no auth-derived org data exists, so hardcode from a constant for now.
- **TopNavbar** (`TopNavbar.tsx`): replace current search-only bar with the design's pattern: small-caps eyebrow label + bold page title (left), search input styled `⌘K` hint (non-functional command palette — just visual, or keep existing search-invoices behavior if trivial to retain), bell icon (static, no notifications backend → no badge count, just icon), theme toggle (already exists, keep wiring to `ThemeProvider`).
  - Page title/eyebrow needs to be **page-aware** — introduce a small context/prop (e.g. each page passes `{eyebrow, title}` via existing `PageHeader` pattern or a new layout-level header slot) rather than hardcoding.
- **Mobile**: replace the current `Sheet`-based hamburger drawer with the design's **bottom tab bar** (`12B`) for the 5 primary routes, shown `< 768px`; keep sidebar hidden on mobile as today. Desktop/tablet sidebar behavior otherwise unchanged (tablet screen `12A` shows sidebar collapsed to icon-only — treat as a stretch goal, not required for v1 since no tablet-specific interaction was specified beyond visual).

---

## Phase 2 — Dashboard Overview (new page, fully static)

Reference: `06 — Dashboard.png`, `13A — Dark Dashboard.png`, `12A/12B` responsive.

Currently `/dashboard/invoices` doubles as "Dashboard" in the nav. Design separates
**Overview** (`/dashboard` or `/dashboard/overview`) from **Invoices** (`/dashboard/invoices`).

- New route `src/app/dashboard/overview/page.tsx` (or reuse `/dashboard` index) — **all static/mock data**:
  - 4 KPI cards (Total Revenue YTD, Outstanding Invoices, Paid This Period, Overdue Balance) with trend badges — hardcoded numbers, use `font-mono` for values.
  - "Revenue & Disbursement Trends" panel with Monthly/Weekly toggle — toggle can be functional (just swaps between two static datasets) but **no chart library exists**; render a lightweight static sparkline/bar visualization (inline SVG, no new dependency) or a placeholder box if a real chart isn't worth the scope — recommend inline SVG bar chart fed by a static array, since it's cheap and matches the visual better than an empty box.
  - "Invoice Resolution Status" panel (Reconciled/Awaiting/Failed %) — static.
  - "Recent Active Invoices" list — **static mock rows** matching the design's status badges (this is distinct from the real `/dashboard/invoices` Supabase list; do not fetch here per the "make static" instruction, since this widget has no defined data contract yet).
- Update Sidebar's "Invoices" and "Overview" links accordingly; update root redirect (`/dashboard` → overview) if one exists.

---

## Phase 3 — Invoices list restyle (keep dynamic, reskin only)

Reference: `07 — Invoices.png`.

- `src/app/dashboard/invoices/page.tsx`: **keep all Supabase logic as-is** (search, filter, sort, delete). Restyle to match:
  - Rename header to "Invoice Registry" / eyebrow "Billing Center".
  - Column layout: Client Ref/ID (name + invoice number stacked), Status (new badge taxonomy), Due Date, Amount (`font-mono`), Actions (View/Send buttons instead of current dropdown menu — or keep dropdown but restyle to match "View"/"Send" pattern; "Send" has no backend, so make it a static/disabled action or wire to a toast "Not yet available").
  - Add "Filters" and "Export list" buttons — **static/non-functional stubs** (or Filters can open existing filter controls in a popover; Export list has no implementation, disable it or show a "coming soon" toast) since no filter/export backend exists beyond current search+type+sort.
  - New status badge set (`DRAFT`, `SENT`, `VIEWED`, `RECONCILED`, `PARTIAL PAY`, `OVERDUE`, `CANCELLED`) replaces current ad-hoc `invoice_type` badge — needs a status→variant mapping component (see Phase 6 shared components). **Data note**: current schema only has `invoice_type`, not a lifecycle `status` field — either derive a placeholder status client-side (e.g. always "RECONCILED" or based on existing fields) or add the column later; for now keep it static/derived so no schema migration is required in this pass.

---

## Phase 4 — Invoice Detail restyle

Reference: `08 — Invoice Detail.png`.

- `src/app/dashboard/invoices/[id]/page.tsx`: restyle existing (real) invoice/customer/items/totals data into the new card layout (Issuer Profile / Client Profile two-column cards, itemized table, totals box, header actions Download PDF / Edit — both already implemented, just restyle).
- **Audit Log & Timeline** side panel — no audit backend exists. Build as **static mock timeline** (e.g. derive 1-2 generic entries from `created_at`/`updated_at` if available, otherwise fully hardcoded placeholder entries) — clearly out of scope to build real event tracking here.

---

## Phase 5 — Customers (new, fully static)

Reference: `09 — Customers.png`, `09B — Customer Detail.png`.

- Replace `src/app/dashboard/customers/page.tsx` "Coming Soon" with a static list page: search input (client-side filter over mock array), "Add Customer Record" button (disabled/toast stub), table (Entity/email, Ledger Count, Outstanding, Settled Volume YTD, Last Event) — mock data array colocated in the page or a `src/lib/mockData.ts`.
- New route `src/app/dashboard/customers/[id]/page.tsx`: profile card, Settled/Outstanding stat cards, Disbursement Ledger History table — all from the same mock dataset, linked by id.
- Note: real customer data already exists in Supabase (`customers` table, used by invoice save) — flag in the plan as a natural Phase 2 (post-static) follow-up to wire this list to real data, but per current instructions build it static first.

---

## Phase 6 — Products (new, fully static)

Reference: `10 — Products.png`.

- Replace `src/app/dashboard/products/page.tsx` placeholder with static list: filter tabs (All/Physical/Services/Digital — functional client-side filter over mock data), search input, table (Product/Service, SKU, Category, Tax Rate, Status badge, Rate/Price in `font-mono`), "Add Product / Service" button (disabled/stub).
- Note: `/api/products` and `/api/products/generate` routes already exist server-side — worth flagging that this page *could* be wired to them later, but keep static now per scope.

---

## Phase 7 — Settings (new, mostly static)

Reference: `11 — Settings.png`.

- Replace `src/app/dashboard/settings/page.tsx` placeholder with a two-column settings layout: left sub-nav (Company Profile, Invoice Customization, Tax Compliance Rails, Payment Gateways, Notifications & Alerts, Users & Permissions, Connected Integrations, Visual Appearance, API Configuration), right content panel.
- Only **"Visual Appearance"** is functionally real (it maps to the existing `ThemeProvider`): Dark/Light/System theme preset cards wired to `next-themes`, everything else on that panel (accent colorway picker, accessibility checkboxes, Discard/Apply buttons) is static/cosmetic — no persistence layer exists beyond theme, so don't fake persistence for the rest.
- All other sub-nav sections (Company Profile, Tax Compliance, etc.) render a static "Coming soon" placeholder (reuse existing `EmptyState` component) when selected — same pattern as today's placeholder pages, just nested inside the new sub-nav shell instead of being the whole page.

---

## Phase 8 — Shared components needed across phases

Build once, reuse everywhere (avoids duplicating badge/empty/skeleton logic per page):

1. **Status badge map** — `src/components/ui/status-badge.tsx`: maps a status string (`DRAFT|SENT|VIEWED|RECONCILED|PARTIAL PAY|OVERDUE|CANCELLED|ACTIVE|BACKORDERED|DEPRECATED|PAID|DUE|FAILED PAYOUT`) to color/variant, built on top of existing `Badge`.
2. **KPI Card** — small stat-card component (label, value in mono, trend badge, helper text) used by Dashboard Overview and Customer Detail.
3. **Empty/Loading states** (`14 — States/Edge Cases.png`): extend existing `EmptyState`; add a `Skeleton`/loading-row component for tables (currently list pages just show a "Loading..." text row — replace with the design's skeleton bars for a closer match, applied to Invoices list at minimum).
4. **Toast styling**: `sonner` is already wired in `AppLayout`; just confirm success/warning color mapping matches new tokens (no code change beyond token cascade from Phase 0).

---

## Explicitly not doing (per scope)

- No new Supabase tables/columns (e.g. no real `status` lifecycle, no audit log table, no payments/expenses backend).
- No chart library dependency — static/inline SVG only.
- No real notifications, command palette (`⌘K`), export, or "Send invoice" functionality — these render but are inert or show a stub toast.
- Tablet-specific icon-collapsed sidebar (`12A`) treated as stretch/optional, not required for v1.

---

## Suggested execution order

1. Phase 0 (tokens/fonts) — foundation, low risk, immediately visible everywhere.
2. Phase 1 (shell/nav) — second, since every other page lives inside it.
3. Phase 3 (Invoices list reskin) + Phase 4 (Invoice Detail reskin) — protects the one real dynamic feature early, keeps it in sync with the new shell.
4. Phase 2 (Dashboard Overview) — first fully-new static page, validates the "static" pattern (KPI card, mock data shape) reused by later phases.
5. Phase 5 (Customers), Phase 6 (Products) — same static pattern, parallelizable.
6. Phase 7 (Settings) — last, lowest interconnection risk.
7. Phase 8 components should actually be extracted opportunistically during Phase 2–3, not deferred — listed last here only for reference.

Each phase should get a quick visual diff against its reference PNG (light + dark) before moving on, plus updating `context/progress_tracker.md`.
