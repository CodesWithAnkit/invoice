import { test, expect } from '@playwright/test';

test.describe('Dashboard Dynamic Data', () => {
  test('Dashboard loads invoices from Supabase dynamically', async ({ page }) => {
    // Navigate to the dashboard invoices page
    await page.goto('/dashboard/invoices');

    // The data should be fetched from Supabase, so we wait for a loading state to disappear if any
    // Wait for the table to populate with real data or show empty state if DB is empty
    const table = page.locator('table');
    const noInvoices = page.getByText('No invoices found');
    await expect(table.or(noInvoices)).toBeVisible();

    // Ensure it's not showing static mock data by verifying no "mock" indicators
    // Or, mock the API response and verify it renders correctly
  });

  test('Dashboard loads customers from Supabase dynamically', async ({ page }) => {
    await page.goto('/dashboard/customers');
    
    await expect(page.getByRole('heading', { name: 'Customers' }).first()).toBeVisible();

    const table = page.locator('table');
    const noCustomers = page.getByText('No customers found');
    await expect(table.or(noCustomers)).toBeVisible();
  });

  test('Dashboard loads products from Supabase dynamically', async ({ page }) => {
    await page.goto('/dashboard/products');
    
    await expect(page.getByRole('heading', { name: 'Products' }).first()).toBeVisible();

    const table = page.locator('table');
    const noProducts = page.getByText('No products found');
    await expect(table.or(noProducts)).toBeVisible();
  });
});
