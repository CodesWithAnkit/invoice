import { test, expect } from '@playwright/test';

// Backend E2E for Phase 2 (Business Onboarding)

test.describe('Business API', () => {
  test.describe('Unauthenticated access', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('unauthenticated access is rejected', async ({ request }) => {
      const resGet = await request.get('/api/business');
    expect(resGet.status()).toBe(401);

    const resPatch = await request.patch('/api/business', {
      data: { name: 'New Name' }
    });
    expect(resPatch.status()).toBe(401);
  });
  });

  test('authenticated user can fetch and update business details', async ({ request }) => {
    // 1. Fetch
    const resGet = await request.get('/api/business');
    expect(resGet.status()).toBe(200);
    const dataGet = await resGet.json();
    expect(dataGet).toHaveProperty('success', true);
    expect(dataGet.data).toHaveProperty('name');

    // 2. Update
    const newName = 'Updated Business ' + Date.now();
    const resPatch = await request.patch('/api/business', {
      data: { name: newName, phone: '9999999999' }
    });
    expect(resPatch.status()).toBe(200);
    const dataPatch = await resPatch.json();
    expect(dataPatch).toHaveProperty('success', true);
    expect(dataPatch.data.name).toBe(newName);
    expect(dataPatch.data.phone).toBe('9999999999');

    // 3. Verify it stuck
    const resVerify = await request.get('/api/business');
    const dataVerify = await resVerify.json();
    expect(dataVerify.data.name).toBe(newName);
    expect(dataVerify.data.phone).toBe('9999999999');
  });
});
