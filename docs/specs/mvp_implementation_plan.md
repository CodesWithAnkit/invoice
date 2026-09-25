# MVP Implementation Plan — Quotation & Project Estimation Platform

**Date:** 2026-09-25
**Inputs:** [mvp_gap_analysis.md](mvp_gap_analysis.md) (where we are) · [spec_review.md](spec_review.md) (open decisions `R-xx`) · the three specs in [docs/project_document/](../project_document/)
**Follows:** PRD §43 build order and PRD §49 "auth and ownership before features", adjusted for the actual codebase.

---

## 1. Principles for this plan

1. **Security first, because the current exposure is live.** Phase 0 fixes C1–C6 from the gap analysis before any feature work.
2. **Ownership before features.** No domain table ships without `business_id`, RLS and handler-level checks (PRD §49).
3. **Extend, don't rebuild** (AGENTS.md). The shell, theme, `DataTable`, `EmptyState`, `StatusBadge`, `KpiCard`, the calculator pattern and the print pipeline are all reused.
4. **The invoice product stays working** (recommended R-00 (b)). Quotation is a new domain beside it. The invoice PDF is never modified.
5. **The server is the source of truth** for totals, status and numbering. The client calculator is only a preview of the same shared module.
6. **Every phase ends green**: `npm run build`, lint, unit, Playwright (desktop + mobile), axe, and responsive audit.

Sizes are relative (S ≈ a few days, M ≈ ~1 week, L ≈ 2+ weeks for one engineer). They are not commitments.

---

## 2. Target architecture

### 2.1 Layers

```text
Browser (client components)
   │  fetch JSON only, never Supabase tables directly
   ▼
Route handlers  src/app/api/<domain>/...           ← auth + zod validation + ownership
   │
   ▼
Domain modules  src/modules/<domain>/{schema,types,service,calculator}.ts
   │  (service = server-only data access; calculator = pure, shared with client preview)
   ▼
Supabase (per-request server client with user's session → RLS as second wall)
```

### 2.2 New and changed infrastructure

| Item | Location | Why |
|---|---|---|
| Supabase SSR clients | `src/lib/supabase/{server,browser,admin}.ts` (replaces root [lib/supabase.ts](../../lib/supabase.ts)) | Cookie sessions (R-22); `admin` = service role, server-only, used only for public-token lookups. |
| Route protection | `src/proxy.ts` (Next 16 name for middleware) | Server-side redirect for protected routes (AC-AUTH-006). |
| API helpers | `src/lib/api/{respond,auth,validate}.ts` | `ok(data)` / `fail(msg, status)` matching AGENTS.md `{ success, data }` / `{ error }`; `requireBusiness()` returns `{ user, businessId }` from the session, never from the request body (AC-AUTHZ-003). |
| Migrations | `supabase/migrations/*.sql` via Supabase CLI | There are no migrations today (gap analysis U4). A baseline dump comes first. |
| Unit tests | Vitest, `src/**/*.test.ts` | AC §25 (R-28). |
| Test DB | local Supabase via `supabase start`, seeded | R-29. Tests never touch the real project. |

**New dependencies:** `@supabase/ssr` (runtime), `vitest` (dev), `supabase` CLI (dev). Each is justified above, as AGENTS.md requires for new patterns.

### 2.3 Data model (MVP)

```text
businesses        id, owner_user_id (unique, MVP 1:1), name, logo_path, email, phone, address, website,
                  tax_id, currency, timezone, default_validity_days, default_terms, default_notes,
                  default_tax_name, default_tax_rate, quote_prefix, allow_client_pdf_download
customers         id, business_id, name*, company, email, phone, address, tax_id, notes, status(active|archived)
services          id, business_id, kind(product|service), name*, description, pricing_model(fixed|hourly|daily|quantity|percentage),
                  default_rate, unit, tax_rate(stored, unused in MVP R-05), is_active
projects          id, business_id, customer_id → customers (same business, enforced), name*, description,
                  start_date, expected_end_date, status, notes
quotations        id, business_id, project_id, customer_id, quote_number (unique per business, null while draft),
                  title, issue_date, valid_until, currency, status, current_version,
                  discount_type(none|fixed|percent), discount_value, tax_name, tax_rate,
                  subtotal, discount_amount, taxable_amount, tax_amount, total,   ← server-computed only
                  notes (client-visible), internal_notes, terms (jsonb sections), public_token (unique, random), created_at, updated_at
quotation_items   id, quotation_id, position, service_id (nullable), name, description, pricing_model, quantity, unit, rate, percent, amount
quotation_scope   quotation_id (1:1): overview, deliverables[], included[], excluded[], assumptions[], revision_policy
quotation_milestones id, quotation_id, position, name, description, start_label, end_label
quotation_versions   id, quotation_id, version, snapshot jsonb (business+customer+project+items+scope+timeline+totals), sent_at
quotation_activity   id, quotation_id, business_id, type, actor(owner|client|system), version, payload jsonb, created_at  ← insert-only
quote_number_counters business_id, year, next_value   ← numbering at send time (R-13)
```

