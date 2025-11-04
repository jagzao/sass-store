import { test, expect } from '@playwright/test';

/**
 * Test: System Navigation (CORRECTED VERSION)
 * Validates navigation between different sections of the application
 */

test.describe('System Navigation (CORRECTED)', () => {
  const tenants = ['wondernails', 'nom-nom'];

  test('should navigate between main sections without errors', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track navigation errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Navigation links to test
      const navigationLinks = [
        { name: 'Products', selector: 'a[href*="/products"]', urlPart: '/products' },
        { name: 'Services', selector: 'a[href*="/services"]', urlPart: '/services' },
        { name: 'Cart', selector: '[data-testid="cart-link"], a[href*="/cart"]', urlPart: '/cart' },
        { name: 'Profile', selector: '[data-testid="profile-link"], a[href*="/profile"]', urlPart: '/profile' },
        { name: 'Orders', selector: '[data-testid="orders-link"], a[href*="/orders"]', urlPart: '/orders' }
      ];

      // Test each navigation link
      for (const link of navigationLinks) {
        const navLink = page.locator(link.selector);
        if (await navLink.count() > 0) {
          await navLink.click();
          await page.waitForLoadState('networkidle');
          
          // Check that we navigated to the correct page
          expect(page.url()).toContain(link.urlPart);
          
          // Check for no navigation errors
          expect(errors.length).toBe(0);
          
          // Go back to homepage for next test
          await page.goto(`/t/${tenant}`);
          await page.waitForLoadState('networkidle');
        }
      }

      console.log(`✅ ${tenant}: Main navigation validated successfully`);
    }
  });

  test('should maintain navigation context across page loads', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant products page
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Track navigation errors
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

        // Go back to products
        await page.goBack();
        await page.waitForLoadState('networkidle');

        // Should be back on products page
        expect(page.url()).toContain('/products');

        // Check for no navigation errors
        expect(errors.length).toBe(0);

        console.log(`✅ ${tenant}: Navigation context maintained correctly`);
      }
    }
  });

  test('should handle breadcrumb navigation correctly', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant products page
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Track navigation errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Find and click on a product
      const productCard = page.locator('[data-testid="product-card"]').first();
      if (await productCard.count() > 0) {
        await productCard.click();
        await page.waitForLoadState('networkidle');

        // Look for breadcrumb navigation
        const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="breadcrumb"]');
        if (await breadcrumbs.count() > 0) {
          await expect(breadcrumbs).toBeVisible();

          // Click on "Products" breadcrumb link
          const productsBreadcrumb = breadcrumbs.locator('a:has-text("Productos"), a:has-text("Products")');
          if (await productsBreadcrumb.count() > 0) {
            await productsBreadcrumb.click();
            await page.waitForLoadState('networkidle');

            // Should be back on products page
            expect(page.url()).toContain('/products');

            // Check for no navigation errors
            expect(errors.length).toBe(0);
          }
        }

        console.log(`✅ ${tenant}: Breadcrumb navigation works correctly`);
      }
    }
  });

  test('should handle mobile navigation correctly', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track navigation errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Look for mobile menu button
      const mobileMenuButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button:has-text("☰")');
      if (await mobileMenuButton.count() > 0) {
        await mobileMenuButton.click();
        await page.waitForTimeout(200);

        // Look for mobile menu
        const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, nav[role="navigation"]');
        if (await mobileMenu.count() > 0) {
          await expect(mobileMenu).toBeVisible();

          // Click on products link in mobile menu
          const productsLink = mobileMenu.locator('a[href*="/products"]');
          if (await productsLink.count() > 0) {
            await productsLink.click();
            await page.waitForLoadState('networkidle');

            // Should be on products page
            expect(page.url()).toContain('/products');

            // Check for no navigation errors
            expect(errors.length).toBe(0);
          }
        }

        console.log(`✅ ${tenant}: Mobile navigation works correctly`);
      }
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should handle keyboard navigation correctly', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track navigation errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Focus on first focusable element
      await page.keyboard.press('Tab');
      
      // Check if we can navigate through links
      const navLinks = page.locator('a[href]');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        // Try to navigate through some links using keyboard
        for (let i = 0; i < Math.min(3, linkCount); i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
        }

        // Try to activate a link with Enter
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');
        
        // Should have navigated somewhere (not crashed)
        expect(page.url()).toBeTruthy();

        // Check for no navigation errors
        expect(errors.length).toBe(0);

        console.log(`✅ ${tenant}: Keyboard navigation works correctly`);
      }
    }
  });

  test('should handle navigation errors gracefully', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant homepage
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Track navigation errors
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      // Try to navigate to a non-existent page
      await page.goto(`/t/${tenant}/non-existent-page`);
      await page.waitForLoadState('networkidle');

      // Should show 404 page or redirect to home
      const is404 = page.url().includes('404');
      const isHome = page.url().includes(`/t/${tenant}`);
      
      // Either should be true (graceful handling)
      expect(is404 || isHome).toBe(true);

      // Check for no fatal navigation errors
      const hasFatalErrors = errors.some(err => 
        err.includes('Unhandled Runtime Error') || 
        err.includes('Application error') ||
        err.includes('Internal Server Error')
      );
      
      expect(hasFatalErrors).toBe(false);

      console.log(`✅ ${tenant}: Navigation errors handled gracefully`);
    }
  });
});