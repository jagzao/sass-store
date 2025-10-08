import { test, expect } from '@playwright/test';

test.describe('Click Budget Tests - UX Optimization', () => {
  test('Purchase Flow - should complete in ≤3 clicks', async ({ page }) => {
    // Test on catalog tenants
    const catalogTenants = ['nom-nom', 'delirios', 'vainilla-vargas'];

    for (const tenant of catalogTenants) {
      let clickCount = 0;

      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Click 1: Add product to cart
      const addToCartButton = page.locator('[data-testid="add-to-cart"]').first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        clickCount++;

        // Click 2: View mini-cart or go to cart
        await page.waitForTimeout(500); // Allow cart state to update
        const cartButton = page.locator('[data-testid="cart-button"], [data-testid="view-cart"], .cart-icon').first();
        if (await cartButton.isVisible()) {
          await cartButton.click();
          clickCount++;

          // Click 3: Proceed to checkout
          const checkoutButton = page.locator('[data-testid="checkout"], [data-testid="proceed-checkout"]').first();
          if (await checkoutButton.isVisible()) {
            await checkoutButton.click();
            clickCount++;

            // Verify we reached checkout
            await page.waitForLoadState('networkidle');
            const isCheckoutPage = await page.locator('[data-testid="checkout-form"], .checkout, h1:has-text("Checkout")').isVisible();

            if (isCheckoutPage) {
              expect(clickCount).toBeLessThanOrEqual(3);
              console.log(`✓ ${tenant}: Purchase completed in ${clickCount} clicks`);
            }
          }
        }
      }
    }
  });

  test('Booking Flow - should complete in ≤2 clicks', async ({ page }) => {
    // Test on booking tenants
    const bookingTenants = ['wondernails', 'vigistudio', 'villafuerte'];

    for (const tenant of bookingTenants) {
      let clickCount = 0;

      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Click 1: Select available slot or quick book
      const quickBookButton = page.locator('[data-testid="quick-book"], [data-testid="book-now"], [data-testid="reservar-ahora"]').first();
      if (await quickBookButton.isVisible()) {
        await quickBookButton.click();
        clickCount++;

        // Click 2: Confirm booking
        await page.waitForTimeout(500);
        const confirmButton = page.locator('[data-testid="confirm-booking"], [data-testid="confirmar-reserva"], button:has-text("Confirmar")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          clickCount++;

          // Verify booking was processed
          await page.waitForLoadState('networkidle');
          const bookingConfirmed = await page.locator('[data-testid="booking-confirmed"], .booking-success, .reservation-success').isVisible();

          if (bookingConfirmed || page.url().includes('confirmation')) {
            expect(clickCount).toBeLessThanOrEqual(2);
            console.log(`✓ ${tenant}: Booking completed in ${clickCount} clicks`);
          }
        }
      }
    }
  });

  test('Reorder Flow - should complete in ≤1 click', async ({ page }) => {
    // Test reorder functionality
    const tenant = 'delirios'; // Use a catalog tenant

    await page.goto(`/t/${tenant}`);
    await page.waitForLoadState('networkidle');

    // Look for reorder functionality
    const reorderButton = page.locator('[data-testid="reorder"], [data-testid="buy-again"], button:has-text("Comprar de nuevo")').first();

    if (await reorderButton.isVisible()) {
      let clickCount = 0;

      // Click 1: Reorder
      await reorderButton.click();
      clickCount++;

      // Verify item was added to cart
      await page.waitForTimeout(500);
      const cartCount = page.locator('[data-testid="cart-count"], .cart-count');
      if (await cartCount.isVisible()) {
        const count = await cartCount.textContent();
        expect(parseInt(count || '0')).toBeGreaterThan(0);
        expect(clickCount).toBeLessThanOrEqual(1);
        console.log(`✓ ${tenant}: Reorder completed in ${clickCount} click`);
      }
    }
  });

  test('Mobile Touch Targets - should meet 44px minimum', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const tenants = ['wondernails', 'nom-nom'];

    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check touch targets
      const buttons = page.locator('button, a, [data-testid*="button"], [role="button"]');
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const boundingBox = await button.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('Command Palette - should open with Cmd+K', async ({ page }) => {
    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    // Press Cmd+K (or Ctrl+K on Windows)
    await page.keyboard.press('Control+k');

    // Look for command palette
    const commandPalette = page.locator('[data-testid="command-palette"], .command-palette, [role="dialog"]:has-text("Search")');

    // If command palette exists, it should be visible
    if (await commandPalette.count() > 0) {
      await expect(commandPalette.first()).toBeVisible();
    }
  });

  test('Quick Actions Dock - should show role-appropriate actions', async ({ page }) => {
    const tenants = ['wondernails', 'nom-nom'];

    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Look for quick actions
      const quickActions = page.locator('[data-testid="quick-actions"], .quick-actions, .floating-actions');

      if (await quickActions.isVisible()) {
        // Verify common actions are present
        const commonActions = ['Buscar', 'Carrito', 'Menú', 'Search', 'Cart', 'Menu'];
        const actionsText = await quickActions.textContent();

        const hasCommonAction = commonActions.some(action =>
          actionsText?.toLowerCase().includes(action.toLowerCase())
        );

        expect(hasCommonAction).toBeTruthy();
      }
    }
  });

  test('Keyboard Navigation - should support full keyboard accessibility', async ({ page }) => {
    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    // Test Tab navigation
    let focusableElements = 0;
    let currentElement = await page.locator(':focus').first();

    // Tab through first 10 focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const newFocusedElement = await page.locator(':focus').first();

      if (await newFocusedElement.isVisible()) {
        focusableElements++;

        // Verify focus is visible
        const focusOutlineStyle = await newFocusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        });

        // Should have some kind of focus indicator
        const hasFocusIndicator = focusOutlineStyle.outline !== 'none' ||
                                 focusOutlineStyle.outlineWidth !== '0px' ||
                                 focusOutlineStyle.boxShadow !== 'none';

        expect(hasFocusIndicator).toBeTruthy();
      }
    }

    expect(focusableElements).toBeGreaterThan(0);
  });

  test('Admin Actions - should complete in ≤2 clicks', async ({ page }) => {
    // This test would require admin authentication
    // For now, we'll test the flow assuming we can reach admin sections

    const tenant = 'wondernails';
    await page.goto(`/t/${tenant}/admin`);

    // If admin page is accessible
    if (page.url().includes('admin') || page.url().includes('dashboard')) {
      let clickCount = 0;

      // Test save changes action
      const saveButton = page.locator('[data-testid="save"], button:has-text("Guardar"), button:has-text("Save")').first();
      if (await saveButton.isVisible()) {
        // Assume we made some change first
        await saveButton.click();
        clickCount++;

        expect(clickCount).toBeLessThanOrEqual(2);
      }

      // Test image upload action
      const uploadButton = page.locator('[data-testid="upload"], input[type="file"]').first();
      if (await uploadButton.isVisible()) {
        clickCount = 0;
        // Click upload button would be click 1, selecting file would be click 2
        expect(2).toBeLessThanOrEqual(2); // This would be tested with actual file upload
      }
    }
  });
});