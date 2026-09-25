import { test, expect } from '@playwright/test';
import { createTenant, saveInvoice, type Tenant } from './utils/ownership';

// Frontend E2E for Phase 0: the invoice pages now read through the
// business-scoped API, so each business sees only its own data.

let a: Tenant;
let b: Tenant;
let aInvoiceId: string;

test.beforeAll(async ({ browser, baseURL }) => {
  a = await createTenant(browser, baseURL!, 'ui-own-a');
  b = await createTenant(browser, baseURL!, 'ui-own-b');
  const res = await saveInvoice(a.request, {
    customerName: 'Tenant A Client',
    invoiceNumber: 'INV-UI-A',
    items: [{ name: 'Website design', quantity: 2, price: 1500 }],
  });
  expect(res.status()).toBe(200);
  aInvoiceId = (await res.json()).invoice.id;
});

test.afterAll(async () => {
  await a?.context.close();
  await b?.context.close();
});

test('each business sees only its own invoices in the list', async () => {
  const pageA = await a.context.newPage();
  await pageA.goto('/dashboard/invoices');
  await expect(pageA.getByText('INV-UI-A').filter({ visible: true }).first()).toBeVisible();

  const pageB = await b.context.newPage();
  await pageB.goto('/dashboard/invoices');
  await expect(pageB.getByText('No matching active invoices')).toBeVisible();
  await expect(pageB.getByText('INV-UI-A')).toHaveCount(0);
});

test('opening another business’s invoice shows Not Found', async () => {
  const pageB = await b.context.newPage();
  await pageB.goto(`/dashboard/invoices/${aInvoiceId}`);
  await expect(pageB.getByRole('heading', { name: 'Invoice Not Found' })).toBeVisible();
  await expect(pageB.getByText('Tenant A Client')).toHaveCount(0);
});

test('owner’s invoice detail shows server-computed totals', async () => {
  const pageA = await a.context.newPage();
  await pageA.goto(`/dashboard/invoices/${aInvoiceId}`);
  await expect(pageA.getByText('Tenant A Client').filter({ visible: true }).first()).toBeVisible();
  // 2 × 1500 = 3000; +18% GST = 3540
  await expect(pageA.getByText('₹3,540', { exact: true }).filter({ visible: true }).first()).toBeVisible();
});

test('edit page loads the owner’s invoice; another business is sent back', async () => {
  const pageA = await a.context.newPage();
  await pageA.goto(`/dashboard/invoices/${aInvoiceId}/edit`);
  await expect(pageA.getByRole('heading', { name: 'Edit Invoice' }).first()).toBeVisible();
  await expect(pageA.getByLabel('Customer Name')).toHaveValue('Tenant A Client');

  const pageB = await b.context.newPage();
  await pageB.goto(`/dashboard/invoices/${aInvoiceId}/edit`);
  await expect(pageB).toHaveURL(/\/dashboard\/invoices$/);
});

test('customer list shows only the business’s own customers', async () => {
  const pageA = await a.context.newPage();
  await pageA.goto('/dashboard/customers');
  await expect(pageA.getByText('Tenant A Client').filter({ visible: true }).first()).toBeVisible();

  const pageB = await b.context.newPage();
  await pageB.goto('/dashboard/customers');
  await expect(pageB.getByText('No matching customers')).toBeVisible();
});

test('saving twice from the editor updates one invoice instead of creating duplicates', async () => {
  const pageB = await b.context.newPage();
  await pageB.goto('/');
  await pageB.getByLabel('Business Name').fill('B Studio');
  await pageB.getByLabel('Business Address').fill('2 Test Road');
  await pageB.getByLabel('Customer Name').fill('Twice Saved Client');
  await pageB.getByPlaceholder('Item description').locator('visible=true').first().fill('Logo');
  await pageB.getByPlaceholder('Qty').locator('visible=true').first().fill('1');
  await pageB.getByPlaceholder('Price').locator('visible=true').first().fill('500');

  const save = pageB.getByRole('button', { name: 'Save to DB' }).filter({ visible: true }).first();
  for (let i = 0; i < 2; i++) {
    const response = pageB.waitForResponse((r) => r.url().includes('/api/invoices/save'));
    await save.click();
    expect((await response).status()).toBe(200);
  }

  const list = await (await b.request.get('/api/invoices?search=Twice')).json();
  expect(list.data).toHaveLength(1);
  const customers = await (await b.request.get('/api/customers')).json();
  expect(customers.data.customers.filter((c: { name: string }) => c.name === 'Twice Saved Client')).toHaveLength(1);
});

test('owner can delete an invoice from the list', async () => {
  const res = await saveInvoice(a.request, { customerName: 'Delete Me Client', invoiceNumber: 'INV-UI-DEL' });
  const { id } = (await res.json()).invoice;

  const pageA = await a.context.newPage();
  pageA.on('dialog', (dialog) => dialog.accept());
  await pageA.goto('/dashboard/invoices');
  const row = pageA.getByRole('row').filter({ hasText: 'INV-UI-DEL' });
  await row.getByRole('button').last().click();
  await pageA.getByRole('menuitem', { name: 'Delete invoice' }).click();
  await expect(pageA.getByText('INV-UI-DEL')).toHaveCount(0);

  expect((await a.request.get(`/api/invoices/${id}`)).status()).toBe(404);
});
