-- Phase 0: User → Business ownership and Row Level Security.
-- See docs/specs/mvp_implementation_plan.md (Phase 0) and spec_review.md (R-26).
--
-- After this migration:
--   * every auth user owns exactly one business (created by trigger; backfilled here)
--   * customers / invoices / products carry business_id, filled from the session
--     by a column default (never trusted from the client)
--   * RLS lets a signed-in user see and change only their own business's rows;
--     the anon key sees nothing
--   * pre-existing rows keep business_id = NULL (invisible) until an admin runs
--     public.claim_legacy_data('<owner email>')

-- 1. Businesses ---------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default 'My business',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "Owners can read their business"
  on public.businesses for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "Owners can update their business"
  on public.businesses for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

-- The caller's business. SECURITY DEFINER so RLS policies can use it without
-- recursing into businesses' own policies. Returns NULL for anon.
create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.businesses where owner_user_id = (select auth.uid())
$$;

revoke execute on function public.current_business_id() from public, anon;
grant execute on function public.current_business_id() to authenticated;

-- Create a business for every new user.
create or replace function public.handle_new_user_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.businesses (owner_user_id)
  values (new.id)
  on conflict (owner_user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_business
  after insert on auth.users
  for each row execute function public.handle_new_user_business();

-- Backfill businesses for users who signed up before this migration.
insert into public.businesses (owner_user_id)
select id from auth.users
on conflict (owner_user_id) do nothing;

-- 2. Ownership columns ----------------------------------------------------------

alter table public.customers
  add column business_id uuid references public.businesses (id) on delete cascade
  default public.current_business_id();

alter table public.invoices
  add column business_id uuid references public.businesses (id) on delete cascade
  default public.current_business_id();

alter table public.products
  add column business_id uuid references public.businesses (id) on delete cascade
  default public.current_business_id();

create index customers_business_id_idx on public.customers (business_id);
create index invoices_business_id_idx on public.invoices (business_id);
create index products_business_id_idx on public.products (business_id);
create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- An invoice may only reference a customer of the same business.
create or replace function public.enforce_invoice_customer_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.customer_id is not null and not exists (
    select 1 from public.customers c
    where c.id = new.customer_id and c.business_id is not distinct from new.business_id
  ) then
    raise exception 'customer does not belong to this business' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger invoices_customer_same_business
  before insert or update of customer_id, business_id on public.invoices
  for each row execute function public.enforce_invoice_customer_business();

-- 3. Row Level Security ---------------------------------------------------------

alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.products enable row level security;

create policy "Business members manage customers"
  on public.customers for all to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));

create policy "Business members manage invoices"
  on public.invoices for all to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));

create policy "Business members manage products"
  on public.products for all to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));

-- Items inherit ownership from their invoice.
create policy "Business members manage invoice items"
  on public.invoice_items for all to authenticated
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.business_id = (select public.current_business_id())
  ))
  with check (exists (
    select 1 from public.invoices i
    where i.id = invoice_items.invoice_id
      and i.business_id = (select public.current_business_id())
  ));

-- 4. Legacy data claim (R-26) ---------------------------------------------------
-- Admin-only: run once in the SQL editor after the owner has signed up, e.g.
--   select * from public.claim_legacy_data('owner@example.com');

create or replace function public.claim_legacy_data(owner_email text)
returns table (customers_claimed int, invoices_claimed int, products_claimed int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  select b.id into target
  from public.businesses b
  join auth.users u on u.id = b.owner_user_id
  where lower(u.email) = lower(owner_email);

  if target is null then
    raise exception 'No business found for %', owner_email;
  end if;

  update public.customers set business_id = target where business_id is null;
  get diagnostics customers_claimed = row_count;
  update public.invoices set business_id = target where business_id is null;
  get diagnostics invoices_claimed = row_count;
  update public.products set business_id = target where business_id is null;
  get diagnostics products_claimed = row_count;
  return next;
end;
$$;

revoke execute on function public.claim_legacy_data(text) from public, anon, authenticated;

-- 5. Invoice PDF storage (C6) ---------------------------------------------------
-- Private bucket; objects live under "<business_id>/…".

insert into storage.buckets (id, name, public)
values ('invoice-pdfs', 'invoice-pdfs', false)
on conflict (id) do update set public = false;

create policy "Business members read invoice PDFs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and (storage.foldername(name))[1] = (select public.current_business_id())::text
  );

create policy "Business members upload invoice PDFs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoice-pdfs'
    and (storage.foldername(name))[1] = (select public.current_business_id())::text
  );

create policy "Business members replace invoice PDFs"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and (storage.foldername(name))[1] = (select public.current_business_id())::text
  );
