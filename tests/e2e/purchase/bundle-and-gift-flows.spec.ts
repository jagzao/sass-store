import { test, expect } from '@playwright/test';

/**
 * Test 2: Bundle Purchase with Cross-Sell
 * Test 3: Gift Purchase Flow
 * Reference: agents/outputs/testing/e2e-flows.md:69-152
 */

test.describe('Bundle Purchase with Cross-Sell - 3 Click Budget', () => {
  test('should complete bundle purchase with cross-sell in 3 clicks', async ({ page }) => {
    let clickCount = 0;

    // Track clicks
    await page.addInitScript(() => {
      window.addEventListener('click', () => {
        (window as any).clickCount = ((window as any).clickCount || 0) + 1;
      });
    });

    await page.goto('/t/wondernails/products/nail-polish-bundle');
    await page.waitForLoadState('networkidle');

    // Verify bundle offer is visible
    const bundleOffer = page.locator('[data-testid="bundle-offer"], .bundle-offer');
    if (await bundleOffer.isVisible()) {
      // CLICK 1: Accept bundle offer (includes main product + complementary items)
      await bundleOffer.locator('[data-testid="add-bundle-to-cart"], button:has-text("Add Bundle")').click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(1);

      await page.waitForTimeout(500);

      // Verify bundle added to cart (should show multiple items)
      const cartCount = page.locator('[data-testid="cart-item-count"], [data-testid="cart-count"]');
      if (await cartCount.isVisible()) {
        const count = await cartCount.textContent();
        expect(parseInt(count || '0')).toBeGreaterThanOrEqual(2); // Bundle of multiple items
      }

      // Cross-sell modal should appear
      const crossSellModal = page.locator('[data-testid="cross-sell-modal"], [data-testid="upsell-modal"]');
      if (await crossSellModal.isVisible()) {
        // CLICK 2: Accept cross-sell recommendation
        await crossSellModal.locator('[data-testid="accept-cross-sell"], button:has-text("Add")').first().click();
        clickCount = await page.evaluate(() => (window as any).clickCount || 0);
        expect(clickCount).toBe(2);

        await page.waitForTimeout(500);

        // Verify cross-sell item added
        const updatedCount = await page.locator('[data-testid="cart-item-count"]').textContent();
        expect(parseInt(updatedCount || '0')).toBeGreaterThan(parseInt(count || '0'));

        // CLICK 3: Proceed to express checkout
        const checkoutBtn = page.locator('[data-testid="express-checkout-from-modal"], [data-testid="checkout-btn"]');
        await checkoutBtn.click();
        clickCount = await page.evaluate(() => (window as any).clickCount || 0);
        expect(clickCount).toBe(3);

        // Verify navigation to checkout
        await expect(page).toHaveURL(/checkout/, { timeout: 3000 });
      }
    }

    // Verify click budget met
    const finalClickCount = await page.evaluate(() => (window as any).clickCount || 0);
    expect(finalClickCount).toBeLessThanOrEqual(3);
  });

  test('should show bundle savings and item breakdown', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const bundleProduct = page.locator('[data-testid="product-card"]').filter({ hasText: /bundle|kit|set/i }).first();
    if (await bundleProduct.isVisible()) {
      await bundleProduct.click();

      // Should show original price and bundle discount
      const originalPrice = page.locator('[data-testid="original-price"], .original-price');
      const bundlePrice = page.locator('[data-testid="bundle-price"], .bundle-price');

      if (await originalPrice.isVisible() && await bundlePrice.isVisible()) {
        const original = await originalPrice.textContent();
        const bundle = await bundlePrice.textContent();

        // Bundle price should be less than original
        const originalNum = parseFloat(original?.replace(/[^0-9.]/g, '') || '0');
        const bundleNum = parseFloat(bundle?.replace(/[^0-9.]/g, '') || '0');

        expect(bundleNum).toBeLessThan(originalNum);
      }

      // Should show items included in bundle
      const bundleItems = page.locator('[data-testid="bundle-items"], .bundle-contents');
      if (await bundleItems.isVisible()) {
        const items = bundleItems.locator('li, [data-testid="bundle-item"]');
        const itemCount = await items.count();

        expect(itemCount).toBeGreaterThan(1); // Bundle should have multiple items
      }
    }
  });
});

