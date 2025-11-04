import { test, expect } from '@playwright/test';

/**
 * Cart Edge Cases & Error Scenarios E2E Tests
 * Tests for unusual conditions, error states, and boundary conditions
 */

test.describe('Cart - Edge Cases & Error Handling', () => {
  const tenants = ['wondernails', 'vigistudio'];

  test.describe('Boundary Conditions', () => {
    test('should handle maximum quantity limits', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // Try to add maximum quantity (99+)
        const plusButton = product.locator('button:has-text("+")');

        // Click plus button many times
        for (let i = 0; i < 50; i++) {
          try {
            await plusButton.click();
            await page.waitForTimeout(10);
          } catch (e) {
            break;
          }
        }

        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Should handle large quantities without crashing
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const quantityText = cartItem.locator('text=/\\d+/').first();
        const quantity = parseInt(await quantityText.textContent() || '0');

        expect(quantity).toBeGreaterThan(1);
        expect(quantity).toBeLessThanOrEqual(99); // Reasonable upper limit

        console.log(`✅ ${tenant}: Large quantities handled correctly (${quantity})`);
      }
    });

    test('should handle zero quantity gracefully', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // Add item first
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Try to set quantity to zero
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const minusButton = cartItem.locator('button:has-text("-")');

        // Click minus until item is removed
        let itemCount = await page.locator('[data-testid="cart-item"]').count();
        while (itemCount > 0) {
          await minusButton.click();
          await page.waitForTimeout(100);
          itemCount = await page.locator('[data-testid="cart-item"]').count();
        }

        // Should remove item when quantity reaches zero
        expect(itemCount).toBe(0);

        console.log(`✅ ${tenant}: Zero quantity handled correctly`);
      }
    });

    test('should handle negative quantities in localStorage', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Inject invalid data
      await page.evaluate((t) => {
        const invalidCart = [{
          sku: 'test-item',
          name: 'Test Item',
          price: 10.00,
          quantity: -5, // Negative quantity
          image: 'test.jpg'
        }];
        localStorage.setItem(`cart_${t}`, JSON.stringify(invalidCart));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should sanitize negative quantities
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();

      if (itemCount > 0) {
        const quantityText = cartItems.first().locator('text=/\\d+/').first();
        const quantity = parseInt(await quantityText.textContent() || '0');
        expect(quantity).toBeGreaterThanOrEqual(0);
      }

      console.log(`✅ ${tenant}: Negative quantities sanitized correctly`);
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from corrupted localStorage', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Corrupt localStorage
      await page.evaluate((t) => {
        localStorage.setItem(`cart_${t}`, 'invalid json {{{');
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should not crash and should allow adding items
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');

        // Should not throw errors
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Should not have JSON parsing errors
        const jsonErrors = errors.filter(err => err.includes('JSON') || err.includes('parse'));
        expect(jsonErrors.length).toBe(0);

        console.log(`✅ ${tenant}: Recovered from corrupted localStorage`);
      }
    });

    test('should handle network failures during cart operations', async ({ page }) => {
      // This test requires network interception
      // For now, test basic resilience
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

        // Simulate offline state
        await page.context().setOffline(true);

        // Try cart operations while offline
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const plusButton = cartItem.locator('button:has-text("+")');

        // Should handle gracefully
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        try {
          await plusButton.click();
          await page.waitForTimeout(500);
        } catch (e) {
          // Expected to potentially fail
        }

        // Back online
        await page.context().setOffline(false);

        // Should still work
        const cartItems = page.locator('[data-testid="cart-item"]');
        expect(await cartItems.count()).toBeGreaterThanOrEqual(1);

        console.log(`✅ ${tenant}: Network failures handled gracefully`);
      }
    });

    test('should handle concurrent cart modifications', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // Simulate concurrent modifications
        await page.evaluate((t) => {
          // Rapid fire cart updates
          const updates = [];
          for (let i = 0; i < 10; i++) {
            updates.push({
              sku: `concurrent-item-${i}`,
              name: `Concurrent Item ${i}`,
              price: 10.00 + i,
              quantity: 1,
              image: 'test.jpg'
            });
          }

          // Set multiple items rapidly
          localStorage.setItem(`cart_${t}`, JSON.stringify(updates));
          setTimeout(() => {
            localStorage.setItem(`cart_${t}`, JSON.stringify(updates.slice(0, 5)));
          }, 10);
        }, tenant);

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Should handle concurrent updates without crashing
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(1000);

        // Should not have critical errors
        const criticalErrors = errors.filter(err =>
          err.includes('TypeError') ||
          err.includes('RangeError') ||
          err.includes('zustand')
        );

        expect(criticalErrors.length).toBe(0);

        console.log(`✅ ${tenant}: Concurrent modifications handled correctly`);
      }
    });
  });

  test.describe('Data Integrity', () => {
    test('should deduplicate identical items', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add same item multiple times
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');

        // Add same item 3 times
        for (let i = 0; i < 3; i++) {
          await buyButton.click();
          await page.waitForLoadState('networkidle');

          if (i < 2) {
            await page.goto(`/t/${tenant}/products`);
            await page.waitForLoadState('networkidle');
          }
        }

        // Should deduplicate to single item with combined quantity
        const cartItems = page.locator('[data-testid="cart-item"]');
        expect(await cartItems.count()).toBe(1);

        const cartItem = cartItems.first();
        const quantityText = cartItem.locator('text=/\\d+/').first();
        const quantity = parseInt(await quantityText.textContent() || '0');

        expect(quantity).toBe(3); // Should combine quantities

        console.log(`✅ ${tenant}: Item deduplication works correctly`);
      }
    });

    test('should handle items with missing required fields', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Inject malformed items
      await page.evaluate((t) => {
        const malformedItems = [
          { sku: 'missing-name', price: 10.00, quantity: 1 }, // Missing name
          { name: 'Missing SKU', price: 10.00, quantity: 1 }, // Missing SKU
          { sku: 'missing-price', name: 'No Price', quantity: 1 }, // Missing price
          { sku: 'valid-item', name: 'Valid Item', price: 15.00, quantity: 2 } // Valid item
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(malformedItems));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should sanitize malformed items and keep valid ones
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();

      // Should have at least the valid item
      expect(itemCount).toBeGreaterThanOrEqual(1);

      // Valid item should be present
      const validItem = cartItems.filter({ hasText: 'Valid Item' });
      expect(await validItem.count()).toBe(1);

      console.log(`✅ ${tenant}: Malformed items handled correctly (${itemCount} items retained)`);
    });

    test('should validate price data types', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Inject items with invalid price types
      await page.evaluate((t) => {
        const invalidPriceItems = [
          { sku: 'string-price', name: 'String Price', price: '10.99', quantity: 1 },
          { sku: 'null-price', name: 'Null Price', price: null, quantity: 1 },
          { sku: 'undefined-price', name: 'Undefined Price', price: undefined, quantity: 1 },
          { sku: 'nan-price', name: 'NaN Price', price: NaN, quantity: 1 },
          { sku: 'valid-price', name: 'Valid Price', price: 25.50, quantity: 1 }
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(invalidPriceItems));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should sanitize invalid prices
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();

      expect(itemCount).toBeGreaterThanOrEqual(1);

      // Check for toFixed errors (common with invalid prices)
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(1000);

      const toFixedErrors = errors.filter(err => err.includes('toFixed'));
      expect(toFixedErrors.length).toBe(0);

      console.log(`✅ ${tenant}: Invalid price types handled correctly`);
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('should handle very large cart data', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Create very large cart (100+ items)
      await page.evaluate((t) => {
        const largeCart = [];
        for (let i = 0; i < 150; i++) {
          largeCart.push({
            sku: `bulk-item-${i}`,
            name: `Bulk Item ${i}`,
            price: 10.00 + (i % 50), // Vary prices
            quantity: 1 + (i % 5), // Vary quantities
            image: `item-${i}.jpg`,
            variant: { size: ['S', 'M', 'L', 'XL'][i % 4] }
          });
        }
        localStorage.setItem(`cart_${t}`, JSON.stringify(largeCart));
      }, tenant);

      const startTime = Date.now();

      await page.reload();
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (10 seconds)
      expect(loadTime).toBeLessThan(10000);

      // Should display items without crashing
      const cartItems = page.locator('[data-testid="cart-item"]');
      const displayedCount = await cartItems.count();

      expect(displayedCount).toBeGreaterThan(0);

      // Should calculate totals
      const totalElement = page.locator('text=/Total|Total:/');
      await expect(totalElement.first()).toBeVisible();

      console.log(`✅ ${tenant}: Large cart handled efficiently (${displayedCount} items, ${loadTime}ms)`);
    });

    test('should handle rapid state changes', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add initial item
      await page.evaluate((t) => {
        const item = {
          sku: 'rapid-test',
          name: 'Rapid Test Item',
          price: 20.00,
          quantity: 1,
          image: 'test.jpg'
        };
        localStorage.setItem(`cart_${t}`, JSON.stringify([item]));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      const cartItem = page.locator('[data-testid="cart-item"]').first();
      const plusButton = cartItem.locator('button:has-text("+")');
      const minusButton = cartItem.locator('button:has-text("-")');

      // Rapid quantity changes
      const operations = [];
      for (let i = 0; i < 20; i++) {
        operations.push(plusButton.click());
        operations.push(page.waitForTimeout(10));
        if (i % 3 === 0) {
          operations.push(minusButton.click());
          operations.push(page.waitForTimeout(10));
        }
      }

      await Promise.all(operations);

      // Should not crash
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(500);

      const criticalErrors = errors.filter(err =>
        err.includes('TypeError') ||
        err.includes('RangeError') ||
        err.includes('Maximum call stack')
      );

      expect(criticalErrors.length).toBe(0);

      console.log(`✅ ${tenant}: Rapid state changes handled without errors`);
    });
  });

  test.describe('Accessibility & Usability', () => {
    test('should maintain focus during cart operations', async ({ page }) => {
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

        // Focus should be manageable
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const quantityButton = cartItem.locator('button').first();

        await quantityButton.focus();
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBe('BUTTON');

        console.log(`✅ ${tenant}: Focus management works correctly`);
      }
    });

    test('should provide clear error messages', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Try invalid coupon
      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        await couponInput.fill('INVALID_COUPON_12345');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        if (await applyButton.count() > 0) {
          await applyButton.click();
          await page.waitForTimeout(500);

          // Should show error message
          const errorMessage = page.locator('text=/cupón.*inválido|invalid.*coupon|no.*válido/i');
          expect(await errorMessage.count()).toBeGreaterThan(0);

          console.log(`✅ ${tenant}: Clear error messages provided`);
        }
      }
    });

    test('should handle very long item names', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Add item with very long name
      await page.evaluate((t) => {
        const longNameItem = {
          sku: 'long-name-test',
          name: 'Este es un nombre de producto extremadamente largo que debería probar cómo el carrito maneja textos muy largos que podrían causar problemas de diseño y usabilidad en diferentes dispositivos y resoluciones de pantalla'.repeat(3),
          price: 99.99,
          quantity: 1,
          image: 'test.jpg'
        };
        localStorage.setItem(`cart_${t}`, JSON.stringify([longNameItem]));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should handle long names without breaking layout
      const cartItem = page.locator('[data-testid="cart-item"]').first();
      await expect(cartItem).toBeVisible();

      // Should not have horizontal scroll issues
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const clientWidth = await page.evaluate(() => document.body.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50); // Allow small tolerance

      console.log(`✅ ${tenant}: Long item names handled correctly`);
    });
  });
});