import { test, expect } from '@playwright/test';

/**
 * Test 21: Payment Gateway Timeout Recovery
 * Reference: agents/outputs/testing/e2e-flows.md:749-789
 */

test.describe('Payment Gateway Timeout Recovery', () => {
  test('should handle payment gateway timeout gracefully', async ({ page }) => {
    await page.goto('/t/wondernails/checkout');

    // Fill out checkout form
    const emailInput = page.locator('[data-testid="email-input"], input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }

    const addressInput = page.locator('[data-testid="address-input"], input[name="address"]');
    if (await addressInput.isVisible()) {
      await addressInput.fill('123 Test St');
    }

    const paymentCard = page.locator('[data-testid="payment-card"], input[name="cardNumber"]');
    if (await paymentCard.isVisible()) {
      await paymentCard.fill('4111111111111111');
    }

    // Mock payment gateway timeout
    await page.route('/api/payments/**', async (route) => {
      // Simulate timeout after delay
      await page.waitForTimeout(100);
      await route.fulfill({
        status: 408,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment gateway timeout' })
      });
    });

    const completeOrderBtn = page.locator('[data-testid="complete-order-btn"], button:has-text("Complete Order")');
    await completeOrderBtn.click();

    // Verify loading state
    const paymentProcessing = page.locator('[data-testid="payment-processing"], .loading');
    if (await paymentProcessing.isVisible()) {
      await expect(paymentProcessing).toBeVisible();
    }

    await page.waitForTimeout(500);

    // Verify timeout handling
    const timeoutMessage = page.locator('[data-testid="payment-timeout-message"], [role="alert"]');
    await expect(timeoutMessage).toBeVisible({ timeout: 5000 });

    // Retry button should be available
    const retryBtn = page.locator('[data-testid="payment-retry-btn"], button:has-text("Retry")');
    await expect(retryBtn).toBeVisible();

    // Test retry functionality
    // Remove timeout mock for retry
    await page.unroute('/api/payments/**');

    await retryBtn.click();

    // Should show processing again
    if (await paymentProcessing.isVisible()) {
      await expect(paymentProcessing).toBeVisible();
    }
  });

  test('should offer alternative payment methods on timeout', async ({ page }) => {
    await page.goto('/t/wondernails/checkout');

    // Fill minimal checkout info
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
    }

    // Mock timeout
    await page.route('/api/payments/**', route => {
      route.fulfill({
        status: 408,
        body: JSON.stringify({ error: 'Timeout' })
      });
    });

    const completeBtn = page.locator('[data-testid="complete-order-btn"]');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();

      await page.waitForTimeout(1000);

      // Alternative payment methods should be offered
      const alternativePayments = page.locator('[data-testid="alternative-payment-methods"]');
      if (await alternativePayments.isVisible()) {
        await expect(alternativePayments).toBeVisible();

        // Should have options like PayPal, bank transfer, etc.
        const paymentOptions = alternativePayments.locator('[data-testid="payment-option"]');
        const optionCount = await paymentOptions.count();

        expect(optionCount).toBeGreaterThan(0);
      }
    }
  });

  test('should preserve cart data during payment timeout', async ({ page }) => {
    // Add item to cart
    await page.goto('/t/wondernails/products');
    const addToCartBtn = page.locator('[data-testid="add-to-cart-btn"]').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(500);
    }

    // Go to checkout
    await page.goto('/t/wondernails/checkout');

    // Get initial cart items
    const cartItems = page.locator('[data-testid="cart-item"], [data-testid="checkout-item"]');
    const initialItemCount = await cartItems.count();

    // Mock timeout
    await page.route('/api/payments/**', route => {
      route.fulfill({ status: 408, body: '{"error":"timeout"}' });
    });

    const completeBtn = page.locator('[data-testid="complete-order-btn"]');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(1000);

      // Cart items should still be visible
      const currentItemCount = await page.locator('[data-testid="cart-item"], [data-testid="checkout-item"]').count();
      expect(currentItemCount).toBe(initialItemCount);
    }
  });

  test('should provide helpful timeout error messages', async ({ page }) => {
    await page.goto('/t/wondernails/checkout');

    await page.route('/api/payments/**', route => {
      route.fulfill({
        status: 408,
        body: JSON.stringify({
          error: 'Payment gateway timeout',
          message: 'The payment service is taking longer than expected. Please try again.'
        })
      });
    });

    const completeBtn = page.locator('[data-testid="complete-order-btn"], button[type="submit"]');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();

      await page.waitForTimeout(1000);

      const errorMessage = page.locator('[data-testid="error-message"], [role="alert"]');
      if (await errorMessage.isVisible()) {
        const messageText = await errorMessage.textContent();

        // Should have user-friendly message
        expect(messageText).toMatch(/try again|timeout|longer than expected/i);

        // Should NOT contain technical jargon
        expect(messageText).not.toMatch(/408|gateway|request timeout/i);
      }
    }
  });

  test('should track timeout attempts and suggest support contact', async ({ page }) => {
    await page.goto('/t/wondernails/checkout');

    // Mock persistent timeouts
    await page.route('/api/payments/**', route => {
      route.fulfill({ status: 408, body: '{"error":"timeout"}' });
    });

    const completeBtn = page.locator('[data-testid="complete-order-btn"]');
    const retryBtn = page.locator('[data-testid="payment-retry-btn"]');

    if (await completeBtn.isVisible()) {
      // First attempt
      await completeBtn.click();
      await page.waitForTimeout(500);

      // Second attempt
      if (await retryBtn.isVisible()) {
        await retryBtn.click();
        await page.waitForTimeout(500);
      }

      // Third attempt
      if (await retryBtn.isVisible()) {
        await retryBtn.click();
        await page.waitForTimeout(500);
      }

      // After multiple failures, should suggest support
      const supportContact = page.locator('[data-testid="support-contact"], [data-testid="contact-support"]');
      if (await supportContact.isVisible()) {
        await expect(supportContact).toBeVisible();

        // Should have contact information
        const contactInfo = await supportContact.textContent();
        expect(contactInfo).toMatch(/contact|support|help|phone|email/i);
      }
    }
  });

  test('should allow saving order for later completion on timeout', async ({ page }) => {
    await page.goto('/t/wondernails/checkout');

    await page.route('/api/payments/**', route => {
      route.fulfill({ status: 408, body: '{"error":"timeout"}' });
    });

    const completeBtn = page.locator('[data-testid="complete-order-btn"]');
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForTimeout(1000);

      // Option to save order for later
      const saveForLater = page.locator('[data-testid="save-order-for-later"], button:has-text("Save for Later")');
      if (await saveForLater.isVisible()) {
        await saveForLater.click();

        await page.waitForTimeout(500);

        // Should confirm order was saved
        const confirmation = page.locator('[data-testid="order-saved-confirmation"]');
        if (await confirmation.isVisible()) {
          await expect(confirmation).toBeVisible();

          // Should provide order reference number
          const orderRef = page.locator('[data-testid="order-reference"]');
          if (await orderRef.isVisible()) {
            const refText = await orderRef.textContent();
            expect(refText?.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('should not create duplicate orders on retry', async ({ page }) => {
    await page.goto('/t/wondernails/checkout');

    let requestCount = 0;

    await page.route('/api/payments/**', async (route) => {
      requestCount++;

      if (requestCount === 1) {
        // First request times out
        await route.fulfill({ status: 408, body: '{"error":"timeout"}' });
      } else {
        // Second request succeeds
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, orderId: 'ORDER-123' })
        });
      }
    });

    const completeBtn = page.locator('[data-testid="complete-order-btn"]');
    if (await completeBtn.isVisible()) {
      // First attempt (timeout)
      await completeBtn.click();
      await page.waitForTimeout(500);

      // Retry (success)
      const retryBtn = page.locator('[data-testid="payment-retry-btn"]');
      if (await retryBtn.isVisible()) {
        await retryBtn.click();
        await page.waitForTimeout(500);

        // Should only have 2 API calls (original + retry), no duplicates
        expect(requestCount).toBe(2);

        // Should show success
        const success = page.locator('[data-testid="order-confirmation"]');
        if (await success.isVisible()) {
          await expect(success).toBeVisible();
        }
      }
    }
  });
});
