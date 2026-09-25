# MVP Implementation Plan — Quotation & Project Estimation Platform

**Date:** 2026-09-25 (revised the same day with product-owner decisions R-00, R-01, R-04, R-08, R-15 and the phase order)
**Inputs:** [mvp_gap_analysis.md](mvp_gap_analysis.md) (where we are) · [spec_review.md](spec_review.md) (decisions `R-xx`) · the three specs in [docs/project_document/](../project_document/)

---

## 1. MVP scope and principles

**The MVP ships two products side by side:**

1. **Existing invoice/quote/proforma generator: kept as it is** (R-00). Same editor, templates, print/PDF, AI features and navigation entry. It receives only the Phase 0 security and ownership fixes; no functional or visual change.
2. **New quotation and project-estimation workflow**, per the PRD and MVP Acceptance Criteria.

**Principles**

1. **Security and ownership first.** The current exposure is live (gap analysis C1–C6). Nothing else starts until Phase 0 is done.
2. **Ownership before features.** No domain table ships without `business_id`, RLS and handler-level checks.
3. **Extend, don't rebuild** (AGENTS.md). Reuse the shell, theme, `DataTable`, `EmptyState`, `StatusBadge`, `KpiCard`, the calculator pattern and the print pipeline.
4. **URLs stay as they are** (R-01). The app lives under `/dashboard/*`, the invoice editor at `/`, and the public quote at `/public/quote/[token]`.
5. **Quotation PDF = one A4 page via browser print, like today** (R-15). Multi-page is deferred.
6. **The server is the source of truth** for totals, status and numbering. The client calculator is only a live preview of the same shared module.
7. **Every phase ends green**: `npm run build`, lint, unit, Playwright (desktop + mobile), axe, responsive audit, and the existing invoice regression tests unchanged. See the phase gate below.

### 1.1 Phase gate: backend and frontend E2E (mandatory)

**A phase is not complete, and the next phase must not start, until its end-to-end tests pass on both the backend and the frontend.**

| Layer | What must be covered | How |
|---|---|---|
| **Backend E2E** | Every API route the phase adds or changes, called over real HTTP against the running app and database: happy path, validation errors (400), unauthenticated (401), other business's resource (404), invalid state transitions. | Playwright API tests (`request` fixture), in `tests/api/**`. |
| **Frontend E2E** | Every user flow the phase adds or changes, driven through the browser: happy path, empty, loading, error and validation states, and redirects. Run on desktop **and** mobile projects, with axe checks on new pages. | Playwright UI tests, in `tests/**`. |
| **Regression** | All earlier phases' backend and frontend E2E suites, plus the unchanged invoice suites (AC-LEGACY-001). | Full `npm run test:e2e`. |

The gate is recorded in `progress_tracker.md` per phase with the test command, the date and the pass count. Tests must actually be executed; they cannot be claimed (AGENTS.md).

Sizes are relative (S ≈ a few days, M ≈ ~1 week, L ≈ 2+ weeks for one engineer). They are not commitments.

---

## 2. Target architecture

### 2.1 Layers

```text
Browser (client components)
   │  fetch JSON only, never Supabase tables directly
   ▼
Route handlers  src/app/api/<domain>/...           ← session + zod validation + ownership
   │
   ▼
Domain modules  src/modules/<domain>/{schema,types,service,calculator}.ts
   │  (service = server-only data access; calculator = pure, shared with client preview)
   ▼
Supabase (per-request server client with the user's session → RLS as second wall)
```

### 2.2 New and changed infrastructure

| Item | Location | Why |
|---|---|---|
| Supabase SSR clients | `src/lib/supabase/{server,browser,admin}.ts` (replaces root [lib/supabase.ts](../../lib/supabase.ts)) | Cookie sessions (R-22); `admin` = service role, server-only, used only for public-token lookups and migrations. |
| Route protection | `src/proxy.ts` (Next 16 name for middleware) | Server-side redirect for protected routes (AC-AUTH-006). |
| API helpers | `src/lib/api/{respond,auth,validate}.ts` | `ok(data)` / `fail(msg, status)` matching AGENTS.md `{ success, data }` / `{ error }`. `requireBusiness()` returns `{ user, businessId }` **from the session only**, never from the request (AC-AUTHZ-003). |
| Migrations | `supabase/migrations/*.sql` via Supabase CLI | No migrations exist today (gap analysis U4). A baseline dump comes first. |
| Unit tests | Vitest, `src/**/*.test.ts` | AC §25 (R-28). |
| Test DB | local Supabase via `supabase start`, seeded | R-29. Tests never touch the real project. |

