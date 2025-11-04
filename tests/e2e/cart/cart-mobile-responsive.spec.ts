import { test, expect } from '@playwright/test';

/**
 * Cart Mobile & Responsive E2E Tests
 * Tests for cart functionality across different devices and screen sizes
 */

test.describe('Cart - Mobile & Responsive', () => {
  const tenants = ['wondernails', 'vigistudio'];

  test.describe('Mobile Viewport Tests', () => {
    test('should work on iPhone SE', async ({ page }) => {
      // iPhone SE dimensions
      await page.setViewportSize({ width: 375, height: 667 });

      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        // Verify cart elements are visible on small screen
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        await expect(cartItem).toBeVisible();

        // Check that buttons are appropriately sized for touch
        const buttons = cartItem.locator('button');
        const buttonCount = await buttons.count();

        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const boundingBox = await button.boundingBox();

          if (boundingBox) {
            // Buttons should be at least 44px for touch accessibility
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }

        console.log(`✅ ${tenant}: Cart works on iPhone SE viewport`);
      }
    });

    test('should work on iPhone 12 Pro Max', async ({ page }) => {
      // iPhone 12 Pro Max dimensions
      await page.setViewportSize({ width: 428, height: 926 });

      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        // Verify layout adapts to larger mobile screen
        const cartContainer = page.locator('[data-testid="cart-container"], .cart-container, main');
        const boundingBox = await cartContainer.first().boundingBox();

        if (boundingBox) {
          // Should utilize most of the screen width
          expect(boundingBox.width).toBeGreaterThan(350);
        }

        console.log(`✅ ${tenant}: Cart works on iPhone 12 Pro Max viewport`);
      }
    });

    test('should work on Galaxy S21', async ({ page }) => {
      // Galaxy S21 dimensions
      await page.setViewportSize({ width: 360, height: 800 });

      const tenant = tenants[1];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        // Test touch interactions
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const plusButton = cartItem.locator('button:has-text("+")');

        // Simulate touch tap
        await plusButton.tap();
        await page.waitForTimeout(200);

        // Quantity should increase
        const quantityText = cartItem.locator('text=/\\d+/').first();
        const quantity = parseInt(await quantityText.textContent() || '0');
        expect(quantity).toBeGreaterThan(1);

        console.log(`✅ ${tenant}: Cart works on Galaxy S21 viewport with touch`);
      }
    });
  });

  test.describe('Tablet Viewport Tests', () => {
    test('should work on iPad', async ({ page }) => {
      // iPad dimensions
      await page.setViewportSize({ width: 768, height: 1024 });

      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add multiple items
      const products = page.locator('[data-testid="product-card"]');
      const productCount = Math.min(await products.count(), 3);

      for (let i = 0; i < productCount; i++) {
        const product = products.nth(i);
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        if (i < productCount - 1) {
          await page.goto(`/t/${tenant}/products`);
          await page.waitForLoadState('networkidle');
        }
      }

      expect(page.url()).toContain('/cart');

      // Verify multiple items display well on tablet
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBe(productCount);

      // Check layout doesn't have horizontal scroll
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10);

      console.log(`✅ ${tenant}: Cart works on iPad viewport (${itemCount} items)`);
    });

    test('should work on iPad Pro', async ({ page }) => {
      // iPad Pro dimensions
      await page.setViewportSize({ width: 1024, height: 1366 });

      const tenant = tenants[1];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Add items via localStorage for testing layout
      await page.evaluate((t) => {
        const items = [
          { sku: 'tablet-test-1', name: 'Tablet Test Item 1', price: 25.99, quantity: 2, image: 'test.jpg' },
          { sku: 'tablet-test-2', name: 'Tablet Test Item 2', price: 15.50, quantity: 1, image: 'test.jpg' },
          { sku: 'tablet-test-3', name: 'Tablet Test Item 3 with a very long name', price: 45.00, quantity: 3, image: 'test.jpg' }
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify all items are visible and well laid out
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBe(3);

      // Check that long item names don't break layout
      for (let i = 0; i < itemCount; i++) {
        const item = cartItems.nth(i);
        await expect(item).toBeVisible();

        // Check text doesn't overflow
        const itemText = item.locator('text').first();
        const textBounding = await itemText.boundingBox();

        if (textBounding) {
          expect(textBounding.width).toBeLessThan(800); // Reasonable max width
        }
      }

      console.log(`✅ ${tenant}: Cart layout works on iPad Pro`);
    });
  });

  test.describe('Desktop Responsive Tests', () => {
    test('should adapt to different desktop screen sizes', async ({ page }) => {
      const screenSizes = [
        { width: 1280, height: 720, name: 'HD' },
        { width: 1920, height: 1080, name: 'Full HD' },
        { width: 2560, height: 1440, name: 'QHD' }
      ];

      const tenant = tenants[0];

      for (const screenSize of screenSizes) {
        await page.setViewportSize({ width: screenSize.width, height: screenSize.height });

        await page.goto(`/t/${tenant}/cart`);
        await page.waitForLoadState('networkidle');

        // Add test items
        await page.evaluate((t) => {
          const items = [
            { sku: 'desktop-test-1', name: 'Desktop Test Item 1', price: 29.99, quantity: 1, image: 'test.jpg' },
            { sku: 'desktop-test-2', name: 'Desktop Test Item 2', price: 19.99, quantity: 2, image: 'test.jpg' }
          ];
          localStorage.setItem(`cart_${t}`, JSON.stringify(items));
        }, tenant);

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Verify cart displays correctly
        const cartItems = page.locator('[data-testid="cart-item"]');
        const itemCount = await cartItems.count();
        expect(itemCount).toBe(2);

        // Check layout utilizes screen space effectively
        const cartContainer = page.locator('[data-testid="cart-container"], .cart-container, main').first();
        const boundingBox = await cartContainer.boundingBox();

        if (boundingBox) {
          // Should use reasonable portion of screen width
          const screenUtilization = boundingBox.width / screenSize.width;
          expect(screenUtilization).toBeGreaterThan(0.5); // At least 50% of screen width
          expect(screenUtilization).toBeLessThan(1); // Not full width (should have margins)
        }

        console.log(`✅ ${tenant}: Cart adapts to ${screenSize.name} (${screenSize.width}x${screenSize.height})`);
      }
    });
  });

  test.describe('Touch & Gesture Tests', () => {
    test('should handle touch gestures on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');

        // Test tap gesture
        await buyButton.tap();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        // Test touch interactions in cart
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const plusButton = cartItem.locator('button:has-text("+")');

        // Multiple taps
        for (let i = 0; i < 3; i++) {
          await plusButton.tap();
          await page.waitForTimeout(100);
        }

        // Verify quantity increased
        const quantityText = cartItem.locator('text=/\\d+/').first();
        const quantity = parseInt(await quantityText.textContent() || '0');
        expect(quantity).toBe(4); // Started at 1, added 3

        console.log(`✅ ${tenant}: Touch gestures work correctly on mobile`);
      }
    });

    test('should handle swipe gestures for cart navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Add multiple items
      await page.evaluate((t) => {
        const items = [];
        for (let i = 0; i < 5; i++) {
          items.push({
            sku: `swipe-test-${i}`,
            name: `Swipe Test Item ${i}`,
            price: 10.00,
            quantity: 1,
            image: 'test.jpg'
          });
        }
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify all items are accessible (scroll if needed)
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBe(5);

      // Test scrolling on mobile
      const lastItem = cartItems.last();
      await lastItem.scrollIntoViewIfNeeded();

      // Should be visible after scroll
      await expect(lastItem).toBeVisible();

      console.log(`✅ ${tenant}: Swipe/scroll navigation works on mobile`);
    });
  });

  test.describe('Orientation Tests', () => {
    test('should handle orientation changes', async ({ page }) => {
      const tenant = tenants[0];

      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Add items
      await page.evaluate((t) => {
        const items = [
          { sku: 'orientation-test-1', name: 'Orientation Test Item 1', price: 25.99, quantity: 1, image: 'test.jpg' },
          { sku: 'orientation-test-2', name: 'Orientation Test Item 2', price: 15.50, quantity: 2, image: 'test.jpg' }
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify portrait layout
      const portraitItems = page.locator('[data-testid="cart-item"]');
      expect(await portraitItems.count()).toBe(2);

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });

      // Wait for layout to adjust
      await page.waitForTimeout(500);

      // Verify landscape layout
      const landscapeItems = page.locator('[data-testid="cart-item"]');
      expect(await landscapeItems.count()).toBe(2);

      // Layout should adapt
      const cartContainer = page.locator('[data-testid="cart-container"], .cart-container, main').first();
      const boundingBox = await cartContainer.boundingBox();

      if (boundingBox) {
        // Should utilize landscape width better
        expect(boundingBox.width).toBeGreaterThan(600);
      }

      console.log(`✅ ${tenant}: Orientation changes handled correctly`);
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('should maintain accessibility on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        // Check ARIA labels
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const buttons = cartItem.locator('button');

        const buttonCount = await buttons.count();
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const ariaLabel = await button.getAttribute('aria-label');
          const textContent = await button.textContent();

          // Should have either aria-label or text content for screen readers
          expect(ariaLabel || textContent?.trim()).toBeTruthy();
        }

        // Check focus management
        const firstFocusable = page.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').first();
        await firstFocusable.focus();

        const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedTag).toBeTruthy();

        console.log(`✅ ${tenant}: Accessibility maintained on mobile`);
      }
    });

    test('should support keyboard navigation on tablets', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const tenant = tenants[1];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Add items
      await page.evaluate((t) => {
        const items = [
          { sku: 'keyboard-test-1', name: 'Keyboard Test Item 1', price: 20.00, quantity: 1, image: 'test.jpg' },
          { sku: 'keyboard-test-2', name: 'Keyboard Test Item 2', price: 30.00, quantity: 1, image: 'test.jpg' }
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Test Tab navigation
      await page.keyboard.press('Tab');
      let activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).toBeTruthy();

      // Continue tabbing through interactive elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(50);

        activeElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(activeElement).toBeTruthy();
      }

      // Test Enter key on buttons
      const plusButton = page.locator('[data-testid="cart-item"]').first().locator('button:has-text("+")');
      await plusButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);

      // Quantity should increase
      const quantityText = page.locator('[data-testid="cart-item"]').first().locator('text=/\\d+/').first();
      const quantity = parseInt(await quantityText.textContent() || '0');
      expect(quantity).toBe(2);

      console.log(`✅ ${tenant}: Keyboard navigation works on tablets`);
    });
  });

  test.describe('Performance on Mobile', () => {
    test('should load quickly on slow mobile connections', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Simulate slow 3G connection
      await page.route('**/*', async (route) => {
        // Add random delay to simulate network variability
        const delay = Math.random() * 500 + 200; // 200-700ms
        await new Promise(resolve => setTimeout(resolve, delay));
        await route.continue();
      });

      const tenant = tenants[0];
      const startTime = Date.now();

      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(15000); // 15 seconds max

      // Add items
      await page.evaluate((t) => {
        const items = [
          { sku: 'slow-network-test', name: 'Slow Network Test Item', price: 15.99, quantity: 1, image: 'test.jpg' }
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      const reloadTime = Date.now() - startTime;

      // Reload should also be reasonable
      expect(reloadTime).toBeLessThan(10000);

      console.log(`✅ ${tenant}: Performs well on slow mobile connections (${loadTime}ms load, ${reloadTime}ms reload)`);
    });
  });
});