- RLS on every table: `business_id in (select id from businesses where owner_user_id = auth.uid())`. Written as one SQL helper so teams can be added later (PRD §11).
- `quotation_activity` and `quotation_versions` have **no update or delete policies** (AC-ACTIVITY-003, AC-DATA-003).
- There are no public RLS policies. Public access goes only through `/api/public/*` using the admin client plus an explicit allow-list DTO (AC-PUBLIC-004).

---

## 3. Phases

### Phase 0 — Stabilize and decide · **S–M** · no user-visible features

**0a. Security hotfixes (no product decision needed, do immediately)**

| Task | Closes |
|---|---|
| Stop shipping credentials: move the shared-credential check into a server route that sets an httpOnly cookie, and delete `NEXT_PUBLIC_APP_*`. This is a stop-gap until Phase 1. Rotate the credential. | C1, C2 |
| Add a shared guard to every existing `/api/*` route (the same cookie for now). **Disable `/api/templates/save`** and the AI "persist to GitHub" path, or put them behind an explicit admin flag. | C4 |
| Resolve U1/U2 (RLS, bucket). If RLS is off, **enable deny-all RLS** once 0b moves the reads server-side. Make `invoice-pdfs` private (signed URLs). | C3, C6 |
| Move the browser's direct Supabase calls (invoices list/detail/edit/copy/delete, customers list) behind route handlers. | C3, AGENTS.md rule |
| Save route: ignore client totals and recompute with the calculator; verify the `id` exists before upsert; send `customer.id` (fixes D1). | C5, D1 |
| `git mv agents.md AGENTS.md` (D7); fix the stale `context/` path (D8). | D7, D8 |

**0b. Foundations**

- Record decisions **R-00, R-01, R-22** in the [spec_review.md](spec_review.md) decision log. Update AGENTS.md rules per R-02.
- Supabase CLI: `supabase/migrations/0000_baseline.sql` from the current schema dump (U4). Local `supabase start` for dev and test.
- Add Vitest; `npm run test:unit`. Add `src/lib/api/*` helpers and `src/lib/supabase/*` clients.
- CI ([.github/workflows/playwright.yml](../../.github/workflows/playwright.yml)): build + lint + unit + e2e against local Supabase.

**Exit:** C1–C6 closed, the browser has no direct table access, tests run against the local DB, and the three blocking decisions are recorded.

---

### Phase 1 — Authentication · **M** · PRD Phase 1

| Task | Reuse / notes |
|---|---|
| Supabase Auth + `@supabase/ssr`; `src/proxy.ts` protects `/dashboard/**` and `/` and allows `/login`, `/register`, `/forgot-password`, `/reset-password`, `/q/**` (R-01). | Replace the [useAuth.ts](../../src/hooks/useAuth.ts) internals and keep its `{ checked, authed, signOut }` shape so the layout components keep working. |
| Pages: register (name, email, password, confirm), login, forgot, reset. States: loading, invalid, unverified, network (PRD §8). Generic "if an account exists…" copy (AC-AUTH-005). | Build `FormField`, `PasswordInput` and `Alert` now (DS §65 "Authentication" list). |
| `AuthGuard` becomes a thin client helper; the real gate is `proxy.ts` plus handler checks. | [AuthGuard.tsx](../../src/components/auth/AuthGuard.tsx) |
| Supabase settings: email confirmation on, password policy (R-23), auth rate limits. | |
| Playwright `global.setup.ts` logs in a **seeded test user** instead of setting `localStorage`. | [tests/global.setup.ts](../../tests/global.setup.ts) |

