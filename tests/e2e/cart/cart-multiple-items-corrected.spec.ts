import { test, expect } from '@playwright/test';

/**
 * Test 1: Cart - Multiple Items (CORRECTED VERSION)
 * Reference: agents/outputs/testing/e2e-flows.md:69-152
 */

test.describe('Cart - Multiple Items (CORRECTED)', () => {
  const tenants = ['wondernails', 'nom-nom'];

  test('should handle multiple items with correct price calculations', async ({ page }) => {
    for (const tenant of tenants) {
      // Navigate to tenant page
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Clear cart first
      await page.evaluate((tenantSlug) => {
        localStorage.removeItem(`cart_${tenantSlug}`);
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Find and add first product
      const firstProduct = page.locator('[data-testid="product-card"]').first();
      if (await firstProduct.count() > 0) {
        // Increase quantity to 2
        const plusButton = firstProduct.locator('button:has-text("+")');
        await plusButton.click();
        await page.waitForTimeout(100);

        // Click "Comprar Ahora"
        const buyButton = firstProduct.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Should be on cart page
        expect(page.url()).toContain('/cart');

        // Go back to products
        await page.goto(`/t/${tenant}/products`);
        await page.waitForLoadState('networkidle');

        // Find and add second product (different from first)
        const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
        if (await secondProduct.count() > 0) {
          // Increase quantity to 3
          const plusButton2 = secondProduct.locator('button:has-text("+")');
          await plusButton2.click();
          await plusButton2.click();
          await page.waitForTimeout(100);

          // Click "Comprar Ahora"
          const buyButton2 = secondProduct.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
          await buyButton2.click();
          await page.waitForLoadState('networkidle');

          // Should be on cart page with 2 items
          expect(page.url()).toContain('/cart');

          // Verify cart has 2 different items
          const cartItems = page.locator('[data-testid="cart-item"]');
          const itemCount = await cartItems.count();
          expect(itemCount).toBeGreaterThanOrEqual(2);

          // Verify prices are displayed correctly (no "toFixed is not a function" error)
          const prices = page.locator('text=/\\$\\d+\\.\\d{2}/');
          const priceCount = await prices.count();
          expect(priceCount).toBeGreaterThan(0);

          // Verify each price element is visible
          for (let i = 0; i < Math.min(priceCount, 5); i++) {
            await expect(prices.nth(i)).toBeVisible();
          }

          // Verify "c/u" (unit price) is shown for items with quantity > 1
          const unitPrices = page.locator('text=/\\$\\d+\\.\\d{2}\\s+c\\/u/');
          const unitPriceCount = await unitPrices.count();
          expect(unitPriceCount).toBeGreaterThan(0);

          // Verify subtotal is calculated
          const subtotal = page.locator('text=/Subtotal/');
          await expect(subtotal).toBeVisible();

          // Verify total is calculated
          const total = page.locator('text=/Total/');
          await expect(total).toBeVisible();

          // Test quantity update
          const firstCartItem = cartItems.first();
          const minusButton = firstCartItem.locator('button:has-text("-")');

          // Get initial quantity
          const quantityDisplay = firstCartItem.locator('text=/\\d+/').first();
          const initialQuantity = await quantityDisplay.textContent();

          // Decrease quantity
          await minusButton.click();
          await page.waitForTimeout(200);

          // Verify quantity decreased
          const newQuantity = await quantityDisplay.textContent();
          expect(parseInt(newQuantity || '0')).toBeLessThan(parseInt(initialQuantity || '0'));

          // Verify prices still display correctly after update
          const updatedPrices = page.locator('text=/\\$\\d+\\.\\d{2}/');
          const updatedPriceCount = await updatedPrices.count();
          expect(updatedPriceCount).toBeGreaterThan(0);

          // Test remove item
          const removeButton = firstCartItem.locator('button[aria-label*="Eliminar"], button:has-text("🗑")');
          if (await removeButton.count() > 0) {
            await removeButton.click();
            await page.waitForTimeout(200);

            // Verify item was removed
            const remainingItems = await cartItems.count();
            expect(remainingItems).toBeLessThan(itemCount);
          }

          console.log(`✅ ${tenant}: Cart with multiple items validated`);
        }
      }
    }
  });

  test('should display correct unit prices for items with quantity > 1', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((tenantSlug) => {
        localStorage.removeItem(`cart_${tenantSlug}`);
      }, tenant);

      // Add a product with quantity > 1
      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // Set quantity to 3
        const plusButton = product.locator('button:has-text("+")');
        await plusButton.click();
        await plusButton.click();
        await page.waitForTimeout(100);

        // Add to cart
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Verify unit price is shown
        const unitPrice = page.locator('text=/\\$\\d+\\.\\d{2}\\s+c\\/u/');
        await expect(unitPrice.first()).toBeVisible();

        // Verify total price is shown
        const totalPrice = page.locator('[data-testid="cart-item"]').first().locator('text=/\\$\\d+\\.\\d{2}/').first();
        await expect(totalPrice).toBeVisible();

        // Verify no JavaScript errors (specifically no "toFixed is not a function")
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(500);

        // Check for toFixed errors
        const hasToFixedError = errors.some(err => err.includes('toFixed is not a function'));
        expect(hasToFixedError).toBe(false);

        console.log(`✅ ${tenant}: Unit prices displayed correctly`);
      }
    }
  });

  test('should not crash when adding multiple items of same product', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart
      await page.evaluate((tenantSlug) => {
        localStorage.removeItem(`cart_${tenantSlug}`);
      }, tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        // Add same product twice
        for (let i = 0; i < 2; i++) {
          const plusButton = product.locator('button:has-text("+")');
          await plusButton.click();

          const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
          await buyButton.click();
          await page.waitForLoadState('networkidle');

          if (i === 0) {
            // Go back to products for second addition
            await page.goto(`/t/${tenant}/products`);
            await page.waitForLoadState('networkidle');
          }
        }

        // Should be on cart page
        expect(page.url()).toContain('/cart');

        // Should not have errors
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(500);

        expect(errors.length).toBe(0);

        console.log(`✅ ${tenant}: Multiple additions of same product handled correctly`);
      }
    }
  });
});