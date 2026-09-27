import { test, expect } from '@playwright/test';

test.describe('Settings Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings page
    await page.goto('/dashboard/settings');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display and update Company Profile', async ({ page }) => {
    // Make sure we are on Company Profile section
    await page.getByRole('button', { name: 'Company Profile' }).click();

    // Fill the profile form
    await page.getByLabel('Company Name *').fill('Acme Corp 2026');
    await page.getByLabel('Email').fill('hello@acme2026.com');
    await page.getByLabel('Phone').fill('123-456-7890');
    await page.getByLabel('Website').fill('https://acme2026.com');
    await page.getByRole('button', { name: 'Save Profile' }).click();

    // Should see success toast
    await expect(page.getByText('Company profile updated successfully')).toBeVisible();
    
    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Company Name *')).toHaveValue('Acme Corp 2026');
    await expect(page.getByLabel('Email')).toHaveValue('hello@acme2026.com');
  });

  test('should display and update Quotation Settings', async ({ page }) => {
    // Navigate to Quotation Settings
    await page.getByRole('button', { name: 'Quotation Settings' }).click();

    // Update settings
    await page.getByLabel('Currency (Code) *').fill('GBP');
    await page.getByLabel('Default Validity (Days) *').fill('45');
    await page.getByLabel('Quote Number Prefix').fill('EST-');
    await page.getByLabel('Default Notes (Appears on bottom of quotes/invoices)').fill('Terms and conditions apply.');
    
    await page.getByRole('button', { name: 'Save Settings' }).click();

    // Should see success toast
    await expect(page.getByText('Quotation settings updated successfully')).toBeVisible();

    // Reload to verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Quotation Settings' }).click();
    
    await expect(page.getByLabel('Currency (Code) *')).toHaveValue('GBP');
    await expect(page.getByLabel('Default Validity (Days) *')).toHaveValue('45');
    await expect(page.getByLabel('Quote Number Prefix')).toHaveValue('EST-');
    await expect(page.getByLabel('Default Notes (Appears on bottom of quotes/invoices)')).toHaveValue('Terms and conditions apply.');
  });
});
