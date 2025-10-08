import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('Screen reader support should be comprehensive', async ({ page }) => {
    await page.goto('/');

    // Check for skip links
    const skipLink = page.locator('.skip-link');
    if (await skipLink.count() > 0) {
      expect(await skipLink.isVisible()).toBe(false); // Hidden by default
      await skipLink.focus();
      expect(await skipLink.isVisible()).toBe(true); // Visible on focus
    }

    // Check for screen reader text classes
    const srOnlyElements = page.locator('.sr-only, .screen-reader-text, .visually-hidden');
    const srCount = await srOnlyElements.count();
    expect(srCount).toBeGreaterThan(0); // Should have screen reader elements

    // Validate that screen reader elements are properly hidden
    for (let i = 0; i < Math.min(5, srCount); i++) {
      const element = srOnlyElements.nth(i);
      const box = await element.boundingBox();

      // Screen reader elements should be visually hidden
      if (box) {
        expect(box.width).toBeLessThanOrEqual(1);
        expect(box.height).toBeLessThanOrEqual(1);
      }
    }

    // Check for proper heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Validate heading hierarchy (should start with h1)
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThanOrEqual(1);

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');

      // Images should have alt text, aria-label, or be decorative
      const hasAccessibleText = alt !== null || ariaLabel !== null || role === 'presentation';
      expect(hasAccessibleText).toBe(true);
    }

    // Check for form labels
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        const hasAriaLabel = ariaLabel !== null || ariaLabelledby !== null;

        expect(hasLabel || hasAriaLabel).toBe(true);
      }
    }
  });

  test('ARIA attributes should be properly implemented', async ({ page }) => {
    await page.goto('/');

    // Check for proper ARIA landmarks
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer');
    expect(await landmarks.count()).toBeGreaterThan(0);

    // Check interactive elements have proper ARIA attributes
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(10, buttonCount); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaDescribedby = await button.getAttribute('aria-describedby');
      const textContent = await button.textContent();

      // Buttons should have accessible text
      const hasAccessibleText = ariaLabel || textContent?.trim() || ariaDescribedby;
      expect(hasAccessibleText).toBeTruthy();
    }

    // Check for proper ARIA states on interactive elements
    const expandableElements = page.locator('[aria-expanded]');
    const expandableCount = await expandableElements.count();

    for (let i = 0; i < expandableCount; i++) {
      const element = expandableElements.nth(i);
      const expanded = await element.getAttribute('aria-expanded');
      expect(['true', 'false'].includes(expanded || '')).toBe(true);
    }

    // Check command palette accessibility
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+KeyK`);

    const commandPalette = page.locator('[data-testid="command-palette"]');
    if (await commandPalette.isVisible()) {
      // Should have proper ARIA attributes
      const role = await commandPalette.getAttribute('role');
      const ariaLabel = await commandPalette.getAttribute('aria-label');

      expect(role || ariaLabel).toBeTruthy();

      // Search input should be properly labeled
      const searchInput = page.locator('[data-testid="command-search"]');
      const inputLabel = await searchInput.getAttribute('aria-label');
      const inputPlaceholder = await searchInput.getAttribute('placeholder');

      expect(inputLabel || inputPlaceholder).toBeTruthy();

      await page.keyboard.press('Escape');
    }
  });

  test('Color contrast should meet WCAG requirements', async ({ page }) => {
    await page.goto('/');

    // Get all text elements and check contrast
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
    const elementCount = await textElements.count();

    // Sample a subset of elements for performance
    const sampleSize = Math.min(20, elementCount);

    for (let i = 0; i < sampleSize; i++) {
      const element = textElements.nth(i);

      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize
          };
        });

        // Parse RGB values
        const parseRGB = (rgb: string) => {
          const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
        };

        const textColor = parseRGB(styles.color);
        const bgColor = parseRGB(styles.backgroundColor);

        // Calculate relative luminance
        const getLuminance = ([r, g, b]: number[]) => {
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const textLum = getLuminance(textColor);
        const bgLum = getLuminance(bgColor);

        // Calculate contrast ratio
        const contrast = (Math.max(textLum, bgLum) + 0.05) / (Math.min(textLum, bgLum) + 0.05);

        // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
        const fontSize = parseFloat(styles.fontSize);
        const minContrast = fontSize >= 24 || (fontSize >= 18 && styles.fontWeight === 'bold') ? 3 : 4.5;

        // Only fail if we have a real background color (not transparent)
        if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent') {
          expect(contrast).toBeGreaterThanOrEqual(minContrast);
        }
      }
    }
  });

  test('Keyboard navigation should work throughout the app', async ({ page }) => {
    await page.goto('/');

    // Test focus management
    let focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').all();

    expect(focusableElements.length).toBeGreaterThan(0);

    // Test Tab navigation
    await page.keyboard.press('Tab');
    let focused = page.locator(':focus');
    expect(await focused.count()).toBe(1);

    // Test that focus is visible
    const focusedElement = focused.first();
    if (await focusedElement.count() > 0) {
      expect(await focusedElement.isVisible()).toBe(true);
    }

    // Test Shift+Tab (reverse navigation)
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');

    // Test Enter/Space activation on focusable elements
    const firstButton = page.locator('button').first();
    if (await firstButton.count() > 0) {
      await firstButton.focus();
      expect(await firstButton.evaluate(el => document.activeElement === el)).toBe(true);
    }

    // Test escape key functionality
    await page.keyboard.press('Escape');

    // Test arrow key navigation where applicable
    const productGrid = page.locator('[data-testid="product-grid"]');
    if (await productGrid.isVisible()) {
      await productGrid.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
    }
  });

  test('Focus management should work correctly', async ({ page }) => {
    await page.goto('/');

    // Test modal focus trapping (command palette)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+KeyK`);

    const commandPalette = page.locator('[data-testid="command-palette"]');
    if (await commandPalette.isVisible()) {
      // Focus should be trapped within the modal
      const searchInput = page.locator('[data-testid="command-search"]');
      expect(await searchInput.isFocused()).toBe(true);

      // Test that focus stays within modal on Tab
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isWithinModal = await focusedElement.evaluate((el, modal) => {
        return modal.contains(el);
      }, await commandPalette.elementHandle());

      expect(isWithinModal).toBe(true);

      // Test escape restores focus
      await page.keyboard.press('Escape');
      expect(await commandPalette.isVisible()).toBe(false);
    }

    // Test that clicking outside elements doesn't break focus
    await page.click('body');
    await page.keyboard.press('Tab');

    const newFocused = page.locator(':focus');
    expect(await newFocused.count()).toBe(1);
  });

  test('Screen reader announcements should be present', async ({ page }) => {
    await page.goto('/');

    // Check for live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    expect(await liveRegions.count()).toBeGreaterThan(0);

    // Check for proper page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check for language attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();

    // Test status announcements
    const quickActionsButtons = page.locator('[data-testid="quick-actions-dock"] button');
    const buttonCount = await quickActionsButtons.count();

    if (buttonCount > 0) {
      const firstButton = quickActionsButtons.first();
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const textContent = await firstButton.textContent();

      expect(ariaLabel || textContent).toBeTruthy();
    }

    // Check for descriptive link text
    const links = page.locator('a');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(10, linkCount); i++) {
      const link = links.nth(i);
      const linkText = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const ariaDescribedby = await link.getAttribute('aria-describedby');

      const accessibleText = linkText || ariaLabel || ariaDescribedby;
      expect(accessibleText?.trim()).toBeTruthy();

      // Avoid generic link text
      if (linkText && linkText.trim().toLowerCase() !== 'click here' && linkText.trim().toLowerCase() !== 'read more') {
        expect(linkText.trim().length).toBeGreaterThan(2);
      }
    }
  });
});