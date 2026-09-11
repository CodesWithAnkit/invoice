import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES = [
  '/',
  '/dashboard',
  '/dashboard/invoices',
  '/dashboard/customers',
  '/dashboard/products',
  '/dashboard/settings',
];

const VIEWPORTS = [
  // Mobile
  { width: 320, height: 568, name: 'mobile-320x568' },
  { width: 375, height: 667, name: 'mobile-375x667' },
  { width: 390, height: 844, name: 'mobile-390x844' },
  { width: 430, height: 932, name: 'mobile-430x932' },
  // Tablet
  { width: 768, height: 1024, name: 'tablet-768x1024' },
  { width: 820, height: 1180, name: 'tablet-820x1180' },
  // Desktop
  { width: 1024, height: 768, name: 'desktop-1024x768' },
  { width: 1280, height: 800, name: 'desktop-1280x800' },
  { width: 1440, height: 900, name: 'desktop-1440x900' },
  { width: 1920, height: 1080, name: 'desktop-1920x1080' },
];

async function checkBoundingBoxes(page: Page, contextStr: string) {
  return await page.evaluate((ctx: string) => {
    const issues: string[] = [];
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    // Check for horizontal overflow of the document
    const htmlScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const clientWidth = document.body.clientWidth;

    if (htmlScrollWidth > innerWidth || bodyScrollWidth > clientWidth) {
      issues.push(`[${ctx}] Horizontal document overflow: width=${Math.max(htmlScrollWidth, bodyScrollWidth)}, viewport=${innerWidth}`);
    }

    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i] as HTMLElement;
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT' || el.tagName === 'HEAD' || el.tagName === 'META') continue;
      
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      if (el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]')) continue;

      const rect = el.getBoundingClientRect();
      
      // Ignore tiny/empty elements or huge overlays
      if (rect.width <= 1 || rect.height <= 1) continue;
      if (rect.width >= innerWidth && rect.height >= innerHeight) continue; // Likely an overlay backdrop

      // Check bounds
      if (rect.left < 0) {
        issues.push(`[${ctx}] Element out of bounds (Left < 0): <${el.tagName.toLowerCase()} class="${el.className}"> rect.left=${rect.left}`);
      }
      // Tolerate a tiny sub-pixel right overlap
      if (rect.right > innerWidth + 1) {
        // Exclude elements that are inside a horizontally scrolling container
        let isInsideScrollingContainer = false;
        let parent = el.parentElement;
        while (parent) {
          const pStyle = window.getComputedStyle(parent);
          if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll' || pStyle.overflow === 'auto' || pStyle.overflow === 'scroll') {
            isInsideScrollingContainer = true;
            break;
          }
          parent = parent.parentElement;
        }

        if (!isInsideScrollingContainer) {
          issues.push(`[${ctx}] Element out of bounds (Right > ${innerWidth}): <${el.tagName.toLowerCase()} class="${el.className}"> rect.right=${rect.right}`);
        }
      }
      
      // Top/bottom are trickier due to scrolling, but fixed/absolute elements shouldn't go off-screen
      if ((style.position === 'fixed' || style.position === 'absolute' || style.position === 'sticky') && el.closest('[role="dialog"], [role="menu"], [data-state="open"]')) {
        if (rect.bottom > innerHeight + 1) {
          // Exclude sheets that are full height by design
          if (rect.height < innerHeight * 0.9) {
             issues.push(`[${ctx}] Element out of bounds (Bottom > ${innerHeight}): <${el.tagName.toLowerCase()} class="${el.className}"> rect.bottom=${rect.bottom}`);
          }
        }
      }
    }
    return issues;
  }, contextStr);
}

test.describe('Responsive Interaction Audit', () => {
  const allIssues: any[] = [];

  test.afterAll(() => {
    fs.writeFileSync(
      path.join(__dirname, '..', 'test-results', 'responsive-audit.json'),
      JSON.stringify(allIssues, null, 2)
    );
  });

  for (const route of ROUTES) {
    test.describe(`Route: ${route || 'Home'}`, () => {
      for (const viewport of VIEWPORTS) {
        test(`Viewport: ${viewport.name}`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          const response = await page.goto(route);
          
          if (!response || response.status() === 404) {
            test.skip();
            return;
          }

          await page.waitForLoadState('networkidle');

          const safeRouteName = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
          const baseScreenshotPath = path.join(__dirname, '..', 'test-results', 'responsive-screenshots');
          if (!fs.existsSync(baseScreenshotPath)) {
             fs.mkdirSync(baseScreenshotPath, { recursive: true });
          }

          // Check baseline load
          let layoutIssues = await checkBoundingBoxes(page, 'Initial Load');
          await page.screenshot({ path: path.join(baseScreenshotPath, `${safeRouteName}-${viewport.name}-load.png`), fullPage: true });

          // Interaction 1: Mobile Menu
          const menuButton = page.locator('button:has(svg.lucide-menu)');
          if (await menuButton.isVisible()) {
            await menuButton.click();
            await page.waitForTimeout(500); // Wait for animation
            layoutIssues = layoutIssues.concat(await checkBoundingBoxes(page, 'Mobile Menu Open'));
            await page.screenshot({ path: path.join(baseScreenshotPath, `${safeRouteName}-${viewport.name}-menu-open.png`) });
            
            // Close menu
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
          }

          // Interaction 2: Dropdown menus (e.g. actions)
          const dropdownTriggers = page.locator('[aria-haspopup="menu"]');
          if (await dropdownTriggers.count() > 0) {
            // Click the first one
            try {
              await dropdownTriggers.first().click({ force: true });
              await page.waitForTimeout(300);
              layoutIssues = layoutIssues.concat(await checkBoundingBoxes(page, 'Dropdown Open'));
              await page.screenshot({ path: path.join(baseScreenshotPath, `${safeRouteName}-${viewport.name}-dropdown.png`) });
              await page.keyboard.press('Escape');
            } catch (e) {
              console.log('Could not click dropdown on ' + route);
            }
          }

          // Interaction 3: Forms and Modals (e.g., Settings, Add Customer)
          if (route.includes('/customers') || route.includes('/products')) {
            const addBtn = page.locator('button', { hasText: 'Add' }).first();
            if (await addBtn.isVisible()) {
              await addBtn.click();
              await page.waitForTimeout(500);
              layoutIssues = layoutIssues.concat(await checkBoundingBoxes(page, 'Modal Open'));
              await page.screenshot({ path: path.join(baseScreenshotPath, `${safeRouteName}-${viewport.name}-modal.png`) });
              
              // Fill long text to test overflow
              const input = page.locator('input[type="text"]').first();
              if (await input.isVisible()) {
                 await input.fill('very-long-customer-name-that-could-break-layout-very-long-email.address@example.com');
                 layoutIssues = layoutIssues.concat(await checkBoundingBoxes(page, 'Modal with Long Text'));
              }

              await page.keyboard.press('Escape');
            }
          }

          if (layoutIssues.length > 0) {
             allIssues.push({
               route,
               viewport: viewport.name,
               issues: Array.from(new Set(layoutIssues)) // deduplicate
             });
          }
        });
      }
    });
  }
});
