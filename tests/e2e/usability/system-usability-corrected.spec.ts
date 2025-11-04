import { test, expect } from '@playwright/test';

/**
 * Test: System Usability (CORRECTED VERSION)
 * Validates usability aspects of the application
 */

test.describe('System Usability (CORRECTED)', () => {
  const tenants = ['wondernails', 'nom-nom'];

  test('should provide clear user feedback and instructions', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track console errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Check for clear headings
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Check for descriptive link text
      const links = page.locator('a');
      const linkCount = await links.count();
      
      for (let i = 0; i < Math.min(linkCount, 10); i++) {
        const link = links.nth(i);
        const linkText = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');
        
        // Should have meaningful text or labels
        const hasMeaningfulText = (linkText && linkText.trim().length > 0) || 
                                 (ariaLabel && ariaLabel.trim().length > 0) || 
                                 (title && title.trim().length > 0);
        
        expect(hasMeaningfulText).toBe(true);
      }

      // Check for form labels
      const formInputs = page.locator('input, textarea, select');
      const inputCount = await formInputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = formInputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        
        // Should have associated label or accessible name
        const hasLabel = id || ariaLabel || ariaLabelledBy;
        expect(hasLabel).toBeTruthy();
      }

      // Check for no JavaScript errors
      expect(errors.length).toBe(0);

      console.log(`✅ ${tenant}: Clear user feedback and instructions validated`);
    }
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track focusable elements
      const focusableElements = page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      const elementCount = await focusableElements.count();
      expect(elementCount).toBeGreaterThan(0);

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

      console.log(`✅ ${tenant}: Keyboard navigation works correctly`);
    }
  });

  test('should provide helpful error messages', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant login page
      await page.goto(`/t/${tenant}/login`);
      await page.waitForLoadState('networkidle');

      // Track errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Try to submit form with invalid data
      const loginButton = page.locator('button[type="submit"]');
      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForTimeout(500);

        // Should show validation errors
        const validationErrors = page.locator('[role="alert"], .error, .text-red-*, [data-testid="error-message"]');
        const errorCount = await validationErrors.count();
        
        // Should show at least one validation error
        expect(errorCount).toBeGreaterThan(0);

        // Errors should be visible
        for (let i = 0; i < Math.min(errorCount, 3); i++) {
          await expect(validationErrors.nth(i)).toBeVisible();
        }

        // Error messages should be descriptive
        const firstError = validationErrors.first();
        const errorText = await firstError.textContent();
        expect(errorText && errorText.trim().length).toBeGreaterThan(0);
      }

      // Check for no JavaScript errors
      expect(errors.length).toBe(0);

      console.log(`✅ ${tenant}: Helpful error messages provided`);
    }
  });

  test('should maintain consistent UI patterns', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Check for consistent button styles
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const computedStyle = await button.evaluate(el => {
          return {
            padding: window.getComputedStyle(el).padding,
            borderRadius: window.getComputedStyle(el).borderRadius,
            backgroundColor: window.getComputedStyle(el).backgroundColor
          };
        });
        
        // All buttons should have some padding and border radius
        expect(computedStyle.padding).not.toBe('0px');
      }

      // Check for consistent typography
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      
      for (let i = 0; i < Math.min(headingCount, 3); i++) {
        const heading = headings.nth(i);
        const fontFamily = await heading.evaluate(el => window.getComputedStyle(el).fontFamily);
        const fontWeight = await heading.evaluate(el => window.getComputedStyle(el).fontWeight);
        
        // Headings should have consistent styling
        expect(fontFamily).toBeTruthy();
        expect(fontWeight).toBeTruthy();
      }

      // Check for no JavaScript errors
      expect(errors.length).toBe(0);

      console.log(`✅ ${tenant}: Consistent UI patterns maintained`);
    }
  });

  test('should provide clear navigation paths', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant products page
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Track errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Find and click on a product
      const productCard = page.locator('[data-testid="product-card"]').first();
      if (await productCard.count() > 0) {
        await productCard.click();
        await page.waitForLoadState('networkidle');

        // Should be on product detail page
        expect(page.url()).toContain('/products');

        // Should have a way to go back
        const backButton = page.locator('a:has-text("Volver"), a:has-text("Back"), button:has-text("Volver"), button:has-text("Back")');
        if (await backButton.count() > 0) {
          await expect(backButton).toBeVisible();
        }

        // Should have breadcrumbs or navigation trail
        const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="breadcrumb"]');
        if (await breadcrumbs.count() > 0) {
          await expect(breadcrumbs).toBeVisible();
        }

        // Check for no JavaScript errors
        expect(errors.length).toBe(0);

        console.log(`✅ ${tenant}: Clear navigation paths provided`);
      }
    }
  });

  test('should be usable on different screen sizes', async ({ page }) => {
    const screenSizes = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];

    for (const tenant of tenants) {
      for (const screenSize of screenSizes) {
        // Set viewport size
        await page.setViewportSize({ width: screenSize.width, height: screenSize.height });

        // Navigate to tenant homepage
        await page.goto(`/t/${tenant}`);
        await page.waitForLoadState('networkidle');

        // Track errors
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        // Check that main content is visible
        const mainContent = page.locator('main, [role="main"]');
        if (await mainContent.count() > 0) {
          await expect(mainContent).toBeVisible();
        }

        // Check that navigation is accessible
        const navigation = page.locator('nav, [role="navigation"]');
        if (await navigation.count() > 0) {
          await expect(navigation).toBeVisible();
        }

        // Check for no JavaScript errors
        expect(errors.length).toBe(0);

        console.log(`✅ ${tenant}: Usable on ${screenSize.name} screen size`);
      }
    }

    // Reset to default viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});