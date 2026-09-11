import { test, expect } from '@playwright/test';

test.describe('Theme Implementation & Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the dashboard
    await page.goto('/dashboard/invoices');
  });

  test('should load with default theme and allow toggling to dark and light', async ({ page }) => {
    // Verify the HTML tag does NOT have the dark class initially (assuming system default is light in playwright, or just verify toggle behavior)
    // Click the theme toggle button (moon/sun icon)
    const toggleButton = page.getByRole('button', { name: /toggle theme/i });
    await expect(toggleButton).toBeVisible();

    await toggleButton.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    // Verify dark class is applied to html
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light
    await toggleButton.click();
    await page.getByRole('menuitem', { name: 'Light' }).click();
    
    // Verify dark class is removed
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should persist theme across navigation', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /toggle theme/i });
    await toggleButton.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Navigate to Create Invoice
    await page.getByRole('link', { name: 'Create Invoice' }).first().click();
    await expect(page).toHaveURL('/');
    
    // Check if dark theme persists
    await expect(html).toHaveClass(/dark/);
  });

  test('should persist theme across page reloads', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /toggle theme/i });
    await toggleButton.click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Reload the page
    await page.reload();
    
    // Check if dark theme persists
    await expect(html).toHaveClass(/dark/);
  });
});
