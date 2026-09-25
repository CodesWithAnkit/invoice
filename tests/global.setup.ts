import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { createUser, signInViaUi } from './utils/auth';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// Signs a real (local Supabase) user in through the login page and saves the
// session cookies for the authenticated test projects.
setup('authenticate', async ({ page }) => {
  const user = await createUser('e2e-owner');

  await page.goto('/login');
  await signInViaUi(page, user.email, user.password);
  await expect(page).toHaveURL(/\/dashboard\/overview/);

  await page.context().storageState({ path: authFile });
});
