# 0002. Phase 3 Domain Decisions

**Date**: 2026-09-27
**Status**: Accepted

## Summary

This spec solidifies three foundational domain decisions for Phase 3 of the MVP: project cardinality, customer lifecycle, and design-token mapping. It establishes that a project can have multiple quotations with its status derived from the latest one, requires only a name for customers while banning hard deletes, and retains existing shadcn design tokens by mapping new design system roles to them. This ensures data integrity and avoids massive UI refactoring across the existing codebase.

## Context

Phase 3 introduces the new Quotation workflow alongside the existing Invoice system. The Product Requirements Document (PRD) and Design System Spec left three load-bearing questions unanswered (R-18, R-19, R-20). First, the relationship between projects and quotations, and who controls project status, was undefined. Second, customer creation rules and deletion semantics were vague, risking historical data loss for referenced customers. Finally, the new Design System spec introduced a new token vocabulary (`surface-*`, `text-primary`), conflicting with the existing codebase's shadcn tokens (`card`, `muted-foreground`), risking a massive, bug-prone refactor if blindly adopted. These decisions must be made before Phase 3 data models and UI components are built.

## Requirements

**User stories**:
- As a user, I want to create multiple quotation revisions for a project so that I can offer alternatives.
- As a user, I want project status to update automatically based on quotation activity so that I don't have to manually sync them.
- As a user, I want to quickly add a customer with just a name so that I am not blocked by missing contact details.
- As a user, I want my historical invoices and quotations to remain intact even if a customer is no longer active.
- As a developer, I want to apply the new design system using existing token names so that I don't have to rewrite every existing UI component.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: A project can have one or many quotations (1:N cardinality).
- **AC-2**: Project status transitions automatically (Estimating, Quoted, Accepted, Rejected, Expired) derived from its most recent sent quotation. Draft, Completed, and Archived statuses are set manually.
- **AC-3**: Customer creation requires only the `name` field; all other fields are optional.
- **AC-4**: Customers can only be marked as `active` or `archived`; hard deletes are rejected by the server if the customer is referenced by any invoice, project, or quotation.
- **AC-5**: The new Design System roles (e.g., `surface-1`, `text-primary`) are mapped to existing shadcn tokens (e.g., `card`, `foreground`) in the global CSS, avoiding renames in component code. Only genuinely missing tokens (e.g., `info`) are added.

## Options considered

### Option 1: 1:N Project to Quotations, Active/Archived Customers, Retain shadcn tokens
This option treats projects as containers for quotation revisions, derives status automatically, uses soft-deletes for customers, and maps the design system to the existing codebase's tokens.

**Pros**:
- Supports quotation revisions (V1/V2).
- Prevents broken records and historical data loss.
- Avoids a massive, risky refactor of all existing UI components.

**Cons**:
- Deriving project status requires slightly more complex database queries or application logic.
- Design token mapping requires maintaining a translation layer in the CSS.

### Option 2: 1:1 Project to Quotation, Hard Deletes, Rename all tokens
This option enforces a strict 1:1 project to quotation relationship, allows hard deletes, and mandates a full codebase refactor to match the new token names perfectly.

**Pros**:
- Simpler project status logic (1:1 mapping).
- Token names perfectly match the design document.

**Cons**:
- Prevents alternative quotes or revisions.
- Hard deletes will break existing invoices and historical records.
- Massive refactoring effort delays the MVP and introduces high regression risk.

## Decision

**Chosen option**: Option 1: 1:N Project to Quotations, Active/Archived Customers, Retain shadcn tokens

A project can have multiple quotations with its status derived from the latest one, customers require only a name and cannot be hard-deleted once referenced, and existing shadcn tokens will be retained and mapped to the new design system roles.

## Rationale

We cannot compromise historical data integrity; therefore, hard deletes for referenced customers are unacceptable, and soft deletes (archiving) are required. For project workflow, allowing multiple quotations per project matches real-world use cases (revisions and alternatives), and deriving the project's status from the quotation prevents manual sync errors. Finally, rewriting every existing component to use new token names is an unnecessary risk that slows down delivery; mapping the new design system intent to the established shadcn vocabulary achieves the same visual result safely and quickly.

## Feature design

**Data model sketch**:
- `projects`: `id` (PK), `business_id` (FK), `customer_id` (FK), `name`, `status` (enum: Draft, Completed, Archived, plus derived states).
- `quotations`: `id` (PK), `project_id` (FK to projects), `status`.
- `customers`: `id` (PK), `business_id` (FK), `name` (required), `status` (enum: active, archived).

**State transitions**:
- Project status (Derived): Estimating, Quoted, Accepted, Rejected, Expired (based on the latest sent quotation's status).
- Project status (Manual): Draft, Completed, Archived.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/customers` | POST | `name` (req) | `id`, `name`, `status` | bearer | 400 (missing name) |
| `/api/customers/:id` | DELETE | | | bearer | 409 (referenced by entity), 404 |
| `/api/projects` | POST | `name`, `customer_id` | `id` | bearer | 400 |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| GET `/api/projects` | Project status | Derived from latest quotation status in DB, or manual column |
| GET `/api/customers` | Customer status | `status` column (active/archived) |
| UI Rendering | Colors/Design | Existing shadcn CSS tokens mapped to DS values |

**Key invariants**:
- A customer cannot be hard deleted if referenced by any existing project, quotation, or invoice.
- A project's status must accurately reflect its latest quotation's status unless manually overridden to Draft/Completed/Archived.

**Security model**:
- All endpoints must enforce `business_id` isolation using `requireBusiness()` per `AGENTS.md`.

## Build plan

1. Update `customers` table migration to add `status` (active/archived) and ensure `name` is the only strictly required non-FK field, satisfies **AC-3**, **AC-4**.
2. Create/update `/api/customers` endpoints to support creation and soft-delete/archive, enforcing the no-hard-delete invariant, satisfies **AC-3**, **AC-4**.
3. Map Design System tokens to `globals.css` using existing shadcn names, adding only new tokens like `info`, satisfies **AC-5**.
4. Create `projects` table migration supporting 1:N quotations, satisfies **AC-1**.
5. Implement project status derivation logic in the project service/API, satisfies **AC-2**.

## Consequences

**Positive**:
- Historical invoices and quotations are protected from cascading deletes.
- Project status remains accurate without manual overhead.
- UI components do not need a massive refactor, accelerating Phase 3 delivery.

**Negative / tradeoffs**:
- Project status logic is slightly more complex as it requires checking quotation states.
- The CSS file will have a mapping layer that new developers must learn (e.g., `card` means `surface-1`).

## Follow-up

- [ ] Update `docs/specs/spec_review.md` Decision Log to mark R-18, R-19, and R-20 as decided.