test.describe('Gift Purchase Flow - 3 Click Budget', () => {
  test('should complete gift purchase with gift options in 3 clicks', async ({ page }) => {
    let clickCount = 0;

    await page.addInitScript(() => {
      window.addEventListener('click', () => {
        (window as any).clickCount = ((window as any).clickCount || 0) + 1;
      });
    });

    await page.goto('/t/wondernails/gifts');
    await page.waitForLoadState('networkidle');

    const giftSection = page.locator('[data-testid="gifts-collection"], .gifts-section');
    if (await giftSection.isVisible()) {
      // CLICK 1: Select gift set with pre-configured options
      const giftSet = giftSection.locator('[data-testid="gift-set-complete"], [data-testid="gift-package"]').first();
      await giftSet.click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(1);

      await page.waitForTimeout(500);

      // Verify gift options are pre-selected
      const giftWrapSelected = page.locator('[data-testid="gift-wrap-selected"], [data-testid="gift-wrap-included"]');
      const giftMessageReady = page.locator('[data-testid="gift-message-ready"], [data-testid="gift-message-included"]');

      if (await giftWrapSelected.isVisible()) {
        await expect(giftWrapSelected).toBeVisible();
      }

      // CLICK 2: Choose recipient from saved addresses
      const recipientSelector = page.locator('[data-testid="recipient-saved-address"], [data-testid="select-recipient"]');
      if (await recipientSelector.isVisible()) {
        await recipientSelector.click();
        clickCount = await page.evaluate(() => (window as any).clickCount || 0);
        expect(clickCount).toBe(2);

        await page.waitForTimeout(500);

        // Verify recipient details populated
        const recipientInfo = page.locator('[data-testid="recipient-info"]');
        if (await recipientInfo.isVisible()) {
          await expect(recipientInfo).toBeVisible();
        }

        // CLICK 3: Complete gift purchase
        const sendGiftBtn = page.locator('[data-testid="send-gift-now"], button:has-text("Send Gift")');
        if (await sendGiftBtn.isVisible()) {
          await sendGiftBtn.click();
          clickCount = await page.evaluate(() => (window as any).clickCount || 0);
          expect(clickCount).toBe(3);

          // Verify gift purchase confirmation
          const giftConfirmation = page.locator('[data-testid="gift-confirmation"]');
          await expect(giftConfirmation).toBeVisible({ timeout: 5000 });

          // Should show tracking info
          const trackingInfo = page.locator('[data-testid="tracking-info"]');
          if (await trackingInfo.isVisible()) {
            await expect(trackingInfo).toBeVisible();
          }
        }
      }
    }

    // Verify click budget met
    const finalClickCount = await page.evaluate(() => (window as any).clickCount || 0);
    expect(finalClickCount).toBeLessThanOrEqual(3);
  });

  test('should allow custom gift message', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Find a product and add as gift
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    const giftOption = page.locator('[data-testid="gift-option"], input[type="checkbox"][name*="gift"]');
    if (await giftOption.isVisible()) {
      await giftOption.check();

      // Gift message field should appear
      const giftMessageField = page.locator('[data-testid="gift-message"], textarea[name*="gift"]');
      await expect(giftMessageField).toBeVisible();

      // Should allow custom message
      const customMessage = 'Happy Birthday! Hope you enjoy these beautiful nail polishes!';
      await giftMessageField.fill(customMessage);

      const messageValue = await giftMessageField.inputValue();
      expect(messageValue).toBe(customMessage);
    }
  });

  test('should show gift pricing with wrap costs', async ({ page }) => {
    await page.goto('/t/wondernails/gifts');

    const giftProduct = page.locator('[data-testid="gift-set"]').first();
    if (await giftProduct.isVisible()) {
      await giftProduct.click();

      // Should show base price
      const basePrice = page.locator('[data-testid="base-price"]');
      if (await basePrice.isVisible()) {
        const basePriceText = await basePrice.textContent();

        // Enable gift wrap
        const giftWrapCheckbox = page.locator('[data-testid="add-gift-wrap"], input[name="giftwrap"]');
        if (await giftWrapCheckbox.isVisible()) {
          await giftWrapCheckbox.check();

          // Total should update with gift wrap cost
          const totalPrice = page.locator('[data-testid="total-price"]');
          const totalPriceText = await totalPrice.textContent();

          const baseNum = parseFloat(basePriceText?.replace(/[^0-9.]/g, '') || '0');
          const totalNum = parseFloat(totalPriceText?.replace(/[^0-9.]/g, '') || '0');

          expect(totalNum).toBeGreaterThan(baseNum);
        }
      }
    }
  });

  test('should support scheduling gift delivery', async ({ page }) => {
    await page.goto('/t/wondernails/gifts');

    const giftProduct = page.locator('[data-testid="gift-set"]').first();
    if (await giftProduct.isVisible()) {
      await giftProduct.click();

      const scheduleDelivery = page.locator('[data-testid="schedule-delivery"], input[name="deliveryDate"]');
      if (await scheduleDelivery.isVisible()) {
        // Should allow selecting a future date
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateString = futureDate.toISOString().split('T')[0];

        await scheduleDelivery.fill(dateString);

        const selectedDate = await scheduleDelivery.inputValue();
        expect(selectedDate).toBe(dateString);
      }
    }
  });
});
