import { test, expect } from '@playwright/test';
import { auditAccessibility, detectHardcodedColors, auditComputedStyles, setTheme } from './utils/theme-audit';

const ROUTES = [
  '/',
  '/dashboard/invoices',
  '/dashboard/customers',
  '/dashboard/products',
  '/dashboard/settings'
];

test.describe('Platform-Wide Theme Audit', () => {
  // Store hardcoded findings across tests for reporting
  const auditFindings: any[] = [];
  const computedViolations: any[] = [];

  for (const route of ROUTES) {
    test.describe(`Route: ${route}`, () => {
      
      test('Light Theme Audit', async ({ page }) => {
        const errors: Error[] = [];
        page.on('pageerror', err => errors.push(err));
        page.on('console', msg => {
          if (msg.type() === 'error' && !msg.text().includes('favicon')) {
            // Log real errors but don't strictly fail on them unless critical
            console.error(`[Console Error - ${route}]:`, msg.text());
          }
        });

        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Ensure Light Mode
        await setTheme(page, 'light');

        // 1. Accessibility Audit
        await auditAccessibility(page, 'light');

        // 2. Computed Style Audit
        const compViolations = await auditComputedStyles(page);
        if (compViolations.length > 0) computedViolations.push({ route, theme: 'light', violations: compViolations });

        // 3. Hardcoded Color Audit
        const hardcoded = await detectHardcodedColors(page, route, 'light');
        if (hardcoded.length > 0) auditFindings.push({ route, theme: 'light', findings: hardcoded });

        // 4. No Unhandled Exceptions
        expect(errors).toHaveLength(0);
      });

      test('Dark Theme Audit', async ({ page }) => {
        const errors: Error[] = [];
        page.on('pageerror', err => errors.push(err));

        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Ensure Dark Mode
        await setTheme(page, 'dark');

        // 1. Accessibility Audit
        await auditAccessibility(page, 'dark');

        // 2. Computed Style Audit
        const compViolations = await auditComputedStyles(page);
        if (compViolations.length > 0) computedViolations.push({ route, theme: 'dark', violations: compViolations });

        // 3. Hardcoded Color Audit
        const hardcoded = await detectHardcodedColors(page, route, 'dark');
        if (hardcoded.length > 0) auditFindings.push({ route, theme: 'dark', findings: hardcoded });

        // 4. No Unhandled Exceptions
        expect(errors).toHaveLength(0);
      });
    });
  }

  test.describe('Component & Interaction Audits', () => {
    test('Dark Mode - Dropdowns and Dialogs', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await setTheme(page, 'dark');

      // Test the Filter Select Dropdown
      const selectTrigger = page.locator('button[role="combobox"]').first();
      await selectTrigger.click();
      
      const selectContent = page.locator('[role="listbox"]').first();
      await expect(selectContent).toBeVisible();

      // Check if the dropdown background is mistakenly bright
      const selectBg = await selectContent.evaluate(el => window.getComputedStyle(el).backgroundColor);
      // Dark popover bg usually matches standard HSL dark colors, should not be pure white rgb(255, 255, 255)
      expect(selectBg).not.toBe('rgb(255, 255, 255)');
      
      // Close dropdown
      await page.keyboard.press('Escape');

      // Check Actions Menu if any row exists
      const actionBtn = page.getByRole('button', { name: 'Open menu' }).first();
      if (await actionBtn.isVisible()) {
        await actionBtn.click();
        const actionMenu = page.getByRole('menu').first();
        await expect(actionMenu).toBeVisible();
        const menuBg = await actionMenu.evaluate(el => window.getComputedStyle(el).backgroundColor);
        expect(menuBg).not.toBe('rgb(255, 255, 255)');
      }
    });
  });

  test.describe('Persistence & Edge Cases', () => {
    test('Theme persists across client navigation', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await setTheme(page, 'dark');

      // Navigate to another page via client routing
      const isMobile = await page.evaluate(() => window.innerWidth < 768);
      if (isMobile) {
        const menuBtn = page.getByRole('button', { name: /toggle navigation menu/i });
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
        }
      }
      // Click the visible Customers link
      await page.locator('a[href="/dashboard/customers"]').first().click({ force: true });
      await expect(page).toHaveURL(/.*customers/);
      
      // Expect theme to still be dark
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  });

  test.describe('Visual Snapshots (High Value)', () => {
    test('Dashboard Invoices - Light Snapshot', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await setTheme(page, 'light');
      // Wait for table to render completely
      await page.waitForTimeout(500); 
      await expect(page).toHaveScreenshot('dashboard-invoices-light.png', { maxDiffPixelRatio: 0.05 });
    });

    test('Dashboard Invoices - Dark Snapshot', async ({ page }) => {
      await page.goto('/dashboard/invoices');
      await setTheme(page, 'dark');
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('dashboard-invoices-dark.png', { maxDiffPixelRatio: 0.05 });
    });
  });

  test.afterAll(() => {
    console.log('\n--- AUDIT SUMMARY REPORT ---');
    console.log(`Routes Audited: ${ROUTES.length}`);
    console.log(`Total Routes with Hardcoded Color Suspicion: ${auditFindings.length}`);
    console.log(`Total Routes with Computed Style Contrast Issues: ${computedViolations.length}`);
    
    if (auditFindings.length > 0 || computedViolations.length > 0) {
      console.log('\nFindings Details Available in Console Logs during run.\n');
    }
  });
});