**Tests:** API/integration tests for register, login, logout and protected routes; E2E for "logged-out user hitting `/dashboard/overview` is redirected". Remove `invoice_auth` everywhere.
**Closes:** AC-AUTH-001…006, AC §23 (credentials, localStorage).
**Exit (PRD):** a user can register, sign in, refresh, sign out, and reach only authenticated areas.

---

### Phase 2 — Business onboarding and settings · **M** · PRD Phase 2

| Task | Reuse / notes |
|---|---|
| Migration: `businesses` + RLS helper + ownership backfill of the legacy tables (R-26). | |
| Onboarding step after the first login when no business exists: name (required), then optional fields with skip (PRD §13). | Field layout from [form/BusinessDetails.tsx](../../src/components/form/BusinessDetails.tsx). |
| Settings sections: **Business** (profile, logo upload to a private bucket) and **Quotation** (currency, timezone, validity days, tax default, terms, notes, prefix, client PDF download toggle R-27). | Existing sub-nav shell in [settings/page.tsx](../../src/app/dashboard/settings/page.tsx). Appearance already works. |
| `GET/PATCH /api/business`. `requireBusiness()` used by all later handlers. | |

**Tests:** settings persist across refresh and re-login (AC-BIZ-002); user B cannot read A's business.
**Closes:** AC-BIZ-001…003, AC-AUTHZ-001 foundation.

---

### Phase 3 — Core data: customers, catalog, projects · **L** · PRD Phase 3

**Navigation first.** Update [config/navigation.ts](../../src/config/navigation.ts) to: Overview, Customers, Projects, Quotations, Products & Services, Settings. Remove the 10 disabled payment/accounting modules. Move Invoices under a secondary "Legacy" group (R-00). Hide Templates (R-03).

| Feature | Tasks | Reuse |
|---|---|---|
| **Customers** | Migration (add `email`, `notes`, `tax_id`, `status`, `business_id`; map `aadhaar`→`tax_id` as decided). `/api/customers` CRUD + archive; server-side search and sort. List (fix D3), create/edit dialog or page, detail with real data (fix D2) and tabs for Projects / Quotations / Activity. | `DataTable` + `FilterBar` + `SearchInput` (they exist but are unused; adopt them here). `CustomerHeader` pattern (DS §38). |
| **Catalog** | Migrate `products` → `services` (`kind`, `pricing_model`, `unit`, `default_rate`, `is_active`, `business_id`). `/api/services` CRUD + deactivate (no hard delete, R-19). Page tabs: Products / Services. Currency formatting from business settings (fixes D4). | [products/page.tsx](../../src/app/dashboard/products/page.tsx) layout; the `ProductSearchDropdown` query moves to `/api/services`. |
| **Projects** | `projects` table. `/api/projects` CRUD; the customer must belong to the same business (AC-PROJECT-002, checked in the handler **and** by an FK + RLS check). List with search, status and customer filters, and sort. Detail with `ProjectHeader` and tabs Overview / Quotations / Activity. Derived status per R-18. | `StatusBadge` gets `project` and `quotation` maps plus an `info` tone (R-20). |

**Design-system work that lands here:** `Textarea`, `Tabs`, `Label`, `FormField`, `LoadingState`, `ErrorState` (with retry), and consolidation of `confirm-dialog`/`confirm-modal` (DS §59).
**Tests:** AC §25 integration (customer and project creation, authz A↔B = **E2E-005**), responsive and axe on the new routes.
**Closes:** AC-CUSTOMER-*, AC-PROJECT-*, AC-CATALOG-001/003, AC-AUTHZ-002/003, AC-DATA-001.

---

### Phase 4 — Estimate builder · **L** · PRD Phase 4 · **needs R-04, R-05, R-07, R-08, R-09**

