-- Phase 5: Estimate builder (docs/specs/mvp_implementation_plan.md §2.3, §2.4).
-- Extends the Phase 3 `quotations` skeleton with pricing/scope/timeline data.
-- Money = bigint minor units (R-08); rates = integer basis points; quantity = numeric(12,3).

alter type public.pricing_model_enum add value if not exists 'quantity';

do $$ begin
  create type public.discount_type_enum as enum ('none', 'fixed', 'percent');
exception
  when duplicate_object then null;
end $$;

-- ─── quotations: header, pricing inputs and server-computed totals ─────────────

alter table public.quotations
  add column if not exists customer_id uuid references public.customers (id) on delete restrict,
  add column if not exists title text not null default '',
  add column if not exists issue_date date,
  add column if not exists valid_until date,
  add column if not exists currency text not null default 'INR',
  add column if not exists current_version integer not null default 1,
  add column if not exists discount_type public.discount_type_enum not null default 'none',
  add column if not exists discount_value_minor bigint not null default 0,
  add column if not exists discount_bp integer not null default 0,
  add column if not exists tax_name text,
  add column if not exists tax_rate_bp integer not null default 0,
  add column if not exists subtotal_minor bigint not null default 0,
  add column if not exists discount_minor bigint not null default 0,
  add column if not exists taxable_minor bigint not null default 0,
  add column if not exists tax_minor bigint not null default 0,
  add column if not exists total_minor bigint not null default 0,
  add column if not exists notes text,
  add column if not exists internal_notes text,
  add column if not exists terms jsonb not null default '[]'::jsonb;

alter table public.quotations
  add constraint quotations_discount_value_check check (discount_value_minor >= 0),
  add constraint quotations_discount_bp_check check (discount_bp between 0 and 10000),
  add constraint quotations_tax_rate_check check (tax_rate_bp between 0 and 10000),
  add constraint quotations_totals_check check (
    subtotal_minor >= 0 and discount_minor between 0 and subtotal_minor
    and taxable_minor >= 0 and tax_minor >= 0 and total_minor >= 0
  ),
  add constraint quotations_validity_check check (
    valid_until is null or issue_date is null or valid_until >= issue_date
  );

create index if not exists quotations_customer_id_idx on public.quotations (customer_id);

-- The quotation's customer must belong to the same business (AC-AUTHZ).
create or replace function public.enforce_quotation_customer_business()
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

create trigger quotations_customer_same_business
  before insert or update of customer_id, business_id on public.quotations
  for each row execute function public.enforce_quotation_customer_business();

-- ─── quotation_items ───────────────────────────────────────────────────────────

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  position integer not null,
  service_id uuid references public.products (id) on delete set null,
  name text not null default '',
  description text,
  pricing_model public.pricing_model_enum not null default 'fixed',
  quantity numeric(12, 3) not null default 1 check (quantity > 0),
  unit text,
  rate_minor bigint not null default 0 check (rate_minor >= 0),
  percent_bp integer not null default 0 check (percent_bp between 0 and 10000),
  amount_minor bigint not null default 0 check (amount_minor >= 0),
  unique (quotation_id, position)
);

create index quotation_items_quotation_id_idx on public.quotation_items (quotation_id);

-- A catalog reference must point at the same business's catalog.
create or replace function public.enforce_quotation_item_service_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.service_id is not null and not exists (
    select 1
    from public.products p
    join public.quotations q on q.id = new.quotation_id
    where p.id = new.service_id and p.business_id is not distinct from q.business_id
  ) then
    raise exception 'service does not belong to this business' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger quotation_items_service_same_business
  before insert or update of service_id, quotation_id on public.quotation_items
  for each row execute function public.enforce_quotation_item_service_business();

-- ─── quotation_scope (1:1) ─────────────────────────────────────────────────────

create table public.quotation_scope (
  quotation_id uuid primary key references public.quotations (id) on delete cascade,
  overview text,
  deliverables text[] not null default '{}',
  included text[] not null default '{}',
  excluded text[] not null default '{}',
  assumptions text[] not null default '{}',
  revision_policy text
);

-- ─── quotation_milestones ──────────────────────────────────────────────────────

create table public.quotation_milestones (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  position integer not null,
  name text not null default '',
  description text,
  start_label text,
  end_label text,
  unique (quotation_id, position)
);

create index quotation_milestones_quotation_id_idx on public.quotation_milestones (quotation_id);

