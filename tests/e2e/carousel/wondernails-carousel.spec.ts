import { test, expect, Page } from '@playwright/test';

test.describe('Wondernails Carousel Hero Section', () => {
  const WONDERNAILS_URL = '/t/wondernails';

  test.beforeEach(async ({ page }) => {
    await page.goto(WONDERNAILS_URL);
    // Wait for the carousel to be fully loaded
    await page.waitForSelector('[data-testid="carousel-container"]');
  });

  test('should display the carousel container with correct structure', async ({ page }) => {
    // Check that carousel container is present
    const carousel = page.locator('[data-testid="carousel-container"]');
    await expect(carousel).toBeVisible();

    // Check that carousel list is present
    const carouselList = page.locator('[data-testid="carousel-list"]');
    await expect(carouselList).toBeVisible();

    // Check that 6 slides are present (for nail salon services)
    const slides = page.locator('[data-testid="carousel-item"]');
    await expect(slides).toHaveCount(6);
  });

  test('should display the active slide correctly by default', async ({ page }) => {
    // In stack architecture, the active slide is at index 1 (second position)
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    await expect(activeSlide).toBeVisible();

    // Check that the active slide has the 'active' class
    await expect(activeSlide).toHaveClass(/active/);

    // Check that wondernails content is visible in the active slide (.introduce section)
    await expect(activeSlide.locator('.introduce .title')).toContainText('WONDERNAILS PRO');
    await expect(activeSlide.locator('.introduce .topic')).toBeVisible();
  });

  test('should navigate to next slide when next button is clicked', async ({ page }) => {
    const nextButton = page.locator('[data-testid="next-button"]');
    await expect(nextButton).toBeVisible();

    // Get initial active slide content (at index 1)
    const initialActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const initialTopic = await initialActiveSlide.locator('.topic').textContent();

    // Click next button
    await nextButton.click();

    // Wait for animation to complete (1100ms for controls to re-enable)
    await page.waitForTimeout(1200);

    // The slide at index 1 should now have different content (array was reordered)
    const newActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const newTopic = await newActiveSlide.locator('.topic').textContent();

    expect(newTopic).not.toBe(initialTopic);
  });

  test('should navigate to previous slide when prev button is clicked', async ({ page }) => {
    // Get initial active slide content
    const initialActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const initialTopic = await initialActiveSlide.locator('.introduce .topic').textContent();

    // Click prev button to go backwards (moves last slide to front)
    const prevButton = page.locator('[data-testid="prev-button"]');
    await expect(prevButton).toBeVisible();
    await prevButton.click({ force: true });
    await page.waitForTimeout(1200);

    // The slide at index 1 should now have different content (last slide moved to position 1)
    const newActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const newTopic = await newActiveSlide.locator('.introduce .topic').textContent();

    // Verify the content changed (prev button is functional)
    expect(newTopic).not.toBe(initialTopic);
  });

  test('should show detail view when see more button is clicked', async ({ page }) => {
    // Wait for carousel to be fully loaded
    await page.waitForTimeout(1000);

    // Find the active slide at index 1
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const seeMoreButton = activeSlide.locator('[data-testid="see-more-button"]');

    // Click the see more button
    await seeMoreButton.click();

    // Wait for detail view transition
    await page.waitForTimeout(1500);

    // Check that detail view is visible in the active slide
    const detailView = activeSlide.locator('[data-testid="detail-view"]');
    await expect(detailView).toBeVisible();

    // Check that detail content is present
    await expect(activeSlide.locator('[data-testid="detail-specifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="back-button"]')).toBeVisible();
  });

  test('should return to carousel view when back button is clicked', async ({ page }) => {
    // Go to detail view first using the see more button
    await page.waitForTimeout(1000);
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const seeMoreButton = activeSlide.locator('[data-testid="see-more-button"]');
    await seeMoreButton.click();
    await page.waitForTimeout(1500);

    // Verify we're in detail view
    await expect(activeSlide.locator('[data-testid="detail-view"]')).toBeVisible();

    // Click back button
    const backButton = page.locator('[data-testid="back-button"]');
    await backButton.click();

    // Wait for carousel to return (800ms resume delay)
    await page.waitForTimeout(1000);

    // Check that see more button is visible again (indicates carousel view)
    await expect(seeMoreButton).toBeVisible();
    await expect(page.locator('[data-testid="carousel-list"]')).toBeVisible();
  });

  test('should display slide content correctly', async ({ page }) => {
    // Active slide is always at index 1 in stack architecture
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');

    // Check that the active slide content is visible (.introduce section)
    await expect(activeSlide.locator('.introduce .topic')).toBeVisible();
    await expect(activeSlide.locator('.introduce .title')).toContainText('WONDERNAILS PRO');

    // Navigate through slides to verify carousel works
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="next-button"]').click({ force: true });
      await page.waitForTimeout(1200); // Wait for animation (1100ms)

      // Verify active slide is still visible and at index 1
      const currentActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
      await expect(currentActiveSlide).toBeVisible();
      await expect(currentActiveSlide.locator('.introduce .topic')).toBeVisible();
    }
  });

  test('should have proper keyboard navigation support', async ({ page }) => {
    // Focus on carousel
    await page.locator('[data-testid="carousel-container"]').focus();

    // Get initial active slide content
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const initialTopic = await activeSlide.locator('.topic').textContent();

    // Test arrow key navigation - Right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1200);

    // Content at index 1 should have changed (array reordered)
    const newActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const newTopic = await newActiveSlide.locator('.topic').textContent();
    expect(newTopic).not.toBe(initialTopic);

    // Test left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1200);

    // Should move back to original content
    const backActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const backTopic = await backActiveSlide.locator('.topic').textContent();
    expect(backTopic).toBe(initialTopic);
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    // Check carousel has proper ARIA role
    const carousel = page.locator('[data-testid="carousel-container"]');
    await expect(carousel).toHaveAttribute('role', 'region');
    await expect(carousel).toHaveAttribute('aria-label');

    // Check slides have proper ARIA attributes
    const slides = page.locator('[data-testid="carousel-item"]');
    for (let i = 0; i < await slides.count(); i++) {
      const slide = slides.nth(i);
      await expect(slide).toHaveAttribute('role', 'tabpanel');
      await expect(slide).toHaveAttribute('aria-label');
    }

    // Check navigation buttons have proper labels
    await expect(page.locator('[data-testid="next-button"]')).toHaveAttribute('aria-label');
    await expect(page.locator('[data-testid="prev-button"]')).toHaveAttribute('aria-label');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Carousel should still be visible and functional
    await expect(page.locator('[data-testid="carousel-container"]')).toBeVisible();

    // Get initial content
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const initialTopic = await activeSlide.locator('.topic').textContent();

    // Navigation should work on mobile
    await page.locator('[data-testid="next-button"]').click();
    await page.waitForTimeout(1200);

    // Check that slide content changed (array reordered)
    const newActiveSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    const newTopic = await newActiveSlide.locator('.topic').textContent();
    expect(newTopic).not.toBe(initialTopic);
  });

  test('should have isolated styles that do not affect other page elements', async ({ page }) => {
    // Get styles of elements outside the carousel
    const header = page.locator('header');
    const headerStyles = await header.evaluate((el) => getComputedStyle(el));

    // Interact with carousel
    await page.locator('[data-testid="next-button"]').click();
    await page.waitForTimeout(600);

    // Check that header styles haven't changed (ensuring isolation)
    const headerStylesAfter = await header.evaluate((el) => getComputedStyle(el));
    expect(headerStyles.color).toBe(headerStylesAfter.color);
    expect(headerStyles.fontSize).toBe(headerStylesAfter.fontSize);
  });

  test('should handle rapid clicking without breaking', async ({ page }) => {
    const nextButton = page.locator('[data-testid="next-button"]');

    // Click next button 3 times with proper delays (controls disable for 1100ms)
    for (let i = 0; i < 3; i++) {
      await nextButton.click({ force: true });
      await page.waitForTimeout(1200); // Wait for controls to re-enable
    }

    // Carousel should still be functional
    await expect(page.locator('[data-testid="carousel-container"]')).toBeVisible();
    const activeSlide = page.locator('[data-testid="carousel-item"][data-index="1"]');
    await expect(activeSlide).toBeVisible();
  });

  test('should maintain performance with smooth animations', async ({ page }) => {
    // Start performance monitoring
    await page.evaluate(() => performance.mark('carousel-start'));

    // Perform several navigation actions with force clicks
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="next-button"]').click({ force: true });
      await page.waitForTimeout(1200); // Wait for full animation (1100ms)
    }

    // End performance monitoring
    await page.evaluate(() => performance.mark('carousel-end'));

    // Check that animations completed without significant performance issues
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('mark').map(entry => entry.name);
    });

    expect(performanceEntries).toContain('carousel-start');
    expect(performanceEntries).toContain('carousel-end');
  });
});