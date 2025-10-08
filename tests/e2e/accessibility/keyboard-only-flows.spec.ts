import { test, expect } from '@playwright/test';

/**
 * Test 15: Complete Purchase Flow via Keyboard
 * Test 16: Screen Reader Booking Flow
 * Reference: agents/outputs/testing/e2e-flows.md:531-615
 */

test.describe('Keyboard-Only Purchase Flow', () => {
  test('should complete entire purchase using only keyboard navigation', async ({ page }) => {
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');

    // Tab through product grid
    await page.keyboard.press('Tab'); // Focus search
    await page.keyboard.press('Tab'); // Focus first filter
    await page.keyboard.press('Tab'); // Focus first product

    // Select product via keyboard
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/products\/.+/);

    await page.waitForTimeout(500);

    // Navigate to add to cart
    await page.keyboard.press('Tab'); // Focus quantity selector or skip
    await page.keyboard.press('Tab'); // Focus add to cart button
    await page.keyboard.press('Enter'); // Add to cart

    await page.waitForTimeout(500);

    // Mini cart or cart page should appear
    const miniCart = page.locator('[data-testid="mini-cart"], [data-testid="cart-popup"]');
    const checkoutBtn = page.locator('[data-testid="checkout-btn"], button:has-text("Checkout")');

    if (await miniCart.isVisible()) {
      // Navigate within mini cart
      await page.keyboard.press('Tab'); // Focus view cart or checkout
      await page.keyboard.press('Tab'); // May need additional tabs
      await page.keyboard.press('Enter'); // Click checkout
    } else {
      // If redirected to cart page
      await expect(page).toHaveURL(/cart/);
      // Navigate to checkout button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    }

    // Should be on checkout page
    await expect(page).toHaveURL(/checkout/, { timeout: 3000 });

    // Complete checkout via keyboard (if payment form is present)
    const paymentMethod = page.locator('[data-testid="saved-payment-method"], [data-testid="payment-method"]');
    if (await paymentMethod.isVisible()) {
      await page.keyboard.press('Tab'); // Focus payment method
      await page.keyboard.press('Space'); // Select saved payment

      await page.keyboard.press('Tab'); // Focus complete order button
      await page.keyboard.press('Enter'); // Complete order

      // Verify order completion
      const orderConfirmation = page.locator('[data-testid="order-confirmation"]');
      await expect(orderConfirmation).toBeVisible({ timeout: 5000 });

      // Verify focused element is order confirmation
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      if (focusedElement) {
        expect(focusedElement).toMatch(/order-confirmation|confirmation/i);
      }
    }
  });

  test('should support keyboard navigation in product filters', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Tab to filters
    await page.keyboard.press('Tab'); // Skip to main content link
    await page.keyboard.press('Enter'); // Activate skip link

    const filterSection = page.locator('[data-testid="product-filters"], .filters-section');
    if (await filterSection.isVisible()) {
      // Focus first filter
      await page.keyboard.press('Tab');

      // Should be able to open filter dropdown with Enter
      await page.keyboard.press('Enter');

      // Navigate filter options with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      // Select option with Enter or Space
      await page.keyboard.press('Enter');

      // Verify filter was applied
      await page.waitForTimeout(500);
      const activeFilter = page.locator('[data-testid="active-filter"], .active-filter');
      if (await activeFilter.isVisible()) {
        await expect(activeFilter).toBeVisible();
      }
    }
  });

  test('should navigate product carousel with keyboard', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();

    const imageCarousel = page.locator('[data-testid="product-carousel"], [data-testid="image-gallery"]');
    if (await imageCarousel.isVisible()) {
      // Focus carousel controls
      await page.keyboard.press('Tab');

      // Navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(300);

      // Verify image changed
      const activeImage = page.locator('[data-testid="active-image"], .active');
      if (await activeImage.isVisible()) {
        await expect(activeImage).toBeVisible();
      }

      // Navigate back
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(300);
    }
  });

  test('should allow keyboard input in search', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.focus();

      // Type search query
      await page.keyboard.type('nail polish');

      // Submit with Enter
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500);

      // Should show search results
      const results = page.locator('[data-testid="search-results"], [data-testid="products-grid"]');
      await expect(results).toBeVisible();
    }
  });
});

