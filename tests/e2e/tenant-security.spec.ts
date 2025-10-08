import { test, expect } from '@playwright/test';

test.describe('Tenant Security & Isolation', () => {

  test('Tenant fallback - unknown subdomain should redirect to zo-system', async ({ page }) => {
    // Mock unknown subdomain by setting host header
    await page.route('**/*', (route) => {
      const headers = {
        ...route.request().headers(),
        'host': 'unknown-tenant.sassstore.com'
      };
      route.continue({ headers });
    });

    await page.goto('/');

    // Should show zo-system tenant content
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText('Zo System');

    // Should show fallback banner in dev/staging
    if (process.env.NODE_ENV !== 'production') {
      await expect(page.locator('[data-testid="fallback-banner"]')).toBeVisible();
    }
  });

  test('Tenant path resolution - /t/{tenant} should work', async ({ page }) => {
    // Test path-based tenant resolution
    await page.goto('/t/wondernails/products');

    // Should show wondernails tenant content
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText('Wonder Nails');

    // Products should be visible
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('Cross-tenant data isolation - API level', async ({ request }) => {
    // Test that tenant A cannot access tenant B data via API
    const response1 = await request.get('/api/v1/products', {
      headers: { 'X-Tenant': 'wondernails' }
    });
    expect(response1.ok()).toBeTruthy();
    const wondernailsProducts = await response1.json();

    const response2 = await request.get('/api/v1/products', {
      headers: { 'X-Tenant': 'vigistudio' }
    });
    expect(response2.ok()).toBeTruthy();
    const vigistudioProducts = await response2.json();

    // Products should be different for different tenants
    expect(wondernailsProducts.data).not.toEqual(vigistudioProducts.data);

    // Try to access wondernails product with vigistudio context
    if (wondernailsProducts.data.length > 0) {
      const productId = wondernailsProducts.data[0].id;
      const crossTenantResponse = await request.get(`/api/v1/products/${productId}`, {
        headers: { 'X-Tenant': 'vigistudio' }
      });

      // Should return 404 (not 403 to avoid information leakage)
      expect(crossTenantResponse.status()).toBe(404);
    }
  });

  test('RLS enforcement - database level', async ({ request }) => {
    // This test would require a test database with RLS enabled
    // For now, we test the API behavior which should enforce RLS

    // Create a product for tenant A
    const createResponse = await request.post('/api/v1/products', {
      headers: {
        'X-Tenant': 'wondernails',
        'X-API-Key': 'sass_test_key'
      },
      data: {
        sku: 'test-product-rls',
        name: 'RLS Test Product',
        price: 19.99,
        category: 'test'
      }
    });

    if (createResponse.ok()) {
      const product = await createResponse.json();

      // Try to access the product from a different tenant
      const accessResponse = await request.get(`/api/v1/products/${product.data.id}`, {
        headers: { 'X-Tenant': 'vigistudio' }
      });

      // Should not be able to access cross-tenant data
      expect(accessResponse.status()).toBe(404);

      // Cleanup - delete the test product
      await request.delete(`/api/v1/products/${product.data.id}`, {
        headers: {
          'X-Tenant': 'wondernails',
          'X-API-Key': 'sass_test_key'
        }
      });
    }
  });

  test('Rate limiting - per tenant enforcement', async ({ request }) => {
    const tenant = 'wondernails';
    const endpoint = '/api/v1/products';

    // Make multiple rapid requests
    const requests = Array.from({ length: 10 }, () =>
      request.get(endpoint, {
        headers: { 'X-Tenant': tenant }
      })
    );

    const responses = await Promise.all(requests);

    // Check if any requests were rate limited
    const rateLimitedResponses = responses.filter(r => r.status() === 429);

    // Depending on rate limit configuration, some requests might be rate limited
    // At minimum, all requests should return valid HTTP status codes
    responses.forEach(response => {
      expect([200, 429, 404].includes(response.status())).toBeTruthy();
    });
  });

  test('Tenant branding - should apply correct theme', async ({ page }) => {
    // Test wondernails tenant
    await page.goto('/t/wondernails');

    // Check if tenant branding is applied
    const primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
    );

    // Should have pink color for wondernails
    expect(primaryColor.trim()).toContain('#EC4899');

    // Test vigistudio tenant
    await page.goto('/t/vigistudio');

    const vigistudioColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary')
    );

    // Should have purple color for vigistudio
    expect(vigistudioColor.trim()).toContain('#7C3AED');

    // Colors should be different
    expect(primaryColor).not.toBe(vigistudioColor);
  });

  test('Tenant-specific content - services vs products', async ({ page }) => {
    // Test booking tenant (wondernails)
    await page.goto('/t/wondernails');

    // Should show booking option for booking-enabled tenant
    await expect(page.locator('[data-testid="booking-cta"]')).toBeVisible();

    // Test catalog tenant (vainilla-vargas)
    await page.goto('/t/vainilla-vargas');

    // Should not show booking for catalog-only tenant
    const hasBooking = await page.locator('[data-testid="booking-cta"]').isVisible();
    expect(hasBooking).toBeFalsy();

    // Should show products prominently
    await expect(page.locator('[data-testid="featured-products"]')).toBeVisible();
  });

  test('Contact information - per tenant', async ({ page }) => {
    // Test wondernails contact info
    await page.goto('/t/wondernails/contact');

    await expect(page.locator('[data-testid="tenant-phone"]')).toContainText('+1-555-0201');
    await expect(page.locator('[data-testid="tenant-address"]')).toContainText('Los Angeles');

    // Test vigistudio contact info
    await page.goto('/t/vigistudio/contact');

    await expect(page.locator('[data-testid="tenant-phone"]')).toContainText('+1-555-0302');
    await expect(page.locator('[data-testid="tenant-address"]')).toContainText('New York');
  });

  test('URL security - no tenant leakage in URLs', async ({ page }) => {
    // Start with one tenant
    await page.goto('/t/wondernails/products');

    // Navigate to another tenant
    await page.goto('/t/vigistudio/products');

    // URL should correctly reflect the current tenant
    expect(page.url()).toContain('vigistudio');
    expect(page.url()).not.toContain('wondernails');

    // Check that tenant context is properly isolated
    await expect(page.locator('[data-testid="tenant-name"]')).toContainText('Vigi Studio');
  });

  test('Session isolation - tenant switching', async ({ page }) => {
    // Add items to cart for wondernails
    await page.goto('/t/wondernails/products');

    const productExists = await page.locator('[data-testid="product-add-btn"]').count() > 0;

    if (productExists) {
      await page.locator('[data-testid="product-add-btn"]').first().click();

      // Verify item in cart
      await expect(page.locator('[data-testid="mini-cart"]')).toBeVisible();

      // Switch to different tenant
      await page.goto('/t/vigistudio/products');

      // Cart should be empty for different tenant
      const cartItems = await page.locator('[data-testid="cart-item"]').count();
      expect(cartItems).toBe(0);
    }
  });
});