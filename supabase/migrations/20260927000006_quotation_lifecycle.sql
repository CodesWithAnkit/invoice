-- Phase 6: quotation lifecycle (R-03, R-11, R-12, R-13, R-17).
-- Send assigns the number, freezes an immutable version snapshot and creates the
-- public token; revise / archive / regenerate-link follow the R-11 table. Every
-- change writes an insert-only activity row (AC-ACTIVITY-001…003).

-- ─── quotations: number, token, sent time ─────────────────────────────────────

alter table public.quotations
  add column if not exists quote_number text,
  add column if not exists public_token text,
  add column if not exists sent_at timestamptz;

create unique index if not exists quotations_business_quote_number_key
  on public.quotations (business_id, quote_number) where quote_number is not null;
create unique index if not exists quotations_public_token_key
  on public.quotations (public_token) where public_token is not null;

-- ─── numbering (R-13): per business, per year; only send touches it ───────────

create table public.quote_number_counters (
  business_id uuid not null references public.businesses (id) on delete cascade,
  year integer not null,
  next_value integer not null default 1,
  primary key (business_id, year)
);

-- No policies: only the security-definer functions below read or write it.
alter table public.quote_number_counters enable row level security;

-- ─── versions: immutable snapshots (R-03, AC-DATA-002/003) ────────────────────

create table public.quotation_versions (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  sent_at timestamptz not null default now(),
  unique (quotation_id, version)
);

create index quotation_versions_business_id_idx on public.quotation_versions (business_id);

alter table public.quotation_versions enable row level security;

-- Read-only for members; rows are written only by send_quotation(). No update or
-- delete policy exists, so snapshots can't be changed through the API.
create policy "Business members read quotation versions"
  on public.quotation_versions for select to authenticated
  using (business_id = (select public.current_business_id()));

revoke update, delete, truncate on public.quotation_versions from authenticated, anon;

-- ─── activity: insert-only history (AC-ACTIVITY-001…003) ─────────────────────

create table public.quotation_activity (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade
    default public.current_business_id(),
  type text not null check (type in (
    'created', 'updated', 'sent', 'viewed', 'accepted', 'rejected', 'expired',
    'revised', 'archived', 'duplicated', 'link_regenerated'
  )),
  actor text not null default 'owner' check (actor in ('owner', 'client', 'system')),
  version integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index quotation_activity_quotation_id_idx on public.quotation_activity (quotation_id, created_at);
create index quotation_activity_business_id_idx on public.quotation_activity (business_id);

alter table public.quotation_activity enable row level security;

create policy "Business members read quotation activity"
  on public.quotation_activity for select to authenticated
  using (business_id = (select public.current_business_id()));

create policy "Business members add quotation activity"
  on public.quotation_activity for insert to authenticated
  with check (
    business_id = (select public.current_business_id())
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_id and q.business_id = (select public.current_business_id())
    )
  );

revoke update, delete, truncate on public.quotation_activity from authenticated, anon;

-- ─── helpers ──────────────────────────────────────────────────────────────────

-- ≥128-bit random, URL-safe (R-17): 24 bytes → 32 base64url characters.
create or replace function public.new_public_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/=', '-_');
$$;

revoke execute on function public.new_public_token() from public, anon, authenticated;

-- Locks and returns the caller's quotation, or raises Q0404.
create or replace function public.lock_own_quotation(p_quotation_id uuid)
returns public.quotations
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotations;
begin
  select * into q from public.quotations
  where id = p_quotation_id and business_id = (select public.current_business_id())
  for update;
  if not found then
    raise exception 'quotation not found' using errcode = 'Q0404';
  end if;
  return q;
end;
$$;

revoke execute on function public.lock_own_quotation(uuid) from public, anon, authenticated;

-- ─── send (R-12, R-13): Draft → Sent ─────────────────────────────────────────
-- The route handler validates required data (AC-QUOTE-002) and builds the
-- snapshot from persisted data; this function does the atomic part.

