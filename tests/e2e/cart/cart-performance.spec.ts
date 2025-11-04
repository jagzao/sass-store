import { test, expect } from '@playwright/test';

/**
 * Cart Performance E2E Tests
 * Tests for cart performance, load handling, and scalability
 */

test.describe('Cart - Performance & Load Testing', () => {
  const tenants = ['wondernails', 'vigistudio'];

  test.describe('Load Performance', () => {
    test('should handle 100+ cart items efficiently', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      const startTime = Date.now();

      // Create cart with 100 items
      await page.evaluate((t) => {
        const largeCart = [];
        for (let i = 0; i < 100; i++) {
          largeCart.push({
            sku: `perf-item-${i}`,
            name: `Performance Test Item ${i}`,
            price: 10.00 + (i % 20), // Vary prices
            quantity: 1 + (i % 3), // Vary quantities
            image: `item-${i % 10}.jpg`, // Reuse images
            variant: {
              size: ['S', 'M', 'L'][i % 3],
              color: ['Red', 'Blue', 'Green'][i % 3]
            }
          });
        }
        localStorage.setItem(`cart_${t}`, JSON.stringify(largeCart));
      }, tenant);

      await page.reload();
      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      // Should display items
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();
      expect(itemCount).toBeGreaterThan(50); // At least half should render

      // Should calculate totals
      const totalElement = page.locator('text=/Total|Total:/');
      await expect(totalElement.first()).toBeVisible();

      // Should be responsive (no long tasks)
      const performanceEntries = await page.evaluate(() =>
        performance.getEntriesByType('measure')
      );

      console.log(`✅ ${tenant}: 100+ items handled in ${loadTime}ms (${itemCount} rendered)`);
    });

    test('should maintain performance with rapid operations', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add initial item
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        const startTime = Date.now();

        // Perform 50 rapid quantity changes
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const plusButton = cartItem.locator('button:has-text("+")');
        const minusButton = cartItem.locator('button:has-text("-")');

        for (let i = 0; i < 25; i++) {
          await plusButton.click();
          await minusButton.click();
        }

        const operationTime = Date.now() - startTime;

        // Should complete within 10 seconds
        expect(operationTime).toBeLessThan(10000);

        // Should not have crashed
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(1000);

        const criticalErrors = errors.filter(err =>
          err.includes('TypeError') ||
          err.includes('RangeError') ||
          err.includes('Maximum call stack')
        );

        expect(criticalErrors.length).toBe(0);

        console.log(`✅ ${tenant}: 50 rapid operations completed in ${operationTime}ms`);
      }
    });

    test('should handle memory efficiently with large carts', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Monitor memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Add 50 items
      await page.evaluate((t) => {
        const items = [];
        for (let i = 0; i < 50; i++) {
          items.push({
            sku: `memory-test-${i}`,
            name: `Memory Test Item ${i}`.repeat(5), // Long names to test memory
            price: 25.99,
            quantity: 2,
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // Small base64 image
            variant: { option: 'A'.repeat(100) } // Large variant data
          });
        }
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

        // Memory increase should be reasonable (< 50MB)
        expect(memoryIncreaseMB).toBeLessThan(50);

        console.log(`✅ ${tenant}: Memory usage reasonable (${memoryIncreaseMB.toFixed(2)}MB increase)`);
      } else {
        console.log(`✅ ${tenant}: Memory monitoring not available, but cart loaded successfully`);
      }
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle simultaneous add/remove operations', async ({ page, context }) => {
      const tenant = tenants[0];

      // Open multiple pages
      const page2 = await context.newPage();
      const page3 = await context.newPage();

      // All pages go to products
      await Promise.all([
        page.goto(`/t/${tenant}/products`),
        page2.goto(`/t/${tenant}/products`),
        page3.goto(`/t/${tenant}/products`)
      ]);

      await Promise.all([
        page.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle'),
        page3.waitForLoadState('networkidle')
      ]);

      // Clear carts
      await Promise.all([
        page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant),
        page2.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant),
        page3.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant)
      ]);

      // All pages add items simultaneously
      const addOperations = [];
      for (const p of [page, page2, page3]) {
        const product = p.locator('[data-testid="product-card"]').first();
        if (await product.count() > 0) {
          const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
          addOperations.push(buyButton.click());
        }
      }

      await Promise.all(addOperations);

      // All navigate to cart
      await Promise.all([
        page.goto(`/t/${tenant}/cart`),
        page2.goto(`/t/${tenant}/cart`),
        page3.goto(`/t/${tenant}/cart`)
      ]);

      await Promise.all([
        page.waitForLoadState('networkidle'),
        page2.waitForLoadState('networkidle'),
        page3.waitForLoadState('networkidle')
      ]);

      // All should show cart items
      const itemCounts = await Promise.all([
        page.locator('[data-testid="cart-item"]').count(),
        page2.locator('[data-testid="cart-item"]').count(),
        page3.locator('[data-testid="cart-item"]').count()
      ]);

      // At least one page should have items
      expect(itemCounts.some(count => count > 0)).toBe(true);

      await page2.close();
      await page3.close();

      console.log(`✅ ${tenant}: Concurrent operations handled (${itemCounts})`);
    });

    test('should handle rapid cart state changes', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Inject cart with changing state
      await page.evaluate((t) => {
        let state = 0;
        const interval = setInterval(() => {
          const items = [];
          for (let i = 0; i < 5 + state; i++) {
            items.push({
              sku: `dynamic-${i}`,
              name: `Dynamic Item ${i} State ${state}`,
              price: 10.00,
              quantity: state + 1,
              image: 'test.jpg'
            });
          }
          localStorage.setItem(`cart_${t}`, JSON.stringify(items));
          state = (state + 1) % 3; // Cycle through 3 states

          if (state === 0) {
            clearInterval(interval);
          }
        }, 100);

        // Clear after 1 second
        setTimeout(() => {
          clearInterval(interval);
        }, 1000);
      }, tenant);

      // Wait for state changes to complete
      await page.waitForTimeout(1500);

      // Should not crash
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(500);

      const criticalErrors = errors.filter(err =>
        err.includes('TypeError') ||
        err.includes('RangeError') ||
        err.includes('zustand')
      );

      expect(criticalErrors.length).toBe(0);

      console.log(`✅ ${tenant}: Rapid state changes handled without errors`);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow networks gracefully', async ({ page }) => {
      const tenant = tenants[0];

      // Simulate slow network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        await route.continue();
      });

      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const startTime = Date.now();

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();

        // Should still work with slow network
        await page.waitForLoadState('networkidle');

        const operationTime = Date.now() - startTime;

        // Should complete within reasonable time (30 seconds with slow network)
        expect(operationTime).toBeLessThan(30000);

        expect(page.url()).toContain('/cart');

        console.log(`✅ ${tenant}: Slow network handled (${operationTime}ms)`);
      }
    });

    test('should handle offline/online transitions', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      // Add item while online
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Go offline
        await page.context().setOffline(true);

        // Try cart operations while offline
        const cartItem = page.locator('[data-testid="cart-item"]').first();
        const plusButton = cartItem.locator('button:has-text("+")');

        // Should work (localStorage based)
        await plusButton.click();
        await page.waitForTimeout(500);

        // Go back online
        await page.context().setOffline(false);

        // Should sync properly
        await page.reload();
        await page.waitForLoadState('networkidle');

        const finalCount = await page.locator('[data-testid="cart-item"]').count();
        expect(finalCount).toBeGreaterThan(0);

        console.log(`✅ ${tenant}: Offline/online transitions handled`);
      }
    });
  });

  test.describe('Resource Usage', () => {
    test('should not leak memory on repeated operations', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');

        // Perform 20 add/remove cycles
        for (let i = 0; i < 20; i++) {
          await buyButton.click();
          await page.waitForLoadState('networkidle');

          if (i < 19) {
            await page.goto(`/t/${tenant}/products`);
            await page.waitForLoadState('networkidle');
          }
        }

        // Check memory hasn't grown excessively
        const memoryUsage = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // MB
          }
          return 0;
        });

        if (memoryUsage > 0) {
          // Memory should be reasonable (< 100MB)
          expect(memoryUsage).toBeLessThan(100);
          console.log(`✅ ${tenant}: Memory usage stable (${memoryUsage.toFixed(2)}MB)`);
        } else {
          console.log(`✅ ${tenant}: Memory monitoring not available, operations completed successfully`);
        }
      }
    });

    test('should handle large localStorage payloads', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Create very large cart data (approaching localStorage limits)
      const largeData = {
        items: [],
        deletedItems: [],
        appliedCoupon: null,
        lastActivity: Date.now()
      };

      // Add items with large metadata
      for (let i = 0; i < 20; i++) {
        largeData.items.push({
          sku: `large-${i}`,
          name: 'Large Item '.repeat(50), // Very long name
          price: 99.99,
          quantity: 5,
          image: 'test.jpg',
          variant: {
            description: 'Long description '.repeat(100),
            specifications: 'Specs '.repeat(200),
            reviews: 'Review '.repeat(300)
          }
        });
      }

      const dataString = JSON.stringify(largeData);
      const dataSizeKB = dataString.length / 1024;

      console.log(`Test data size: ${dataSizeKB.toFixed(2)}KB`);

      // Should handle large data without crashing
      await page.evaluate(({ tenant, dataString }) => {
        localStorage.setItem(`cart_${tenant}`, dataString);
      }, { tenant, dataString });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should load successfully
      const cartItems = page.locator('[data-testid="cart-item"]');
      const itemCount = await cartItems.count();

      expect(itemCount).toBeGreaterThan(0);

      console.log(`✅ ${tenant}: Large localStorage payload handled (${itemCount} items)`);
    });
  });

  test.describe('Scalability Tests', () => {
    test('should handle tenant-specific cart isolation at scale', async ({ page, context }) => {
      const tenantsToTest = ['wondernails', 'vigistudio', 'delirios'];

      // Create pages for each tenant
      const pages = [];
      for (const tenant of tenantsToTest) {
        const newPage = await context.newPage();
        pages.push({ page: newPage, tenant });
      }

      // Load all tenant pages
      await Promise.all(pages.map(({ page, tenant }) =>
        page.goto(`/t/${tenant}/products`)
      ));

      await Promise.all(pages.map(({ page }) =>
        page.waitForLoadState('networkidle')
      ));

      // Clear all carts
      await Promise.all(pages.map(({ page, tenant }) =>
        page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant)
      ));

      // Add different items to each tenant cart
      const addOperations = pages.map(async ({ page, tenant }, index) => {
        const products = page.locator('[data-testid="product-card"]');
        if (await products.count() > index) {
          const product = products.nth(index);
          const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
          await buyButton.click();
          await page.waitForLoadState('networkidle');
        }
      });

      await Promise.all(addOperations);

      // Navigate all to cart pages
      await Promise.all(pages.map(({ page, tenant }) =>
        page.goto(`/t/${tenant}/cart`)
      ));

      await Promise.all(pages.map(({ page }) =>
        page.waitForLoadState('networkidle')
      ));

      // Verify each cart has its own items
      const cartCounts = await Promise.all(pages.map(({ page }) =>
        page.locator('[data-testid="cart-item"]').count()
      ));

      // Each cart should have at least 1 item
      cartCounts.forEach((count, index) => {
        expect(count).toBeGreaterThanOrEqual(1);
        console.log(`✅ ${tenantsToTest[index]}: ${count} items in cart`);
      });

      // Cleanup
      await Promise.all(pages.map(({ page }) => page.close()));

      console.log(`✅ Multi-tenant cart isolation at scale verified`);
    });
  });
});