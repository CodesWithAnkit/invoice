-- Migration for Phase 3 Customer fields
alter table public.customers
  add column if not exists email text,
  add column if not exists notes text,
  add column if not exists tax_id text;
