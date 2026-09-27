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