create or replace function public.send_quotation(p_quotation_id uuid, p_snapshot jsonb)
returns table (quote_number text, public_token text, version integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotations;
  v_year integer;
  v_seq integer;
  v_prefix text;
  v_number text;
  v_token text;
  v_now timestamptz := now();
begin
  q := public.lock_own_quotation(p_quotation_id);
  if q.status <> 'Draft' then
    raise exception 'only draft quotations can be sent' using errcode = 'Q0409';
  end if;
  if q.issue_date is null then
    raise exception 'issue date is required' using errcode = 'Q0400';
  end if;

  v_number := q.quote_number;
  if v_number is null then
    v_year := extract(year from q.issue_date)::integer;
    insert into public.quote_number_counters as c (business_id, year, next_value)
    values (q.business_id, v_year, 2)
    on conflict (business_id, year) do update set next_value = c.next_value + 1
    returning c.next_value - 1 into v_seq;

    select coalesce(nullif(b.quote_prefix, ''), 'QT-') into v_prefix
    from public.businesses b where b.id = q.business_id;
    v_number := v_prefix || v_year::text || '-' || lpad(v_seq::text, 3, '0');
  end if;

  v_token := coalesce(q.public_token, public.new_public_token());

  update public.quotations set
    status = 'Sent',
    quote_number = v_number,
    public_token = v_token,
    sent_at = v_now,
    updated_at = v_now
  where id = q.id;

  insert into public.quotation_versions (quotation_id, business_id, version, snapshot, sent_at)
  values (
    q.id,
    q.business_id,
    q.current_version,
    jsonb_set(
      jsonb_set(p_snapshot, '{quotation,quote_number}', to_jsonb(v_number)),
      '{quotation,sent_at}', to_jsonb(v_now)
    ),
    v_now
  );

  insert into public.quotation_activity (quotation_id, business_id, type, actor, version, payload)
  values (q.id, q.business_id, 'sent', 'owner', q.current_version,
          jsonb_build_object('quote_number', v_number, 'total_minor', q.total_minor));

  return query select v_number, v_token, q.current_version;
end;
$$;

-- ─── revise (R-11): Sent/Viewed/Rejected/Expired → Draft, version + 1 ─────────

create or replace function public.revise_quotation(p_quotation_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotations;
begin
  q := public.lock_own_quotation(p_quotation_id);
  if q.status not in ('Sent', 'Viewed', 'Rejected', 'Expired') then
    raise exception 'this quotation can''t be revised' using errcode = 'Q0409';
  end if;

  update public.quotations set
    status = 'Draft',
    current_version = q.current_version + 1,
    updated_at = now()
  where id = q.id;

  insert into public.quotation_activity (quotation_id, business_id, type, actor, version, payload)
  values (q.id, q.business_id, 'revised', 'owner', q.current_version + 1,
          jsonb_build_object('from_status', q.status));

  return q.current_version + 1;
end;
$$;

-- ─── archive (R-11): anything but Archived → Archived (terminal) ──────────────

create or replace function public.archive_quotation(p_quotation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotations;
begin
  q := public.lock_own_quotation(p_quotation_id);
  if q.status = 'Archived' then
    raise exception 'quotation is already archived' using errcode = 'Q0409';
  end if;

  update public.quotations set status = 'Archived', updated_at = now() where id = q.id;

  insert into public.quotation_activity (quotation_id, business_id, type, actor, version, payload)
  values (q.id, q.business_id, 'archived', 'owner', q.current_version,
          jsonb_build_object('from_status', q.status));
end;
$$;

-- ─── regenerate link (R-17): the old link stops working ──────────────────────

create or replace function public.regenerate_quotation_token(p_quotation_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.quotations;
  v_token text := public.new_public_token();
begin
  q := public.lock_own_quotation(p_quotation_id);
  if q.public_token is null then
    raise exception 'quotation has not been sent' using errcode = 'Q0409';
  end if;
  if q.status = 'Archived' then
    raise exception 'quotation is archived' using errcode = 'Q0409';
  end if;

  update public.quotations set public_token = v_token, updated_at = now() where id = q.id;

  insert into public.quotation_activity (quotation_id, business_id, type, actor, version)
  values (q.id, q.business_id, 'link_regenerated', 'owner', q.current_version);

  return v_token;
end;
$$;

revoke execute on function public.send_quotation(uuid, jsonb) from public, anon;
revoke execute on function public.revise_quotation(uuid) from public, anon;
revoke execute on function public.archive_quotation(uuid) from public, anon;
revoke execute on function public.regenerate_quotation_token(uuid) from public, anon;
grant execute on function public.send_quotation(uuid, jsonb) to authenticated;
grant execute on function public.revise_quotation(uuid) to authenticated;
grant execute on function public.archive_quotation(uuid) to authenticated;
grant execute on function public.regenerate_quotation_token(uuid) to authenticated;

-- Status, number, token and version change only through the functions above.
-- Direct updates by members may still write draft content (save_quotation_draft
-- runs as the caller), so guard the lifecycle columns with a trigger.
create or replace function public.guard_quotation_lifecycle_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Security-definer lifecycle functions run as the table owner.
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;
  if new.status is distinct from old.status
     or new.quote_number is distinct from old.quote_number
     or new.public_token is distinct from old.public_token
     or new.current_version is distinct from old.current_version
     or new.sent_at is distinct from old.sent_at then
    raise exception 'quotation lifecycle fields change only through send/revise/archive'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger quotations_guard_lifecycle
  before update on public.quotations
  for each row execute function public.guard_quotation_lifecycle_columns();

-- ─── save_quotation_draft: now also records "updated" (coalesced) ─────────────

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
declare
  v_business_id uuid;
  v_version integer;
  v_last_type text;
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
  where id = p_quotation_id and status = 'Draft'
  returning business_id, current_version into v_business_id, v_version;

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

  -- Auto-save runs every few seconds; one "updated" entry per editing session.
  select a.type into v_last_type
  from public.quotation_activity a
  where a.quotation_id = p_quotation_id
  order by a.created_at desc
  limit 1;

  if v_last_type is distinct from 'updated' then
    insert into public.quotation_activity (quotation_id, business_id, type, actor, version)
    values (p_quotation_id, v_business_id, 'updated', 'owner', v_version);
  end if;
end;
$$;