**New dependencies:** `@supabase/ssr` (runtime), `vitest` (dev), `supabase` CLI (dev).

### 2.3 Data model (MVP)

All money columns are `bigint` **minor units** (suffix `_minor`, paise for INR) (R-08). All rates and percentages are `integer` **basis points** (suffix `_bp`; 18% = 1800, 12.5% = 1250). Quantities are `numeric(12,3)`, which allows 0.5 hours.

```text
businesses        id, owner_user_id (unique, MVP 1:1), name, logo_path, email, phone, address, website,
                  tax_id, currency, timezone, default_validity_days, default_terms, default_notes,
                  default_tax_name, default_tax_rate_bp, quote_prefix, allow_client_pdf_download
customers         id, business_id, name*, company, email, phone, address, tax_id, notes, status(active|archived)
services          id, business_id, kind(product|service), name*, description,
                  pricing_model(fixed|hourly|daily|quantity|percentage), default_rate_minor, default_percent_bp,
                  unit, tax_rate_bp (stored, unused in MVP, R-05), is_active
projects          id, business_id, customer_id → customers (same business, enforced), name*, description,
                  start_date, expected_end_date, status, notes
quotations        id, business_id, project_id, customer_id, quote_number (unique per business, null while draft),
                  title, issue_date, valid_until, currency, status, current_version,
                  discount_type(none|fixed|percent), discount_value_minor, discount_bp, tax_name, tax_rate_bp,
                  subtotal_minor, discount_minor, taxable_minor, tax_minor, total_minor,   ← server-computed only
                  notes (client-visible), internal_notes, terms (jsonb sections), public_token (unique, random),
                  created_at, updated_at
quotation_items   id, quotation_id, position, service_id (nullable), name, description, pricing_model,
                  quantity, unit, rate_minor, percent_bp, amount_minor
quotation_scope   quotation_id (1:1): overview, deliverables[], included[], excluded[], assumptions[], revision_policy
quotation_milestones id, quotation_id, position, name, description, start_label, end_label
quotation_versions   id, quotation_id, version, snapshot jsonb (business+customer+project+items+scope+timeline+totals), sent_at
quotation_activity   id, quotation_id, business_id, type, actor(owner|client|system), version, payload jsonb, created_at  ← insert-only
quote_number_counters business_id, year, next_value   ← numbering at send time (R-13)
```

- **Legacy tables** (`customers`, `invoices`, `invoice_items`, `products`) gain `business_id` in Phase 0. Their existing columns and float money are **left as they are** (R-00).
- RLS on every table: `business_id in (select id from businesses where owner_user_id = auth.uid())`. It is written as one SQL helper so teams can be added later (PRD §11).
- `quotation_activity` and `quotation_versions` have **no update or delete policies** (AC-ACTIVITY-003, AC-DATA-003).
- There are no public RLS policies. Public access goes only through `/api/public/*` using the admin client plus an explicit allow-list DTO (AC-PUBLIC-004).

### 2.4 Money and calculation rules (R-04, R-08)

The rules are implemented once in `src/modules/quotation/quotation.calculator.ts`, a pure function using **integer arithmetic only**. The server uses it on every write; the client uses it for live preview. Every value is a safe integer (`Number.isSafeInteger`), and quantities are converted to thousandths before multiplying.

**Rounding rule (the only one):** `roundHalfUp(numerator / denominator)` on non-negative integers. It is applied **only** at the boundaries marked ⓡ below.

```text
1. Line amount (non-percentage)   = ⓡ quantity × rate_minor
2. Base subtotal                  = Σ line amounts from step 1              (R-04)
3. Line amount (percentage)       = ⓡ base_subtotal × percent_bp / 10000   (never included in its own base)
4. Subtotal                       = Σ all line amounts (steps 1 + 3)
5. Discount                       = fixed: discount_value_minor
                                    percent: ⓡ subtotal × discount_bp / 10000
                                    must satisfy 0 ≤ discount ≤ subtotal     (R-07)
6. Taxable amount                 = subtotal − discount
7. Tax                            = ⓡ taxable × tax_rate_bp / 10000
8. Total                          = taxable + tax
```

