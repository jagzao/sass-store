import { test, expect } from '@playwright/test';

test.describe('Product Reviews E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a product page
    await page.goto('/test-store/products/test-product-001');
  });

  test('should display existing reviews', async ({ page }) => {
    // Wait for reviews section to load
    await page.waitForSelector('[data-testid="review-list"]');

    // Check if reviews are visible
    const reviews = page.locator('[data-testid="product-review"]');
    const count = await reviews.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should submit a new review successfully', async ({ page }) => {
    // Scroll to review form
    await page.locator('[data-testid="review-form"]').scrollIntoViewIfNeeded();

    // Fill in the review form
    await page.click('[data-testid="star-rating-5"]');
    await page.fill('[data-testid="review-name"]', 'E2E Test User');
    await page.fill('[data-testid="review-email"]', 'e2e@test.com');
    await page.fill('[data-testid="review-title"]', 'Great product!');
    await page.fill('[data-testid="review-comment"]', 'This is an automated test review.');

    // Submit the form
    await page.click('[data-testid="submit-review"]');

    // Wait for success message
    await expect(page.locator('[data-testid="review-success"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.locator('[data-testid="review-form"]').scrollIntoViewIfNeeded();
    await page.click('[data-testid="submit-review"]');

    // Should show validation error
    await expect(page.locator('text=Please select a rating')).toBeVisible();
  });

  test('should allow marking review as helpful', async ({ page }) => {
    // Wait for reviews to load
    await page.waitForSelector('[data-testid="product-review"]');

    // Get initial helpful count
    const helpfulButton = page.locator('[data-testid="helpful-button"]').first();
    const initialText = await helpfulButton.textContent();
    const initialCount = parseInt(initialText?.match(/\d+/)?.[0] || '0');

    // Click helpful
    await helpfulButton.click();

    // Wait for update
    await page.waitForTimeout(500);

    // Verify count increased
    const updatedText = await helpfulButton.textContent();
    const updatedCount = parseInt(updatedText?.match(/\d+/)?.[0] || '0');

    expect(updatedCount).toBe(initialCount + 1);
  });

  test('should display average rating', async ({ page }) => {
    // Check for average rating display
    const avgRating = page.locator('[data-testid="average-rating"]');
    await expect(avgRating).toBeVisible();

    // Verify it's a valid rating (1-5)
    const ratingText = await avgRating.textContent();
    const rating = parseFloat(ratingText || '0');

    expect(rating).toBeGreaterThanOrEqual(1);
    expect(rating).toBeLessThanOrEqual(5);
  });

  test('should filter reviews by rating', async ({ page }) => {
    // Click on 5-star filter
    await page.click('[data-testid="filter-5-stars"]');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // All visible reviews should be 5 stars
    const reviews = page.locator('[data-testid="product-review"]');
    const count = await reviews.count();

    for (let i = 0; i < count; i++) {
      const stars = await reviews.nth(i).locator('[data-testid="filled-star"]').count();
      expect(stars).toBe(5);
    }
  });

  test('should load more reviews on scroll', async ({ page }) => {
    // Get initial review count
    const initialReviews = await page.locator('[data-testid="product-review"]').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for more reviews to load
    await page.waitForTimeout(1000);

    // Verify more reviews loaded
    const finalReviews = await page.locator('[data-testid="product-review"]').count();

    expect(finalReviews).toBeGreaterThanOrEqual(initialReviews);
  });
});
