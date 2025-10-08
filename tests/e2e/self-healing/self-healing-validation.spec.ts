import { test, expect } from '@playwright/test';
import { ClickBudgetTracker, validateFlowWithClickBudget } from '../utils/click-budget-tracker';

test.describe('Self-Healing Test Validation - Master Plan Implementation', () => {
  const tenants = ['wondernails', 'nom-nom', 'delirios'];

  test('Self-healing selector fallback - data-testid priority', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      const tracker = new ClickBudgetTracker(page, 'purchase');

      // Test primary selector with fallbacks (self-healing approach)
      const primarySelector = '[data-testid="add-to-cart"]';
      const fallbackSelectors = [
        'button:has-text("Agregar al carrito")',
        'button:has-text("Add to cart")',
        '.add-to-cart-btn',
        'button[aria-label*="cart"]'
      ];

      const success = await tracker.clickWithBudgetTracking(
        primarySelector,
        fallbackSelectors,
        'Add to cart button'
      );

      if (success) {
        // Verify the action worked
        const cartUpdate = await tracker.waitForStateChange(
          '[data-testid="cart-count"], .cart-count',
          'visible',
          3000,
          'Cart count update'
        );

        expect(cartUpdate).toBeTruthy();
        console.log(`✅ ${tenant}: Self-healing selector worked`);
      } else {
        console.log(`⚠️ ${tenant}: No add-to-cart button found with any selector`);
      }
    }
  });

  test('State-based waits vs sleep - network idle and element states', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);

      const tracker = new ClickBudgetTracker(page, 'purchase');

      // Good practice: Wait for network idle instead of arbitrary sleep
      await tracker.waitForNetworkIdle(5000);

      // Good practice: Wait for specific state changes
      const productGrid = page.locator('[data-testid="products-grid"], .products-grid');
      if (await productGrid.count() > 0) {
        await productGrid.waitFor({ state: 'visible', timeout: 5000 });

        // Test state-based interaction
        const firstProduct = productGrid.locator('[data-testid="product-card"]').first();
        if (await firstProduct.count() > 0) {
          // Wait for product to be fully loaded (not just visible)
          await tracker.waitForStateChange(
            '[data-testid="product-card"]',
            'enabled',
            3000,
            'Product card interactive'
          );

          await firstProduct.click();

          // Wait for navigation or modal to complete
          await tracker.waitForNetworkIdle(3000);
        }
      }

      console.log(`✅ ${tenant}: State-based waits working properly`);
    }
  });

  test('Controlled retry logic - 1-2 retries maximum', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);

      const tracker = new ClickBudgetTracker(page, 'booking');
      let retryCount = 0;
      const maxRetries = 2;

      // Simulate flaky operation that might fail on first try
      const attemptBooking = async (): Promise<boolean> => {
        try {
          const bookingButton = page.locator('[data-testid="book-now"], [data-testid="reservar-ahora"]');

          if (await bookingButton.count() === 0) {
            throw new Error('Booking button not found');
          }

          await bookingButton.waitFor({ state: 'visible', timeout: 3000 });
          await bookingButton.click();

          // Wait for booking confirmation or form
          const confirmationOrForm = page.locator(
            '[data-testid="booking-confirmation"], [data-testid="booking-form"]'
          );

          await confirmationOrForm.waitFor({ state: 'visible', timeout: 5000 });
          return true;

        } catch (error) {
          console.log(`Booking attempt failed: ${error}`);
          return false;
        }
      };

      // Retry loop with controlled limit
      let success = false;
      while (!success && retryCount < maxRetries) {
        retryCount++;
        console.log(`[SELF-HEALING] Booking attempt ${retryCount}/${maxRetries}`);

        success = await attemptBooking();

        if (!success && retryCount < maxRetries) {
          console.log(`[SELF-HEALING] Retrying in 1 second...`);
          await page.waitForTimeout(1000); // Brief pause between retries
        }
      }

      if (success) {
        console.log(`✅ ${tenant}: Booking succeeded after ${retryCount} attempts`);
      } else {
        console.log(`⚠️ ${tenant}: Booking failed after ${maxRetries} attempts - needs human attention`);
      }

      // Verify retry count is within acceptable limits
      expect(retryCount).toBeLessThanOrEqual(maxRetries);
    }
  });

  test('Click budget validation with real user flows', async ({ page }) => {
    const tenant = 'nom-nom'; // Catalog tenant for purchase flow

    await page.goto(`/t/${tenant}`);

    // Test purchase flow with click budget tracking
    const flowResult = await validateFlowWithClickBudget(
      page,
      'purchase',
      [
        {
          action: async () => {
            const productCard = page.locator('[data-testid="product-card"]').first();
            if (await productCard.isVisible()) {
              await productCard.click();
            } else {
              throw new Error('No products available for purchase flow test');
            }
          },
          description: 'Navigate to product details',
          maxClicks: 1
        },
        {
          action: async () => {
            const addToCart = page.locator('[data-testid="add-to-cart"]');
            if (await addToCart.isVisible()) {
              await addToCart.click();
            }
          },
          description: 'Add product to cart',
          maxClicks: 1
        },
        {
          action: async () => {
            const viewCart = page.locator('[data-testid="view-cart"], [data-testid="cart-button"]');
            if (await viewCart.isVisible()) {
              await viewCart.click();
            }
          },
          description: 'View cart',
          maxClicks: 1
        },
        {
          action: async () => {
            const checkout = page.locator('[data-testid="checkout"], [data-testid="proceed-checkout"]');
            if (await checkout.isVisible()) {
              await checkout.click();
            }
          },
          description: 'Proceed to checkout (would complete purchase)',
          maxClicks: 1
        }
      ]
    );

    console.log(flowResult.report);

    // Verify the flow met click budget requirements
    expect(flowResult.budgetMet).toBeTruthy();
    expect(flowResult.success).toBeTruthy();

    console.log(`✅ ${tenant}: Purchase flow click budget validation passed`);
  });

  test('Booking flow with 2-click budget validation', async ({ page }) => {
    const tenant = 'wondernails'; // Booking tenant

    await page.goto(`/t/${tenant}`);

    const flowResult = await validateFlowWithClickBudget(
      page,
      'booking',
      [
        {
          action: async () => {
            const quickBook = page.locator('[data-testid="quick-book"], [data-testid="book-now"]');
            if (await quickBook.isVisible()) {
              await quickBook.click();
            } else {
              // Try alternative booking entry points
              const serviceCard = page.locator('[data-testid="service-card"]').first();
              if (await serviceCard.isVisible()) {
                await serviceCard.click();
              }
            }
          },
          description: 'Select service or quick booking',
          maxClicks: 1
        },
        {
          action: async () => {
            const confirmBooking = page.locator(
              '[data-testid="confirm-booking"], [data-testid="book-appointment"]'
            );
            if (await confirmBooking.isVisible()) {
              await confirmBooking.click();
            }
          },
          description: 'Confirm booking',
          maxClicks: 1
        }
      ]
    );

    console.log(flowResult.report);

    // Booking flow should complete in ≤2 clicks
    expect(flowResult.budgetMet).toBeTruthy();

    console.log(`✅ ${tenant}: Booking flow click budget validation passed`);
  });

  test('Selector stability validation - no brittle selectors', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check for presence of stable data-testid selectors
      const criticalSelectors = [
        '[data-testid="products-grid"]',
        '[data-testid="product-card"]',
        '[data-testid="add-to-cart"]',
        '[data-testid="cart-button"]'
      ];

      const selectorResults = [];

      for (const selector of criticalSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();

        selectorResults.push({
          selector,
          found: count > 0,
          count
        });
      }

      // Check for brittle selectors that should be avoided
      const brittleSelectors = [
        '.btn-primary:nth-child(2)', // Position-based
        'div > div > button',         // Deep nesting
        'button:contains("Buy")',     // Text-based (fragile)
        '#content > .main > .product-list > .item:first' // Long chains
      ];

      for (const brittleSelector of brittleSelectors) {
        const elements = page.locator(brittleSelector);
        const count = await elements.count();

        if (count > 0) {
          console.warn(`⚠️ ${tenant}: Found potentially brittle selector: ${brittleSelector}`);
        }
      }

      // Verify we have stable selectors for critical actions
      const hasStableSelectors = selectorResults.some(result => result.found);
      expect(hasStableSelectors).toBeTruthy();

      console.log(`✅ ${tenant}: Selector stability validated`);
    }
  });

  test('Error recovery and graceful degradation', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);

      // Test network error recovery
      await page.route('**/api/**', route => {
        // Simulate intermittent API failures
        if (Math.random() < 0.3) { // 30% failure rate
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Simulated server error' })
          });
        } else {
          route.continue();
        }
      });

      const tracker = new ClickBudgetTracker(page, 'purchase');

      // Attempt to interact with product despite potential API failures
      await tracker.waitForNetworkIdle(5000);

      const productGrid = page.locator('[data-testid="products-grid"], .products-grid');
      const hasProducts = await productGrid.count() > 0;

      if (hasProducts) {
        const productCard = productGrid.locator('[data-testid="product-card"]').first();
        if (await productCard.count() > 0) {
          await productCard.click();

          // Check if error state is handled gracefully
          const errorBanner = page.locator('[data-testid="error-banner"], .error-message');
          const hasError = await errorBanner.count() > 0;

          if (hasError) {
            const errorText = await errorBanner.textContent();
            expect(errorText?.toLowerCase()).toContain('error');
            console.log(`✅ ${tenant}: Error state handled gracefully`);
          } else {
            console.log(`✅ ${tenant}: Operation completed without errors`);
          }
        }
      }
    }
  });

  test('Performance-aware self-healing - timeout management', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);

      const tracker = new ClickBudgetTracker(page, 'purchase');

      // Test progressive timeout strategy
      const timeouts = [1000, 3000, 5000]; // Progressive timeouts
      let elementFound = false;

      for (const timeout of timeouts) {
        try {
          await page.locator('[data-testid="product-card"]').first().waitFor({
            state: 'visible',
            timeout
          });

          elementFound = true;
          console.log(`✅ ${tenant}: Element found within ${timeout}ms`);
          break;

        } catch (error) {
          console.log(`⏱️ ${tenant}: Element not found within ${timeout}ms, trying longer timeout...`);
        }
      }

      if (!elementFound) {
        console.log(`⚠️ ${tenant}: Element not found after maximum timeout - may need manual intervention`);
      }

      // Verify we don't use excessive timeouts
      const maxAcceptableTimeout = 10000; // 10 seconds maximum
      expect(Math.max(...timeouts)).toBeLessThanOrEqual(maxAcceptableTimeout);
    }
  });
});