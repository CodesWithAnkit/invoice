import { test, expect } from '@playwright/test';

test.describe('Customers UI flow', () => {
  test('creates, views, and edits a customer', async ({ page }) => {
    // Generate a unique name to avoid conflicts
    const uniqueCustomerName = `UI Test Customer ${Math.random().toString(36).slice(2, 10)}`;

    // 1. Navigate to the customers list
    await page.goto('/dashboard/customers');
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
    await page.waitForTimeout(500); // Give time for rendering
    await page.screenshot({ path: 'screenshots/step1_list.png', fullPage: true });

    // 2. Create a new customer
    await page.getByRole('button', { name: 'New Customer' }).click();
    await expect(page.getByRole('heading', { name: 'New Customer' })).toBeVisible();

    // Fill in the form
    await page.getByLabel('Name *').fill(uniqueCustomerName);
    await page.getByLabel('Email').fill('ui-test@example.com');
    await page.getByLabel('Phone').fill('555-0100');
    await page.getByLabel('Notes').fill('Initial notes');
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step2_create_form.png', fullPage: true });

    // Save customer
    await page.getByRole('button', { name: 'Save Customer' }).click();

    // Verify redirect back to list and customer is present
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();
    await expect(page.getByText(uniqueCustomerName)).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step3_list_after_create.png', fullPage: true });

    // 3. View detail page
    await page.getByRole('link', { name: uniqueCustomerName }).click();
    
    // Verify detail page elements
    await expect(page.getByRole('heading', { name: uniqueCustomerName })).toBeVisible();
    await expect(page.getByText('ui-test@example.com')).toBeVisible();
    await expect(page.getByText('Initial notes')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step4_detail_page.png', fullPage: true });

    // 4. Edit the customer
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Customer' })).toBeVisible();

    // Change some fields
    await page.getByLabel('Notes').fill('Updated notes through UI');
    await page.getByLabel('Status').selectOption('archived');
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step5_edit_form.png', fullPage: true });

    // Save
    await page.getByRole('button', { name: 'Save Customer' }).click();

    // Should redirect back to list
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

    // Wait for the table to stabilize (we expect the status to be changed)
    // We can go back to details to check if notes changed.
    await page.getByRole('link', { name: uniqueCustomerName }).click();
    
    await expect(page.getByText('Updated notes through UI')).toBeVisible();
    await expect(page.getByText('archived')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/step6_detail_page_updated.png', fullPage: true });
  });
});
