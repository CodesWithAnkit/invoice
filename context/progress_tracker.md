# Progress Tracker: Invoice System

## Current Phase
- **Phase 1**: Establishing Architectural Context & Foundation Setup

---

## Active & In-Progress Tasks
- `[x]` Initialize Six-File Context System to enforce structural discipline and prevent AI drift.
- `[ ]` Integrate Gemini AI parser on the frontend to allow dragging and dropping invoice PDFs for auto-filling inputs.
- `[ ]` Connect dashboard views (`invoices`, `customers`, `products`) to dynamically query Supabase tables instead of static tables.

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
