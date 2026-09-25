# Runbook — Phase 0 rollout to the hosted Supabase project

**Applies to:** migration `supabase/migrations/20260926000000_business_ownership.sql` and the Phase 0 code (business-scoped API routes, RLS).
**Legacy data owner (decided 2026-09-26):** `webans001@gmail.com`. The account already exists in the hosted project and is confirmed.

## Why the order matters

- **Code before migration:** the new API routes call `current_business_id()`, which doesn't exist yet, so every page answers "No business is set up".
- **Migration before code:** RLS is on, but the old code reads tables with the anon key, so the old app shows no data.
- **Migration without the claim:** existing rows have no `business_id`, so they are hidden from everyone (intact, but invisible).

Do steps 2–4 together, in one short window.

## Steps

1. **Back up.** In the Supabase dashboard, open Database → Backups and confirm there is a recent backup (or take one).

2–3. **Simplest: one script.** In Supabase Dashboard → SQL Editor, paste all of [`phase0_hosted_rollout.sql`](phase0_hosted_rollout.sql) and click Run. It applies both migrations, claims all existing data for webans001@gmail.com, and records the migrations, in one transaction (all or nothing). It was dry-run on a production-like copy on 2026-09-26. If you use it, skip to step 4.

2. **Or apply the migrations yourself** (either option):
   - **CLI:** reset the database password (Settings → Database; the one in `.env` is rejected), then:
     ```bash
     npx supabase link --project-ref pffulyqpbqcglptrawat
     npx supabase db push
     ```
     `20260925000000_baseline_legacy_schema.sql` is safe on the hosted DB: it only uses `create table if not exists`.
   - **SQL editor:** paste and run `20260925000000_baseline_legacy_schema.sql`, then `20260926000000_business_ownership.sql`.

3. **Assign all existing data to the owner** (SQL editor):
   ```sql
   select * from public.claim_legacy_data('webans001@gmail.com');
   ```
   Expected: `customers_claimed = 23`, `invoices_claimed = 4`, `products_claimed = 0` (the counts as of 2026-09-25). Invoice items follow their invoices automatically.

4. **Deploy / restart the app** with the Phase 0 code.

5. **Verify:**
   ```sql
   -- nothing left unowned
   select
     (select count(*) from public.customers where business_id is null) as customers_unowned,
     (select count(*) from public.invoices  where business_id is null) as invoices_unowned,
     (select count(*) from public.products  where business_id is null) as products_unowned;
   -- RLS on
   select relname, relrowsecurity from pg_class
   where relname in ('customers','invoices','invoice_items','products','businesses');
   ```
   Then sign in as webans001@gmail.com and check that the invoices and customers lists show the existing data. Finally, confirm that the anon key alone now reads nothing:
   ```bash
   curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/customers?select=id" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"   # → []
   ```

6. **Storage:** the migration makes the `invoice-pdfs` bucket private. Any old public PDF links stored in `invoices.pdf_url` stop working. The editor has not uploaded PDFs for some time, so this only affects older rows, if any.

## Rollback

- Disable RLS on the five tables (`alter table … disable row level security`) to restore visibility immediately. Keep the columns; they are harmless.
- Redeploy the previous app version only together with that change.
