import { test, expect, request as playwrightRequest } from '@playwright/test';
import { createUser, signInViaUi } from '../utils/auth';

// Backend E2E for Phase 1 (Authentication): real HTTP against the running app
// and the local Supabase Auth server.

const PROTECTED_APIS: { method: 'GET' | 'POST'; path: string }[] = [
  { method: 'GET', path: '/api/products' },
  { method: 'POST', path: '/api/products/generate' },
  { method: 'GET', path: '/api/templates/list' },
  { method: 'POST', path: '/api/templates/save' },
  { method: 'POST', path: '/api/invoices/save' },
  { method: 'POST', path: '/api/ai-invoice' },
  { method: 'POST', path: '/api/ai-business-invoice' },
  { method: 'POST', path: '/api/business-invoice' },
  { method: 'POST', path: '/api/parse-invoice' },
];

test.describe('Unauthenticated access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const { method, path } of PROTECTED_APIS) {
    test(`${method} ${path} → 401`, async ({ request }) => {
      const res = await request.fetch(path, { method, data: method === 'POST' ? {} : undefined });
      expect(res.status()).toBe(401);
      expect(await res.json()).toEqual({ error: 'Unauthorized' });
    });
  }

  for (const path of ['/', '/dashboard/overview', '/dashboard/invoices', '/dashboard/customers', '/dashboard/settings']) {
    test(`page ${path} redirects to /login with next`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      const location = new URL(res.headers()['location'], 'http://x');
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('next')).toBe(path);
    });
  }

  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
    test(`public auth page ${path} → 200`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
    });
  }

  test('public quote path is not redirected to login', async ({ request }) => {
    const res = await request.get('/public/quote/some-token', { maxRedirects: 0 });
    expect(res.status()).not.toBe(307);
    expect(res.headers()['location']).toBeUndefined();
  });

  test('auth callback with an invalid code redirects to login with an error', async ({ request }) => {
    const res = await request.get('/auth/callback?code=not-a-real-code&next=/dashboard/overview', {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(307);
    const location = new URL(res.headers()['location']);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('error')).toBe('link_invalid');
  });

  test('auth callback without parameters redirects to login with an error', async ({ request }) => {
    const res = await request.get('/auth/callback', { maxRedirects: 0 });
    expect(new URL(res.headers()['location']).searchParams.get('error')).toBe('link_invalid');
  });
});

test.describe('Authenticated access', () => {
  test('protected API responds normally with a valid session', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.status()).toBe(200);
    expect(await res.json()).toHaveProperty('products');
  });

  test('protected page is served with a valid session', async ({ request }) => {
    const res = await request.get('/dashboard/overview', { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('signed-in user is sent away from sign-in pages', async ({ request }) => {
    for (const path of ['/login', '/register', '/forgot-password']) {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(307);
      expect(new URL(res.headers()['location'], 'http://x').pathname, path).toBe('/dashboard/overview');
    }
  });
});

test.describe('Logout invalidates the session (AC-AUTH-004)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('cookies captured before logout are rejected afterwards', async ({ page, baseURL }) => {
    const user = await createUser('api-logout');
    await page.goto('/login');
    await signInViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard\/overview/);

    // Keep a copy of the live session cookies.
    const captured = await page.context().storageState();
    const stale = await playwrightRequest.newContext({ baseURL, storageState: captured });
    expect((await stale.get('/api/products')).status()).toBe(200);

    // Log out through the UI.
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);

    // The old cookies must no longer grant access.
    const res = await stale.get('/api/products');
    expect(res.status()).toBe(401);
    const pageRes = await stale.get('/dashboard/overview', { maxRedirects: 0 });
    expect(pageRes.status()).toBe(307);
    await stale.dispose();
  });
});
