# AI Agent Entrypoint & Context System

## Project Context
This is an existing production codebase for a high-fidelity, high-speed Invoice & Quote Generator & Manager. It supports freelancers and small businesses with A4 print layout, digital signatures, AI-assisted PDF parsing, and a Supabase dashboard.

## Repository Structure
- `src/app`: Next.js Pages & API Route Handlers
- `src/components`: React components
- `src/hooks`: React Custom Hooks (e.g. `useInvoice.ts`)
- `src/lib`: Core utilities
- `src/modules`: Business logic & schemas
- `docs/`: Architecture and specific implementations
- `docs/specs/`: Feature specifications and plans
- `docs/project_document/`: Product specifications (PRD, MVP acceptance criteria, design system)

## Product Direction & Specifications
The product is evolving into a **Quotation & Project Estimation Platform**. These documents are the "Existing specification" at the top of the Decision Hierarchy below:

- `docs/project_document/Quotation & Project Estimation Platform — Product Requirements Document.md`: what to build and why.
- `docs/project_document/MVP Acceptance Criteria.md`: `AC-*` IDs that define "done". Reference them in specs, PRs and tests.
- `docs/project_document/Quotation & Project Estimation Platform — Design System Specification.md`: UI tokens, components and quality gates.

Working documents derived from them:

- `docs/specs/mvp_gap_analysis.md`: current code vs. specs, including open security findings (C1–C6).
- `docs/specs/mvp_implementation_plan.md`: phased build order. Work within the current phase.
- `docs/specs/spec_review.md`: contradictions and open decisions (`R-xx`). Items marked 🔴 must be decided before the phase that needs them. Record decisions in its Decision Log.

**Existing invoice feature:** it is kept as it is and is part of the MVP (R-00). The invoice-specific rules below (schemas, `/api/invoices/save`, the `useInvoice` localStorage draft, print invariants) keep governing it, except for the Phase 0 security and ownership fixes.

**Pending conflicts:** those same rules conflict with the specs for new quotation-domain work (see `spec_review.md` R-02). Do not silently pick a side. Surface the conflict and ask.

**Quotation-domain decisions:** routes stay under `/dashboard/*` (R-01); money is integer minor units (R-08); percentage items use the non-percentage base subtotal (R-04); the quotation PDF is one A4 page via browser print (R-15).

## Existing Codebase Rule
This is an existing production codebase.

Do not implement requested functionality as if building a new application.

Before creating a new component, service, utility, hook, API pattern, state-management pattern, or architectural abstraction:
1. Search the repository for an existing equivalent.
2. Inspect how similar functionality is implemented.
3. Reuse existing patterns where appropriate.
4. Extend existing abstractions before creating new ones.
5. Only introduce a new pattern when the existing architecture cannot reasonably support the requirement.
6. Document why the existing pattern was insufficient.

## Architecture Rules
- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + Tailwind Animate
- **Database / Backend**: Supabase
- **AI Processing**: Google Generative AI
- **No External Store Libraries**: Do not introduce Redux, Zustand, Recoil, or MobX. The hook `useInvoice.ts` provides a custom singleton listener model.
- **No Database schema drift**: Use API route handlers instead of direct client DB access. Ensure compatibility with `customers`, `invoices`, `invoice_items`, `projects`, and `quotations` schemas.

## Frontend Rules
- Keep client components minimal. Mark files with `"use client"` only when they manage state, use local storage, browser APIs, or React hooks.
- Build form inputs as modular blocks using Radix/Shadcn primitives.
- **Form State Pattern**: Never use individual `useState` hooks for each form field. Always group form fields into a single `values` state object (e.g. `const [values, setValues] = useState({ field1: "", field2: "" })`) and use a single change handler, often paired with `zod` for validation. See `src/app/login/LoginForm.tsx` for reference.
- **Strict Print Invariants**: The A4 printing engine and export PDF functionality must never be broken. Do NOT change export PDF (layout, styles, components) without explicit request. Pure UI controls must use `.no-print`.
- **Theme & UI Rules (Permanent Dark/Light Mode)**: Every new UI must support both themes. Use **Semantic Theme Tokens** (e.g. `bg-background`, `text-foreground`). Hardcoded colors are prohibited unless intentional. Shared components must be theme-aware.
- Use Geist Sans for UI, Geist Mono for tabular values.

## Backend Rules
- All mutations must go through API route handlers (`src/app/api/...`) or React Server Actions.
- Return consistent JSON payloads: `{ success: true, data }` or `{ error: "Error message details" }`.
- Wrap all async operations, API calls, and local storage read/writes in try-catch statements.
- The browser should not hold private tokens (e.g. Supabase service roles, Gemini keys) or call the LLM directly.

