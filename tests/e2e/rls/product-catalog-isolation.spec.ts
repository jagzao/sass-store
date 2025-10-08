import { test, expect } from '@playwright/test';

/**
 * Test 8: Product Catalog Isolation
 * Verifies tenant cannot access other tenant's products
 * Reference: agents/outputs/testing/e2e-flows.md:296-340
 */
test.describe('Product Catalog Tenant Isolation', () => {
  test('should only show products from current tenant', async ({ page }) => {
    // Navigate to wondernails products
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');

    // Verify wondernails products are visible
    await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();

    expect(productCount).toBeGreaterThan(0);

    // Verify all products belong to wondernails
    for (let i = 0; i < productCount; i++) {
      const productCard = productCards.nth(i);
      const productName = await productCard.locator('h3, h2, [data-testid="product-name"]').textContent();

      // Products should be wondernails-specific (nail-related)
      expect(productName?.toLowerCase()).toMatch(/nail|polish|manicure|cuticle|wondernails/i);
    }
  });

  test('should not display other tenant products in search results', async ({ page }) => {
    // Search in vigistudio for wondernails product
    await page.goto('/t/vigistudio/products');

    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('nail polish');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Should show no results or only vigistudio products
      const noResults = page.locator('[data-testid="no-results"], .no-results');
      const hasNoResults = await noResults.isVisible();

      if (!hasNoResults) {
        // If there are results, verify they're vigistudio products
        const results = page.locator('[data-testid="product-card"]');
        const count = await results.count();

        for (let i = 0; i < count; i++) {
          const productName = await results.nth(i).locator('h3, h2, [data-testid="product-name"]').textContent();
          // Should NOT contain wondernails products
          expect(productName?.toLowerCase()).not.toContain('wondernails');
        }
      }
    }
  });

  test('should return 404 for cross-tenant product access via URL', async ({ page }) => {
    // First, get a wondernails product ID
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productLink = await firstProduct.locator('a').first().getAttribute('href');

    if (productLink) {
      // Extract product ID from URL
      const productIdMatch = productLink.match(/\/products\/([^\/]+)/);

      if (productIdMatch) {
        const productId = productIdMatch[1];

        // Try to access this product from vigistudio tenant
        const response = await page.goto(`/t/vigistudio/products/${productId}`);

        // Should return 404 or redirect to not found
        expect(response?.status()).toBe(404);
      }
    }
  });

  test('should isolate product API responses by tenant', async ({ page, request }) => {
    // Get wondernails products via API
    const wondernailsResponse = await request.get('/api/products?tenant=wondernails');
    expect(wondernailsResponse.ok()).toBeTruthy();

    const wondernailsData = await wondernailsResponse.json();
    const wondernailsProducts = wondernailsData.products || wondernailsData;

    // Get vigistudio products via API
    const vigistudioResponse = await request.get('/api/products?tenant=vigistudio');
    expect(vigistudioResponse.ok()).toBeTruthy();

    const vigistudioData = await vigistudioResponse.json();
    const vigistudioProducts = vigistudioData.products || vigistudioData;

    // Verify no overlap in product IDs
    const wondernailsIds = new Set(wondernailsProducts.map((p: any) => p.id));
    const vigistudioIds = new Set(vigistudioProducts.map((p: any) => p.id));

    const intersection = new Set([...wondernailsIds].filter(x => vigistudioIds.has(x)));
    expect(intersection.size).toBe(0);
  });

  test('should prevent cross-tenant cart contamination', async ({ page }) => {
    // Add product to cart in wondernails
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');

    const addToCartBtn = page.locator('[data-testid="add-to-cart-btn"], button:has-text("Add to Cart")').first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(500);
    }

    // Switch to vigistudio tenant
    await page.goto('/t/vigistudio/products');
    await page.waitForLoadState('networkidle');

    // Cart should be empty in vigistudio
    const cartCount = page.locator('[data-testid="cart-count"], [data-testid="cart-item-count"]');
    if (await cartCount.isVisible()) {
      const count = await cartCount.textContent();
      expect(count).toBe('0');
    }
  });

  test('should enforce tenant boundary in product mutations', async ({ page, request }) => {
    // Try to create a product for vigistudio using wondernails authentication
    // This simulates a malicious attempt to cross tenant boundaries

    // First navigate to wondernails to establish session
    await page.goto('/t/wondernails/admin/products');

    // Get cookies/auth headers from wondernails session
    const cookies = await page.context().cookies();

    // Attempt to create product in vigistudio with wondernails auth
    const createResponse = await request.post('/api/products', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.map(c => `${c.name}=${c.value}`).join('; ')
      },
      data: {
        tenant: 'vigistudio',
        name: 'Malicious Product',
        sku: 'HACK-001',
        price: 99.99
      }
    });

    // Should be rejected (403 Forbidden or 400 Bad Request)
    expect(createResponse.status()).toBeGreaterThanOrEqual(400);
    expect(createResponse.status()).toBeLessThan(500);
  });
});
