import { test, expect } from '@playwright/test';

test.describe('Confirmation Dialog Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Uses the authenticated session from global.setup.ts
    await page.goto('/dashboard/invoices');
  });

  test('Log out button triggers the Confirmation Dialog correctly', async ({ page }) => {
    // Find the log out button by looking for the Log Out text inside the button
    const logoutTriggerButton = page.locator('button:has-text("Log out")');
    await expect(logoutTriggerButton).toBeVisible();

    // Click the logout button on the navbar
    await logoutTriggerButton.click();

    // Verify the AlertDialog/ConfirmationDialog appears
    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible();

    // Verify the content
    await expect(dialog.locator('h2')).toContainText('Log out');
    await expect(dialog.locator('p')).toContainText('Are you sure you want to log out of Invoice Generator?');

    // Verify buttons exist
    const cancelButton = dialog.locator('button:has-text("Cancel")');
    const confirmButton = dialog.locator('button:has-text("Log out")');

    await expect(cancelButton).toBeVisible();
    await expect(confirmButton).toBeVisible();

    // Verify destructive styling (should have bg-destructive class)
    await expect(confirmButton).toHaveClass(/bg-destructive/);

    // Cancel the dialog and verify it closes
    await cancelButton.click();
    await expect(dialog).toBeHidden();
  });
});
