import { test, expect } from '@playwright/test';

test.describe('Invoice Editor', () => {
  test('can fill out invoice details and preview', async ({ page }) => {
    await page.goto('/');

    // Ensure we are on the Editor
    await expect(page.getByRole('heading', { name: 'Invoice Editor' }).first()).toBeVisible();

    // 1. Fill Business Details
    await page.getByLabel('Business Name').fill('Acme Corp');
    await page.getByLabel('Business Address').fill('123 Industrial Way');

    // 2. Fill Customer Details
    await page.getByLabel('Customer Name').fill('John Doe');

    // 3. Add an Item
    // Find the item description input. It might not have an explicit label, so we use a placeholder or role if available.
    // Assuming the table structure:
    await page.getByPlaceholder('Item description').first().fill('Widget');
    await page.getByPlaceholder('Qty').first().fill('5');
    await page.getByPlaceholder('Price').first().fill('100');
    
    // Check if the total calculates automatically
    // The total for this row should be 500.00
    // Wait for the DOM to update. Since there are desktop/mobile views, one will be visible.
    await expect(page.getByText(/500\.00/).filter({ visible: true }).first()).toBeVisible();

    // 4. Open Preview
    await page.getByRole('button', { name: 'Preview' }).click();

    // Verify the modal opens
    const dialog = page.getByRole('dialog', { name: 'Invoice Preview' });
    await expect(dialog).toBeVisible();

    // Verify some text appears in the preview
    await expect(dialog.getByText('Acme Corp', { exact: true })).toBeVisible();
    await expect(dialog.getByText('John Doe')).toBeVisible();
    await expect(dialog.getByText('Widget')).toBeVisible();

    // Close preview
    // Shadcn dialogs can be closed via keyboard or the 'Close' button
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
