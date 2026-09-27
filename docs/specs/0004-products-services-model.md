# 0004. Products & Services Model

**Date**: 2026-09-27
**Status**: Accepted

## Summary
We are extending the existing `products` table instead of creating a new `services` table. This approach simplifies querying and reuses the existing invoice relation logic. The API will also be updated to handle both products and services via `/api/products`, and the frontend will use tabs on a single page to filter between the two kinds.

## Context
Phase 3 requires adding "Services" alongside the existing "Products". We need to decide whether to separate them into two database tables (`products` and `services`) or combine them. A combined table avoids duplicating the relationship logic with `invoice_items` and `quotation_items`, and keeps the API surface simpler.

## Options considered
- **Extend existing products table** (Recommended & Chosen): Add a `kind` column and related pricing model fields. Simplifies foreign keys on invoices and quotations.
- **Create new services table**: Stricter normalization if services have completely different fields in the future, but requires polymorphic relations or two separate item tables for invoices/quotations.

## Decision
Extend the existing `products` table with the new fields needed for services.

### Data Model Extension
The `products` table will be extended with the following fields:
- `kind`: enum (`product`, `service`)
- `pricing_model`: enum (`fixed`, `hourly`, `daily`, `percentage`)
- `unit`: string (e.g. `hours`, `items`, `kg`)
- `default_rate_minor`: bigint (for money)
- `default_percent_bp`: integer (for basis points)
- `is_active`: boolean (default true)

### API Surface
- **Endpoint**: `/api/products`
- **Behavior**: The existing endpoint will be updated to handle full CRUD operations for both products and services. It will support deactivation (setting `is_active = false`) instead of hard deletion. It will accept a `kind` query parameter to filter the results.

### User Interface
- **Page Composition**: A single `/dashboard/products` page.
- **Tabs**: "Products" and "Services" tabs will be used to locally filter the `DataTable` based on the `kind` field.
- **Invoice Editor**: The `ProductSearchDropdown` will continue to work seamlessly, querying the combined table for active items.

## Requirements

**User stories**:
- As a business owner, I want to manage both products and services in my catalog so that I can add them to invoices and quotations.
- As a business owner, I want to deactivate a product or service instead of deleting it so that past invoices remain intact.

**Acceptance criteria**:
- **AC-1**: The `products` table has the new fields (`kind`, `pricing_model`, `unit`, `default_rate_minor`, `default_percent_bp`, `is_active`).
- **AC-2**: The `/api/products` endpoint returns both products and services, filterable by `kind`, and supports toggling `is_active`.
- **AC-3**: The UI on `/dashboard/products` provides tabs to switch between viewing Products and Services.
- **AC-4**: Soft deletion is enforced: items are marked `is_active = false` instead of being removed from the database.

## Build plan
1. **Database Migration** (AC-1): Add the new columns to the `products` table in Supabase.
2. **API Updates** (AC-2): Update `/api/products` GET, POST, PATCH handlers to validate and accept the new fields, handle soft delete, and support filtering by `kind`.
3. **Frontend Model** (AC-3): Update the frontend `Product` types and the `DataTable` to display the new columns (e.g. Unit, Pricing Model).
4. **Frontend UI** (AC-3, AC-4): Implement the Tabs on `/dashboard/products` and wire the Deactivate action in the row dropdown.

## Consequences
- We commit to a single-table inheritance-like model for our catalog. If services drastically diverge from products in required data fields, this table will become sparse (many null columns).

## Follow-up
- Ensure the existing invoice creation flow (and `ProductSearchDropdown`) defaults to showing only `is_active = true` items.

## Rationale
Using a single table is significantly faster to implement and removes the complexity of managing polymorphic associations in the `invoice_items` table. Since the new fields (pricing model, unit, rates) apply reasonably well to both concepts, the risk of a sparse table is low.
