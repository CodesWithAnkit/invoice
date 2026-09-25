import { test, expect, type Page } from '@playwright/test';
import {
  TEST_PASSWORD,
  countEmailsTo,
  createUser,
  expectNoHorizontalOverflow,
  expectNoSeriousA11yViolations,
  latestEmailLinks,
  signInViaUi,
  uniqueEmail,
} from './utils/auth';

// Frontend E2E for Phase 1 (Authentication). Runs on desktop and mobile.

// Our form alerts live inside <main>; this skips Next's hidden route announcer.
const formAlert = (page: Page) => page.getByRole('main').getByRole('alert');

test.describe('Signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.describe('Protected routes (AC-AUTH-006)', () => {
    test('redirects to login and returns to the requested page after sign-in', async ({ page }) => {
      const user = await createUser('ui-next');
      await page.goto('/dashboard/customers');
      await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fcustomers/);

      await signInViaUi(page, user.email, user.password);
      await expect(page).toHaveURL(/\/dashboard\/customers$/);
    });

    test('ignores off-site next targets (no open redirect)', async ({ page }) => {
      const user = await createUser('ui-openredirect');
      await page.goto('/login?next=https://evil.example/steal');
      await signInViaUi(page, user.email, user.password);
      await expect(page).toHaveURL(/localhost:3100\/dashboard\/overview$/);
    });
  });

  test.describe('Sign in (AC-AUTH-002)', () => {
    test('shows field errors next to empty inputs', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByText('Email is required.')).toBeVisible();
      await expect(page.getByText('Password is required.')).toBeVisible();
      await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
      await expectNoSeriousA11yViolations(page);
    });

    test('rejects invalid credentials with a clear error and stays signed out', async ({ page }) => {
      const user = await createUser('ui-badpass');
      await page.goto('/login');
      await signInViaUi(page, user.email, 'wrong-password-1');
      await expect(formAlert(page)).toContainText('Incorrect email or password.');
      await expect(page).toHaveURL(/\/login/);

      await page.goto('/dashboard/overview');
      await expect(page).toHaveURL(/\/login/);
    });

    test('unconfirmed account is told to confirm and can resend the email', async ({ page }) => {
      const user = await createUser('ui-unconfirmed', { confirmed: false });
      await page.goto('/login');
      await signInViaUi(page, user.email, user.password);
      await expect(formAlert(page)).toContainText('Confirm your email address');

      const before = await countEmailsTo(user.email);
      await page.getByRole('button', { name: 'Resend confirmation email' }).click();
      await expect(page.getByText('Confirmation email sent.')).toBeVisible();
      await expect.poll(() => countEmailsTo(user.email)).toBeGreaterThan(before);
    });

    test('valid credentials sign in and the session survives a reload (AC-AUTH-003)', async ({ page }) => {
      const user = await createUser('ui-login');
      await page.goto('/login');
      await signInViaUi(page, user.email, user.password);
      await expect(page).toHaveURL(/\/dashboard\/overview$/);

      await page.reload();
      await expect(page).toHaveURL(/\/dashboard\/overview$/);
      await page.goto('/dashboard/invoices');
      await expect(page).toHaveURL(/\/dashboard\/invoices$/);
    });
  });

  test.describe('Registration (AC-AUTH-001)', () => {
    test('validates required fields, email, password length and confirmation', async ({ page }) => {
      await page.goto('/register');
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByText('Full name is required.')).toBeVisible();
      await expect(page.getByText('Email is required.')).toBeVisible();

      await page.getByLabel('Full name').fill('Asha Rao');
      await page.getByLabel('Email').fill('not-an-email');
      await page.getByLabel('Password', { exact: true }).fill('short');
      await page.getByLabel('Confirm password').fill('different');
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByText('Enter a valid email address')).toBeVisible();
      await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
      await expect(page.getByText('Passwords do not match.')).toBeVisible();
    });

    test('new account: confirm by email, then land in the app', async ({ page }) => {
      const email = uniqueEmail('ui-register');
      await page.goto('/register');
      await page.getByLabel('Full name').fill('Asha Rao');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
      await page.getByLabel('Confirm password').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
      await expect(page.getByText(email)).toBeVisible();

      const links = await latestEmailLinks(email, /confirm/i);
      const confirmLink = links.find((l) => l.includes('/auth/v1/verify'));
      expect(confirmLink, 'confirmation link in email').toBeTruthy();

      await page.goto(confirmLink!);
      await expect(page).toHaveURL(/\/dashboard\/overview$/);
      await page.reload();
      await expect(page).toHaveURL(/\/dashboard\/overview$/);
    });

    test('duplicate email is rejected', async ({ page }) => {
      const existing = await createUser('ui-duplicate');
      await page.goto('/register');
      await page.getByLabel('Full name').fill('Someone Else');
      await page.getByLabel('Email').fill(existing.email);
      await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
      await page.getByLabel('Confirm password').fill(TEST_PASSWORD);
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(formAlert(page)).toContainText('An account with this email already exists.');
    });
  });

  test.describe('Password recovery (AC-AUTH-005)', () => {
    test('unknown email gets the same neutral confirmation and no email is sent', async ({ page }) => {
      const email = uniqueEmail('ui-nobody');
      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(email);
      await page.getByRole('button', { name: 'Send reset link' }).click();
      await expect(page.getByText(`If an account exists for ${email}`)).toBeVisible();
      await page.waitForTimeout(1500);
      expect(await countEmailsTo(email)).toBe(0);
    });

    test('reset link lets the user set a new password; old password stops working', async ({ page }) => {
      const user = await createUser('ui-reset');
      const newPassword = 'Brand-New-Secret-9';

      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(user.email);
      await page.getByRole('button', { name: 'Send reset link' }).click();
      await expect(page.getByText(`If an account exists for ${user.email}`)).toBeVisible();

      const links = await latestEmailLinks(user.email, /reset/i);
      const resetLink = links.find((l) => l.includes('/auth/v1/verify'));
      expect(resetLink, 'reset link in email').toBeTruthy();

      await page.goto(resetLink!);
      await expect(page).toHaveURL(/\/reset-password$/);
      await page.getByLabel('New password', { exact: true }).fill(newPassword);
      await page.getByLabel('Confirm new password').fill(newPassword);
      await page.getByRole('button', { name: 'Update password' }).click();

      await expect(page).toHaveURL(/\/login\?reset=success/);
      await expect(page.getByText('Password updated.')).toBeVisible();

      await signInViaUi(page, user.email, user.password);
      await expect(formAlert(page)).toContainText('Incorrect email or password.');

      await page.getByLabel('Password', { exact: true }).fill(newPassword);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/dashboard\/overview$/);
    });

    test('reset page without a recovery session explains the link expired', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(page.getByRole('heading', { name: 'Link expired' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
    });

    test('invalid email link shows an error on the sign-in page', async ({ page }) => {
      await page.goto('/auth/callback?code=bogus');
      await expect(page).toHaveURL(/\/login\?error=link_invalid/);
      await expect(formAlert(page)).toContainText('invalid or has expired');
    });
  });

  test.describe('Auth pages quality', () => {
    for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
      test(`${path}: accessible, no app shell, no horizontal overflow`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
        await expectNoHorizontalOverflow(page);
        await expectNoSeriousA11yViolations(page);
      });
    }
  });
});

test.describe('Signed in', () => {
  test('visiting /login sends the user into the app', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard\/overview$/);
  });
});

test.describe('Logout (AC-AUTH-004)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('logging out returns to login and blocks protected pages', async ({ page }) => {
    const user = await createUser('ui-logout');
    await page.goto('/login');
    await signInViaUi(page, user.email, user.password);
    await expect(page).toHaveURL(/\/dashboard\/overview$/);

    await page.getByRole('button', { name: 'Log out' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard/overview');
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });
});
