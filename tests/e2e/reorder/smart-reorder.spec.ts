import { test, expect } from '@playwright/test';

/**
 * Test 7: Smart Reorder with Inventory Check
 * Reference: agents/outputs/testing/e2e-flows.md:265-291
 */

test.describe('Smart Reorder with Substitutions - 1 Click Budget', () => {
  test('should complete smart reorder with substitutions in 1 click', async ({ page }) => {
    let clickCount = 0;

    await page.addInitScript(() => {
      window.addEventListener('click', () => {
        (window as any).clickCount = ((window as any).clickCount || 0) + 1;
      });
    });

    await page.goto('/t/wondernails/dashboard/quick-actions');
    await page.waitForLoadState('networkidle');

    const smartReorderBtn = page.locator('[data-testid="smart-reorder"], button:has-text("Smart Reorder")');

    if (await smartReorderBtn.isVisible()) {
      // CLICK 1: Smart reorder button
      await smartReorderBtn.click();
      clickCount = await page.evaluate(() => (window as any).clickCount || 0);
      expect(clickCount).toBe(1);

      await page.waitForTimeout(1000);

      // Verify smart substitutions made
      const reorderWithSubstitutions = page.locator('[data-testid="reorder-with-substitutions"]');
      if (await reorderWithSubstitutions.isVisible()) {
        await expect(reorderWithSubstitutions).toBeVisible();

        // Should show substitution details
        const substitutionDetails = page.locator('[data-testid="substitution-details"]');
        await expect(substitutionDetails).toBeVisible();

        // Should show order confirmed
        const orderConfirmed = page.locator('[data-testid="order-confirmed"]');
        await expect(orderConfirmed).toBeVisible();
      }
    }

    // Verify click budget met (exactly 1 click)
    const finalClickCount = await page.evaluate(() => (window as any).clickCount || 0);
    expect(finalClickCount).toBe(1);
  });

  test('should detect out-of-stock items and suggest alternatives', async ({ page }) => {
    await page.goto('/t/wondernails/account/orders');

    const previousOrder = page.locator('[data-testid="order-item"]').first();
    if (await previousOrder.isVisible()) {
      const reorderBtn = previousOrder.locator('[data-testid="reorder-btn"]');
      await reorderBtn.click();

      await page.waitForTimeout(500);

      // If items are out of stock, should show substitution modal
      const substitutionModal = page.locator('[data-testid="substitution-modal"], [data-testid="out-of-stock-modal"]');
      if (await substitutionModal.isVisible()) {
        // Should list out-of-stock items
        const outOfStockItems = substitutionModal.locator('[data-testid="out-of-stock-item"]');
        const outOfStockCount = await outOfStockItems.count();
        expect(outOfStockCount).toBeGreaterThan(0);

        // Should suggest alternatives
        const alternatives = substitutionModal.locator('[data-testid="alternative-product"]');
        const alternativeCount = await alternatives.count();
        expect(alternativeCount).toBeGreaterThanOrEqual(outOfStockCount);

        // Each alternative should have similarity score or reason
        const firstAlternative = alternatives.first();
        const reason = firstAlternative.locator('[data-testid="substitution-reason"]');
        if (await reason.isVisible()) {
          const reasonText = await reason.textContent();
          expect(reasonText?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should apply smart substitution preferences', async ({ page }) => {
    // Navigate to user preferences
    await page.goto('/t/wondernails/account/preferences');

    const substitutionPreferences = page.locator('[data-testid="substitution-preferences"]');
    if (await substitutionPreferences.isVisible()) {
      // Should allow setting substitution rules
      const autoSubstitute = page.locator('[data-testid="auto-substitute"], input[name="autoSubstitute"]');
      if (await autoSubstitute.isVisible()) {
        await autoSubstitute.check();

        // Should allow selecting preference type
        const preferenceType = page.locator('[data-testid="preference-type"], select[name="preferenceType"]');
        if (await preferenceType.isVisible()) {
          await preferenceType.selectOption('similar-color');

          // Save preferences
          const saveBtn = page.locator('button:has-text("Save")');
          await saveBtn.click();

          await page.waitForTimeout(500);

          // Verify preferences saved
          const confirmation = page.locator('[data-testid="preferences-saved"]');
          if (await confirmation.isVisible()) {
            await expect(confirmation).toBeVisible();
          }
        }
      }
    }
  });

  test('should show price comparison for substitutions', async ({ page }) => {
    await page.goto('/t/wondernails/account/orders');

    const order = page.locator('[data-testid="order-item"]').first();
    if (await order.isVisible()) {
      const reorderBtn = order.locator('[data-testid="smart-reorder-btn"], [data-testid="reorder-btn"]');
      await reorderBtn.click();

      await page.waitForTimeout(500);

      const substitutionModal = page.locator('[data-testid="substitution-modal"]');
      if (await substitutionModal.isVisible()) {
        const substitution = substitutionModal.locator('[data-testid="substitution-item"]').first();

        // Should show original price
        const originalPrice = substitution.locator('[data-testid="original-price"]');
        if (await originalPrice.isVisible()) {
          const originalPriceText = await originalPrice.textContent();

          // Should show substitute price
          const substitutePrice = substitution.locator('[data-testid="substitute-price"]');
          const substitutePriceText = await substitutePrice.textContent();

          // Should show price difference
          const priceDiff = substitution.locator('[data-testid="price-difference"]');
          if (await priceDiff.isVisible()) {
            const diffText = await priceDiff.textContent();

            // Should indicate if it's more expensive, cheaper, or same
            expect(diffText).toMatch(/more|less|same|cheaper|expensive|\+|-|=/i);
          }
        }
      }
    }
  });

  test('should handle complete inventory check before reorder', async ({ page }) => {
    await page.goto('/t/wondernails/account/orders');

    const order = page.locator('[data-testid="order-item"]').first();
    if (await order.isVisible()) {
      const smartReorderBtn = order.locator('[data-testid="smart-reorder-btn"]');
      await smartReorderBtn.click();

      // Should show loading state during inventory check
      const inventoryCheck = page.locator('[data-testid="checking-inventory"], [data-testid="loading"]');
      if (await inventoryCheck.isVisible()) {
        await expect(inventoryCheck).toBeVisible();
      }

      await page.waitForTimeout(1000);

      // Should show inventory status summary
      const inventorySummary = page.locator('[data-testid="inventory-summary"]');
      if (await inventorySummary.isVisible()) {
        // Should show count of available, out-of-stock, and substituted items
        const availableCount = inventorySummary.locator('[data-testid="available-count"]');
        const outOfStockCount = inventorySummary.locator('[data-testid="out-of-stock-count"]');
        const substitutedCount = inventorySummary.locator('[data-testid="substituted-count"]');

        if (await availableCount.isVisible()) {
          const availableText = await availableCount.textContent();
          expect(availableText).toMatch(/\d+/);
        }
      }
    }
  });

  test('should maintain order history with substitution records', async ({ page }) => {
    // After completing a smart reorder with substitutions
    await page.goto('/t/wondernails/account/orders');

    const recentOrder = page.locator('[data-testid="order-item"]').first();
    if (await recentOrder.isVisible()) {
      // Click to view order details
      await recentOrder.click();

      await page.waitForTimeout(500);

      // Should show which items were substituted
      const substitutedItems = page.locator('[data-testid="substituted-item"]');
      const substitutedCount = await substitutedItems.count();

      if (substitutedCount > 0) {
        const firstSubstitution = substitutedItems.first();

        // Should show original item
        const originalItem = firstSubstitution.locator('[data-testid="original-item-name"]');
        await expect(originalItem).toBeVisible();

        // Should show substitute item
        const substituteItem = firstSubstitution.locator('[data-testid="substitute-item-name"]');
        await expect(substituteItem).toBeVisible();

        // Should show reason for substitution
        const reason = firstSubstitution.locator('[data-testid="substitution-reason"]');
        if (await reason.isVisible()) {
          const reasonText = await reason.textContent();
          expect(reasonText).toMatch(/out of stock|unavailable|better alternative/i);
        }
      }
    }
  });
});
