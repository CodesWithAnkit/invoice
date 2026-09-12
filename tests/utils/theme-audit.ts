import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export type Theme = 'light' | 'dark';

/**
 * Injects axe-core into the page and runs accessibility checks focusing on contrast.
 */
export async function auditAccessibility(page: Page, theme: Theme) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Log contrast violations for our audit
  const contrastViolations = accessibilityScanResults.violations.filter(v => v.id === 'color-contrast');
  
  if (contrastViolations.length > 0) {
    console.warn(`[Theme Audit] Found ${contrastViolations.length} contrast violations in ${theme} mode on URL: ${page.url()}`);
  }
}

/**
 * Evaluates the page for suspicious hardcoded color classes that might not adapt to the theme.
 * Focuses on 'bg-white', 'text-black', 'text-gray-*', 'bg-black', 'bg-gray-*'
 */
export async function detectHardcodedColors(page: Page, route: string, theme: Theme) {
  const suspiciousClasses = [
    'bg-white', 'bg-black', 
    'text-white', 'text-black', 
    'text-gray-', 'bg-gray-', 'border-gray-', 'ring-gray-',
    'text-slate-', 'bg-slate-', 'border-slate-', 'ring-slate-'
  ];

  const selector = suspiciousClasses.map(cls => `[class*="${cls}"]`).join(', ');

  const findings = await page.$$eval(selector, (elements) => {
    return elements.map(el => {
      // Find the specific suspicious class
      const classList = Array.from(el.classList);
      const suspicious = classList.filter(c => 
        c === 'bg-white' || c === 'bg-black' || 
        c === 'text-white' || c === 'text-black' ||
        c.startsWith('text-gray-') || c.startsWith('bg-gray-') || c.startsWith('border-gray-') ||
        c.startsWith('text-slate-') || c.startsWith('bg-slate-') || c.startsWith('border-slate-')
      );
      
      // Get some context
      let textContent = el.textContent?.substring(0, 30).replace(/\s+/g, ' ').trim() || '';
      return {
        tag: el.tagName.toLowerCase(),
        classes: suspicious,
        textContext: textContent
      };
    });
  });

  // Filter out known exceptions
  const filteredFindings = findings.filter(f => {
    // Buttons often use text-white in light mode (e.g. primary buttons bg-primary text-primary-foreground which might be white)
    // Wait, text-primary-foreground is semantic, text-white is hardcoded. So text-white is still slightly suspicious,
    // but if it's on a button, it might be intentional. Let's just report them all.
    return f.classes.length > 0;
  });

  if (filteredFindings.length > 0) {
    console.warn(`[Theme Audit] Found ${filteredFindings.length} elements with suspicious hardcoded colors on route ${route} in ${theme} mode:`, filteredFindings.slice(0, 10), filteredFindings.length > 10 ? '...' : '');
  }

  return filteredFindings;
}

/**
 * Checks computed styles for obvious contrast violations that standard A11y tools might miss
 * or flags specific issues where text is completely unreadable.
 */
export async function auditComputedStyles(page: Page) {
  const violations = await page.evaluate(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const elements = document.querySelectorAll('div, p, span, h1, h2, h3, h4, h5, h6, a, button');
    
    const issues: string[] = [];

    // Helper to get raw rgb values
    function getRGB(color: string) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }

    function getBrightness(rgb: number[]) {
      return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    }

    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const textNode = Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && (n.textContent?.trim().length ?? 0) > 0);
      
      if (!textNode) return; // Only care if it contains direct text
      
      const bgColor = style.backgroundColor;
      const textColor = style.color;
      
      const bgRGB = getRGB(bgColor);
      const textRGB = getRGB(textColor);
      
      if (!bgRGB || !textRGB) return;
      
      // If background is transparent, skip heuristics (would need to traverse DOM up to find actual background)
      if (bgRGB[0] === 0 && bgRGB[1] === 0 && bgRGB[2] === 0 && bgColor.includes('rgba(0, 0, 0, 0)')) return;

      const bgBrightness = getBrightness(bgRGB);
      const textBrightness = getBrightness(textRGB);
      
      // Brightness diff
      const diff = Math.abs(bgBrightness - textBrightness);

      if (diff < 40) { // Very low contrast
        issues.push(`Low contrast element <${el.tagName.toLowerCase()}> with text "${el.textContent?.substring(0, 20)}": bg=${bgColor}, text=${textColor}`);
      }
      
      if (isDark && bgBrightness > 200) {
        // High brightness background in dark mode (might be a lingering white element)
        issues.push(`White/bright background found in Dark mode on <${el.tagName.toLowerCase()}>: bg=${bgColor}`);
      }
    });

    return issues;
  });

  if (violations.length > 0) {
    console.warn(`[Theme Audit] Found ${violations.length} computed style issues:`, violations.slice(0, 5));
  }
  return violations;
}

/**
 * Sets the theme explicitly.
 */
export async function setTheme(page: Page, theme: Theme) {
  const toggleButton = page.getByRole('button', { name: /toggle theme/i });
  await toggleButton.click();
  await page.getByRole('menuitem', { name: theme === 'dark' ? 'Dark' : 'Light' }).click();
  
  // Wait for the class to be applied
  if (theme === 'dark') {
    await expect(page.locator('html')).toHaveClass(/dark/);
  } else {
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  }
}
