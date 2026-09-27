# 0002. Phase 3 Domain Decisions - Rationale

## Context

Phase 3 introduces the new Quotation workflow alongside the existing Invoice system. The Product Requirements Document (PRD) and Design System Spec left three load-bearing questions unanswered (R-18, R-19, R-20). First, the relationship between projects and quotations, and who controls project status, was undefined. Second, customer creation rules and deletion semantics were vague, risking historical data loss for referenced customers. Finally, the new Design System spec introduced a new token vocabulary (`surface-*`, `text-primary`), conflicting with the existing codebase's shadcn tokens (`card`, `muted-foreground`), risking a massive, bug-prone refactor if blindly adopted. These decisions must be made before Phase 3 data models and UI components are built.

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

## Rationale

We cannot compromise historical data integrity; therefore, hard deletes for referenced customers are unacceptable, and soft deletes (archiving) are required. For project workflow, allowing multiple quotations per project matches real-world use cases (revisions and alternatives), and deriving the project's status from the quotation prevents manual sync errors. Finally, rewriting every existing component to use new token names is an unnecessary risk that slows down delivery; mapping the new design system intent to the established shadcn vocabulary achieves the same visual result safely and quickly.