-- ─── RLS: child rows follow their quotation's business ────────────────────────

alter table public.quotation_items enable row level security;
alter table public.quotation_scope enable row level security;
alter table public.quotation_milestones enable row level security;

create policy "Business members manage quotation items"
  on public.quotation_items for all to authenticated
  using (exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.business_id = (select public.current_business_id())
  ))
  with check (exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.business_id = (select public.current_business_id())
  ));

create policy "Business members manage quotation scope"
  on public.quotation_scope for all to authenticated
  using (exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.business_id = (select public.current_business_id())
  ))
  with check (exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.business_id = (select public.current_business_id())
  ));

create policy "Business members manage quotation milestones"
  on public.quotation_milestones for all to authenticated
  using (exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.business_id = (select public.current_business_id())
  ))
  with check (exists (
    select 1 from public.quotations q
    where q.id = quotation_id and q.business_id = (select public.current_business_id())
  ));

-- ─── save_quotation_draft: one transaction for header + children ──────────────
-- Security invoker, so RLS still applies. The route handler validates the payload
-- and computes totals with src/modules/quotation/quotation.calculator.ts first.

create or replace function public.save_quotation_draft(
  p_quotation_id uuid,
  p_header jsonb,
  p_items jsonb,
  p_scope jsonb,
  p_milestones jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.quotations set
    title                = p_header->>'title',
    issue_date           = (p_header->>'issue_date')::date,
    valid_until          = (p_header->>'valid_until')::date,
    discount_type        = (p_header->>'discount_type')::public.discount_type_enum,
    discount_value_minor = (p_header->>'discount_value_minor')::bigint,
    discount_bp          = (p_header->>'discount_bp')::integer,
    tax_name             = p_header->>'tax_name',
    tax_rate_bp          = (p_header->>'tax_rate_bp')::integer,
    subtotal_minor       = (p_header->>'subtotal_minor')::bigint,
    discount_minor       = (p_header->>'discount_minor')::bigint,
    taxable_minor        = (p_header->>'taxable_minor')::bigint,
    tax_minor            = (p_header->>'tax_minor')::bigint,
    total_minor          = (p_header->>'total_minor')::bigint,
    notes                = p_header->>'notes',
    internal_notes       = p_header->>'internal_notes',
    terms                = coalesce(p_header->'terms', '[]'::jsonb),
    updated_at           = now()
  where id = p_quotation_id and status = 'Draft';

  if not found then
    raise exception 'quotation is not an editable draft' using errcode = 'P0002';
  end if;

  delete from public.quotation_items where quotation_id = p_quotation_id;
  insert into public.quotation_items
    (quotation_id, position, service_id, name, description, pricing_model,
     quantity, unit, rate_minor, percent_bp, amount_minor)
  select p_quotation_id, i.position, i.service_id, i.name, i.description,
         i.pricing_model::public.pricing_model_enum,
         i.quantity, i.unit, i.rate_minor, i.percent_bp, i.amount_minor
  from jsonb_to_recordset(p_items) as i(
    position integer, service_id uuid, name text, description text, pricing_model text,
    quantity numeric, unit text, rate_minor bigint, percent_bp integer, amount_minor bigint
  );

  insert into public.quotation_scope
    (quotation_id, overview, deliverables, included, excluded, assumptions, revision_policy)
  values (
    p_quotation_id,
    p_scope->>'overview',
    array(select jsonb_array_elements_text(coalesce(p_scope->'deliverables', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(p_scope->'included', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(p_scope->'excluded', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(p_scope->'assumptions', '[]'::jsonb))),
    p_scope->>'revision_policy'
  )
  on conflict (quotation_id) do update set
    overview        = excluded.overview,
    deliverables    = excluded.deliverables,
    included        = excluded.included,
    excluded        = excluded.excluded,
    assumptions     = excluded.assumptions,
    revision_policy = excluded.revision_policy;

  delete from public.quotation_milestones where quotation_id = p_quotation_id;
  insert into public.quotation_milestones
    (quotation_id, position, name, description, start_label, end_label)
  select p_quotation_id, m.position, m.name, m.description, m.start_label, m.end_label
  from jsonb_to_recordset(p_milestones) as m(
    position integer, name text, description text, start_label text, end_label text
  );
end;
$$;

revoke execute on function public.save_quotation_draft(uuid, jsonb, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.save_quotation_draft(uuid, jsonb, jsonb, jsonb, jsonb) to authenticated;