**Reference checks (unit tests):**
- AC-CALC-003: subtotal 1,00,000.00 → discount 10,000.00 → taxable 90,000.00 → tax 18% 16,200.00 → **total 1,06,200.00** (`10620000` paise).
- PRD §21: 4,00,000.00 − 10% (40,000.00) → taxable 3,60,000.00 → tax 64,800.00 → **total 4,24,800.00**.
- AC-ESTIMATE-007: base 4,00,000.00, project management 10% → 40,000.00.

Formatting to rupees happens only at display time (`formatCurrency` from the business currency). No float money is ever persisted for quotations.

---

## 3. Phases

### Phase 0 — Security and ownership foundation · **M–L**

This phase fixes the live vulnerabilities and puts the ownership model under **all** existing data before any new feature is built.

> **Why real sign-in appears here, before Phase 1:** ownership and guards need a real user identity. Phase 0 therefore swaps the shared password for **Supabase email/password sign-in on the existing login screen** (one pre-created operator account). Phase 1 then adds the rest of the flows: registration, password reset, route protection polish and error states.

| Workstream | Tasks | Closes |
|---|---|---|
| **0.1 Fix security vulnerabilities** | Remove `NEXT_PUBLIC_APP_USER/PASS` and the `localStorage` flag; the login page calls Supabase `signInWithPassword` (cookie session through `@supabase/ssr`). Rotate the old shared password. **Disable `/api/templates/save`** and the AI "persist to GitHub" path (or put them behind an admin flag). Make the `invoice-pdfs` bucket private (signed URLs). Resolve gap-analysis U1–U3. | C1, C2, C4, C6 |
| **0.2 Establish User → Business ownership** | Supabase CLI plus a baseline migration (U4). Create the `businesses` table and the RLS helper. Add `business_id` to `customers`, `invoices`, `invoice_items` (via invoice), and `products`. Create the operator's business and **backfill all existing rows to it** (R-26). Then enable RLS on every table. | AC-AUTHZ-001 foundation |
| **0.3 Establish authorization guards** | `src/lib/api/auth.ts` → `requireUser()` / `requireBusiness()`. Wrap **every** existing `/api/*` route, including the AI routes. Unauthenticated → 401; not owned → 404 (do not leak existence). | C4, AC-AUTHZ-002 |
| **0.4 Validate API ownership** | Move all direct browser Supabase calls (invoices list/detail/edit/copy/delete, customers list) into route handlers that scope by `business_id`. Delete becomes one server-side operation (fixes D5). | C3, AGENTS.md backend rule |
| **0.5 Remove frontend trust of business/user IDs** | Handlers take `business_id` only from the session. `/api/invoices/save`: verify that a supplied `invoice.id` / `customer.id` belongs to the business before upsert; send `customer.id` from the toolbar (fixes D1); recompute totals server-side with the **existing** invoice calculator (output must equal today's; float rules unchanged per R-00). | C5, D1, AC-AUTHZ-003 |
| **0.6 Add security regression tests** | Add Vitest plus local Supabase test DB (R-28, R-29). Integration tests: unauthenticated → 401 on every `/api/*`; user A cannot read, update or delete user B's customers, invoices or products (**E2E-005**); a client-supplied `business_id`/`id` is ignored or rejected; the bundle contains no `APP_PASS`. Playwright `global.setup.ts` signs in a **seeded** user (drop the `invoice_auth` bypass). | AC §23, E2E-005 |
| Housekeeping | `git mv agents.md AGENTS.md` (D7); fix the stale `context/` path (D8); update AGENTS.md rules per R-02. | D7, D8 |

**Must stay unchanged:** the invoice editor, templates, and print/PDF output. `invoice-pdf-export.spec.ts`, `invoice-view.spec.ts` and `invoice-editor.spec.ts` must pass unmodified (apart from the login setup).
**Exit:** C1–C6 closed; no browser → table access; every API is session-guarded and business-scoped; security suite green in CI.

---

### Phase 1 — Authentication · **M** · ✅ implemented 2026-09-25 (started before Phase 0 at the product owner's request)

**As built:**
- Supabase Auth with `@supabase/ssr` cookie sessions. `src/lib/supabase/{browser,server}.ts`, route rules in `src/config/auth.ts`.
- `src/proxy.ts` refreshes the session and calls `getUser()` (so a revoked session fails immediately). Protected pages redirect to `/login?next=…`; **every non-public `/api/*` returns 401 JSON** without a session, which also closes gap-analysis C4 for anonymous callers. Signed-in users are sent away from the sign-in pages.
- Pages: `/login`, `/register`, `/forgot-password`, `/reset-password`, plus the `/auth/callback` route (PKCE `code` and `token_hash` links). `next` is same-origin only (open-redirect guard).
- **Sign-in, sign-up and reset run from the browser client**, not through our API routes. Supabase rate-limits auth per client IP; routing through our server would make every user share the server's IP and limit. Auth calls are not database mutations, so the AGENTS.md mutation rule is unaffected.
- Shared UI: `Alert`, `FormField`, `PasswordInput`, `AuthShell`; `Input` shows a red border when `aria-invalid`.
- `NEXT_PUBLIC_APP_USER/PASS` and the `invoice_auth` localStorage flag are gone from the code (closes C1, C2).
- Test infrastructure: local Supabase (`supabase/config.toml`, baseline migration of the legacy schema, Mailpit for emails); Playwright runs the app on port 3100 against it (`.next-e2e` build folder) with a separate `api` project for backend E2E.

**Phase gate (2026-09-25):** backend E2E `tests/api/auth.spec.ts` + frontend E2E `tests/auth.spec.ts` (desktop + mobile): **64/64 passed**. Full regression `npm run test:e2e`: 218 passed, 20 skipped (pre-existing `test.skip` in the responsive audit), and 4 failed only because the Invoices visual-snapshot baselines had never been committed; they pass on re-run. `next build` passes.

**Remaining Phase 1 follow-ups:** apply the hosted-project settings (redirect URLs, minimum password length 8, custom SMTP); see progress_tracker.md.

| Task | Reuse / notes |
|---|---|
| Registration (name, email, password, confirm), forgot password, reset password. Email confirmation on; password policy (R-23); Supabase auth rate limits. Generic "if an account exists…" copy (AC-AUTH-005). | Build `FormField`, `PasswordInput` and `Alert` now (DS §65). |
| `src/proxy.ts` protects `/` and `/dashboard/**`; allows `/login`, `/register`, `/forgot-password`, `/reset-password`, `/public/**`. Signed-in users are sent away from auth pages. | [AuthGuard.tsx](../../src/components/auth/AuthGuard.tsx) becomes a thin client helper. |
| Login states: loading, invalid credentials, unverified, network error (PRD §8). Session expiry → redirect with message. | Existing login page layout. |
| Logout invalidates the session server-side. | `useAuth` keeps its `{ checked, authed, signOut }` shape. |

**Tests:** register, login, logout (the API is rejected afterwards), refresh keeps the session, protected-route redirects, and the reset flow.
**Closes:** AC-AUTH-001…006.

---

### Phase 2 — Business onboarding · **S–M**

| Task | Notes |
|---|---|
| After the first sign-in with no business: onboarding step with business name (required), then optional logo, email, phone, address, website, tax ID and currency, with Skip (PRD §13). | Field layout from [form/BusinessDetails.tsx](../../src/components/form/BusinessDetails.tsx). |
| `GET/PATCH /api/business`; logo upload to a private bucket. | Signing up creates exactly one business (MVP 1:1). |

**Tests:** **E2E-001** (register → business setup → dashboard); persists across refresh and re-login (AC-BIZ-002).
**Closes:** AC-BIZ-001, AC-BIZ-002.

---

### Phase 3 — Existing customers, products and settings on business data · **L**

| Feature | Tasks | Reuse |
|---|---|---|
| **Customers** | Migration: add `email`, `notes`, `tax_id`, `status` (keep `aadhaar` and `company_name` for the invoice feature). `/api/customers` CRUD + archive; server-side search and sort. Fix the list columns (D3); create/edit form; **detail page on real data** (fixes D2). | `DataTable` + `FilterBar` + `SearchInput` (they exist but are unused; adopt them here); `CustomerHeader` (DS §38). |
| **Products & Services** | Extend `products` (or add `services`) with `kind`, `pricing_model`, `unit`, `default_rate_minor`, `default_percent_bp`, `is_active`. `/api/services` CRUD + deactivate (no hard delete, R-19). Tabs: Products / Services. Currency from business settings (fixes D4). The invoice editor's `ProductSearchDropdown` keeps working. | [products/page.tsx](../../src/app/dashboard/products/page.tsx) |
| **Settings** | Wire the **Business** section (profile, logo) and the **Quotation** section (currency, timezone, validity days, tax name and rate, default terms and notes, number prefix, client PDF download toggle R-27). Appearance already works. | [settings/page.tsx](../../src/app/dashboard/settings/page.tsx) sub-nav shell |
| **Navigation** | Add Projects and Quotations. **Invoices stays** (R-00). Remove the 10 disabled payment/accounting "modules" that the PRD excludes. Hide Templates (R-03). | [config/navigation.ts](../../src/config/navigation.ts) |

**Design-system work:** `Textarea`, `Tabs`, `Label`, `FormField`, `LoadingState`, `ErrorState` (retry); merge `confirm-dialog`/`confirm-modal`; `StatusBadge` gets an `info` tone plus `quotation` and `project` maps (R-20).
**Closes:** AC-CUSTOMER-*, AC-CATALOG-001/003, AC-BIZ-003, AC-DATA-001.

---

### Phase 4 — Projects · **M**

| Task | Notes |
|---|---|
| `projects` table; `/api/projects` CRUD + archive. The customer must belong to the same business (handler check + RLS). | AC-PROJECT-002 |
| `/dashboard/projects`: list with search, status filter, customer filter, sort. Detail with `ProjectHeader` and tabs Overview / Quotations / Activity. "New project" is also available from the customer detail page. | DS §39 |
| Status: Draft, Completed and Archived are set manually; Estimating, Quoted, Accepted, Rejected and Expired are **derived** from the latest quotation (R-18). The server rejects arbitrary values. | AC-PROJECT-004 |

**Tests:** CRUD, cross-business customer reference rejected, filters, responsive, axe.
**Closes:** AC-PROJECT-001…004.

---

### Phase 5 — Estimate builder · **L** · needs R-05, R-07, R-09, R-10, R-15a

| Task | Notes |
|---|---|
| `quotation.calculator.ts` per §2.4, plus a **Vitest suite**: fixed, hourly, daily, quantity, percentage, discount (fixed and %), tax, total, rounding ties, and invalid values (negatives, NaN, ∞, non-integer minor units, discount > subtotal). | AC-ESTIMATE-003…007, AC-CALC-*, AC §25 unit list |
| `quotation.schema.ts` (zod) is the single validation source for the API and forms. | AC-CALC-005 |
| Migrations: `quotations`, `quotation_items`, `quotation_scope`, `quotation_milestones`. `/api/quotations` create/get/patch draft. **The server recomputes totals on every write** and ignores client totals. | AC-CALC-004 |
| UI: `CurrencyInput` (rupees in, paise stored), `PercentageInput`, `QuantityInput`, `EstimateLineItem` (desktop row / mobile card), `EstimateBuilder`, `QuoteSummary` (seeded from [InvoiceLiveSummary.tsx](../../src/components/invoice/InvoiceLiveSummary.tsx)), `ScopeSection`, milestone editor. Entry point: "Create quotation" on the project page. | DS §31–35 |
| **One-page content caps** (R-15a): the builder enforces the item, scope and milestone limits decided in R-15a, with live "fits on one page" feedback. | |
| Drafts auto-save to the server (debounced). | AC-QUOTE-001 |

**Closes:** AC-ESTIMATE-*, AC-CALC-*, AC-SCOPE-*, AC-TIMELINE-001, AC-QUOTE-001, AC-CATALOG-002.

---

### Phase 6 — Quotation · **L** · needs R-11, R-12, R-13, R-15a, R-17

| Task | Notes |
|---|---|
| Status machine in `quotation.service.ts` implementing the R-11 table; every change writes a `quotation_activity` row. | AC-QUOTE-005, AC-ACTIVITY-001/002 |
| `POST /api/quotations/:id/send`: validate required data and validity range; assign the number from `quote_number_counters` in a transaction; write the `quotation_versions` snapshot; create `public_token` (≥128-bit random); status → Sent. | AC-QUOTE-002…004, R-03, R-21 |
| Revise (→ Draft, version + 1) and duplicate quotation. | PRD §28, §35 |
| `/dashboard/quotations` list (`QuotationTable` wrapping `DataTable`) and detail page (reusing the invoice detail layout) with activity timeline. | `ActivityTimeline` (existing, unused) |
| `QuotePreview` renders persisted data and never recomputes. | AC-PREVIEW-002 |
| **Quotation print layout: one A4 page via browser print, like today** (R-15). A new `QuotationPrintLayout` in the same visual family as the Classic/Modern templates, with a separate stylesheet. **The invoice print files are not edited.** | AC-PDF-001…003, 005 |
| Playwright one-page guard for quotations, modelled on [invoice-pdf-export.spec.ts](../../tests/invoice-pdf-export.spec.ts): fill to the R-15a caps with long names, generate `page.pdf()`, assert **exactly 1 page**, and assert that the PDF total equals the API total. | E2E-003, AC-PDF-003 |

**Closes:** AC-QUOTE-*, AC-PREVIEW-*, AC-PDF-001…003/005, AC-TIMELINE-002, AC-DATA-002…004, **E2E-002**.
**Exit:** a professional one-page quotation can be generated and downloaded.

---

### Later phases (after the ordered sequence above)

These are still required for MVP acceptance (AC §1 and §28), but come after Quotation in the agreed order.

**Phase 7 — Client workflow · M** (R-14, R-16, R-17, R-24, R-25, R-27)
Public page `/public/quote/[token]` outside the dashboard layout; allow-list DTO API; view tracking; lazy expiry; accept (name, comment) and reject (reason, comment) with stale-version protection; rate limit on `/api/public/*`; owner sees the response on the detail page and activity timeline. Tests: **E2E-004**, plus invalid, expired, already-accepted and archived tokens. Closes AC-PUBLIC-*, AC-CLIENT-*, AC-ACTIVITY-*.

**Phase 8 — Dashboard · S–M**
One SQL function for the KPIs (total, pending = Sent + Viewed, accepted count and value, quoted value, per-status counts). Acceptance rate = accepted / (accepted + rejected + expired), documented. Rebuild the overview page with `KpiCard`, remove the mock data, and add a new-user empty state. Closes AC-DASH-001…004.

**Phase 9 — Release hardening · M**
Full AC §28 success scenario as one Playwright test; extend the responsive and theme audits to all new routes; component gallery screenshots (R-30); keyboard walkthroughs; `security-review` pass; AC §27 release-gate checklist recorded in `progress_tracker.md`; docs sync (architecture_context, ui_context, ui-registry).

---

## 4. Dependency view

```text
Phase 0  Security & ownership ─► 1 Auth ─► 2 Business onboarding ─► 3 Customers / Products / Settings
                                                                         │
                                        ┌────────────────────────────────┘
                                        ▼
                                  4 Projects ─► 5 Estimate builder ─► 6 Quotation ─► 7 Client ─► 8 Dashboard ─► 9 Release
```

Design-system components are built inside the phase that first needs them (DS §65), not up front.

## 5. Decisions status

| Status | IDs |
|---|---|
| ✅ Decided | R-00, R-01, R-04, R-08, R-15, phase order |
| 🔴 Needed before Phase 0 | R-22 (auth provider; Supabase Auth assumed in this plan), gap-analysis U1–U5, R-26 (legacy data owner) |
| Needed before Phase 3–4 | R-18, R-19, R-20 |
| Needed before Phase 5 | R-05, R-07, R-09, R-10, **R-15a** |
| Needed before Phase 6 | R-03, R-11, R-12, R-13, R-17 |
| Needed before Phase 7 | R-14, R-16, R-24, R-25, R-27 |

## 6. Risks

| Risk | Mitigation |
|---|---|
| Adding `business_id` + RLS breaks the kept-as-is invoice feature. | Backfill before enabling RLS; invoice regression suite must pass unmodified in every phase. |
| One-page limit makes quotations with long scope or terms impossible to print. | R-15a content caps enforced in the builder and a measured one-page test; multi-page is the known next step. |
| Quotation (integer paise) and invoice (float) calculators diverge in behaviour. | Intentional (R-00 vs R-08). The two modules are kept separate and named clearly, with no shared helpers across them. |
| Scope creep from V1/V2 items (templates, AI, analytics). | AC §29 boundary enforced in review; R-03 table. |
