# Spec Review — Contradictions, Gaps and Open Decisions

**Date:** 2026-09-25
**Reviewed:** [PRD](<../project_document/Quotation & Project Estimation Platform — Product Requirements Document.md>) · [MVP Acceptance Criteria](<../project_document/MVP Acceptance Criteria.md>) · [Design System Spec](<../project_document/Quotation & Project Estimation Platform — Design System Specification.md>)
**Also checked against:** [AGENTS.md](../../AGENTS.md), [architecture_context.md](../architecture_context.md), current code.

Overall the three documents agree on direction, MVP boundary and build order. The problems are mostly **undefined rules inside otherwise-clear requirements**: calculation base, status transitions, what "Sent" means without email. There are also **conflicts with the existing codebase and its AGENTS.md rules**, which the specs don't acknowledge.

Per AGENTS.md ("Never silently guess load-bearing decisions"), each item below has an ID and a **recommended default**. Items marked **🔴 Blocking** must be decided before the phase that needs them starts (see [mvp_implementation_plan.md](mvp_implementation_plan.md)). The others can proceed on the recommended default, which should be recorded when adopted.

---

## A. Product-level conflicts

### R-00 ✅ What happens to the existing invoice product?
> **Decided 2026-09-25:** keep the invoice/quote/proforma generator **as it is**: unchanged behaviour, still in navigation, and explicitly part of the MVP (see MVP Acceptance Criteria §30). The security and ownership fixes in Phase 0 still apply to it. The quotation domain is built alongside it.

*Original analysis:*
The codebase *is* an invoice/proforma generator: GST split, bank details, Aadhaar, signatures, AI PDF parsing, and hardcoded proforma delivery T&Cs. The PRD redefines the product as a quotation platform with "no accounts receivable" and never mentions invoices, proforma, bank details or signatures. The PRD's §49 even says "The current application does not have an authentication system", so it appears to have been written without the current feature set in view.
**Options:** (a) keep invoicing alongside quotations; (b) freeze invoicing as legacy, hidden from nav but still reachable; (c) remove it.
**Recommendation:** (b). Keep the invoice editor and print pipeline working and untouched, remove it from primary nav, and build quotations as a new domain that reuses its components. Revisit "quote → invoice" conversion post-MVP.

### R-01 ✅ URL structure
> **Decided 2026-09-25:** keep the current structure: authenticated app under `/dashboard/*`, invoice editor at `/`. The spec's paths are logical names. New routes follow the same pattern (`/dashboard/projects`, `/dashboard/quotations`). The public quote page lives outside `/dashboard` at `/public/quote/[token]` (PRD §10).

*Original analysis:*
The PRD (§10) and AC-AUTH-006 list `/dashboard`, `/customers`, `/projects`, `/quotations`, … as top-level routes. The app nests everything under `/dashboard/*` and uses `/` for the invoice editor. AC-AUTH-006 also adds `/services`, which the PRD doesn't have.
**Recommendation:** keep the `/dashboard/*` prefix (it is established and tested) and read the spec paths as logical names. Put the public route at `/q/[token]` or `/public/quote/[token]` (outside the authenticated layout). Treat Services as a tab of Products & Services, not its own route.

### R-02 Existing AGENTS.md rules that contradict the specs
| AGENTS.md rule | Spec requirement | Resolution needed |
|---|---|---|
| "Ensure compatibility with `customers`, `invoices`, `invoice_items` schemas" / "No schema drift" | New `businesses`, `projects`, `services`, `quotations`, … plus `business_id` everywhere | Rule must become "schema changes only through versioned migrations". |
| "Schema mutations go through `/api/invoices/save`" | Domain-organized APIs (PRD §42) | Rule must become "mutations go through domain route handlers". |
| "Do NOT change export PDF without explicit request" | Multi-page quotation PDF with new sections (AC-PDF-004) | Applies to the **invoice** PDF. The quotation PDF is a new, explicitly requested document → see R-15. |
| `useInvoice` singleton + `localStorage` draft | Backend is source of truth for totals; drafts persisted server-side (AC-QUOTE-001) | The singleton remains fine as editor state, but it is not the system of record. |