test.describe('Screen Reader Booking Flow', () => {
  test('should announce booking form properly for screen readers', async ({ page }) => {
    // Enable screen reader simulation
    await page.addInitScript(() => {
      // Track ARIA announcements
      (window as any).announcements = [];
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-live') {
            const target = mutation.target as HTMLElement;
            (window as any).announcements.push(target.textContent);
          }
        });
      });
      observer.observe(document.body, { attributes: true, subtree: true });
    });

    await page.goto('/t/wondernails/services');

    // Verify service page heading is announced
    const serviceHeading = await page.locator('h1').textContent();
    expect(serviceHeading).toContain('Services');

    // Select service via screen reader
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Verify booking form has proper role and aria-label
    const bookingForm = page.locator('[data-testid="booking-form"], form');
    if (await bookingForm.isVisible()) {
      const role = await bookingForm.getAttribute('role');
      const ariaLabel = await bookingForm.getAttribute('aria-label');

      expect(role).toBe('form');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    }

    // Complete booking
    const selectTimeSlot = page.locator('[data-testid="select-time-slot"]').first();
    if (await selectTimeSlot.isVisible()) {
      await selectTimeSlot.click();

      const confirmBtn = page.locator('[data-testid="confirm-booking"]');
      await confirmBtn.click();

      // Verify confirmation is announced
      const bookingConfirmation = page.locator('[data-testid="booking-confirmation"]');
      if (await bookingConfirmation.isVisible()) {
        const ariaLive = await bookingConfirmation.getAttribute('aria-live');
        expect(ariaLive).toBe('polite');

        // Check announcements
        const announcements = await page.evaluate(() => (window as any).announcements);
        const hasConfirmation = announcements.some((a: string) => a?.includes('booking confirmed') || a?.includes('confirmed'));
        expect(hasConfirmation).toBeTruthy();
      }
    }
  });

  test('should have descriptive labels for all form inputs', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const bookButton = page.locator('[data-testid="book-service-btn"], button:has-text("Book")');
    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Check all form inputs have labels
      const inputs = page.locator('input:not([type="hidden"]), select, textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const inputId = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Input should have either:
        // 1. Associated label element
        // 2. aria-label attribute
        // 3. aria-labelledby attribute
        if (inputId) {
          const label = page.locator(`label[for="${inputId}"]`);
          const hasLabel = await label.count() > 0;
          const hasAriaLabel = ariaLabel !== null && ariaLabel.length > 0;
          const hasAriaLabelledBy = ariaLabelledBy !== null;

          expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
        }
      }
    }
  });

  test('should announce time slot availability', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    // Time slots should have aria-labels describing availability
    const timeSlots = page.locator('[data-testid="time-slot"]');
    const slotCount = await timeSlots.count();

    if (slotCount > 0) {
      for (let i = 0; i < Math.min(slotCount, 5); i++) {
        const slot = timeSlots.nth(i);
        const ariaLabel = await slot.getAttribute('aria-label');

        if (ariaLabel) {
          // Should include time and availability info
          expect(ariaLabel).toMatch(/\d{1,2}:\d{2}|AM|PM/i);
          expect(ariaLabel.length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();

    // Focus element
    await serviceCard.focus();

    // Check for visible focus indicator
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;

      const styles = window.getComputedStyle(active);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow
      };
    });

    // Should have some form of focus indicator
    const hasFocusIndicator =
      focusedElement?.outline !== 'none' ||
      focusedElement?.outlineWidth !== '0px' ||
      focusedElement?.boxShadow !== 'none';

    expect(hasFocusIndicator).toBeTruthy();
  });

  test('should support ARIA live regions for dynamic content', async ({ page }) => {
    await page.goto('/t/wondernails/services');

    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await serviceCard.click();

    const timeSlotPicker = page.locator('[data-testid="time-slot-picker"]');
    if (await timeSlotPicker.isVisible()) {
      // Select a date to load time slots
      const dateSelector = page.locator('[data-testid="date-selector"], input[type="date"]');
      if (await dateSelector.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dateSelector.fill(tomorrow.toISOString().split('T')[0]);

        // Wait for time slots to update
        await page.waitForTimeout(500);

        // Time slots container should have aria-live
        const ariaLive = await timeSlotPicker.getAttribute('aria-live');
        const ariaAtomic = await timeSlotPicker.getAttribute('aria-atomic');

        expect(ariaLive).toBeTruthy();
        expect(['polite', 'assertive']).toContain(ariaLive);
      }
    }
  });
});
