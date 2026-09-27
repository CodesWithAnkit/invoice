# Verify: Phase 4 Projects · updated 2026-09-27
_Steps derived from Phase 4 spec (AC-PROJECT-001…004). `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Visit `/dashboard/projects` → page loads, shows empty state ("No projects yet") when no projects exist → AC-PROJECT-001
- [ ] Click "New Project" button → dialog opens with Project Name, Customer select, Start/End Date, Description, Notes fields → AC-PROJECT-001
- [ ] Fill Name only, leave Customer blank → submit → validation error "Please select a customer" shown without page reload → (form validation)
- [ ] Fill both Name and Customer → submit → dialog closes, project appears in list with status "Draft" → AC-PROJECT-001
- [ ] Create a project with start_date and expected_end_date → open detail page → Schedule card shows formatted dates → AC-PROJECT-001
- [ ] Search for a project by name → list filters to matching results → AC-PROJECT-001
- [ ] Filter by status "Draft" → only Draft projects shown; filter by "All" → all shown → AC-PROJECT-003
- [ ] Click project name in list → navigates to `/dashboard/projects/[id]` → shows project title, status badge, customer link, schedule → AC-PROJECT-001
- [ ] Customer name on detail page is a link → click → navigates to `/dashboard/customers/[id]` → (cross-feature link)
- [ ] Open detail page edit dialog → change name → save → page refreshes with updated name → AC-PROJECT-001
- [ ] Click Archive on detail page → confirm dialog appears → confirm → redirected to `/dashboard/projects` → project status in list shows "Archived" when filtered → AC-PROJECT-003
- [ ] Customer detail page at `/dashboard/customers/[id]` shows Projects section with project count and link → (AC-PROJECT-002 cross-reference)
- [ ] Both light and dark themes render all project pages without contrast issues → (theme invariant)
- [ ] Mobile viewport (375px): list page, dialog, and detail page are usable without horizontal scroll → (responsive)

## Commands

- [ ] `npx playwright test tests/projects.spec.ts --project=api` → all backend E2E pass (CRUD, validation, auth, ownership, soft-delete) → AC-PROJECT-001…004
- [ ] `npx playwright test tests/projects.spec.ts --project=desktop` → frontend E2E pass → AC-PROJECT-001
- [ ] `npx playwright test tests/projects.spec.ts --project=mobile` → mobile E2E pass → (responsive)
- [ ] `npm run build` → compiles with no TypeScript errors → (build gate)

## Acceptance-criteria coverage

- AC-PROJECT-001: project CRUD (create/list/detail/edit) → UI manual steps above + API backend tests
- AC-PROJECT-002: customer must belong to same business — enforced by DB trigger + handler ownership check → API test "get single project — other business returns 404"
- AC-PROJECT-003: status filter (Draft, Estimating, Quoted, Accepted, Rejected, Expired, Completed, Archived) → UI filter step + `toneForProjectStatus()` maps all values
- AC-PROJECT-004: status derivation (R-18) — Estimating/Quoted/Accepted/Rejected/Expired from latest quotation; Draft/Completed/Archived are manual — enforced in both GET /api/projects and GET /api/projects/[id]
