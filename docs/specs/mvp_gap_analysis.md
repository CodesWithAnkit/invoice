# MVP Gap Analysis — Current Codebase vs. Quotation Platform Specs

**Date:** 2026-09-25
**Branch audited:** `redesign_project` @ `240b7a3`
**Compared against:**
- [Product Requirements Document](<../project_document/Quotation & Project Estimation Platform — Product Requirements Document.md>) (PRD)
- [MVP Acceptance Criteria](<../project_document/MVP Acceptance Criteria.md>) (AC)
- [Design System Specification](<../project_document/Quotation & Project Estimation Platform — Design System Specification.md>) (DS)

Companion documents: [mvp_implementation_plan.md](mvp_implementation_plan.md), [spec_review.md](spec_review.md).

---

## 1. Summary

The codebase is a **single-tenant invoice/quote/proforma generator** with a finished, themed, responsive presentation layer. The specs describe a **multi-tenant quotation and project-estimation platform**. The UI shell carries over well. The data model, auth, authorization and quotation domain do not exist yet.

| Area | Verdict |
|---|---|
| Presentation layer (shell, theming, responsive, tokens) | **Largely reusable**. This is the strongest asset. |
| Authentication | **Not real.** A shared username/password is compiled into the browser bundle; a `localStorage` flag decides access. |
| Authorization / business isolation | **Absent.** There is no `business` concept; the browser reads and deletes rows directly with the public anon key. |
| Domain model (business, projects, services, quotations, scope, timeline, activity) | **Absent.** Only `customers`, `invoices`, `invoice_items`, `products` exist. |
| Calculation engine | **Partial.** A pure calculator exists, but it runs only in the client, the server trusts client totals, and discounts and pricing models are missing. |
| PDF | **Partial and conflicting.** Browser print is hard-capped to one A4 page with 15 items; the ACs require multi-page. |
| Public quote / client accept-reject | **Absent.** |
| Dashboard analytics | **Mock data only**, and invoice/payment-oriented. |
| Tests | **E2E exists but bypasses auth.** No unit-test runner; the ACs require unit tests. |

**AC coverage:** of the ~70 acceptance criteria, **0 are fully met** under the AC's own bar: "A visually complete screen without working persistence, validation, authorization, or error handling does **not** satisfy MVP acceptance" (AC §1). Roughly 15 are partially met, all in UI or calculation. The rest are missing.

---

## 2. Critical findings (fix before any feature work)

These are live issues in the current code, not just future gaps. Each one breaches an MVP release gate (AC §27) or a security AC (AC §23).

