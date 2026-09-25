-- Baseline of the legacy invoice schema as it exists in the hosted project on 2026-09-25.
--
-- Reconstructed from the hosted PostgREST schema description (table/column/type/default/FK metadata),
-- because a direct pg_dump was not possible. Not captured by that source and therefore not reproduced
-- here: FK ON DELETE behaviour, CHECK constraints, extra indexes, and RLS policies.
--
-- RLS is intentionally left disabled: the hosted anon key can currently read every row of these tables,
-- so this matches production behaviour. Ownership + RLS is Phase 0 work (docs/specs/mvp_implementation_plan.md).

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  aadhaar text,
  created_at timestamp without time zone default now(),
  company_name text
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text,
  customer_id uuid references public.customers (id),
  customer_name text,
  invoice_type text,
  subtotal numeric,
  sgst numeric,
  cgst numeric,
  total numeric,
  pdf_url text,
  created_at timestamp without time zone default now(),
  business_name text,
  business_address text,
  business_phone text,
  business_gstin text,
  bank_name text,
  account_name text,
  account_number text,
  ifsc text
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices (id),
  product_name text,
  quantity integer,
  unit_price numeric,
  total numeric
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  industry text,
  source text default 'manual',
  created_at timestamp without time zone default now()
);
