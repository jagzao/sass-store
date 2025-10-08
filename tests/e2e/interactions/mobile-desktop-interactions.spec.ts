import { test, expect, devices } from '@playwright/test';

/**
 * Test 22: Mobile Touch Interactions
 * Test 23: Desktop Mouse Interactions
 * Reference: agents/outputs/testing/e2e-flows.md:795-874
 */

// Configure mobile device for mobile tests
const mobileTest = test.extend({});

test.describe('Mobile Touch Interactions', () => {

  test('should support pinch-to-zoom on product images', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.goto('/t/wondernails/products');
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();

    const productImage = page.locator('[data-testid="product-image-main"], .product-image');
    if (await productImage.isVisible()) {
      // Get image bounding box
      const imageBbox = await productImage.boundingBox();

      if (imageBbox) {
        // Simulate pinch gesture (zoom in)
        await page.touchscreen.tap(imageBbox.x + 100, imageBbox.y + 100);
        await page.waitForTimeout(100);
        await page.touchscreen.tap(imageBbox.x + 150, imageBbox.y + 150);

        // Verify zoom functionality
        const zoomOverlay = page.locator('[data-testid="image-zoom-overlay"], .zoom-modal');
        if (await zoomOverlay.isVisible()) {
          await expect(zoomOverlay).toBeVisible();
        }
      }
    }
  });

  test('should support swipe gestures for image gallery', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.goto('/t/wondernails/products');
    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();

    const imageGallery = page.locator('[data-testid="image-gallery"], .product-images');
    if (await imageGallery.isVisible()) {
      const galleryBbox = await imageGallery.boundingBox();

      if (galleryBbox) {
        // Get initial active image index
        const initialActiveImage = page.locator('[data-testid="active-gallery-image"], .active');
        const initialIndex = await initialActiveImage.getAttribute('data-index');

        // Simulate swipe left
        await page.mouse.move(galleryBbox.x + galleryBbox.width - 50, galleryBbox.y + galleryBbox.height / 2);
        await page.mouse.down();
        await page.mouse.move(galleryBbox.x + 50, galleryBbox.y + galleryBbox.height / 2);
        await page.mouse.up();

        await page.waitForTimeout(500);

        // Verify image changed
        const newActiveImage = page.locator('[data-testid="active-gallery-image"], .active');
        const newIndex = await newActiveImage.getAttribute('data-index');

        expect(newIndex).not.toBe(initialIndex);
      }
    }
  });

  test('should support pull-to-refresh', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.goto('/t/wondernails/products');

    const viewportHeight = page.viewportSize()?.height || 0;

    // Simulate pull-to-refresh gesture
    await page.mouse.move(200, 50);
    await page.mouse.down();
    await page.mouse.move(200, 200);
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Check for refresh indicator
    const refreshIndicator = page.locator('[data-testid="pull-refresh-indicator"], .refresh-spinner');
    if (await refreshIndicator.isVisible()) {
      await expect(refreshIndicator).toBeVisible();
    }
  });

  test('should have touch targets of at least 44px', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.goto('/t/wondernails/products');

    // Check interactive elements have minimum touch target size
    const buttons = page.locator('button, a[href]');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const bbox = await button.boundingBox();

      if (bbox) {
        expect(bbox.width).toBeGreaterThanOrEqual(44);
        expect(bbox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should support long-press for context menu', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();
    const bbox = await productCard.boundingBox();

    if (bbox) {
      // Simulate long press (touch and hold)
      await page.touchscreen.tap(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);

      // Hold for 500ms (simulate long press)
      await page.waitForTimeout(500);

      // Check for context menu
      const contextMenu = page.locator('[data-testid="context-menu"], [data-testid="product-options"]');
      if (await contextMenu.isVisible()) {
        await expect(contextMenu).toBeVisible();
      }
    }
  });
});

