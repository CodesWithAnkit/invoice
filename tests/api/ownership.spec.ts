import * as fs from 'node:fs';
import * as path from 'node:path';
import { test, expect } from '@playwright/test';
import { adminClient, createUser } from '../utils/auth';
import {
  anonDbClient,
  businessIdFor,
  createTenant,
  saveInvoice,
  userDbClient,
  type Tenant,
} from '../utils/ownership';

// Backend E2E for Phase 0 (security & ownership): business isolation through
// our API *and* directly against the database (RLS), plus server-side totals.

let a: Tenant;
let b: Tenant;

test.beforeAll(async ({ browser, baseURL }) => {
  a = await createTenant(browser, baseURL!, 'own-a');
  b = await createTenant(browser, baseURL!, 'own-b');
});

test.afterAll(async () => {
  await a?.context.close();
  await b?.context.close();
});

async function createInvoiceFor(tenant: Tenant, options: Parameters<typeof saveInvoice>[1] = {}) {
  const res = await saveInvoice(tenant.request, options);
  expect(res.status(), await res.text()).toBe(200);
  return (await res.json()).invoice as { id: string; customer_id: string; total: number; business_id: string };
}

test.describe('Ownership model', () => {
  test('every new user gets exactly one business', async () => {
    const user = await createUser('own-trigger');
    const { data, error } = await adminClient().from('businesses').select('id').eq('owner_user_id', user.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  test('saved records belong to the caller’s business, ignoring a client-supplied business_id', async () => {
    const invoice = await createInvoiceFor(a, { extraInvoiceFields: { business_id: b.businessId } });
    expect(invoice.business_id).toBe(a.businessId);

    const { data: customer } = await adminClient()
      .from('customers')
      .select('business_id')
      .eq('id', invoice.customer_id)
      .single();
    expect(customer?.business_id).toBe(a.businessId);
  });
});

test.describe('Server-side totals (C5)', () => {
  test('stored totals are recomputed from items and tax, not taken from the client', async () => {
    const invoice = await createInvoiceFor(a, {
      items: [
        { name: 'Design', quantity: 2, price: 100.5 },
        { name: 'Build', quantity: 3, price: 33.33 },
      ],
      taxPercent: 18,
    });
    // subtotal = 201.00 + 99.99 = 300.99; sgst = cgst = round2(300.99 × 9%) = 27.09
    const { data } = await adminClient()
      .from('invoices')
      .select('subtotal, sgst, cgst, total')
      .eq('id', invoice.id)
      .single();
    expect(Number(data!.subtotal)).toBe(300.99);
    expect(Number(data!.sgst)).toBe(27.09);
    expect(Number(data!.cgst)).toBe(27.09);
    expect(Number(data!.total)).toBe(355.17);

    const { data: items } = await adminClient()
      .from('invoice_items')
      .select('total')
      .eq('invoice_id', invoice.id)
      .order('total');
    expect(items!.map((i) => Number(i.total))).toEqual([99.99, 201]);
  });

  test('rejects negative or non-numeric line items', async () => {
    const res = await saveInvoice(a.request, { items: [{ name: 'Bad', quantity: -1, price: 10 }] });
    expect(res.status()).toBe(400);
    const res2 = await saveInvoice(a.request, { items: [{ name: 'Bad', quantity: 1, price: 'abc' as unknown as number }] });
    expect(res2.status()).toBe(400);
  });

  test('re-saving an invoice updates it and keeps the same customer (D1)', async () => {
    const first = await createInvoiceFor(a, { customerName: 'Repeat Client', invoiceNumber: 'INV-R1' });
    const second = await createInvoiceFor(a, {
      id: first.id,
      customerName: 'Repeat Client',
      invoiceNumber: 'INV-R1',
      items: [{ name: 'Widget', quantity: 1, price: 50 }],
    });
    expect(second.id).toBe(first.id);
    expect(second.customer_id).toBe(first.customer_id);

    const { count } = await adminClient()
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', a.businessId)
      .eq('name', 'Repeat Client');
    expect(count).toBe(1);
  });
});

test.describe('Cross-business access through the API (AC-AUTHZ-001/002)', () => {
  test('another business’s invoice is invisible: list, get, delete, overwrite', async () => {
    const invoice = await createInvoiceFor(a, { invoiceNumber: 'INV-PRIVATE' });

    const listB = await (await b.request.get('/api/invoices')).json();
    expect(listB.data.map((i: { id: string }) => i.id)).not.toContain(invoice.id);
    const listA = await (await a.request.get('/api/invoices')).json();
    expect(listA.data.map((i: { id: string }) => i.id)).toContain(invoice.id);

    expect((await b.request.get(`/api/invoices/${invoice.id}`)).status()).toBe(404);
    expect((await b.request.delete(`/api/invoices/${invoice.id}`)).status()).toBe(404);

    const overwrite = await saveInvoice(b.request, { id: invoice.id, items: [{ name: 'Hijack', quantity: 1, price: 1 }] });
    expect(overwrite.status()).toBe(404);

    const stillThere = await a.request.get(`/api/invoices/${invoice.id}`);
    expect(stillThere.status()).toBe(200);
    const body = await stillThere.json();
    expect(body.data.invoice.invoice_number).toBe('INV-PRIVATE');
    expect(body.data.items.map((i: { product_name: string }) => i.product_name)).toEqual(['Widget']);
  });

  test('customer list only shows the caller’s customers', async () => {
    await createInvoiceFor(a, { customerName: 'Only For A' });
    const bCustomers = await (await b.request.get('/api/customers')).json();
    expect(bCustomers.data.customers.map((c: { name: string }) => c.name)).not.toContain('Only For A');
    const aCustomers = await (await a.request.get('/api/customers')).json();
    expect(aCustomers.data.customers.map((c: { name: string }) => c.name)).toContain('Only For A');
  });

  test('products list only shows the caller’s products', async () => {
    const aDb = await userDbClient(a.user.email, a.user.password);
    const { error } = await aDb.from('products').insert({ name: 'A-only product', price: 10 });
    expect(error).toBeNull();

    const bProducts = await (await b.request.get('/api/products?search=A-only')).json();
    expect(bProducts.products).toEqual([]);
    const aProducts = await (await a.request.get('/api/products?search=A-only')).json();
    expect(aProducts.products.map((p: { name: string }) => p.name)).toContain('A-only product');
  });

  test('owner can delete their own invoice', async () => {
    const invoice = await createInvoiceFor(a, { invoiceNumber: 'INV-DEL' });
    const res = await a.request.delete(`/api/invoices/${invoice.id}`);
    expect(res.status()).toBe(200);
    expect((await a.request.get(`/api/invoices/${invoice.id}`)).status()).toBe(404);
    const { count } = await adminClient()
      .from('invoice_items')
      .select('id', { count: 'exact', head: true })
      .eq('invoice_id', invoice.id);
    expect(count).toBe(0);
  });

  test('malformed ids answer 404, not 500', async () => {
    expect((await a.request.get('/api/invoices/not-a-uuid')).status()).toBe(404);
    expect((await saveInvoice(a.request, { id: 'not-a-uuid' })).status()).toBe(404);
  });
});

test.describe('Direct database access (RLS, C3)', () => {
  test('the public anon key reads nothing and writes nothing', async () => {
    await createInvoiceFor(a);
    const anon = anonDbClient();
    for (const table of ['customers', 'invoices', 'invoice_items', 'products', 'businesses']) {
      const { data, error } = await anon.from(table).select('*').limit(5);
      expect(error, table).toBeNull();
      expect(data, table).toEqual([]);
    }
    const { error: insertError } = await anon.from('customers').insert({ name: 'Anon write' });
    expect(insertError).not.toBeNull();
  });

  test('a signed-in user sees only their own rows even when querying the database directly', async () => {
    const invoice = await createInvoiceFor(a, { invoiceNumber: 'INV-RLS' });
    const bDb = await userDbClient(b.user.email, b.user.password);

    const { data: visible } = await bDb.from('invoices').select('id').eq('id', invoice.id);
    expect(visible).toEqual([]);
    const { data: items } = await bDb.from('invoice_items').select('id').eq('invoice_id', invoice.id);
    expect(items).toEqual([]);

    const { data: updated } = await bDb.from('invoices').update({ total: 0 }).eq('id', invoice.id).select();
    expect(updated).toEqual([]);
    const { data: deleted } = await bDb.from('invoices').delete().eq('id', invoice.id).select();
    expect(deleted).toEqual([]);

    const { data: after } = await adminClient().from('invoices').select('total').eq('id', invoice.id).single();
    expect(Number(after!.total)).toBeGreaterThan(0);
  });

  test('cannot write rows into another business', async () => {
    const bDb = await userDbClient(b.user.email, b.user.password);
    const { error } = await bDb.from('customers').insert({ name: 'Planted', business_id: a.businessId });
    expect(error?.code).toBe('42501');
  });

  test('an invoice cannot reference another business’s customer', async () => {
    const aInvoice = await createInvoiceFor(a, { customerName: 'A Customer' });
    const bDb = await userDbClient(b.user.email, b.user.password);
    const { error } = await bDb.from('invoices').insert({ invoice_number: 'X', customer_id: aInvoice.customer_id });
    expect(error).not.toBeNull();
  });

  test('users cannot read other businesses or run the legacy claim', async () => {
    const bDb = await userDbClient(b.user.email, b.user.password);
    const { data } = await bDb.from('businesses').select('id');
    expect(data?.map((r) => r.id)).toEqual([b.businessId]);

    const { error } = await bDb.rpc('claim_legacy_data', { owner_email: b.user.email });
    expect(error).not.toBeNull();
  });
});

test.describe('Legacy data claim (R-26)', () => {
  test('unowned rows are hidden until an admin assigns them to an account', async () => {
    const owner = await createUser('own-legacy');
    const ownerBusiness = await businessIdFor(owner.id);
    const admin = adminClient();

    const { data: legacy, error } = await admin
      .from('customers')
      .insert({ name: 'Legacy Customer', business_id: null })
      .select('id')
      .single();
    expect(error).toBeNull();

    const ownerDb = await userDbClient(owner.email, owner.password);
    expect((await ownerDb.from('customers').select('id').eq('id', legacy!.id)).data).toEqual([]);

    const { data: counts, error: claimError } = await admin.rpc('claim_legacy_data', { owner_email: owner.email });
    expect(claimError).toBeNull();
    expect(counts[0].customers_claimed).toBeGreaterThanOrEqual(1);

    const { data: claimed } = await admin.from('customers').select('business_id').eq('id', legacy!.id).single();
    expect(claimed!.business_id).toBe(ownerBusiness);
    expect((await ownerDb.from('customers').select('id').eq('id', legacy!.id)).data).toHaveLength(1);
  });
});

test.describe('Other Phase 0 guards', () => {
  test('template publishing is disabled unless explicitly enabled', async () => {
    const res = await a.request.post('/api/templates/save', {
      data: { template: { name: 'Injected', items: [] } },
    });
    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ error: 'Template publishing is disabled.' });
  });

  test('no source file references the removed shared credentials or localStorage auth flag', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const text = fs.readFileSync(full, 'utf8');
          if (/NEXT_PUBLIC_APP_(USER|PASS)|invoice_auth/.test(text)) offenders.push(full);
        }
      }
    };
    walk(path.join(__dirname, '../../src'));
    expect(offenders).toEqual([]);
  });
});
