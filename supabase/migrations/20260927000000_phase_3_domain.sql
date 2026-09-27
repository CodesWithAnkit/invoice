-- Migration for Phase 3 Domain Decisions (Projects, Quotations, Customer Status)

create type public.customer_status as enum ('active', 'archived');

alter table public.customers
  add column status public.customer_status not null default 'active';

create type public.project_status as enum (
  'Draft',
  'Estimating',
  'Quoted',
  'Accepted',
  'Rejected',
  'Expired',
  'Completed',
  'Archived'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade default public.current_business_id(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  name text not null,
  status public.project_status not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_business_id_idx on public.projects (business_id);
create index projects_customer_id_idx on public.projects (customer_id);

alter table public.projects enable row level security;

create policy "Business members manage projects"
  on public.projects for all to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));

-- Ensure project customer belongs to the same business
create or replace function public.enforce_project_customer_business()
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

create trigger projects_customer_same_business
  before insert or update of customer_id, business_id on public.projects
  for each row execute function public.enforce_project_customer_business();


create type public.quotation_status as enum (
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired'
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade default public.current_business_id(),
  project_id uuid not null references public.projects (id) on delete cascade,
  status public.quotation_status not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotations_business_id_idx on public.quotations (business_id);
create index quotations_project_id_idx on public.quotations (project_id);

alter table public.quotations enable row level security;

create policy "Business members manage quotations"
  on public.quotations for all to authenticated
  using (business_id = (select public.current_business_id()))
  with check (business_id = (select public.current_business_id()));

-- Ensure quotation project belongs to the same business
create or replace function public.enforce_quotation_project_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = new.project_id and p.business_id is not distinct from new.business_id
  ) then
    raise exception 'project does not belong to this business' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger quotations_project_same_business
  before insert or update of project_id, business_id on public.quotations
  for each row execute function public.enforce_quotation_project_business();
