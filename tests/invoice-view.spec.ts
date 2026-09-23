import { test, expect } from '@playwright/test';

test.describe('Invoice View Details Page', () => {
  test('should have an Export as PDF button that triggers window.print', async ({ page }) => {
    // We mock the database call to avoid needing real auth or data in this isolated test
    await page.route('**/rest/v1/invoices?select=*&id=eq.test-id*', async (route) => {
      const mockInvoice = {
        id: 'test-id',
        invoice_number: 'INV-123',
        created_at: new Date().toISOString(),
        customer_name: 'Test Customer',
        business_name: 'Test Business',
      };
      await route.fulfill({ json: mockInvoice });
    });

    await page.route('**/rest/v1/invoice_items?select=*&invoice_id=eq.test-id', async (route) => {
      await route.fulfill({ json: [] });
    });

    // We catch the window.print call
    let printCalled = false;
    await page.exposeFunction('mockPrint', () => {
      printCalled = true;
    });
    await page.addInitScript(() => {
      window.print = () => {
        (window as any).mockPrint();
      };
    });

    await page.goto('/dashboard/invoices/test-id');

    // Check if the Export as PDF button is visible
    const exportButton = page.getByRole('button', { name: /Export as PDF/i });
    await expect(exportButton).toBeVisible();

    // Click it and ensure window.print was called
    await exportButton.click();
    expect(printCalled).toBe(true);
  });
});
