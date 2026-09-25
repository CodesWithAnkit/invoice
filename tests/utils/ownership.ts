import { createClient } from '@supabase/supabase-js';
import { expect, type APIRequestContext, type Browser, type BrowserContext } from '@playwright/test';
import { adminClient, createUser, signInViaUi } from './auth';

// Helpers for business-isolation tests: each "tenant" is a fresh user with
// their own business and a signed-in browser context.

export type Tenant = {
  user: { id: string; email: string; password: string };
  businessId: string;
  context: BrowserContext;
  /** Shares the context's session cookies. */
  request: APIRequestContext;
};

export async function createTenant(browser: Browser, baseURL: string, prefix: string): Promise<Tenant> {
  const user = await createUser(prefix);
  const context = await browser.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto('/login');
  await signInViaUi(page, user.email, user.password);
  await expect(page).toHaveURL(/\/dashboard\/overview/);
  await page.close();
  return { user, businessId: await businessIdFor(user.id), context, request: context.request };
}

export async function businessIdFor(userId: string) {
  const { data, error } = await adminClient()
    .from('businesses')
    .select('id')
    .eq('owner_user_id', userId)
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Supabase client acting as the user directly (bypasses our API; RLS applies). */
export async function userDbClient(email: string, password: string) {
  const client = createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

/** Anonymous Supabase client (only the public anon key, like any website visitor). */
export function anonDbClient() {
  return createClient(process.env.E2E_SUPABASE_URL!, process.env.E2E_SUPABASE_ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type SaveOptions = {
  id?: string;
  customerName?: string;
  invoiceNumber?: string;
  items?: { name: string; quantity: number; price: number }[];
  taxPercent?: number;
  extraInvoiceFields?: Record<string, unknown>;
};

/** POST /api/invoices/save the way the editor toolbar does. */
export function saveInvoice(request: APIRequestContext, options: SaveOptions = {}) {
  const {
    id,
    customerName = 'Acme Client',
    invoiceNumber = 'INV-001',
    items = [{ name: 'Widget', quantity: 2, price: 100.5 }],
    taxPercent = 18,
    extraInvoiceFields = {},
  } = options;
  return request.post('/api/invoices/save', {
    multipart: {
      customer: JSON.stringify({ name: customerName, address: '1 Test Street', phone: '', aadhaar: '', companyName: '' }),
      invoice: JSON.stringify({
        id,
        invoice_number: invoiceNumber,
        invoice_type: 'invoice',
        tax_percent: taxPercent,
        // Deliberately wrong client totals: the server must ignore them.
        subtotal: 1,
        sgst: 1,
        cgst: 1,
        total: 999999,
        business_name: 'Tenant Business',
        business_address: 'Somewhere',
        business_phone: '',
        business_gstin: '',
        bank: {},
        ...extraInvoiceFields,
      }),
      items: JSON.stringify(items),
    },
  });
}
