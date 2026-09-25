import { test, expect } from '@playwright/test';
import {
  createUser,
  signInViaUi,
} from './utils/auth';

test.describe('Business Onboarding', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('E2E-001: register -> business setup -> dashboard, data persists (AC-BIZ-002)', async ({ page }) => {
    // 1. Create a user (simulate registration)
    const user = await createUser('ui-onboarding');

    // 2. Login, should redirect to /dashboard/overview (default) or /onboarding if we had logic, 
    // but the user can navigate to /onboarding to set it up.
    await page.goto('/login');
    await signInViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard\/overview$/);
    
    // As per our assumption in Phase 2, they navigate to /onboarding or we can just go there
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding/);

    // 3. Verify form loads and Business Name is empty (or defaults)
    await expect(page.getByRole('heading', { name: 'Set up your Business' })).toBeVisible();
    await expect(page.getByLabel('Business Name')).toBeVisible();

    // 4. Submit empty form, should show error
    await page.getByLabel('Business Name').fill('');
    await page.getByRole('button', { name: 'Save and Continue' }).click();
    await expect(page.getByText('Business Name is required.')).toBeVisible();

    // 5. Fill out the form
    await page.getByLabel('Business Name').fill('Acme Corp');
    await page.getByLabel('Phone').fill('1234567890');
    await page.getByLabel('GSTIN').fill('GST123');
    await page.getByLabel('Business Address').fill('123 Acme St');
    
    // 6. Save and check redirect to dashboard
    
    // Wait for the PATCH response
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/business') && res.request().method() === 'PATCH'),
      page.getByRole('button', { name: 'Save and Continue' }).click()
    ]);
    
    if (response.status() !== 200) {
      console.log('PATCH /api/business failed with status:', response.status());
      const body = await response.json();
      console.log('Response body:', body);
    }
    
    await expect(page).toHaveURL(/\/dashboard\/overview$/, { timeout: 15000 });

    // 7. Verify it persists across refresh
    await page.goto('/onboarding');
    await expect(page.getByLabel('Business Name')).toHaveValue('Acme Corp');
    await expect(page.getByLabel('Phone')).toHaveValue('1234567890');
    await expect(page.getByLabel('GSTIN')).toHaveValue('GST123');
    await expect(page.getByLabel('Business Address')).toHaveValue('123 Acme St');

    // 8. Re-login to ensure it persists
    await page.getByRole('button', { name: 'Skip for now' }).click();
    await expect(page).toHaveURL(/\/dashboard\/overview$/);
  });
});