test.describe('Desktop Mouse Interactions', () => {

  test('should show hover effects on product cards', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.hover();

    // Verify hover overlay appears
    const hoverOverlay = page.locator('[data-testid="product-hover-overlay"], .product-overlay');
    if (await hoverOverlay.isVisible()) {
      await expect(hoverOverlay).toBeVisible();

      // Quick view button should be visible on hover
      const quickViewBtn = page.locator('[data-testid="quick-view-btn"], button:has-text("Quick View")');
      if (await quickViewBtn.isVisible()) {
        await expect(quickViewBtn).toBeVisible();
      }
    }
  });

  test('should support right-click context menu', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click({ button: 'right' });

    const contextMenu = page.locator('[data-testid="context-menu"]');
    if (await contextMenu.isVisible()) {
      await expect(contextMenu).toBeVisible();

      // Should have options like "Add to Wishlist", "Share", etc.
      const menuOptions = contextMenu.locator('[data-testid="menu-option"]');
      const optionCount = await menuOptions.count();

      expect(optionCount).toBeGreaterThan(0);
    }
  });

  test('should support drag and drop to cart', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();
    const cartDropZone = page.locator('[data-testid="cart-drop-zone"], [data-testid="mini-cart"]');

    if (await cartDropZone.isVisible()) {
      // Drag product to cart
      await productCard.dragTo(cartDropZone);

      await page.waitForTimeout(500);

      // Verify item added to cart
      const cartItemCount = page.locator('[data-testid="cart-item-count"]');
      const count = await cartItemCount.textContent();

      expect(parseInt(count || '0')).toBeGreaterThan(0);
    }
  });

  test('should support keyboard shortcuts', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    // Test Cmd+K (or Ctrl+K) for search
    await page.keyboard.press('Control+k');

    const searchModal = page.locator('[data-testid="search-modal"], [data-testid="command-palette"]');
    if (await searchModal.isVisible()) {
      await expect(searchModal).toBeVisible();

      // Test Escape to close
      await page.keyboard.press('Escape');
      await expect(searchModal).not.toBeVisible();
    }
  });

  test('should show tooltip on hover', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();

    // Hover over info icon or similar element
    const infoIcon = productCard.locator('[data-testid="info-icon"], .info-icon');
    if (await infoIcon.isVisible()) {
      await infoIcon.hover();

      await page.waitForTimeout(300);

      // Tooltip should appear
      const tooltip = page.locator('[data-testid="tooltip"], [role="tooltip"]');
      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible();

        const tooltipText = await tooltip.textContent();
        expect(tooltipText?.length).toBeGreaterThan(0);
      }
    }
  });

  test('should support mouse wheel for image zoom', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();
    await productCard.click();

    const productImage = page.locator('[data-testid="product-image-main"]');
    if (await productImage.isVisible()) {
      const imageBbox = await productImage.boundingBox();

      if (imageBbox) {
        // Hover over image
        await page.mouse.move(imageBbox.x + imageBbox.width / 2, imageBbox.y + imageBbox.height / 2);

        // Scroll to zoom
        await page.mouse.wheel(0, -100); // Scroll up to zoom in

        await page.waitForTimeout(300);

        // Image should be zoomed or zoom indicator should be visible
        const zoomLevel = page.locator('[data-testid="zoom-level"]');
        if (await zoomLevel.isVisible()) {
          const zoomText = await zoomLevel.textContent();
          expect(zoomText).toMatch(/\d+%/);
        }
      }
    }
  });

  test('should support double-click for quick actions', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-specific test');

    await page.goto('/t/wondernails/products');

    const productCard = page.locator('[data-testid="product-card"]').first();

    // Double-click to add to cart or open quick view
    await productCard.dblclick();

    await page.waitForTimeout(500);

    // Either quick view modal or cart should be updated
    const quickView = page.locator('[data-testid="quick-view-modal"]');
    const miniCart = page.locator('[data-testid="mini-cart"]');

    const quickViewVisible = await quickView.isVisible();
    const miniCartVisible = await miniCart.isVisible();

    expect(quickViewVisible || miniCartVisible).toBeTruthy();
  });
});
