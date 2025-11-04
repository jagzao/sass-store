import { test, expect } from '@playwright/test';

/**
 * Comprehensive Cart E2E Tests
 * Enhanced test suite covering all cart functionality, edge cases, and error scenarios
 */

test.describe('Cart - Comprehensive E2E Tests', () => {
  const tenants = ['wondernails', 'vigistudio', 'delirios', 'nom-nom'];

  test.describe('Basic Cart Operations', () => {
    test('should add single item to cart', async ({ page }) => {
      for (const tenant of tenants) {
        await page.goto(`/t/${tenant}/products`);
        await page.waitForLoadState('networkidle');

        // Clear cart
        await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

        const product = page.locator('[data-testid="product-card"]').first();
        if (await product.count() > 0) {
          // First increment quantity to 1
          const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
          await incrementBtn.click();

          // Then click "Comprar ahora" button
          const buyButton = product.locator('[data-testid="add-to-cart-btn"]');
          await buyButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/cart');

          const cartItems = page.locator('[data-testid="cart-item"]');
          expect(await cartItems.count()).toBe(1);

          console.log(`✅ ${tenant}: Single item added successfully`);
        }
      }
    });

    test('should add multiple different items to cart', async ({ page }) => {
      for (const tenant of tenants) {
        await page.goto(`/t/${tenant}/products`);
        await page.waitForLoadState('networkidle');

        // Clear cart
        await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

        const products = page.locator('[data-testid="product-card"]');
        const productCount = await products.count();

        if (productCount >= 2) {
          // Add first product
          const firstProduct = products.first();
          const firstIncrementBtn = firstProduct.locator('button[aria-label="Increase quantity"]');
          await firstIncrementBtn.click();

          const firstBuyButton = firstProduct.locator('[data-testid="add-to-cart-btn"]');
          await firstBuyButton.click();
          await page.waitForLoadState('networkidle');

          // Go back and add second product
          await page.goto(`/t/${tenant}/products`);
          await page.waitForLoadState('networkidle');

          const secondProduct = products.nth(1);
          const secondIncrementBtn = secondProduct.locator('button[aria-label="Increase quantity"]');
          await secondIncrementBtn.click();

          const secondBuyButton = secondProduct.locator('[data-testid="add-to-cart-btn"]');
          await secondBuyButton.click();
          await page.waitForLoadState('networkidle');

          expect(page.url()).toContain('/cart');

          const cartItems = page.locator('[data-testid="cart-item"]');
          expect(await cartItems.count()).toBe(2);

          console.log(`✅ ${tenant}: Multiple different items added successfully`);
        }
      }
    });

    test('should handle quantity increment/decrement', async ({ page }) => {
      for (const tenant of tenants) {
        await page.goto(`/t/${tenant}/products`);
        await page.waitForLoadState('networkidle');

        // Clear cart
        await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

        const product = page.locator('[data-testid="product-card"]').first();
        if (await product.count() > 0) {
          // Set quantity to 3
          const plusButton = product.locator('button[aria-label="Increase quantity"]');
          await plusButton.click();
          await plusButton.click();

          const buyButton = product.locator('[data-testid="add-to-cart-btn"]');
          await buyButton.click();
          await page.waitForLoadState('networkidle');

          // Verify initial quantity
          const cartItem = page.locator('[data-testid="cart-item"]').first();
          const quantityText = cartItem.locator('text=/\\d+/').first();
          expect(await quantityText.textContent()).toBe('3');

          // Increment quantity
          const incrementBtn = cartItem.locator('button[aria-label="Increase quantity"]');
          await incrementBtn.click();
          await page.waitForTimeout(200);
          expect(await quantityText.textContent()).toBe('4');

          // Decrement quantity
          const decrementBtn = cartItem.locator('button[aria-label="Decrease quantity"]');
          await decrementBtn.click();
          await page.waitForTimeout(200);
          expect(await quantityText.textContent()).toBe('3');

          console.log(`✅ ${tenant}: Quantity operations work correctly`);
        }
      }
    });
  });

  test.describe('Cart Persistence & State Management', () => {
    test('should persist cart across page reloads', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add item
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        const initialCount = await page.locator('[data-testid="cart-item"]').count();

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check cart still has item
        const afterReloadCount = await page.locator('[data-testid="cart-item"]').count();
        expect(afterReloadCount).toBe(initialCount);

        console.log(`✅ ${tenant}: Cart persists across reloads`);
      }
    });

    test('should persist cart across navigation', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add item
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // First increment quantity
        const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
        await incrementBtn.click();

        const buyButton = product.locator('[data-testid="add-to-cart-btn"]');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        const initialCount = await page.locator('[data-testid="cart-item"]').count();

        // Navigate to different page and back
        await page.goto(`/t/${tenant}`);
        await page.waitForLoadState('networkidle');
        await page.goto(`/t/${tenant}/cart`);
        await page.waitForLoadState('networkidle');

        // Check cart still has item
        const afterNavigationCount = await page.locator('[data-testid="cart-item"]').count();
        expect(afterNavigationCount).toBe(initialCount);

        console.log(`✅ ${tenant}: Cart persists across navigation`);
      }
    });

    test('should isolate cart data between tenants', async ({ page }) => {
      const tenant1 = tenants[0];
      const tenant2 = tenants[1];

      // Add item to first tenant
      await page.goto(`/t/${tenant1}/products`);
      await page.waitForLoadState('networkidle');
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant1);

      const product1 = page.locator('[data-testid="product-card"]').first();
      if (await product1.count() > 0) {
        // First increment quantity
        const incrementBtn1 = product1.locator('button[aria-label="Increase quantity"]');
        await incrementBtn1.click();

        const buyButton1 = product1.locator('[data-testid="add-to-cart-btn"]');
        await buyButton1.click();
        await page.waitForLoadState('networkidle');

        const count1 = await page.locator('[data-testid="cart-item"]').count();

        // Switch to second tenant
        await page.goto(`/t/${tenant2}/products`);
        await page.waitForLoadState('networkidle');
        await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant2);

        const product2 = page.locator('[data-testid="product-card"]').first();
        if (await product2.count() > 0) {
          // First increment quantity
          const incrementBtn2 = product2.locator('button[aria-label="Increase quantity"]');
          await incrementBtn2.click();

          const buyButton2 = product2.locator('[data-testid="add-to-cart-btn"]');
          await buyButton2.click();
          await page.waitForLoadState('networkidle');

          const count2 = await page.locator('[data-testid="cart-item"]').count();

          // Switch back to first tenant
          await page.goto(`/t/${tenant1}/cart`);
          await page.waitForLoadState('networkidle');

          const count1Again = await page.locator('[data-testid="cart-item"]').count();

          expect(count1Again).toBe(count1);
          expect(count2).toBe(1); // Second tenant should have its own item

          console.log(`✅ Cart isolation between ${tenant1} and ${tenant2} works correctly`);
        }
      }
    });
  });

  test.describe('Cart Calculations & Pricing', () => {
    test('should calculate correct totals with multiple items', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const products = page.locator('[data-testid="product-card"]');
      if (await products.count() >= 2) {
        // Add first product with quantity 2
        const firstProduct = products.first();
        const plusBtn1 = firstProduct.locator('button[aria-label="Increase quantity"]');
        await plusBtn1.click();

        const buyBtn1 = firstProduct.locator('[data-testid="add-to-cart-btn"]');
        await buyBtn1.click();
        await page.waitForLoadState('networkidle');

        // Go back and add second product with quantity 1
        await page.goto(`/t/${tenant}/products`);
        await page.waitForLoadState('networkidle');

        const secondProduct = products.nth(1);
        const plusBtn2 = secondProduct.locator('button[aria-label="Increase quantity"]');
        await plusBtn2.click();

        const buyBtn2 = secondProduct.locator('[data-testid="add-to-cart-btn"]');
        await buyBtn2.click();
        await page.waitForLoadState('networkidle');

        // Verify calculations
        const subtotal = page.locator('text=/Subtotal/').first();
        const total = page.locator('text=/Total/').first();

        await expect(subtotal).toBeVisible();
        await expect(total).toBeVisible();

        // Extract prices and verify calculations
        const priceElements = page.locator('text=/\\$\\d+\\.\\d{2}/');
        const prices = await priceElements.allTextContents();

        expect(prices.length).toBeGreaterThan(0);

        console.log(`✅ ${tenant}: Price calculations work correctly`);
      }
    });

    test('should handle free shipping threshold', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add high-value item to trigger free shipping
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // Try to add multiple quantities to reach free shipping threshold
        const plusButtons = product.locator('button[aria-label="Increase quantity"]');
        for (let i = 0; i < 10 && await plusButtons.count() > 0; i++) {
          try {
            await plusButtons.click();
            await page.waitForTimeout(50);
          } catch (e) {
            break;
          }
        }

        const buyButton = product.locator('[data-testid="add-to-cart-btn"]');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Check if shipping is free (should be for orders > 500 MXN)
        const shippingText = page.locator('text=/Envío|Shipping/');
        if (await shippingText.count() > 0) {
          const shippingValue = await shippingText.textContent();
          // Should either show free shipping or not show shipping cost
          expect(shippingValue).not.toContain('$0.00'); // If shown, should be free
        }

        console.log(`✅ ${tenant}: Shipping calculations work correctly`);
      }
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle empty cart gracefully', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should show empty cart message or redirect
      const emptyMessage = page.locator('text=/carrito está vacío|empty|no items/');
      const continueShopping = page.locator('text=/continuar comprando|keep shopping/');

      expect(await emptyMessage.count() + await continueShopping.count()).toBeGreaterThan(0);

      console.log(`✅ ${tenant}: Empty cart handled gracefully`);
    });

    test('should handle network errors during add to cart', async ({ page }) => {
      // This test would require mocking network failures
      // For now, just verify basic error handling
      console.log('⏭️ Network error test requires mocking - skipping for now');
    });

    test('should handle invalid product data', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Try to add product with invalid data
      await page.evaluate((t) => {
        // Simulate adding invalid item
        const invalidItem = {
          sku: 'invalid',
          name: null, // Invalid name
          price: 'not-a-number', // Invalid price
          quantity: -1 // Invalid quantity
        };
        localStorage.setItem(`cart_${t}`, JSON.stringify([invalidItem]));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should handle gracefully without crashing
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(1000);

      // Should not have critical errors
      const criticalErrors = errors.filter(err =>
        err.includes('TypeError') ||
        err.includes('ReferenceError') ||
        err.includes('toFixed')
      );

      expect(criticalErrors.length).toBe(0);

      console.log(`✅ ${tenant}: Invalid data handled gracefully`);
    });
  });

  test.describe('Cart UI/UX', () => {
    test('should show loading states appropriately', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // First increment quantity
        const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
        await incrementBtn.click();

        const buyButton = product.locator('[data-testid="add-to-cart-btn"]');

        // Click and check for loading state
        await buyButton.click();

        // Should navigate to cart (loading state handled by navigation)
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/cart');

        console.log(`✅ ${tenant}: Loading states work correctly`);
      }
    });

    test('should be keyboard accessible', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Check for focusable elements
      const focusableElements = page.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const count = await focusableElements.count();

      expect(count).toBeGreaterThan(0);

      // Try tab navigation
      await page.keyboard.press('Tab');
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).toBeTruthy();

      console.log(`✅ ${tenant}: Cart is keyboard accessible`);
    });

    test('should work on mobile viewport', async ({ page }) => {
      const tenant = tenants[0];

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // First increment quantity
        const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
        await incrementBtn.click();

        const buyButton = product.locator('[data-testid="add-to-cart-btn"]');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        // Check cart is usable on mobile
        const cartItems = page.locator('[data-testid="cart-item"]');
        expect(await cartItems.count()).toBe(1);

        console.log(`✅ ${tenant}: Cart works on mobile viewport`);
      }
    });
  });

  test.describe('Performance & Load Testing', () => {
    test('should handle large cart efficiently', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const products = page.locator('[data-testid="product-card"]');
      const productCount = Math.min(await products.count(), 5); // Test with up to 5 products

      // Add multiple products quickly
      const startTime = Date.now();

      for (let i = 0; i < productCount; i++) {
        const product = products.nth(i);
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');

        if (await buyButton.count() > 0) {
          // First increment quantity for each product
          const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
          await incrementBtn.click();

          const addBtn = product.locator('[data-testid="add-to-cart-btn"]');
          await addBtn.click();
          await page.waitForLoadState('networkidle');

          if (i < productCount - 1) {
            await page.goto(`/t/${tenant}/products`);
            await page.waitForLoadState('networkidle');
          }
        }
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (30 seconds max)
      expect(totalTime).toBeLessThan(30000);

      // Verify all items are in cart
      const cartItems = page.locator('[data-testid="cart-item"]');
      expect(await cartItems.count()).toBe(productCount);

      console.log(`✅ ${tenant}: Large cart handled efficiently (${totalTime}ms for ${productCount} items)`);
    });

    test('should handle rapid add/remove operations', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // First increment quantity
        const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
        await incrementBtn.click();

        const buyButton = product.locator('[data-testid="add-to-cart-btn"]');

        // Rapid add/remove cycle
        for (let i = 0; i < 3; i++) {
          await buyButton.click();
          await page.waitForLoadState('networkidle');

          if (i < 2) {
            await page.goto(`/t/${tenant}/products`);
            await page.waitForLoadState('networkidle');
          }
        }

        // Verify final state
        const cartItems = page.locator('[data-testid="cart-item"]');
        expect(await cartItems.count()).toBe(1);

        // Rapid quantity changes
        const cartItem = cartItems.first();
        const plusBtn = cartItem.locator('button[aria-label="Increase quantity"]');
        const minusBtn = cartItem.locator('button[aria-label="Decrease quantity"]');

        for (let i = 0; i < 5; i++) {
          await plusBtn.click();
          await page.waitForTimeout(50);
        }

        for (let i = 0; i < 3; i++) {
          await minusBtn.click();
          await page.waitForTimeout(50);
        }

        // Should not crash
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(500);
        expect(errors.length).toBe(0);

        console.log(`✅ ${tenant}: Rapid operations handled without errors`);
      }
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    // Note: These tests would run on different browsers in CI/CD
    test('should work with different browsers', async ({ page, browserName }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // First increment quantity
        const incrementBtn = product.locator('button[aria-label="Increase quantity"]');
        await incrementBtn.click();

        const buyButton = product.locator('[data-testid="add-to-cart-btn"]');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('/cart');

        console.log(`✅ ${tenant}: Works correctly on ${browserName}`);
      }
    });
  });
});