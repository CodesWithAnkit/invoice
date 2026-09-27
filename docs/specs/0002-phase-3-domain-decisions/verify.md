# Verify: Phase 3 Domain Decisions · spec 0002 · updated 2026-09-27
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._
## UI / manual
- [x] Create a project, add multiple quotations → AC-1
- [x] Add a quotation in 'Sent' state, verify project state is 'Quoted' → AC-2
- [x] Create a customer with just a name → AC-3
- [x] Try to delete a customer referenced by a project/invoice, verify failure (409) → AC-4
- [x] Check UI rendering uses mapped shadcn tokens including new `info` token → AC-5

## Commands
- [x] `curl -X POST /api/customers -d '{"name": "test"}'` → success → AC-3
- [x] `curl -X DELETE /api/customers/<referenced_id>` → 409 → AC-4
- [x] `curl -X GET /api/projects` → check status field is derived correctly → AC-2

## Acceptance-criteria coverage
- AC-1 covered by step (UI project creation)
- AC-2 covered by step (UI/API project state)
- AC-3 covered by step (UI/API customer creation)
- AC-4 covered by step (UI/API customer deletion)
- AC-5 covered by step (UI rendering check)

## API / Backend (Customers Feature)
- [x] `POST /api/customers` creates a customer with new fields (`email`, `notes`, `tax_id`) and returns `status="active"`
- [x] `PATCH /api/customers/[id]` successfully updates `email`, `notes`, `tax_id`, and `status` to `archived`
- [x] `GET /api/customers?search=xyz` returns only matching customers
- [x] `GET /api/customers?sort=name&dir=desc` returns correctly sorted list

## UI / manual (Customers Feature)
- [x] Navigate to `/dashboard/customers`, verify the columns (Name, Phone, Invoices, Status) and that search works locally.
- [x] Click "New Customer", submit the form, and verify redirection to the list with the new customer visible.
- [x] Click a customer name in the list, verify the detail page loads real data (Contact Details, Business Details, Recent Projects, Recent Invoices).
- [x] Click "Edit", change a field (e.g., set status to Archived), and save. Verify the detail page reflects the change.
