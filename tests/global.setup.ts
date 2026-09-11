import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // We navigate to the root page. The app checks localStorage.
  await page.goto('/');
  
  // Set the localStorage item "invoice_auth" which bypasses the login screen
  await page.evaluate(() => {
    localStorage.setItem('invoice_auth', 'true');
  });

  // Save the storage state which now includes our localStorage item.
  // Playwright's `storageState` command captures cookies and localStorage.
  await page.context().storageState({ path: authFile });
});
