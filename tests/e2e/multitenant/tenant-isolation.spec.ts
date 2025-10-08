import { test, expect } from '@playwright/test';

test.describe('Multitenant Isolation Tests', () => {
  const tenants = ['wondernails', 'nom-nom', 'delirios', 'zo-system'];

  test('Cart isolation between tenants', async ({ page }) => {
    // Add item to wondernails cart
    await page.goto('/t/wondernails');

    // Wait for page to load and check if it has services
    await page.waitForLoadState('networkidle');

    // Try to add a service to cart if available
    const addToCartButton = page.locator('[data-testid="add-to-cart"], [data-testid="book-service"]').first();
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click();

      // Verify item was added
      const cartIndicator = page.locator('[data-testid="cart-count"], .cart-count');
      if (await cartIndicator.isVisible()) {
        const cartCount = await cartIndicator.textContent();
        expect(parseInt(cartCount || '0')).toBeGreaterThan(0);
      }
    }

    // Switch to nom-nom tenant
    await page.goto('/t/nom-nom');
    await page.waitForLoadState('networkidle');

    // Verify cart is empty (isolated)
    const nomNomCartCount = page.locator('[data-testid="cart-count"], .cart-count');
    if (await nomNomCartCount.isVisible()) {
      const count = await nomNomCartCount.textContent();
      expect(count).toBe('0');
    }
  });

  test('Data isolation - no cross-tenant data leakage', async ({ page }) => {
    for (const tenant of tenants.slice(0, 3)) { // Test first 3 tenants
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check that tenant-specific branding is applied
      const tenantHeaders = page.locator('h1, h2, .tenant-name, [data-testid="tenant-name"]');
      const headerText = await tenantHeaders.first().textContent();

      // Ensure we don't see other tenant names in the content
      const otherTenants = tenants.filter(t => t !== tenant);
      for (const otherTenant of otherTenants) {
        const pageContent = await page.textContent('body');
        // Allow for some common words but check for specific tenant identifiers
        if (otherTenant !== 'zo-system') {
          expect(pageContent?.toLowerCase()).not.toContain(otherTenant.toLowerCase());
        }
      }
    }
  });

  test('API endpoint isolation', async ({ page }) => {
    // Intercept API calls to verify tenant headers
    const apiCalls: Array<{ url: string, headers: Record<string, string> }> = [];

    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          headers: request.headers()
        });
      }
    });

    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    // Verify API calls include tenant information
    const relevantCalls = apiCalls.filter(call =>
      call.url.includes('/api/') &&
      !call.url.includes('/_next/')
    );

    for (const call of relevantCalls) {
      // Check that tenant is identified either in headers or URL
      const hasTenantHeader = call.headers['x-tenant'] === 'wondernails';
      const hasTenantInUrl = call.url.includes('wondernails') || call.url.includes('tenant');

      expect(hasTenantHeader || hasTenantInUrl).toBeTruthy();
    }
  });

  test('Fallback to zo-system for unknown tenants', async ({ page }) => {
    // Test with a non-existent tenant
    await page.goto('/t/non-existent-tenant');
    await page.waitForLoadState('networkidle');

    // Should redirect or fallback to zo-system
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');

    // Either redirected to zo-system or showing zo-system content
    const isZoSystemFallback = currentUrl.includes('zo-system') ||
                               pageContent?.toLowerCase().includes('zo-system') ||
                               await page.locator('[data-tenant="zo-system"]').isVisible();

    expect(isZoSystemFallback).toBeTruthy();
  });

  test('Session isolation between tenants', async ({ context }) => {
    // Create two pages to simulate different tenant sessions
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Navigate to different tenants
    await page1.goto('/t/wondernails');
    await page2.goto('/t/nom-nom');

    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');

    // Verify each page shows correct tenant content
    const page1Content = await page1.textContent('body');
    const page2Content = await page2.textContent('body');

    // Each page should contain its tenant-specific content
    expect(page1Content?.toLowerCase()).toContain('wondernails');
    expect(page2Content?.toLowerCase()).toContain('nom-nom');

    // And should not contain the other tenant's content
    expect(page1Content?.toLowerCase()).not.toContain('nom-nom');
    expect(page2Content?.toLowerCase()).not.toContain('wondernails');

    await page1.close();
    await page2.close();
  });
});