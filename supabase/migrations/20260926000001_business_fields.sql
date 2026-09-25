-- Migration to add remaining fields to the businesses table

alter table public.businesses
  add column if not exists logo_path text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists website text,
  add column if not exists tax_id text,
  add column if not exists currency text default 'INR',
  add column if not exists timezone text default 'Asia/Kolkata',
  add column if not exists default_validity_days integer default 30,
  add column if not exists default_terms jsonb default '[]'::jsonb,
  add column if not exists default_notes text,
  add column if not exists default_tax_name text,
  add column if not exists default_tax_rate_bp integer,
  add column if not exists quote_prefix text default 'QT-',
  add column if not exists allow_client_pdf_download boolean default true;
