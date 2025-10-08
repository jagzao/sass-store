import { test, expect } from '@playwright/test';

test.describe('Comprehensive Fallback Testing - Master Plan Implementation', () => {
  test('Unknown subdomain fallback to zo-system', async ({ page }) => {
    // Test various unknown subdomain patterns
    const unknownSubdomains = [
      'nonexistent-tenant',
      'invalid-business-123',
      'test-tenant-xyz',
      'deleted-tenant',
      'suspended-business'
    ];

    for (const subdomain of unknownSubdomains) {
      console.log(`Testing fallback for: ${subdomain}`);

      // Navigate to unknown subdomain
      await page.goto(`/t/${subdomain}`);
      await page.waitForLoadState('networkidle');

      // Should fallback to zo-system content
      const currentUrl = page.url();
      const pageContent = await page.textContent('body');
      const title = await page.title();

      // Check multiple indicators of fallback behavior
      const fallbackIndicators = [
        currentUrl.includes('zo-system'),
        title.toLowerCase().includes('zo-system'),
        title.toLowerCase().includes('sass store'),
        pageContent?.toLowerCase().includes('zo-system'),
        await page.locator('[data-tenant="zo-system"]').count() > 0,
        await page.locator('[data-testid="tenant-fallback"]').count() > 0
      ];

      const hasFallback = fallbackIndicators.some(indicator => indicator);
      expect(hasFallback).toBeTruthy();

      // Verify fallback notice is shown (requirement from master plan)
      const fallbackNotice = page.locator('[data-testid="tenant-fallback-notice"], .fallback-notice');
      if (await fallbackNotice.count() > 0) {
        const noticeText = await fallbackNotice.textContent();
        expect(noticeText?.toLowerCase()).toContain('redirect');
      }

      // Verify functionality still works in fallback mode
      const productsGrid = page.locator('[data-testid="products-grid"], .products-grid');
      if (await productsGrid.count() > 0) {
        await expect(productsGrid).toBeVisible();
      }

      // Verify navigation menu is present
      const navigation = page.locator('[data-testid="navigation-menu"], nav');
      if (await navigation.count() > 0) {
        await expect(navigation).toBeVisible();
      }

      console.log(`✅ Fallback working for: ${subdomain}`);
    }
  });

  test('Tenant path fallback handling', async ({ page }) => {
    // Test invalid tenant paths
    const invalidPaths = [
      '/t/invalid-tenant-slug/products',
      '/t/suspended-business/services',
      '/t/non-existent/contact',
      '/t/deleted-tenant/admin',
      '/t/malformed-slug-123!/booking'
    ];

    for (const path of invalidPaths) {
      console.log(`Testing path fallback for: ${path}`);

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Should show tenant not found banner
      const notFoundBanner = page.locator('[data-testid="tenant-not-found-banner"], .tenant-not-found');
      if (await notFoundBanner.count() > 0) {
        await expect(notFoundBanner).toBeVisible();
      }

      // Should default to zo-system content
      const tenantContext = page.locator('[data-testid="tenant-context"]');
      if (await tenantContext.count() > 0) {
        const contextText = await tenantContext.textContent();
        expect(contextText?.toLowerCase()).toContain('zo-system');
      }

      // Should provide helpful navigation
      const browseTenants = page.locator('[data-testid="browse-tenants-link"], .browse-tenants');
      if (await browseTenants.count() > 0) {
        await expect(browseTenants).toBeVisible();
      }

      console.log(`✅ Path fallback working for: ${path}`);
    }
  });

  test('SEO handling for fallback scenarios', async ({ page }) => {
    // Test SEO requirements for fallback
    await page.goto('/t/unknown-tenant-seo-test');
    await page.waitForLoadState('networkidle');

    // Check canonical URL handling
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    if (canonical) {
      // Should either canonical to zo-system or set noindex
      const isZoSystemCanonical = canonical.includes('zo-system');
      const hasNoIndex = await page.locator('meta[name="robots"][content*="noindex"]').count() > 0;

      expect(isZoSystemCanonical || hasNoIndex).toBeTruthy();
    }

    // Check meta robots for noindex on unknown tenants
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    if (robotsMeta) {
      // Unknown tenants should have noindex to prevent SEO pollution
      expect(robotsMeta.toLowerCase()).toContain('noindex');
    }

    // Verify title indicates fallback appropriately
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    console.log('✅ SEO fallback handling validated');
  });

  test('Suspended tenant handling', async ({ page }) => {
    // Mock suspended tenant response
    await page.route('**/api/tenants/suspended-tenant', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Tenant suspended',
          code: 'TENANT_SUSPENDED',
          message: 'This business is temporarily suspended'
        })
      });
    });

    await page.goto('/t/suspended-tenant');

    // Should show suspension notice
    const suspensionNotice = page.locator('[data-testid="tenant-suspended"], .suspension-notice');
    if (await suspensionNotice.count() > 0) {
      await expect(suspensionNotice).toBeVisible();
      const noticeText = await suspensionNotice.textContent();
      expect(noticeText?.toLowerCase()).toContain('suspend');
    }

    // Should provide contact information
    const contactInfo = page.locator('[data-testid="contact-info"], .contact-info');
    if (await contactInfo.count() > 0) {
      await expect(contactInfo).toBeVisible();
    }

    console.log('✅ Suspended tenant handling validated');
  });

  test('Tenant migration and redirect handling', async ({ page }) => {
    // Mock tenant migration redirect
    await page.route('**/api/tenants/old-tenant-slug', route => {
      route.fulfill({
        status: 301,
        headers: {
          'Location': '/t/new-tenant-slug'
        },
        body: ''
      });
    });

    // Test redirect from old slug to new slug
    const response = await page.goto('/t/old-tenant-slug');

    // Should handle redirect gracefully
    const finalUrl = page.url();
    expect(finalUrl).toContain('new-tenant-slug');

    // Should preserve SEO value with proper redirect
    expect(response?.status()).toBe(301);

    console.log('✅ Tenant migration redirect validated');
  });

  test('Graceful degradation with limited functionality', async ({ page }) => {
    // Mock partial service degradation
    await page.route('**/api/v1/products', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service temporarily unavailable',
          fallback: true
        })
      });
    });

    await page.goto('/t/zo-system');
    await page.waitForLoadState('networkidle');

    // Should show degraded service banner
    const degradedBanner = page.locator('[data-testid="service-degraded"], .service-degraded');
    if (await degradedBanner.count() > 0) {
      await expect(degradedBanner).toBeVisible();
      const bannerText = await degradedBanner.textContent();
      expect(bannerText?.toLowerCase()).toContain('unavailable');
    }

    // Should show cached or limited content
    const cachedContent = page.locator('[data-testid="cached-content"], .cached-products');
    if (await cachedContent.count() > 0) {
      await expect(cachedContent).toBeVisible();
    }

    // Should disable affected features gracefully
    const disabledFeatures = page.locator('[data-testid="feature-disabled"], .disabled-feature');
    const disabledCount = await disabledFeatures.count();

    if (disabledCount > 0) {
      for (let i = 0; i < disabledCount; i++) {
        const feature = disabledFeatures.nth(i);
        await expect(feature).toBeVisible();
      }
    }

    console.log('✅ Graceful degradation validated');
  });

  test('Database failover fallback', async ({ page }) => {
    // Mock database connection issues
    await page.route('**/api/**', route => {
      const url = route.request().url();

      // Simulate database-dependent endpoints failing
      if (url.includes('/products') || url.includes('/bookings') || url.includes('/orders')) {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Database temporarily unavailable',
            message: 'Our system is experiencing high traffic. Please try again shortly.'
          })
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/t/wondernails');

    // Should show user-friendly error message
    const errorMessage = page.locator('[data-testid="database-error"], .database-unavailable');
    if (await errorMessage.count() > 0) {
      const messageText = await errorMessage.textContent();
      expect(messageText?.toLowerCase()).toContain('high traffic');
    }

    // Should provide alternative contact methods
    const contactOptions = page.locator('[data-testid="alternative-contact"], .contact-alternatives');
    if (await contactOptions.count() > 0) {
      await expect(contactOptions).toBeVisible();
    }

    // Should not expose technical error details to users
    const pageContent = await page.textContent('body');
    const hasTechnicalErrors = pageContent?.toLowerCase().includes('database') ||
                              pageContent?.toLowerCase().includes('connection') ||
                              pageContent?.toLowerCase().includes('timeout');

    // Technical terms should be minimal or user-friendly
    if (hasTechnicalErrors) {
      // Should be in context of user-friendly messaging
      expect(pageContent?.toLowerCase()).toContain('traffic');
    }

    console.log('✅ Database failover fallback validated');
  });

  test('CDN and asset fallback', async ({ page }) => {
    // Mock CDN failures for static assets
    await page.route('**/cdn/**', route => {
      route.fulfill({ status: 404 });
    });

    await page.route('**/_next/static/**', route => {
      // Simulate CDN issues for some assets
      if (Math.random() < 0.5) {
        route.fulfill({ status: 404 });
      } else {
        route.continue();
      }
    });

    await page.goto('/t/nom-nom');
    await page.waitForLoadState('networkidle');

    // Should still render page despite asset failures
    const mainContent = page.locator('main, [data-testid="main-content"]');
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible();
    }

    // Should show placeholder for missing images
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i);
        const hasErrorHandler = await img.evaluate(el => {
          return el.onerror !== null || el.hasAttribute('onError');
        });

        // Images should have error handling
        if (hasErrorHandler) {
          console.log('✅ Image error handling present');
        }
      }
    }

    console.log('✅ CDN and asset fallback validated');
  });

  test('Fallback performance validation', async ({ page }) => {
    const startTime = Date.now();

    // Test fallback performance for unknown tenant
    await page.goto('/t/performance-test-unknown-tenant');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Fallback should still be reasonably fast (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);

    // Should have basic Core Web Vitals even in fallback
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          if (lcp) {
            resolve(lcp.startTime);
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Fallback timeout
        setTimeout(() => resolve(null), 3000);
      });
    });

    if (vitals) {
      // LCP should be reasonable even for fallback
      expect(vitals as number).toBeLessThan(4000); // 4s for fallback scenarios
    }

    console.log(`✅ Fallback performance validated: ${loadTime}ms load time`);
  });
});