These are flagged in AGENTS.md as pending, not silently rewritten.

### R-03 MVP scope is inconsistent across documents
| Feature | PRD §43 phases | PRD §44/§46 MVP & roadmap | AC | Recommendation |
|---|---|---|---|---|
| Quotation versioning | Phase 5 | **V1 (post-MVP)** | AC-CLIENT-004/005 record "quotation version"; AC-DATA-002/003 require stable snapshots | **Minimal versioning in MVP:** an immutable snapshot + `version` integer on each send. No version-history UI until V1. |
| Templates | Phase 8 | V1 | Not in AC; DS nav includes "Templates" | Out of MVP; hide the nav item. |
| Duplicate quotation/project | Phase 5 / §35 | — | Not in AC | Duplicate *quotation* in MVP (cheap, high value; the `copy` page pattern already exists). Project duplicate post-MVP. |
| Packages | §18 category | V1 | Not in AC | Out of MVP. |
| Analytics monthly charts | §15 | V1 "advanced analytics" | AC-DASH only requires KPIs, pipeline and recent | MVP = KPIs + pipeline + recent. Trend charts are optional. |
| AI | Phase 9 | V2 | §29: ❌ AI | Existing AI features: keep them behind auth, don't extend. |

---

## B. Calculation rules (blocks Phase 4)

