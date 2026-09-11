# Progress Tracker: Invoice System

## Current Phase
- **Phase 2**: Northstar Redesign — see `context/redesign_implementation_plan.md`. Phase 0 (design tokens/fonts) and Phase 1 (app shell + Dashboard Overview) of that plan are complete.

---

## Active & In-Progress Tasks
- `[x]` Initialize Six-File Context System to enforce structural discipline and prevent AI drift.
- `[ ]` Integrate Gemini AI parser on the frontend to allow dragging and dropping invoice PDFs for auto-filling inputs.
- `[ ]` Connect dashboard views (`invoices`, `customers`, `products`) to dynamically query Supabase tables instead of static tables.
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
