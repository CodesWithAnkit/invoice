import { test, expect } from '@playwright/test';

test.describe('Products & Services UI flow', () => {
  test('creates and edits products and services, and verifies tabs', async ({ page }) => {
    const uniqueProductName = `UI Test Product ${Math.random().toString(36).slice(2, 10)}`;
    const uniqueServiceName = `UI Test Service ${Math.random().toString(36).slice(2, 10)}`;

    // 1. Navigate to the products list
    await page.goto('/dashboard/products');
    await expect(page.getByRole('heading', { name: 'Products & Services' })).toBeVisible();

    // 2. Create a new product
    await page.getByRole('button', { name: 'Add Item' }).click();
    await expect(page.getByRole('heading', { name: 'Add Item' })).toBeVisible();

    // Fill in product form
    await page.getByLabel('Name *').fill(uniqueProductName);
    await page.getByLabel('Kind').selectOption('product');
    await page.getByLabel('Pricing Model').selectOption('fixed');
    await page.getByLabel('Rate (in cents/paise)').fill('10000'); // $100.00
    await page.getByLabel('Unit').fill('item');
    await page.getByRole('button', { name: 'Save' }).click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add Item' })).toBeHidden();

    // 3. Create a new service
    await page.getByRole('button', { name: 'Add Item' }).click();
    await page.getByLabel('Name *').fill(uniqueServiceName);
    await page.getByLabel('Kind').selectOption('service');
    await page.getByLabel('Pricing Model').selectOption('percentage');
    await page.getByLabel('Percent (Basis Points)').fill('500'); // 5%
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByRole('heading', { name: 'Add Item' })).toBeHidden();

    // 4. Check "All Items" tab (default)
    await expect(page.getByText(uniqueProductName)).toBeVisible();
    await expect(page.getByText(uniqueServiceName)).toBeVisible();

    // 5. Check "Products" tab
    await page.getByRole('button', { name: 'Products', exact: true }).click();
    await expect(page.getByText(uniqueProductName)).toBeVisible();
    await expect(page.getByText(uniqueServiceName)).toBeHidden();

    // 6. Check "Services" tab
    await page.getByRole('button', { name: 'Services', exact: true }).click();
    await expect(page.getByText(uniqueServiceName)).toBeVisible();
    await expect(page.getByText(uniqueProductName)).toBeHidden();

    // Go back to "All Items"
    await page.getByRole('button', { name: 'All Items', exact: true }).click();

    // 7. Edit the product
    // Click action menu for the product row
    const productRow = page.getByRole('row', { name: new RegExp(uniqueProductName) });
    await productRow.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible();
    await page.getByLabel('Name *').fill(`${uniqueProductName} Updated`);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeHidden();

    await expect(page.getByText(`${uniqueProductName} Updated`)).toBeVisible();

    // 8. Deactivate the product
    const updatedProductRow = page.getByRole('row', { name: new RegExp(`${uniqueProductName} Updated`) });
    await updatedProductRow.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('menuitem', { name: 'Deactivate' }).click();

    // Ensure it shows 'Inactive' (since we use StatusBadge with 'Inactive' text)
    await expect(updatedProductRow.getByText('Inactive')).toBeVisible();

  });
});