### R-04 ✅ Percentage line-item base
> **Decided 2026-09-25:** percentage amount = **base subtotal × %**, where base subtotal = Σ of all **non-percentage** line amounts. Percentage items are never part of their own base (no circular calculation). The exact order of steps is in [mvp_implementation_plan.md §2.4](mvp_implementation_plan.md#24-money-and-calculation-rules-r-04-r-08).

*Original analysis:*
AC-ESTIMATE-007 says "calculate against the defined calculation base" but never defines it.
**Recommendation:** base = Σ of **non-percentage** line amounts. Percentage items never include other percentage items (so there is no circularity). They are included in the subtotal, then discounted and taxed like any other line.

### R-05 🔴 Tax granularity
PRD §18 and AC-CATALOG-001 give every service a **Tax** field, which implies per-line tax. PRD §22 and AC-CALC-003 describe a **single quotation-level rate** applied to the taxable amount.
**Recommendation:** MVP uses **one quotation-level tax** (name + %) defaulted from business settings. The service `tax` field is stored for future per-line tax but ignored in MVP calculation. This must be stated in the service form UI.

### R-06 Existing CGST/SGST split vs. "tax name + percentage"
The current calculator always splits tax into CGST/SGST halves, while PRD §22 says a single named tax for MVP.
**Recommendation:** the quotation calculator stores `tax_name`, `tax_rate`, `tax_amount`. A "Show as CGST + SGST" presentation toggle can come later. Leave the invoice calculator unchanged (R-00).

### R-07 Discount rules
Neither document specifies: quotation-level only or also per line? Can a discount exceed the subtotal? What is a fixed discount's max?
**Recommendation:** quotation-level only. Percentage 0–100. Fixed from 0 up to the subtotal. The server rejects anything else (AC-CALC-005).

### R-08 ✅ Money representation and rounding
> **Decided 2026-09-25:** store all monetary values as **integers in minor units** (paise), `bigint` in Postgres. Round with one deterministic rule at defined calculation boundaries only. The rule is **round half up**, applied once per line, per percentage item, and to discount and tax (see [mvp_implementation_plan.md §2.4](mvp_implementation_plan.md#24-money-and-calculation-rules-r-04-r-08)). This applies to the new quotation domain; the existing invoice calculator stays as it is (R-00).

*Original analysis:*
Not specified anywhere. The existing code uses JS floats with `round2` per line.
*Superseded recommendation:* store money as `numeric(14,2)` in Postgres, compute server-side with an explicit rounding rule (half-up to 2 dp at **each line** and at **each summary step**), and document it in one module shared by the server and the preview. Quantities `numeric(12,3)` (allows 0.5 hours). This rule decides the answers to AC-CALC-004 and AC-DATA-004.

### R-09 Quantity rules
The AC rejects negative values but is silent on **zero** and fractions. The existing schema demands `quantity ≥ 1` (it would reject 0.5 h).
**Recommendation:** quantity > 0, fractional allowed, max 3 dp. Rate ≥ 0 (zero allowed for complimentary items).

### R-10 Multi-currency
Quotations have `currency` (PRD §26) and the business has a default currency, but dashboard KPIs sum "quoted value" across quotations.
**Recommendation:** in MVP, currency is fixed per business (the settings default). The quotation copies it, and changing it on a quotation is disallowed. KPIs then sum safely.

---

## C. Quotation lifecycle (blocks Phase 5–6)

### R-11 🔴 Full status transition table
PRD §27 gives a partial graph. Undefined: Sent → Rejected? Sent → Accepted (client accepts without a recorded view)? Viewed → Expired? Archive from anything other than Draft? Un-archive?
**Recommended table** (the server enforces it; everything else is rejected):

| From → To | Draft | Sent | Viewed | Accepted | Rejected | Expired | Archived |
|---|---|---|---|---|---|---|---|
| **Draft** | — | owner "send" | | | | | owner |
| **Sent** | owner "revise" (new version) | — | client first open | client | client | system | owner |
| **Viewed** | owner "revise" (new version) | | — | client | client | system | owner |
| **Accepted** | | | | — | ✗ | ✗ | owner |
| **Rejected** | owner "revise" (new version) | | | ✗ | — | | owner |
| **Expired** | owner "revise" (new version) | | | ✗ | ✗ | — | owner |
| **Archived** | | | | | | | — |

Accepting implies viewing, so the `Viewed` activity is recorded implicitly if it is missing.

### R-12 🔴 What does "Sent" mean without email?
Email is a V3 integration (PRD §46), yet `Sent` is a core status and PRD §42 has `POST /quotations/:id/send`.
**Recommendation:** "Send" = the owner finalizes the quotation. That assigns the quote number (R-13), freezes a version snapshot (R-03), creates the public token and shows a copyable link. Delivery is manual (copy link / download PDF).

### R-13 "Finalized" is used but is not a status
AC-QUOTE-002/003 talk about a "finalized" quotation, which is not in the status list.
**Recommendation:** finalized ≡ transition Draft → Sent (R-12). Drafts show a provisional label ("Draft") and receive their `QT-YYYY-NNN` number at send time, from a per-business, per-year DB sequence, so drafts never burn numbers.

### R-14 Expiry mechanism and time zones
Who moves Sent/Viewed → Expired, and when? In which time zone is `valid_until` evaluated?
**Recommendation:** evaluate lazily. On every read and every public action, `valid_until < today(business_tz)` ⇒ treat the quotation as Expired and persist that plus an activity row. No cron needed for MVP. Add a business `timezone` setting (default `Asia/Kolkata`).

### R-15 ✅ PDF generation approach
> **Decided 2026-09-25:** the quotation PDF works **like the current one**: browser print, **single A4 page**. Multi-page PDFs are deferred and will be added later if needed. AC-PDF-004 "multi-page" is out of MVP (noted in MVP Acceptance Criteria).
>
> **Consequence, open as R-15a 🔴 (blocks Phase 6):** one A4 page already holds at most 15 line items with the current footer. Quotations also need scope, deliverables, timeline, assumptions and terms (AC-PREVIEW-001, AC-PDF-002). Not all of that fits on one page at full length. Decide which sections appear on the PDF and in what compact form, and cap their content in the builder. Caps are set by measurement with the existing one-page Playwright test (`tests/invoice-pdf-export.spec.ts` pattern), not by guesswork.

*Original analysis:*
AC-PDF-004 requires multi-page output; AC-CLIENT-003 requires a **client** "Download PDF" on the public page; E2E-003 requires verifying the output. The current engine is browser `window.print()`, deliberately fixed to **one A4 page and 15 items**, and protected by an AGENTS.md invariant.
**Options:** (a) a new print-CSS quotation layout with real pagination (`break-inside`, running header and footer), still using browser print. The client's "Download PDF" is then just print-to-PDF. (b) Server-rendered PDF (headless Chromium, or `@react-pdf/renderer`) giving a real downloadable file.
**Recommendation:** (a) for MVP. It reuses the proven print pipeline and needs no new infrastructure, and the invoice layout stays untouched. Revisit (b) if a real file download or storage becomes a requirement. Needs an explicit decision because it sets the meaning of "Download PDF".

### R-16 View tracking accuracy
Link unfurlers (WhatsApp, Slack, iMessage previews) and the owner opening their own link would mark a quotation `Viewed`.
**Recommendation:** record a view only from a real page render (not HEAD requests or bot user-agents), and skip it when the viewer has an authenticated session for the owning business.

### R-17 Public-link lifecycle
Undefined: does the link change per version? Can the owner revoke it? What does the client see for a superseded version?
**Recommendation:** one token per quotation, always showing the **latest sent version**. The owner can revoke and regenerate it. Accept/reject records the version number being viewed, and the server rejects the action if that is no longer the current version ("This quotation has been updated, please review the latest version").

---

## D. Domain model gaps

### R-18 Project ↔ quotation cardinality and project-status sync
Can a project have multiple quotations? (Presumably yes: revisions, alternatives.) The project statuses Quoted, Accepted, Rejected and Expired mirror quotation statuses, but AC-PROJECT-004 says transitions must be "controlled" without saying *who* drives them.
**Recommendation:** 1 project → many quotations. Project status is **derived** for Estimating → Quoted → Accepted/Rejected/Expired, from its most recent sent quotation. Only Draft, Completed and Archived are set manually.

### R-19 Customer status, required fields, delete semantics
AC-CUSTOMER-002 shows a "Status" column, but no customer status is defined (the PRD only has an "Archive" action). AC-CUSTOMER-001 says "only required fields should block creation" without naming them. Edge cases mention "customer **deleted**/archived".
**Recommendation:** customer `status ∈ {active, archived}`; required = `name` only. **No hard deletes** for customers, projects or catalog items once they are referenced; only archive. Apply the same rule to catalog items (AC-DATA-001).

### R-20 Design-token vocabulary
The DS spec says "the existing semantic-token approach should remain" (§5), then lists a different naming scheme (`surface-*`, `text-primary`, `--color-text-primary`, `info`). The code uses shadcn names (`card`, `muted-foreground`, …).
**Recommendation:** **do not rename.** Map the DS roles to existing tokens in [ui_context.md](../ui_context.md), and add only the genuinely missing ones: `info`/`info-foreground`, subtle variants if needed, and a `caption`/`label` type step. Add `prefers-reduced-motion`.

### R-21 Customer historical snapshot
AC-CUSTOMER-004 and AC-DATA-002 require that customer edits don't rewrite history. This is consistent with R-03: the quotation version snapshot must include business **and** customer details as of send time.

---

## E. Auth and security gaps

### R-22 🔴 Auth provider
Neither spec picks one. The stack is Supabase.
**Recommendation:** **Supabase Auth** with `@supabase/ssr` cookie sessions (no tokens in `localStorage`, which satisfies AC §23). Use a Next.js `proxy.ts` (formerly `middleware.ts`) for route protection, and a per-request server client in route handlers so **RLS enforces business isolation** as defence in depth behind handler checks. It brings password hashing, reset tokens with expiry, and auth rate limits built in (PRD §37).

### R-23 Email verification and password policy
The PRD says "account not verified, *if verification is implemented*" and "password minimum requirements" (undefined). Supabase enables email confirmation by default.
**Recommendation:** email confirmation **on** (it prevents registering other people's emails). Password min 8 characters (the Supabase setting) plus a leaked-password check if the plan supports it.

### R-24 Rate limiting beyond auth
The ACs only require auth-endpoint rate limits. The public accept/reject endpoints and the (existing) Gemini endpoints are equally abusable.
**Recommendation:** add a basic rate limit on `/api/public/*` and require auth for all AI routes.

### R-25 Private fields on the public page
AC-PUBLIC-004 forbids "private notes", but the quotation entity has one `notes` field with no internal/client split.
**Recommendation:** `notes` (client-visible) and `internal_notes` (never serialized to public responses). The public API uses an explicit allow-list DTO.

### R-26 Existing data ownership on migration
No spec addresses the existing `customers`/`invoices`/`products` rows, which have no owner.
**Recommendation:** depends on U5 in the gap analysis. If the data is real, create one business for the current operator and backfill `business_id`; otherwise start clean.

### R-27 "PDF download if enabled by the business" (AC-CLIENT-003)
There is no such setting in PRD §36.
**Recommendation:** add a boolean `allow_client_pdf_download` to quotation settings, default **true**.

---

## F. Testing and quality gaps

### R-28 Unit-test runner
AC §25 requires unit tests. The repo has only Playwright. Adding **Vitest** is a new dev dependency, justified because Playwright is the wrong tool for pure-function tests.

### R-29 Test environment isolation
Integration and E2E tests (registration, authz between users A and B) need a disposable database. The current tests hit whatever `.env` points at.
**Recommendation:** local Supabase (`supabase start`) for tests and CI, seeded by migrations.

### R-30 Component-level visual regression (DS §56)
There is no harness for per-component screenshots.
**Recommendation:** a dev-only `/dashboard/_design-system` gallery route screenshotted by Playwright in light and dark. That is lighter than adopting Storybook.

---

## G. Minor wording issues

- PRD §6 and §49 say there is no authentication system, while the code has a placeholder one. Harmless, but future readers may be confused.
- PRD §10 uses `/public/quote/:token`, §42 uses `/public/quotations/:token`. Pick one (R-01).
- "Estimate" and "quotation" are used interchangeably. Suggest: the *estimate* is the line-item/pricing part of a *quotation*, not a separate entity (the ACs imply this).
- DS §17 folder structure (`primitives/`, `feedback/`, …) differs from the existing `ui/`, `form/`, `invoice/`. The DS explicitly allows this, so **don't restructure**. Put new quotation components in `src/components/quotation/`.

---

## Decision log

When a decision is made, record it here (date, decision, who).

| ID | Decision | Date | By |
|---|---|---|---|
| R-00 | Keep the invoice/quote/proforma generator as it is; it is part of the MVP. | 2026-09-25 | Product owner |
| R-01 | Keep the `/dashboard/*` URL structure; public quote at `/public/quote/[token]`. | 2026-09-25 | Product owner |
| R-04 | Percentage items = base subtotal (Σ non-percentage lines) × %. | 2026-09-25 | Product owner |
| R-08 | Money as integer minor units (paise); one deterministic rounding rule (half up) at defined boundaries. | 2026-09-25 | Product owner |
| R-15 | Quotation PDF = browser print, single A4 page, as now. Multi-page deferred. Opens R-15a. | 2026-09-25 | Product owner |
| — | Phase order: Security & ownership → Auth → Business onboarding → Existing customers/products/settings → Projects → Estimate builder → Quotation. | 2026-09-25 | Product owner |
| — | Start with Phase 1 (Authentication). Every phase must pass backend and frontend E2E before the next starts. | 2026-09-25 | Product owner |
| R-29 | E2E tests run against a local Supabase stack (Docker), not the hosted project. | 2026-09-25 | Product owner |
| R-22 | Supabase Auth with `@supabase/ssr` cookie sessions: the plan's default, adopted when Phase 1 was implemented. | 2026-09-25 | Implemented per plan |
| R-23 | Email confirmation on (already the hosted setting); password minimum 8. | 2026-09-25 | Implemented per plan |