| Task | Notes |
|---|---|
| **`src/modules/quotation/quotation.calculator.ts`**: a pure function `(items, discount, tax) → { lines[], subtotal, discountAmount, taxable, tax, total }` implementing R-04/R-07/R-08. Used by the server when saving and by the client as a live preview. | The pattern mirrors [invoice.calculator.ts](../../src/modules/invoice/invoice.calculator.ts), which stays unchanged. |
| **Vitest suite** for fixed, hourly, daily, quantity and percentage pricing, discount (fixed and %), tax, total, rounding edges and invalid values (NaN, ∞, negatives). Include the AC-CALC-003 example (₹1,00,000 → ₹1,06,200) and the PRD §21 example (₹4,24,800). | AC §25 unit list |
| `quotation.schema.ts` (zod) as the single validation source for the API and forms. | Fixes D6 for the new domain. |
| Migrations: `quotations`, `quotation_items`, `quotation_scope`, `quotation_milestones`. `/api/quotations` create/get/patch draft. **The server recomputes totals on every write** and ignores client totals. | AC-CALC-004 |
| UI: `CurrencyInput`, `PercentageInput`, `QuantityInput`, `EstimateLineItem` (desktop row / mobile card, DS §33–34), `EstimateBuilder`, `QuoteSummary` (seeded from [InvoiceLiveSummary.tsx](../../src/components/invoice/InvoiceLiveSummary.tsx)), `ScopeSection`, `Timeline/Milestone` editor. Entry point: "Create quotation" from the project detail page. | No 15-item limit (it is tied only to the invoice PDF). |
| Drafts auto-save to the server (debounced). `localStorage` is only a crash buffer, if kept at all. | AC-QUOTE-001 |

**Closes:** AC-ESTIMATE-*, AC-CALC-*, AC-SCOPE-*, AC-TIMELINE-001, AC-QUOTE-001, AC-CATALOG-002.
**Exit (PRD):** a complete quotation can be built accurately.

---

### Phase 5 — Quotation finalize, preview, PDF · **L** · PRD Phase 5 · **needs R-11, R-12, R-13, R-15, R-17**

| Task | Notes |
|---|---|
| Status machine in `quotation.service.ts`: one `transition(quotation, to, actor)` implementing the R-11 table. Every change writes a `quotation_activity` row. | AC-QUOTE-005, AC-ACTIVITY-001/002 |
| `POST /api/quotations/:id/send`: validate required data (AC-QUOTE-002, validity range AC-QUOTE-004), assign the number from `quote_number_counters` inside a transaction (Postgres function), write the `quotation_versions` snapshot, create `public_token` (≥128-bit random, base64url), set status Sent. | AC-QUOTE-003, R-03, R-21 |
| "Revise" on Sent/Viewed/Rejected/Expired → back to Draft with `current_version + 1`. The previous snapshot is untouched. | PRD §28 |
| Quotations list page (`QuotationTable` wrapping `DataTable`) and detail page (convert the invoice detail layout, per PRD §49 step 7) with activity timeline and status. | [invoices/[id]/page.tsx](../../src/app/dashboard/invoices/%5Bid%5D/page.tsx) layout; `ActivityTimeline` (existing, unused) |
| `QuotePreview`: renders **from the persisted snapshot or API response**, never recomputes (AC-PREVIEW-002). | |
| **Quotation print layout** (R-15 option a): a new `QuotationPrintLayout` with multi-page pagination, running header, `break-inside: avoid` on items and milestones, and logo. Separate from the invoice print CSS. | Mirror the approach in [invoice-print.css](../../src/styles/invoice-print.css) without editing it. |
| Duplicate quotation (R-03). | Copy-page pattern already exists for invoices. |

**Tests:** **E2E-002** (login → customer → project → estimate → save), **E2E-003** (PDF via `page.pdf()` + `pdf-parse-new`: multi-page, long names, totals match the API), and a unit test that the snapshot is immutable after a customer edit (AC-DATA-002).
**Closes:** AC-QUOTE-*, AC-PREVIEW-*, AC-PDF-*, AC-TIMELINE-002, AC-DATA-002…004.

---

### Phase 6 — Client workflow · **M** · PRD Phase 6 · **needs R-14, R-16, R-17, R-25**