## Database Rules
- **Invoice feature** schema mutations go through `/api/invoices/save` (the transactional handler for `invoices` and `invoice_items`). Keep this route for all invoice writes.
- **New domain schemas** (`projects`, `quotations`, and future domain tables) go through `supabase/migrations/` and are applied with `npm run db:migrate` (`supabase migration up --local`).
- **Never reset a database.** Do not run `supabase db reset` (local or remote), `npm run db:reset`, or anything that drops and recreates the database. The local database holds the developer's own account and data (loaded from production); a reset deletes them. Apply schema changes only as new, forward-only migrations with `npm run db:migrate`. If a migration is wrong, fix it with a new migration, never by resetting. If a reset ever seems unavoidable, stop and ask the user first.
- Preserve transactional data flow for insertions and updates.

## Testing Rules
- E2E tests run against **local Supabase** only: `npm run db:start` (Docker/colima), then `npm run test:e2e`. Playwright serves the app on port 3100 from `.next-e2e`, so it can run next to `npm run dev`. Never point tests at the hosted project.
- **Phase gate:** a phase is done only when its backend E2E (`tests/api/**`, Playwright `api` project, real HTTP) and frontend E2E (`tests/**`, desktop + mobile) pass, together with all earlier suites. Record the result in `docs/progress_tracker.md`.
- Schema changes go in `supabase/migrations/`; `npm run db:migrate` applies pending ones locally. Never reset the database to re-apply them (see Database Rules). E2E tests create their own users and businesses, so they need no reset.
- Use existing Playwright setup for UI changes.
- Use existing accessibility and responsive tests.
- Do not claim tests passed unless they were actually executed.
- **`/check verify` behavior**: `/check verify` means you MUST write a Playwright E2E test for the new feature and verify all the conditions using the test runner. Do not use manual browser automation (Browser Subagent) for `/check verify`.

## Security Rules
- Every API route handler starts with `requireUser()` or `requireBusiness()` (`src/lib/api/auth.ts`) and uses the returned per-request Supabase client, so RLS applies. Never take `business_id`/`user_id` from the request; business-owned tables fill `business_id` from the session by default.
- Another business's resource answers 404. The browser never queries Supabase tables directly.
- Keep private tokens private.
- Authorization and Data constraints must be validated server-side.

## AI Workflow Rules
We use a disciplined AI-assisted development workflow combining JSMastery skills and TypeSafe principles:
1. `scope` -> `audit` -> `architect` -> `develop` -> `check` -> `test` -> `document` -> `sync`.
2. For bugs use `debug`.
3. Stop and use `architect` when major architectural, load-bearing decisions are unmade.
4. Explicitly identify Unknowns, Assumptions, Risks, and Evidence (TypeSafe principles) before implementing non-trivial features.
5. Never silently guess load-bearing decisions. Ask for evidence or product decisions.
6. The AI is not the designer. Reproduce visual references exactly. 

## Decision Hierarchy
When making technical decisions, prefer evidence in this order:
1. Existing specification
2. Existing architecture
3. Existing implementation
4. Existing tests
5. Official documentation
6. Runtime behavior
7. Controlled experiment
8. Explicit user decision
9. Explicitly recorded assumption

## Verification Rules
- Run `npm run build` when routes or server code changes.
- Verify happy path, empty states, invalid inputs in browser.
- Verify print styles manually or verify CSS logic.
- Check Supabase state.
- Check regression impact: Existing behavior + New behavior.

## Completion Criteria
A task is complete only when:
[ ] Scope understood
[ ] Existing implementation audited
[ ] Existing patterns identified
[ ] Reusable components identified
[ ] Assumptions identified
[ ] Important assumptions validated
[ ] Specification created/updated if necessary
[ ] Implementation completed
[ ] Acceptance criteria verified
[ ] Regression impact checked
[ ] Tests added/updated
[ ] Tests actually executed
[ ] Runtime behavior verified where necessary
[ ] Accessibility checked where applicable
[ ] Responsive behavior checked where applicable
[ ] Security reviewed where applicable
[ ] Documentation updated
[ ] Project context synchronized

## Context files
- **StatusBadge**: `toneForProjectStatus(status)` maps all 8 project statuses (Draft, Estimating, Quoted, Accepted, Rejected, Expired, Completed, Archived). Import from `src/components/ui/status-badge.tsx`.
- **Soft delete pattern**: `DELETE /api/projects/[id]` archives (sets `status = Archived`) rather than hard-deleting. Preserve quotations.
- **Project status**: derive with `deriveProjectStatus()` from `src/modules/project/project.status.ts`; never re-implement the map.
- **Quotation lifecycle**: status, number, token and version change only through the SQL functions (`send_quotation`, `revise_quotation`, `archive_quotation`, `regenerate_quotation_token`); a trigger rejects direct updates. Use `toneForQuotationStatus` for badges.
- **Quotation document / PDF**: `QuotationDocumentView` renders the client-facing document (preview, PDF, and the Phase 7 public page) from a `QuotationDocument` (sent versions use the frozen snapshot). Print styles live in `src/styles/quotation-print.css`; one-page fit is measured with `OnePageMeasurer`, not by counting items.
