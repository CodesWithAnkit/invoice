import { test, expect } from '@playwright/test';

test.describe('Gemini AI Parser', () => {
  test('drag and drop PDF auto-fills invoice inputs', async ({ page }) => {
    await page.goto('/');

    // Ensure we are on the Editor
    await expect(page.getByRole('heading', { name: 'Invoice Editor' }).first()).toBeVisible();

    // Check for the AI parser dropzone
    const dropzone = page.locator('.ai-parser-dropzone'); // Placeholder selector
    
    // Test that the dropzone exists
    // The feature is currently unimplemented, so this will fail, acting as a TDD test
    await expect(dropzone).toBeVisible({ timeout: 2000 });

    // Note: To fully test drag and drop with a file, we'd need to dispatch events or use page.setInputFiles
    // e.g. await page.locator('input[type="file"]').setInputFiles('tests/fixtures/sample_invoice.pdf');
    // For now, we assert the UI presence and basic states.

    // Expect an uploading/processing state indicator to eventually appear
    // await expect(page.getByText('Parsing PDF...')).toBeVisible();

    // Expect the inputs to be populated
    // await expect(page.getByLabel('Customer Name')).toHaveValue(/some name from pdf/i);
  });
});
