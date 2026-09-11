import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation', () => {
  // Test only for mobile viewport
  test.skip(({ isMobile }) => !isMobile, 'Only run this test on mobile viewports');

  test('can open mobile sidebar and navigate', async ({ page }) => {
    // Go to the dashboard
    await page.goto('/dashboard/invoices');

    // Wait for page load
    await expect(page.getByRole('heading', { name: 'Invoice Management' }).first()).toBeVisible();

    // Verify the desktop sidebar is hidden
    const desktopSidebarLink = page.locator('.hidden.md\\:flex').getByRole('link', { name: 'Create Invoice' });
    await expect(desktopSidebarLink).toBeHidden();

    // The hamburger menu button should be visible
    const menuButton = page.getByRole('button', { name: 'Toggle navigation menu' });
    await expect(menuButton).toBeVisible();

    // Click the hamburger menu
    await menuButton.click();

    // The Sheet with the mobile menu should open
    const sheetContent = page.getByRole('dialog', { name: 'Navigation Menu' });
    await expect(sheetContent).toBeVisible();

    // The links should be visible in the sheet
    const createInvoiceLink = sheetContent.getByRole('link', { name: 'Create Invoice' });
    await expect(createInvoiceLink).toBeVisible();

    // Navigate to Create Invoice
    await createInvoiceLink.click();

    // The sheet should close automatically
    await expect(sheetContent).toBeHidden();

    // Wait for navigation
    await expect(page).toHaveURL('/');
    
    // Check for a known visible text instead of heading since role might be blocked by transition
    await expect(page.getByText('Invoice Editor').first()).toBeVisible();
  });
});
