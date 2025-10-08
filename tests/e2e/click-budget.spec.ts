import { test, expect } from '@playwright/test';

class ClickBudgetTracker {
  private clickCount = 0;
  private maxClicks: Record<string, number> = {
    purchase: 3,
    booking: 2,
    reorder: 1
  };

  constructor(private page: any) {
    this.setupClickTracking();
  }

  private setupClickTracking() {
    // Track all click events
    this.page.on('click', () => {
      this.clickCount++;
    });
  }

  getClickCount(): number {
    return this.clickCount;
  }

  reset(): void {
    this.clickCount = 0;
  }

  assertClickBudget(flowType: keyof typeof this.maxClicks): void {
    const maxAllowed = this.maxClicks[flowType];
    if (this.clickCount > maxAllowed) {
      throw new Error(
        `Click budget exceeded for ${flowType} flow: ${this.clickCount} clicks (max: ${maxAllowed})`
      );
    }
  }
}

test.describe('Click Budget Tests', () => {
  let tracker: ClickBudgetTracker;

  test.beforeEach(async ({ page }) => {
    tracker = new ClickBudgetTracker(page);
    await page.goto('/');
  });

  test('Purchase Flow - should complete in ≤3 clicks', async ({ page }) => {
    tracker.reset();

    // Start from Product List Page
    await page.goto('/products');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();

    // Click 1: Add to cart from PLP
    await page.locator('[data-testid="product-add-btn"]').first().click();
    expect(tracker.getClickCount()).toBe(1);

    // Mini-cart should auto-open
    await expect(page.locator('[data-testid="mini-cart"]')).toBeVisible();

    // Click 2: Proceed to checkout from mini-cart
    await page.locator('[data-testid="mini-cart-checkout"]').click();
    expect(tracker.getClickCount()).toBe(2);

    // Should be on checkout page
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();

    // Click 3: Complete purchase (assuming saved payment method)
    await page.locator('[data-testid="complete-purchase"]').click();
    expect(tracker.getClickCount()).toBe(3);

    // Verify success
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();

    // Assert click budget compliance
    tracker.assertClickBudget('purchase');
  });

  test('Booking Flow - should complete in ≤2 clicks', async ({ page }) => {
    // Skip if tenant doesn't support booking
    await page.goto('/booking');
    const isBookingPage = await page.locator('h1:has-text("Book Appointment")').isVisible();
    test.skip(!isBookingPage, 'Tenant does not support booking');

    tracker.reset();

    // Should see services and "First Available Slot" button
    await expect(page.locator('[data-testid="service-selection"]')).toBeVisible();
    await expect(page.locator('[data-testid="first-available-slot"]')).toBeVisible();

    // Click 1: Select service and first available slot
    await page.locator('[data-testid="first-available-slot"]').click();
    expect(tracker.getClickCount()).toBe(1);

    // Should now show booking form with pre-filled data
    await expect(page.locator('[data-testid="booking-form"]')).toBeVisible();

    // Click 2: Confirm booking (assuming saved customer data)
    await page.locator('[data-testid="confirm-booking"]').click();
    expect(tracker.getClickCount()).toBe(2);

    // Verify booking confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();

    // Assert click budget compliance
    tracker.assertClickBudget('booking');
  });

  test('Reorder Flow - should complete in ≤1 click', async ({ page }) => {
    // Setup: Ensure there's order history
    await page.goto('/account/orders');
    const hasOrders = await page.locator('[data-testid="order-item"]').count() > 0;
    test.skip(!hasOrders, 'No order history available for reorder test');

    tracker.reset();

    // Click 1: One-click reorder
    await page.locator('[data-testid="reorder-btn"]').first().click();
    expect(tracker.getClickCount()).toBe(1);

    // Should show reorder confirmation or go directly to cart
    const confirmationVisible = await page.locator('[data-testid="reorder-confirmation"]').isVisible();
    const cartVisible = await page.locator('[data-testid="cart-page"]').isVisible();

    expect(confirmationVisible || cartVisible).toBe(true);

    // Assert click budget compliance
    tracker.assertClickBudget('reorder');
  });

  test('Mobile Touch Targets - should meet 44px minimum', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/products');

    // Check Quick Actions Dock buttons
    const dockButtons = page.locator('[data-testid="quick-actions-dock"] button');
    const buttonCount = await dockButtons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = dockButtons.nth(i);
      const box = await button.boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    // Check product add buttons
    const addButtons = page.locator('[data-testid="product-add-btn"]');
    const addButtonCount = await addButtons.count();

    for (let i = 0; i < Math.min(3, addButtonCount); i++) {
      const button = addButtons.nth(i);
      const box = await button.boundingBox();

      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Command Palette - should open with Cmd+K', async ({ page }) => {
    await page.goto('/');

    // Press Cmd+K (or Ctrl+K on Windows/Linux)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.keyboard.press(`${modifier}+KeyK`);

    // Command palette should be visible
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();

    // Should have search input focused
    await expect(page.locator('[data-testid="command-search"]')).toBeFocused();

    // Test search functionality
    await page.type('[data-testid="command-search"]', 'book');

    // Should show booking-related results
    await expect(page.locator('[data-testid="command-results"]')).toContainText('Book');

    // Test Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
  });

  test('Quick Actions Dock - should show role-appropriate actions', async ({ page }) => {
    await page.goto('/');

    // Quick Actions Dock should be visible
    await expect(page.locator('[data-testid="quick-actions-dock"]')).toBeVisible();

    // Should have customer actions by default (Book Now, Reorder, Favorites, Help)
    const actions = page.locator('[data-testid="quick-actions-dock"] button');
    const actionCount = await actions.count();

    expect(actionCount).toBeGreaterThan(0);
    expect(actionCount).toBeLessThanOrEqual(4); // Customer role has max 4 actions

    // Check if booking action is present for booking-enabled tenants
    await page.goto('/booking');
    const isBookingTenant = await page.locator('h1:has-text("Book Appointment")').isVisible();

    if (isBookingTenant) {
      await page.goto('/');
      await expect(page.locator('[data-testid="quick-actions-dock"]')).toContainText('Book');
    }
  });

  test('Keyboard Navigation - should support full keyboard accessibility', async ({ page }) => {
    await page.goto('/');

    // Test Tab navigation through Quick Actions Dock
    await page.keyboard.press('Tab');

    // First focusable element should be focused
    const focusedElement = await page.locator(':focus').first();
    expect(await focusedElement.isVisible()).toBe(true);

    // Test that all interactive elements are reachable via Tab
    const interactiveSelectors = [
      '[data-testid="quick-actions-dock"] button',
      '[data-testid="product-add-btn"]',
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])'
    ];

    for (const selector of interactiveSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        // Focus first element of this type
        await elements.first().focus();
        await expect(elements.first()).toBeFocused();

        // Test Enter/Space activation
        await page.keyboard.press('Enter');
        // Allow for any navigation or state changes
        await page.waitForTimeout(100);
      }
    }

    // Test Escape key functionality
    await page.keyboard.press('Escape');

    // Test arrow key navigation in grid layouts
    await page.goto('/products');
    const productGrid = page.locator('[data-testid="product-grid"]');
    if (await productGrid.isVisible()) {
      await productGrid.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowDown');
    }

    // Verify keyboard shortcuts work
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    // Test Cmd/Ctrl+K for command palette
    await page.keyboard.press(`${modifier}+KeyK`);
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
  });
});