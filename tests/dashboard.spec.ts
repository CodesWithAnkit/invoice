import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('displays invoices list', async ({ page }) => {
    // Navigate to the dashboard. The global setup has already authenticated us.
    await page.goto('/dashboard/invoices');
    
    // Check that the table or "No invoices found" message is present
    const table = page.locator('table');
    const noInvoices = page.getByText('No invoices found');
    
    // Wait for either the table or the empty state to appear
    await expect(table.or(noInvoices)).toBeVisible();
  });

  test('can navigate to create invoice page', async ({ page }) => {
    await page.goto('/dashboard/invoices');
    
    // Click the "Create Invoice" button
    await page.getByRole('link', { name: 'Create Invoice' }).first().click();
    
    // Verify we navigated to the root '/' which is the invoice editor
    await expect(page).toHaveURL('/');
    
    // Verify the Invoice Editor is visible
    await expect(page.getByRole('heading', { name: 'Invoice Editor' }).first()).toBeVisible();
  });
});
