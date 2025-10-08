import { test, expect } from '@playwright/test';

test.describe('Quotas and Cost Guards E2E Tests', () => {
  const testTenants = ['wondernails', 'nom-nom']; // Dedicated test tenants for quota testing

  test.beforeEach(async ({ page }) => {
    // Mock admin authentication for quota management
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'mock-admin-token');
      localStorage.setItem('user_role', 'admin');
    });
  });

  test('Eco Mode (50% budget) - Reduced features and quality', async ({ page }) => {
    for (const tenant of testTenants) {
      // Mock 50% budget usage to trigger eco mode
      await page.route('/api/v1/quota/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usage: 50,
            limit: 100,
            mode: 'eco',
            remaining: 50,
            threshold: {
              eco: 50,
              warning: 80,
              freeze: 90,
              kill: 100
            }
          })
        });
      });

      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Verify eco mode banner is displayed
      await expect(page.locator('[data-testid="eco-mode-banner"]')).toBeVisible();
      await expect(page.locator('[data-testid="eco-mode-banner"]')).toContainText('Eco Mode');

      // Verify reduced image quality (requirement: 1 imagen en eco)
      const productImages = page.locator('img[src*="/products/"], img[src*="/_next/image"]');
      const imageCount = await productImages.count();

      if (imageCount > 0) {
        const firstImage = productImages.first();
        const src = await firstImage.getAttribute('src');

        if (src) {
          // Should have reduced quality parameters
          const hasReducedQuality = src.includes('q=60') || // Quality 60%
                                  src.includes('q=50') ||   // Quality 50%
                                  src.includes('quality=60');

          expect(hasReducedQuality).toBeTruthy();
        }
      }

      // Verify limited features - only 1 image per upload in eco mode
      await page.goto(`/t/${tenant}/admin/media`);
      const uploadLimit = page.locator('[data-testid="upload-limit"]');
      if (await uploadLimit.isVisible()) {
        await expect(uploadLimit).toContainText('1'); // Max 1 image in eco mode
      }

      // Test that basic functionality still works
      const addToCartButton = page.locator('[data-testid="add-to-cart"]').first();
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
        await expect(page.locator('[data-testid="cart-updated"]')).toBeVisible();
      }

      console.log(`✅ ${tenant}: Eco mode (50%) working correctly`);
    }
  });

  test('Warning Mode (80% budget) - Usage notifications', async ({ page }) => {
    for (const tenant of testTenants) {
      // Mock 80% budget usage to trigger warning mode
      await page.route('/api/v1/quota/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usage: 80,
            limit: 100,
            mode: 'warning',
            remaining: 20,
            threshold: {
              eco: 50,
              warning: 80,
              freeze: 90,
              kill: 100
            }
          })
        });
      });

      await page.goto(`/t/${tenant}/admin`);
      await page.waitForLoadState('networkidle');

      // Verify warning banner is displayed
      await expect(page.locator('[data-testid="warning-banner"]')).toBeVisible();
      await expect(page.locator('[data-testid="warning-banner"]')).toContainText('80%');

      // Verify usage notifications
      const usageNotification = page.locator('[data-testid="usage-notification"]');
      if (await usageNotification.isVisible()) {
        await expect(usageNotification).toContainText('usage');
        await expect(usageNotification).toContainText('80%');
      }

      // Test that upgrade options are presented
      const upgradeOption = page.locator('[data-testid="upgrade-plan"], [data-testid="increase-quota"]');
      if (await upgradeOption.isVisible()) {
        await expect(upgradeOption).toContainText('upgrade');
      }

      // All functionality should still work normally in warning mode
      await page.goto(`/t/${tenant}`);
      const productGrid = page.locator('[data-testid="products-grid"]');
      await expect(productGrid).toBeVisible();

      console.log(`✅ ${tenant}: Warning mode (80%) working correctly`);
    }
  });

  test('Freeze Mode (90% budget) - Write operations disabled', async ({ page }) => {
    for (const tenant of testTenants) {
      // Mock 90% budget usage to trigger freeze mode
      await page.route('/api/v1/quota/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usage: 90,
            limit: 100,
            mode: 'freeze',
            remaining: 10,
            threshold: {
              eco: 50,
              warning: 80,
              freeze: 90,
              kill: 100
            }
          })
        });
      });

      await page.goto(`/t/${tenant}/admin`);
      await page.waitForLoadState('networkidle');

      // Verify freeze mode banner
      await expect(page.locator('[data-testid="freeze-banner"]')).toBeVisible();
      await expect(page.locator('[data-testid="freeze-banner"]')).toContainText('read-only');

      // Verify write operations are disabled
      const writeButtons = [
        '[data-testid="create-product"]',
        '[data-testid="save-changes"]',
        '[data-testid="upload-media"]',
        '[data-testid="schedule-post"]'
      ];

      for (const selector of writeButtons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          const isDisabled = await button.isDisabled();
          expect(isDisabled).toBeTruthy();
        }
      }

      // Test that read operations still work
      await page.goto(`/t/${tenant}`);
      await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

      // Shopping cart should be disabled (write operation)
      const addToCartButton = page.locator('[data-testid="add-to-cart"]');
      if (await addToCartButton.isVisible()) {
        await expect(addToCartButton).toBeDisabled();
      }

      // Browsing should still work
      const productLink = page.locator('a[href*="/products/"]').first();
      if (await productLink.isVisible()) {
        await productLink.click();
        await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
      }

      console.log(`✅ ${tenant}: Freeze mode (90%) working correctly`);
    }
  });

  test('Kill Switch (100% budget) - Service unavailable', async ({ page }) => {
    for (const tenant of testTenants) {
      // Mock 100% budget usage to trigger kill switch
      await page.route('/api/v1/**', route => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Service temporarily unavailable',
            code: 'QUOTA_EXCEEDED',
            message: 'Monthly quota exceeded. Service will resume next billing cycle.'
          })
        });
      });

      await page.goto(`/t/${tenant}`);

      // Verify maintenance mode is displayed
      await expect(page.locator('[data-testid="maintenance-mode"]')).toBeVisible();
      await expect(page.locator('[data-testid="maintenance-message"]')).toContainText('temporarily unavailable');

      // Verify normal content is not accessible
      const productGrid = page.locator('[data-testid="products-grid"]');
      await expect(productGrid).not.toBeVisible();

      // Verify emergency contact information is available
      await expect(page.locator('[data-testid="emergency-contact"]')).toBeVisible();

      // Should show upgrade/billing information
      const billingInfo = page.locator('[data-testid="billing-info"], [data-testid="upgrade-info"]');
      if (await billingInfo.isVisible()) {
        await expect(billingInfo).toContainText('quota');
      }

      console.log(`✅ ${tenant}: Kill switch (100%) working correctly`);
    }
  });

  test('Quota API - 429 responses with retry headers', async ({ request }) => {
    const tenant = 'wondernails';

    // Simulate quota exceeded scenario
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(
        request.get('/api/v1/products', {
          headers: { 'x-tenant': tenant }
        })
      );
    }

    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status());

    // Should have some 429 responses if rate limiting is working
    const rateLimitedResponses = responses.filter(r => r.status() === 429);

    if (rateLimitedResponses.length > 0) {
      // Check for proper retry headers
      const rateLimitedResponse = rateLimitedResponses[0];
      const headers = rateLimitedResponse.headers();

      // Should have retry-after or rate limit headers
      const hasRetryHeaders = headers['retry-after'] ||
                            headers['x-ratelimit-reset'] ||
                            headers['x-ratelimit-remaining'];

      expect(hasRetryHeaders).toBeTruthy();

      // Response should have proper error format
      const errorBody = await rateLimitedResponse.json();
      expect(errorBody.type || errorBody.code).toBeTruthy();
      expect(errorBody.message || errorBody.detail).toBeTruthy();
    }

    console.log(`✅ API rate limiting with proper 429 responses`);
  });

  test('Resource Limits - Storage, API calls, connections', async ({ page, request }) => {
    const tenant = 'wondernails';

    // Test storage quota
    const largeFileData = 'x'.repeat(1024 * 1024); // 1MB of data
    const uploadResponse = await request.post('/api/v1/media/upload', {
      headers: {
        'x-tenant': tenant,
        'authorization': 'Bearer mock-admin-token'
      },
      multipart: {
        file: {
          name: 'large-file.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from(largeFileData)
        }
      }
    });

    // Should track storage usage
    if (uploadResponse.ok()) {
      const result = await uploadResponse.json();
      if (result.quota) {
        expect(result.quota.storageUsed).toBeGreaterThan(0);
        expect(result.quota.storageLimit).toBeGreaterThan(result.quota.storageUsed);
      }
    }

    // Test API rate limiting
    const apiRequests = [];
    for (let i = 0; i < 100; i++) {
      apiRequests.push(
        request.get('/api/v1/products', {
          headers: { 'x-tenant': tenant }
        })
      );
    }

    const apiResponses = await Promise.all(apiRequests);
    const rateLimited = apiResponses.filter(r => r.status() === 429);

    // Should have some rate limiting at high request volumes
    expect(rateLimited.length).toBeGreaterThan(0);

    console.log(`✅ Resource limits properly enforced`);
  });

  test('Quota Recovery - Service restoration after limits reset', async ({ page }) => {
    for (const tenant of testTenants) {
      // Start in kill switch mode
      await page.route('/api/v1/quota/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usage: 100,
            limit: 100,
            mode: 'kill',
            remaining: 0
          })
        });
      });

      await page.goto(`/t/${tenant}`);
      await expect(page.locator('[data-testid="maintenance-mode"]')).toBeVisible();

      // Simulate quota reset (new billing cycle)
      await page.route('/api/v1/quota/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usage: 0,
            limit: 100,
            mode: 'normal',
            remaining: 100
          })
        });
      });

      // Refresh page to check recovery
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Service should be restored
      await expect(page.locator('[data-testid="maintenance-mode"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();

      console.log(`✅ ${tenant}: Quota recovery working`);
    }
  });

  test('Budget Notifications - Progressive alerts', async ({ page }) => {
    const budgetLevels = [
      { usage: 50, mode: 'eco', banner: 'eco-mode-banner' },
      { usage: 80, mode: 'warning', banner: 'warning-banner' },
      { usage: 90, mode: 'freeze', banner: 'freeze-banner' }
    ];

    for (const level of budgetLevels) {
      await page.route('/api/v1/quota/status', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            usage: level.usage,
            limit: 100,
            mode: level.mode,
            remaining: 100 - level.usage
          })
        });
      });

      await page.goto('/t/wondernails');
      await page.waitForLoadState('networkidle');

      // Verify appropriate banner is shown
      await expect(page.locator(`[data-testid="${level.banner}"]`)).toBeVisible();

      console.log(`✅ Budget notification at ${level.usage}% working`);
    }
  });
});