# Progress Tracker: Invoice System

## Current Phase
- **Phase 2**: Northstar Redesign — see `docs/specs/redesign_implementation_plan.md`. Phase 0 (design tokens/fonts) and Phase 1 (app shell + Dashboard Overview) of that plan are complete.

---

## Active & In-Progress Tasks
- `[x]` Initialize Six-File Context System to enforce structural discipline and prevent AI drift.
- `[x]` Integrate Gemini AI parser on the frontend to allow dragging and dropping invoice PDFs for auto-filling inputs.
- `[x]` Connect dashboard views (`invoices`, `customers`, `products`) to dynamically query Supabase tables instead of static tables.
- `[x]` Redesign Phase 0: Northstar color tokens (`globals.css`, `tailwind.config.ts`) + Geist Sans/Mono fonts wired in without altering the print/PDF font stack.
- `[x]` Redesign Phase 1: Sidebar/TopNavbar rebuilt to Northstar shell (Primary Operating Register + static/disabled Automated Modules), mobile bottom tab nav added.
- `[x]` Redesign Phase 2: `/dashboard/overview` built — fully static/mock KPI cards, inline-SVG trend chart, resolution status, recent invoices list.
- `[x]` Redesign Phase 3: Invoices list reskin (Supabase logic untouched; status is a placeholder derived from `pdf_url` until a real lifecycle field exists).
- `[x]` Redesign Phase 4: Invoice Detail reskin (Issuer/Client profile cards, itemised table, totals); Audit Log panel derived from real timestamps, not fabricated events.
- `[x]` Redesign Phase 5: `/dashboard/customers` + `/dashboard/customers/[id]` — fully static/mock (a real `customers` Supabase table exists but isn't wired up yet).
- `[x]` Redesign Phase 6: `/dashboard/products` — fully static/mock (`/api/products` exists server-side but isn't wired up yet).
- `[x]` Redesign Phase 7: `/dashboard/settings` — sub-nav shell; only Visual Appearance is real (wired to `next-themes`), other sections are static placeholders.
- Verified via Playwright screenshots (light + dark) that the redesign matches the reference boards, and that print-media output of the invoice PDF template is pixel-identical to pre-redesign (font/layout isolated by design).
- `[x]` Redesign Phase 8 (new reference boards `invoice_design/new/15-16`): reskinned the Invoice View page (Issuer/From, Recipient/To cards, 4-button header incl. static Send/Record Payment stubs, timeline dots) and the invoice Editor/Edit/Copy workspace pages (title+actions header, sticky "Realtime Calculation Audit" live-totals sidebar) to match. `InvoiceToolbar` was destyled into a plain button group (same handlers) so it can sit in the new header — no field, handler, or schema logic changed. Verified responsive at desktop/tablet/mobile and re-confirmed print/PDF output is still pixel-identical.
- `[x]` Made the action-button header always visible while scrolling on the View/Edit/Create/Copy invoice pages (`sticky`, offset precisely measured against `TopNavbar` + layout gap). Extracted the duplicated header+editor+sidebar markup shared by the create/edit/copy pages into `src/components/invoice/InvoiceWorkspaceShell.tsx` so it only needs to change in one place.
- `[x]` Added a third document type, **Proforma Invoice**, alongside Invoice/Quote: `meta.type` enum extended to `"proforma"` (`invoice.schema.ts`, `invoice.types.ts`), new option in the Invoice Meta type dropdown, and both `InvoicePrintLayout.tsx` (the real print/PDF pipeline) and `InvoiceTemplate.tsx` (on-screen preview) render "PROFORMA INVOICE" / "Proforma #", a "This is not a tax invoice only proforma invoice" subtitle under the title, and a "prepared from the uploaded Price Quote #{number} ... not a Tax Invoice" disclaimer at the bottom — matching the user-supplied reference PDF. For proforma specifically, the Quote#/Date row and the Terms & Conditions block are hidden (the quote number is already shown via the subtitle). `invoice`/`quote` output verified byte-for-byte unchanged via print-media screenshot regression check after each change. Shared title/number-label text via `src/utils/documentType.ts`, but only where the two templates already used identical strings — where they differed (`"Invoice #"` vs `"Invoice No:"`) each file kept its own original text to avoid silently changing real PDF output. Also fixed the Invoices list type filter (`/dashboard/invoices`), which previously used values (`Standard`/`Tax`) that never matched the actual saved `invoice_type` — now uses the real `invoice`/`quote`/`proforma` values.
- `[x]` Added **proforma-specific Terms & Conditions** block in both `InvoicePrintLayout.tsx` and `InvoiceTemplate.tsx`. Proforma invoices now show a dedicated "Delivery & Installation" T&C section with: delivery timeline (3–6 weeks), installation (included), trial run, operator training, warranty (6 months), transportation terms, and civil/electrical work clauses — matching the reference PDF shared by the user.
- `[x]` Enabled direct PDF export from the Invoice View Details page by hydrating the singleton state locally and exposing the print layout, removing the need to navigate back to the editor just to print/export.
- `[x]` Added `tests/invoice-pdf-export.spec.ts` — a Playwright test guarding the print/PDF pipeline's "everything fits on one A4 page" contract (`src/styles/invoice-print.css`'s `.invoice-print-page { zoom: 0.85 }`, and the documented 15-item max). It fills a realistic invoice with the app's own enforced maximum of 15 line items, full business/customer/bank details, and a **drawn signature**, generates a real PDF via `page.pdf()`, and asserts exactly 1 page via `pdf-parse-new`'s `numpages` — for both templates (Classic/Modern) × the two heaviest-footer document types (Invoice, Proforma).
  - **This test caught two real, pre-existing overflow bugs** in Classic template's Proforma footer (payment-terms table + delivery/installation block): first at 15 items with no signature, then — after a user-supplied screenshot showed a *real* 2-page case the first fix missed — again once a drawn signature was added to the repro. Root cause of the second one: the footer row is bottom-aligned (`alignItems: "flex-end"`), so a real signature image makes that row much taller than the no-signature placeholder ever tested.
  - Fixed by (a) tightening spacing/font-sizes inside `Classic.tsx`'s `isProforma`-specific footer branch, and (b) adding a scoped `zoom: 0.78` inline-style override (beats the shared CSS `zoom: 0.85`) applied only when `isProforma`, so Modern and Classic's own Invoice/Quote branch are untouched.
  - Verified `getBoundingClientRect().height` / CSS `zoom` metrics were unreliable signals here (didn't match actual PDF pagination) — the fix was validated against the real `page.pdf()` + `pdf-parse-new` page count instead, and Classic Invoice output was re-screenshotted and confirmed pixel-identical to before the fix.

- `[x]` **MVP Phase 1 — Authentication** (2026-09-25; see `docs/specs/mvp_implementation_plan.md`). Replaced the shared-credential/localStorage login with Supabase Auth (`@supabase/ssr` cookie sessions): register with email confirmation, sign in (invalid, unconfirmed + resend, network states), sign out that revokes the session, forgot/reset password, and `/auth/callback`. `src/proxy.ts` protects pages (redirect to `/login?next=`) and returns 401 for every non-public `/api/*`. Added local Supabase test infrastructure (`supabase/`, baseline legacy-schema migration, Mailpit) and a Playwright `api` project.
  - **Phase gate:** `npx playwright test tests/api tests/auth.spec.ts` → 64/64 passed (backend E2E + frontend E2E on desktop and mobile). Full `npm run test:e2e` → 218 passed / 20 skipped (pre-existing) / 4 failed on first run only, because the Invoices visual-snapshot baselines had never existed (they pass on re-run). `next build` passes.
  - Found and fixed two WCAG contrast failures in the new form components (error red on the card surface was 4.4:1).
  - **Hosted-project follow-ups (dashboard, not code):** add `<site>/auth/callback` to Auth → URL Configuration redirect URLs; set minimum password length to 8; configure custom SMTP (the default only emails project team members, so real users would not receive confirmation or reset emails); delete `NEXT_PUBLIC_APP_USER/PASS` from `.env` and rotate that password.
  - **Found during the audit:** the hosted anon key can read every customer, invoice and invoice-item row (RLS off or permissive). That is Phase 0 work.

---

## Completed Tasks
- `[x]` Next.js 16 App Router + React 19 boilerplate config.
- `[x]` Tailwind CSS v4 custom theme setup utilizing HSL color variables and Tailwind-Animate plugin.
- `[x]` Custom React state singleton listener model (`src/hooks/useInvoice.ts`) to synchronize the separate form editor and preview columns.
- `[x]` Support for offline draft caching via `localStorage`.
- `[x]` Indian GST tax calculation system (CGST & SGST 18% default breakdown).
- `[x]` Supabase Integration: Database client config (`lib/supabase.ts`) and `/api/invoices/save` REST endpoint executing transactional records on `customers`, `invoices`, and `invoice_items`.
- `[x]` High-fidelity A4 browser printing Layout and print media styles.

---

## Technical & Architectural Decisions

### 1. Custom State Singleton instead of State Manager
- **Context**: The app displays an editor column and a print preview column side-by-side. Both need to subscribe to, update, and persist a complex state tree.
- **Decision**: Avoided adding massive external library weight (e.g. Redux, MobX, Zustand). Instead, built a clean, subscription-based singleton state manager inside `src/hooks/useInvoice.ts`.
- **Consequence**: Keeps package size minimal, provides high-performance local state propagation without re-render cascades, and isolates storage persistence logic perfectly.

### 2. Transactional REST Endpoint over Client Queries
- **Context**: Saving an invoice requires saving or finding a customer record, uploading the generated PDF to a Storage bucket, saving the invoice body, and saving multiple line items.
- **Decision**: Implemented this orchestration entirely in a Next.js API Route handler `/api/invoices/save/route.ts` using Node-based Supabase bindings.
- **Consequence**: Keeps client-side code lightweight, ensures clean transaction sequences (e.g. deleting old line items before re-inserting new ones during an update), and protects API keys and sensitive processing parameters.

---

## Project Backlog
- `[ ]` Dark mode toggle for the invoice dashboard workspace.
- `[ ]` Client-side dynamic PDF generation option (using pdfmake/jspdf) as an alternative to standard browser print/export.
- `[ ]` Multi-currency supports (dollar, euro) with automated tax adjustments.