| Task | Notes |
|---|---|
| Public route `/q/[token]` outside the authenticated layout, server-rendered and responsive. Shows business, project, scope, deliverables, timeline, cost and terms. Actions: Download PDF (if enabled), Accept, Reject. | AC-PUBLIC-*, AC-CLIENT-001…003 |
| `GET /api/public/quotations/:token`: admin client lookup by token → **allow-list DTO** (no ids, internal notes or audit data). | AC-PUBLIC-004 |
| View tracking per R-16. Lazy expiry per R-14. | |
| `POST …/accept` (name, optional comment) and `…/reject` (reason enum from PRD §32, comment). Both carry the version shown, and the server rejects stale versions and invalid states (AC-CLIENT-006). | Transactional status change + activity row. |
| Rate limit on `/api/public/*` (R-24). | |
| Owner side: status, acceptance timestamp and client response visible on the quotation detail page and the activity timeline. | |

**Tests:** **E2E-004** (generate link → open in a fresh unauthenticated context → accept → owner sees Accepted); integration tests for invalid token, expired, already accepted → reject refused, and archived.
**Closes:** AC-PUBLIC-*, AC-CLIENT-*, AC-ACTIVITY-*.

---

### Phase 7 — Dashboard · **S–M** · PRD Phase 7

- `GET /api/dashboard/summary`: one SQL function returning total, pending (Sent + Viewed), accepted count and value, quoted value, and counts per status. **Define and document** the acceptance-rate denominator: accepted / (accepted + rejected + expired).
- Rebuild [overview/page.tsx](../../src/app/dashboard/overview/page.tsx) with the existing `KpiCard`: KPIs, pipeline and recent quotations. Remove the mock data and `DummyDataBadge` usage. New-user empty state (AC-DASH-004). A monthly value chart is optional (R-03).
- Also retire mock data on the customer detail page (done in Phase 3); delete `src/lib/mockData.ts` once it has no importers.

**Closes:** AC-DASH-001…004.

---

### Phase 8 — Release hardening · **M**

- **E2E-001** (register → setup → dashboard) and the full **AC §28 success scenario** as a single Playwright test from a clean seeded database.
- Extend `responsive.spec.ts` and `theme-platform-audit.spec.ts` route lists to every new route, including `/q/[token]`.
- Component gallery route plus light/dark screenshot tests for the DS §56 priority components (R-30).
- Keyboard walkthrough of login, customer create, estimate builder and the public accept flow (AC §22).
- Run the `security-review` pass; walk through the **AC §27 release gate** checklist and record the results in `progress_tracker.md`.
- Docs sync: [architecture_context.md](../architecture_context.md) (new schema and layers), [ui_context.md](../ui_context.md) (token mapping R-20), [ui-registry.md](../../ui-registry.md).

---

## 4. Dependency view

```text
Phase 0a hotfixes ──► 0b foundations ──► 1 Auth ──► 2 Business ──► 3 Customers ─┐
                                                                  3 Catalog ───┼──► 4 Estimate ──► 5 Quotation ──► 6 Client ──► 7 Dashboard ──► 8 Release
                                                                  3 Projects ──┘
Design-system components are built inside the phase that first needs them (DS §65), not up front.
```

Within Phase 3, customers → projects is sequential (FK). Catalog can run in parallel.

## 5. Decisions needed, by phase

| Before phase | Decide |
|---|---|
| 0b | R-00 (invoice product fate), R-01 (URLs), R-22 (auth provider), plus gap-analysis U1–U5 |
| 2 | R-26 (legacy data ownership) |
| 3 | R-18 (project status derivation), R-19 (customer status and delete policy), R-20 (tokens) |
| 4 | R-04, R-05, R-07, R-08, R-09, R-10 |
| 5 | R-03 (MVP versioning and duplicate), R-11, R-12, R-13, R-15 |
| 6 | R-14, R-16, R-17, R-24, R-25, R-27 |

## 6. Risks

| Risk | Mitigation |
|---|---|
| Legacy invoice flows break during the migration to `business_id` + RLS. | Keep the invoice regression suite (`invoice-pdf-export`, `invoice-view`, `invoice-editor`) green in every phase; the backfill runs before RLS is enabled. |
| Money-rounding mismatch between preview and PDF. | A single calculator module, persisted totals rendered as-is, and E2E-003 asserting PDF total = API total. |
| Print-based "Download PDF" is not a real file on mobile browsers. | R-15 is flagged as a decision; option (b) remains open. |
| Scope creep from PRD V1/V2 items (templates, AI, analytics). | The AC §29 boundary is enforced in review; R-03 table. |