| # | Finding | Evidence | Breaches |
|---|---|---|---|
| C1 | **Login credentials ship to every browser.** `NEXT_PUBLIC_APP_USER` / `NEXT_PUBLIC_APP_PASS` are inlined into the client bundle at build time, so anyone can read them from the JS. | [useAuth.ts:18-27](../../src/hooks/useAuth.ts#L18-L27) | AC §23 "No secrets in frontend source"; Release gate 2 |
| C2 | **Auth can be bypassed with one line**: `localStorage.setItem('invoice_auth','true')`. The Playwright setup does exactly this. | [useAuth.ts:13-16](../../src/hooks/useAuth.ts#L13-L16), [tests/global.setup.ts](../../tests/global.setup.ts) | AC-AUTH-002/006; Release gate 2 |
| C3 | **The browser reads and deletes business data directly** with the anon key. The anon key is public by design, so without Row Level Security anyone can call the Supabase REST API to read or delete all invoices and customers, whether or not they are "logged in". **RLS status is unverified** (see §5). | [invoices/page.tsx:45,78-79](../../src/app/dashboard/invoices/page.tsx#L45), [customers/page.tsx:30-31](../../src/app/dashboard/customers/page.tsx#L30-L31), `invoices/[id]/{page,edit,copy}` | AGENTS.md backend rule; AC-AUTHZ-001/002; Release gate 1 |
| C4 | **All API routes are unauthenticated.** That includes `/api/templates/save`, which **commits to the GitHub repo using `GITHUB_TOKEN`**, and the Gemini routes (`/api/ai-*`, `/api/parse-invoice`, `/api/products/generate`, `/api/business-invoice`), which anyone can call at our API cost. | [templates/save/route.ts](../../src/app/api/templates/save/route.ts), `src/app/api/*` | AC §23; PRD §37 |
| C5 | **Save trusts client-supplied IDs and totals.** `upsert` uses the client's `invoiceData.id` (so any invoice can be overwritten) and stores the client's `subtotal/sgst/cgst/total` verbatim. | [invoices/save/route.ts:77-105](../../src/app/api/invoices/save/route.ts#L77-L105) | AC-CALC-004; PRD §37 "Never trust client-side totals"; Release gate 3 |
| C6 | **The PDF storage bucket is public**, and file names are derived from customer name and number, so they are guessable. | [invoices/save/route.ts:49-74](../../src/app/api/invoices/save/route.ts#L49-L74) | AC-PUBLIC-003 spirit; AC §23 |

C1, C2 and C4 can be fixed without any product decision (see Plan, Phase 0).

---

## 3. Functional defects in the existing UI

These are bugs today, found during the audit.

| # | Defect | Evidence |
|---|---|---|
| D1 | Every "Save to dashboard" **inserts a new customer row**, because the toolbar never sends a customer `id`. Repeated saves create duplicate customers. | [InvoiceToolbar.tsx:24-32](../../src/components/invoice/InvoiceToolbar.tsx#L24-L32) + [save/route.ts:30-47](../../src/app/api/invoices/save/route.ts#L30-L47) |
| D2 | The customer list shows **real** Supabase rows, but the detail page looks the ID up in **mock** data, so every real customer opens to "Customer Not Found". | [customers/[id]/page.tsx:22](../../src/app/dashboard/customers/%5Bid%5D/page.tsx#L22) |
| D3 | The customer list shows **phone in the email column** and treats "has `pdf_url`" as "settled" (payment semantics the PRD removes). | [customers/page.tsx:39-55](../../src/app/dashboard/customers/page.tsx#L39-L55) |
| D4 | The products page hardcodes a `$` prefix, although the product is INR-first. | [products/page.tsx](../../src/app/dashboard/products/page.tsx) |
| D5 | Invoice `delete` removes items and then the invoice as two client calls, with no transaction and no error check on the first call. | [invoices/page.tsx:78-79](../../src/app/dashboard/invoices/page.tsx#L78-L79) |
| D6 | `InvoiceItemSchema` requires `quantity ≥ 1`, which would reject 0.5 hours. The schema is currently **not used anywhere**, so there is no server validation. | [invoice.schema.ts:5](../../src/modules/invoice/invoice.schema.ts#L5) |
| D7 | `CLAUDE.md` points to `AGENTS.md`, but git tracks the file as lowercase `agents.md`. This only works on case-insensitive filesystems (macOS), not in Linux CI. | `git ls-files` |
| D8 | `progress_tracker.md` and a code comment reference `context/redesign_implementation_plan.md`; the file actually lives at `docs/specs/`. | [progress_tracker.md](../progress_tracker.md) |

---

## 4. Acceptance-criteria matrix

Legend: ✅ Done · 🟡 Partial (usable foundation, not AC-compliant) · ❌ Missing · ⚠️ Conflicts with existing code or rules

### 4.1 Authentication (AC §2)

| AC | Status | Current state | Reuse / notes |
|---|---|---|---|
| AUTH-001 Registration | ❌ | No sign-up. | — |
| AUTH-002 Login | ⚠️ | A single shared credential checked in the browser (C1). Error shown via toast. | Login page layout can be reskinned. |
| AUTH-003 Session persistence | 🟡 | The `localStorage` flag survives refresh, but it is not a session. | Replace with Supabase session cookies. |
| AUTH-004 Logout | 🟡 | Clears the flag; there was never a server session to invalidate. | `signOut` wiring in `useAuth` is reusable. |
| AUTH-005 Password recovery | ❌ | — | — |
| AUTH-006 Protected routes | ⚠️ | A client-only `AuthGuard` wraps the whole root layout; there is no server/proxy check. Routes live under `/dashboard/*` and the editor at `/`, not at the spec's paths. | [AuthGuard.tsx](../../src/components/auth/AuthGuard.tsx), [layout.tsx](../../src/app/layout.tsx). Path mismatch → [spec_review.md](spec_review.md) R-01. |

### 4.2 Authorization (AC §3)

| AC | Status | Current state |
|---|---|---|
| AUTHZ-001 Business isolation | ❌ | No `business` table or `business_id` column; every query is unscoped. |
| AUTHZ-002 Direct API access | ❌ | Any ID works; the browser can bypass the API entirely (C3). |
| AUTHZ-003 Ownership on create | ❌ | No ownership fields exist. |

### 4.3 Business setup (AC §4)

| AC | Status | Current state | Reuse |
|---|---|---|---|
| BIZ-001 Business creation | ❌ | Business name, address, phone and GSTIN are typed **per invoice** in the editor and copied onto each `invoices` row. | [form/BusinessDetails.tsx](../../src/components/form/BusinessDetails.tsx) field layout |
| BIZ-002 Persistence | ❌ | Only the `localStorage` draft. | — |
| BIZ-003 Default quotation settings | ❌ | The Settings page has a sub-nav shell; only Appearance works. | [settings/page.tsx](../../src/app/dashboard/settings/page.tsx) shell |

### 4.4 Customers (AC §5)

| AC | Status | Current state |
|---|---|---|
| CUSTOMER-001 Create | ❌ | The button shows a "coming soon" toast. Customers are created only as a side effect of saving an invoice (D1). The schema lacks `email`, `notes` and a proper tax field (it has `aadhaar`); `company_name` exists. |
| CUSTOMER-002 List | 🟡 | Real data, client-side search; wrong columns (D3); no status; direct DB access (C3). |
| CUSTOMER-003 Detail | ⚠️ | Mock-only; broken for real records (D2). |
| CUSTOMER-004 Edit | ❌ | — |

### 4.5 Projects (AC §6)

| AC | Status |
|---|---|
| PROJECT-001 … 004 | ❌ No table, route, nav entry or UI. |

### 4.6 Catalog (AC §7)

| AC | Status | Current state |
|---|---|---|
| CATALOG-001 Create service | 🟡 | A `products` table with read-only `GET /api/products` (search, industry filter, limit 20). No create or edit UI. No pricing model, unit or active flag. |
| CATALOG-002 Pricing models | ❌ | Only `quantity × unitPrice`. |
| CATALOG-003 Reuse without rewriting history | 🟡 | [ProductSearchDropdown](../../src/components/form/ProductSearchDropdown.tsx) picks catalog items into the editor. `invoice_items` stores a **copy** of name and price (the right snapshot behaviour to keep). |

### 4.7 Estimate builder and calculation (AC §8–9)

| AC | Status | Current state |
|---|---|---|
| ESTIMATE-001 Create for project | ❌ | No projects. |
| ESTIMATE-002 Line items | 🟡 | [InvoiceItems.tsx](../../src/components/form/InvoiceItems.tsx): add, remove, edit qty and rate, product pick, bulk paste. **Hard limit of 15 items**, tied to the one-page PDF. |
| ESTIMATE-003/004/005/006 Fixed, hourly, quantity, daily | 🟡 | All reduce to `qty × rate`, which the calculator already does. The *pricing model* and *unit* concept is missing. |
| ESTIMATE-007 Percentage | ❌ | — |
| CALC-001 Subtotal | 🟡 | `calculateSubTotal` in [invoice.calculator.ts](../../src/modules/invoice/invoice.calculator.ts) is correct and rounds per line. Client-side only. |
| CALC-002 Discount | ❌ | — |
| CALC-003 Tax | 🟡 | A single `taxPercent`, always split into CGST/SGST. No tax name, and tax applies to the subtotal (no discount step). |
| CALC-004 Total consistency | ⚠️ | The server stores client totals (C5). Server-side item totals are `quantity * price` **without** `round2`, so they can differ from the UI. |
| CALC-005 Invalid values | 🟡 | A zod schema exists but is never called (D6). No NaN or Infinity guards. |

### 4.8 Scope and timeline (AC §10–11)

| AC | Status |
|---|---|
| SCOPE-001 … 006 | ❌ Only proforma-specific hardcoded T&C text exists. |
| TIMELINE-001 … 002 | ❌ |

### 4.9 Quotation (AC §12–13)

| AC | Status | Current state |
|---|---|---|
| QUOTE-001 Draft | 🟡 | A `localStorage` draft through the `useInvoice` singleton. No server-side draft. `meta.type = "quote"` exists. |
| QUOTE-002 Required data | ❌ | — |
| QUOTE-003 Unique number | ❌ | The number is typed freely; no uniqueness constraint or sequence. |
| QUOTE-004 Validity | ❌ | No `valid_until`. |
| QUOTE-005 Status | ❌ | No status column; the list derives a placeholder status from `pdf_url`. |
| PREVIEW-001 Complete preview | 🟡 | Business, customer, number, date, items, totals, bank and signature. Missing: project, validity, discount, scope, deliverables, timeline, assumptions, structured terms. |
| PREVIEW-002 Preview accuracy | 🟡 | The preview reads the same client singleton as the editor, not persisted data. |

### 4.10 PDF (AC §14)

| AC | Status | Current state |
|---|---|---|
| PDF-001 Generate | 🟡 | Browser `window.print()` → Save as PDF. Solid, well-tested ([invoice-pdf-export.spec.ts](../../tests/invoice-pdf-export.spec.ts)). |
| PDF-002 Completeness | 🟡 | See PREVIEW-001. |
| PDF-003 Accuracy | ⚠️ | Prints client state, not persisted totals. |
| PDF-004 Layout / multi-page | ⚠️ | **Designed as exactly one A4 page** (`zoom: 0.85`, 15-item cap, test asserts 1 page). Multi-page quotations with scope, timeline and terms need a different layout contract. AGENTS.md also forbids changing the export PDF without an explicit request → [spec_review.md](spec_review.md) R-15. |
| PDF-005 Branding | 🟡 | Name and contact yes; no logo; two templates (Classic, Modern). |

### 4.11 Public quote, client actions, activity (AC §15–18)

| AC | Status | Current state |
|---|---|---|
| PUBLIC-001 … 004 | ❌ | Only `/login` bypasses the guard. |
| CLIENT-001 … 006 | ❌ | — |
| ACTIVITY-001 … 003 | ❌ | [ActivityTimeline.tsx](../../src/components/ActivityTimeline.tsx) exists but is **unused**. The invoice detail "audit log" is derived from `created_at`/`updated_at`. |

### 4.12 Dashboard (AC §19)

| AC | Status | Current state |
|---|---|---|
| DASH-001 … 003 | ❌ | [overview/page.tsx](../../src/app/dashboard/overview/page.tsx) is 100% mock (`DummyDataBadge`), with invoice and revenue KPIs. `KpiCard` and `SparklineChart` are reusable. |
| DASH-004 Empty state | 🟡 | `EmptyState` component exists and is used on 5 pages. |

### 4.13 Cross-cutting quality (AC §20–25)

| AC | Status | Current state |
|---|---|---|
| §20 Loading / empty / error | 🟡 | Loading and empty exist on list pages; errors appear only as toasts, with no retryable error state. There is no `LoadingState`/`ErrorState` component. |
| RESP-001 … 003 | 🟡 | Good: `responsive.spec.ts` audits overflow per route and viewport; mobile bottom nav; mobile item cards. It must be extended to new routes. |
| §22 Accessibility | 🟡 | axe runs inside [theme-audit.ts](../../tests/utils/theme-audit.ts). Form labels were added. There is no keyboard or focus test suite. |
| §23 Security | ⚠️ | See C1–C6. |
| DATA-001 … 004 | 🟡 | Item name and price snapshotting exists; customer name is copied; totals are not reproducible server-side (C5). |
| §25 Testing | 🟡 | Playwright is configured (desktop + Pixel 5). **No unit-test runner** (the AC requires unit tests for all pricing models). Tests run against whichever Supabase project `.env` points to, and there is no isolated test database. |

---

## 5. Design system vs. DS spec

| DS item | Status | Notes |
|---|---|---|
| Semantic colour tokens (§5) | 🟡 | shadcn-style tokens exist (`background`, `card`, `muted`, `primary`, `success`, `warning`, `destructive`, …). The DS spec names a **different vocabulary** (`surface-*`, `text-primary`, `border-*`, `info`). **No `info` token**, which the DS needs for Sent/Viewed → [spec_review.md](spec_review.md) R-20. |
| Typography scale (§7) | ✅ | `display/h1/h2/h3/body/body-sm` in [tailwind.config.ts](../../tailwind.config.ts); Geist Sans and Mono. Missing `caption` and `label` steps. |
| Spacing, radius, shadow (§9–11) | 🟡 | Tailwind defaults plus a single `--radius`. Not formalized as a named scale. |
| Motion, reduced motion (§13) | ❌ | No `prefers-reduced-motion` handling in `globals.css`. |
| Primitives (§18, §63) | 🟡 | Present in `ui/`: button, input, select, badge, card, dialog, dropdown-menu, popover, sheet, table. **Missing:** textarea, checkbox, radio, switch, tooltip, tabs, label, avatar, separator. |
| Application components (§63) | 🟡 | `DataTable` (TanStack, with sorting and pagination), `FilterBar`, `SearchInput`, `EmptyState`, `ActivityTimeline`, `PageHeader` exist, **but `DataTable`, `FilterBar` and `ActivityTimeline` have zero call sites**. Pages hand-roll `<Table>`. **Missing:** FormField, Pagination (standalone), LoadingState, ErrorState. |
| StatusBadge / QuoteStatus (§6, §37) | 🟡 | [status-badge.tsx](../../src/components/ui/status-badge.tsx) is tone-based and reusable, but its map is payment-oriented (PAID, OVERDUE, FAILED PAYOUT) and maps SENT/VIEWED to neutral. No quotation or project status map. No icon. Colour is the only differentiator apart from the label. |
| Duplicate components (§59) | ⚠️ | `confirm-dialog.tsx` (popover) and `confirm-modal.tsx` (dialog) overlap. |
| Hardcoded colours (§59) | 🟡 | Few in app UI (for example inline hex in [InvoiceToolbar.tsx](../../src/components/invoice/InvoiceToolbar.tsx) template pills). Print templates intentionally hardcode colours; that is allowed. [constants/styles.ts](../../src/constants/styles.ts) holds a hardcoded `#ccc` input style. |
| Quotation components (§63) | ❌ | CurrencyInput, PercentageInput, QuantityInput, EstimateLineItem, EstimateBuilder, QuoteSummary, QuoteStatus, QuotePreview, Timeline, ScopeSection. [InvoiceLiveSummary.tsx](../../src/components/invoice/InvoiceLiveSummary.tsx) is the natural seed for `QuoteSummary`. |
| Navigation (§42) | ⚠️ | [config/navigation.ts](../../src/config/navigation.ts) is centralized (good), but it lists Invoices plus 10 disabled payment/accounting "modules" (Payments, Payroll, Treasury, …) that the PRD's non-goals exclude. |
| Visual regression (§56) | 🟡 | Page-level light/dark snapshots exist for Invoices only. There is no component-level harness (no Storybook or component test route). |
| Figma alignment (§49–50) | ❓ | No Figma file is referenced in the repo. [ui-registry.md](../../ui-registry.md) tracks patterns. |

---

## 6. Unknowns that block accurate assessment

| # | Unknown | Why it matters | How to resolve |
|---|---|---|---|
| U1 | **Is RLS enabled** on `customers`, `invoices`, `invoice_items`, `products`, and what policies exist? | It decides whether C3 is a theoretical or an actively exploitable data exposure. | Supabase dashboard → Authentication → Policies, or `select relname, relrowsecurity from pg_class where relname in (...)`. |
| U2 | Is the `invoice-pdfs` bucket public, and does it contain real client PDFs? | C6 severity. | Supabase Storage settings. |
| U3 | Does `.env` point at a production project that Playwright tests write to? | Test isolation; data pollution. | Confirm with the project owner. |
| U4 | What columns do `products` and `invoices` actually have (for example `industry`, `created_at`, `updated_at`, `bank_*`)? | No migrations exist in the repo; [architecture_context.md](../architecture_context.md) is out of date (for example it is missing `company_name` and the bank fields). | `supabase db dump --schema-only` into `supabase/migrations/0000_baseline.sql`. |
| U5 | Is there real production data (customers, invoices) that must survive the migration? | It decides between backfill and a clean start. | Product owner. |
