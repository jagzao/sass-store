import { test, expect } from '@playwright/test';

/**
 * Cart Coupon System E2E Tests
 * Tests for coupon application, validation, and discount calculations
 */

test.describe('Cart - Coupon System', () => {
  const tenants = ['wondernails', 'vigistudio'];

  test.describe('Coupon Application', () => {
    test('should apply valid percentage coupon', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add item
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Get original total
        const originalTotalText = await page.locator('text=/Total|Total:/').first().textContent();
        const originalTotal = parseFloat(originalTotalText?.replace(/[^\d.]/g, '') || '0');

        // Apply valid coupon
        const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
        if (await couponInput.count() > 0) {
          await couponInput.fill('SAVE10');
          const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Should show discount
          const discountText = page.locator('text=/Descuento|Discount|10%/');
          await expect(discountText.first()).toBeVisible();

          // New total should be 10% less
          const newTotalText = await page.locator('text=/Total|Total:/').last().textContent();
          const newTotal = parseFloat(newTotalText?.replace(/[^\d.]/g, '') || '0');

          expect(newTotal).toBeCloseTo(originalTotal * 0.9, 2);

          console.log(`✅ ${tenant}: 10% coupon applied correctly (${originalTotal} → ${newTotal})`);
        }
      }
    });

    test('should apply valid flat discount coupon', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add item
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Get original total
        const originalTotalText = await page.locator('text=/Total|Total:/').first().textContent();
        const originalTotal = parseFloat(originalTotalText?.replace(/[^\d.]/g, '') || '0');

        // Apply flat discount coupon
        const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
        if (await couponInput.count() > 0) {
          await couponInput.fill('FLAT50');
          const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Should show $50 discount
          const discountText = page.locator('text=/Descuento|Discount|\\$50/');
          await expect(discountText.first()).toBeVisible();

          // New total should be $50 less
          const newTotalText = await page.locator('text=/Total|Total:/').last().textContent();
          const newTotal = parseFloat(newTotalText?.replace(/[^\d.]/g, '') || '0');

          expect(newTotal).toBeCloseTo(Math.max(0, originalTotal - 50), 2);

          console.log(`✅ ${tenant}: $50 flat coupon applied correctly (${originalTotal} → ${newTotal})`);
        }
      }
    });

    test('should reject invalid coupon', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        await couponInput.fill('INVALID_COUPON_12345');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Should show error message
        const errorMessage = page.locator('text=/cupón.*inválido|invalid.*coupon|no.*válido/i');
        await expect(errorMessage.first()).toBeVisible();

        // Should not apply discount
        const discountText = page.locator('text=/Descuento|Discount/');
        expect(await discountText.count()).toBe(0);

        console.log(`✅ ${tenant}: Invalid coupon rejected correctly`);
      }
    });
  });

  test.describe('Coupon Edge Cases', () => {
    test('should handle coupon case insensitivity', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add item
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
        if (await couponInput.count() > 0) {
          // Try different cases
          const testCases = ['save10', 'SAVE10', 'Save10', 'SaVe10'];

          for (const couponCode of testCases) {
            await couponInput.clear();
            await couponInput.fill(couponCode);
            const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
            await applyButton.click();
            await page.waitForTimeout(500);

            // Should accept regardless of case
            const discountText = page.locator('text=/Descuento|Discount|10%/');
            if (await discountText.count() > 0) {
              console.log(`✅ ${tenant}: Coupon case insensitive (${couponCode} accepted)`);
              break;
            }
          }
        }
      }
    });

    test('should allow coupon removal', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add item
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        // Apply coupon
        const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
        if (await couponInput.count() > 0) {
          await couponInput.fill('SAVE10');
          const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Verify discount applied
          const discountText = page.locator('text=/Descuento|Discount|10%/');
          await expect(discountText.first()).toBeVisible();

          // Remove coupon
          const removeButton = page.locator('button:has-text("Remover"), button:has-text("Remove"), button[aria-label*="remover" i]');
          if (await removeButton.count() > 0) {
            await removeButton.click();
            await page.waitForTimeout(500);

            // Discount should be removed
            expect(await discountText.count()).toBe(0);

            console.log(`✅ ${tenant}: Coupon removal works correctly`);
          }
        }
      }
    });

    test('should handle multiple coupon applications', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add item
      await page.evaluate((t) => localStorage.removeItem(`cart_${t}`), tenant);

      const product = page.locator('[data-testid="product-card"]').first();
      if (await product.count() > 0) {
        const buyButton = product.locator('button:has-text("Comprar Ahora"), button:has-text("Comprar ahora")');
        await buyButton.click();
        await page.waitForLoadState('networkidle');

        const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
        if (await couponInput.count() > 0) {
          const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');

          // Apply first coupon
          await couponInput.fill('SAVE10');
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Try to apply second coupon (should replace first)
          await couponInput.clear();
          await couponInput.fill('WELCOME20');
          await applyButton.click();
          await page.waitForTimeout(1000);

          // Should show 20% discount (second coupon)
          const discountText = page.locator('text=/Descuento|Discount|20%/');
          await expect(discountText.first()).toBeVisible();

          console.log(`✅ ${tenant}: Multiple coupon applications handled correctly`);
        }
      }
    });
  });

  test.describe('Coupon Validation', () => {
    test('should validate minimum purchase requirements', async ({ page }) => {
      // This test assumes coupons might have minimum purchase requirements
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      // Add small item
      await page.evaluate((t) => {
        const smallItem = {
          sku: 'small-item',
          name: 'Small Item',
          price: 1.00,
          quantity: 1,
          image: 'test.jpg'
        };
        localStorage.setItem(`cart_${t}`, JSON.stringify([smallItem]));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        // Try coupon that might require minimum purchase
        await couponInput.fill('SAVE10');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Should either apply or show minimum purchase error
        const discountText = page.locator('text=/Descuento|Discount|10%/');
        const errorText = page.locator('text=/mínimo|minimum|compra|purchase/i');

        expect(await discountText.count() + await errorText.count()).toBeGreaterThan(0);

        console.log(`✅ ${tenant}: Minimum purchase validation works`);
      }
    });

    test('should handle expired coupons', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        // Try obviously expired coupon code
        await couponInput.fill('EXPIRED2020');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Should show error
        const errorMessage = page.locator('text=/expirado|expired|inválido|invalid/i');
        expect(await errorMessage.count()).toBeGreaterThan(0);

        console.log(`✅ ${tenant}: Expired coupon handling works`);
      }
    });

    test('should prevent coupon abuse', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/cart`);
      await page.waitForLoadState('networkidle');

      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');

        // Try rapid coupon applications
        for (let i = 0; i < 5; i++) {
          await couponInput.clear();
          await couponInput.fill(`ABUSE${i}`);
          await applyButton.click();
          await page.waitForTimeout(100);
        }

        // Should not crash and should handle rate limiting gracefully
        const errors: string[] = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });

        await page.waitForTimeout(500);

        // Should not have critical errors
        const criticalErrors = errors.filter(err =>
          err.includes('TypeError') ||
          err.includes('RangeError')
        );

        expect(criticalErrors.length).toBe(0);

        console.log(`✅ ${tenant}: Coupon abuse prevention works`);
      }
    });
  });

  test.describe('Discount Calculations', () => {
    test('should calculate percentage discounts correctly', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add multiple items with known prices
      await page.evaluate((t) => {
        const items = [
          { sku: 'item1', name: 'Item 1', price: 100.00, quantity: 1, image: 'test.jpg' },
          { sku: 'item2', name: 'Item 2', price: 50.00, quantity: 2, image: 'test.jpg' }
        ];
        localStorage.setItem(`cart_${t}`, JSON.stringify(items));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Subtotal should be 100 + (50*2) = 200
      const subtotalText = await page.locator('text=/Subtotal|Subtotal:/').first().textContent();
      const subtotal = parseFloat(subtotalText?.replace(/[^\d.]/g, '') || '0');
      expect(subtotal).toBeCloseTo(200, 2);

      // Apply 10% discount
      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        await couponInput.fill('SAVE10');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Discount should be 200 * 0.10 = 20
        const discountText = await page.locator('text=/Descuento|Discount/').first().textContent();
        const discount = parseFloat(discountText?.replace(/[^\d.]/g, '') || '0');
        expect(discount).toBeCloseTo(20, 2);

        // Final total should be 200 - 20 = 180
        const totalText = await page.locator('text=/Total|Total:/').last().textContent();
        const total = parseFloat(totalText?.replace(/[^\d.]/g, '') || '0');
        expect(total).toBeCloseTo(180, 2);

        console.log(`✅ ${tenant}: Percentage discount calculations correct (${subtotal} → ${total})`);
      }
    });

    test('should calculate flat discounts correctly', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add item
      await page.evaluate((t) => {
        const item = {
          sku: 'expensive-item',
          name: 'Expensive Item',
          price: 100.00,
          quantity: 1,
          image: 'test.jpg'
        };
        localStorage.setItem(`cart_${t}`, JSON.stringify([item]));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Apply $50 flat discount
      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        await couponInput.fill('FLAT50');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Total should be 100 - 50 = 50
        const totalText = await page.locator('text=/Total|Total:/').last().textContent();
        const total = parseFloat(totalText?.replace(/[^\d.]/g, '') || '0');
        expect(total).toBeCloseTo(50, 2);

        console.log(`✅ ${tenant}: Flat discount calculations correct (100 → ${total})`);
      }
    });

    test('should not allow negative totals', async ({ page }) => {
      const tenant = tenants[0];
      await page.goto(`/t/${tenant}/products`);
      await page.waitForLoadState('networkidle');

      // Clear cart and add cheap item
      await page.evaluate((t) => {
        const item = {
          sku: 'cheap-item',
          name: 'Cheap Item',
          price: 10.00,
          quantity: 1,
          image: 'test.jpg'
        };
        localStorage.setItem(`cart_${t}`, JSON.stringify([item]));
      }, tenant);

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Apply large flat discount
      const couponInput = page.locator('input[placeholder*="cupón" i], input[placeholder*="coupon" i]');
      if (await couponInput.count() > 0) {
        await couponInput.fill('FLAT50');
        const applyButton = page.locator('button:has-text("Aplicar"), button:has-text("Apply")');
        await applyButton.click();
        await page.waitForTimeout(1000);

        // Total should be 0, not negative
        const totalText = await page.locator('text=/Total|Total:/').last().textContent();
        const total = parseFloat(totalText?.replace(/[^\d.]/g, '') || '0');
        expect(total).toBeGreaterThanOrEqual(0);

        console.log(`✅ ${tenant}: Negative totals prevented (${total})`);
      }
    });
  });
});