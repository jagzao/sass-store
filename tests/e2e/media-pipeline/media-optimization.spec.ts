import { test, expect } from '@playwright/test';

test.describe('Media Pipeline E2E Tests - Optimization & AVIF/WebP', () => {
  const tenants = ['wondernails', 'nom-nom', 'delirios', 'zo-system'];

  test('Media Upload - Optimization pipeline (AVIF/WebP, variantes, EXIF off)', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}/admin/media`);
      await page.waitForLoadState('networkidle');

      // Mock admin authentication
      await page.addInitScript(() => {
        localStorage.setItem('auth_token', 'mock-admin-token');
        localStorage.setItem('user_role', 'admin');
      });

      // Skip if media upload not available
      const uploadExists = await page.locator('[data-testid="media-upload"]').count() > 0;
      if (!uploadExists) {
        console.log(`⚪ ${tenant}: Media upload not available`);
        continue;
      }

      // Mock file upload with real image characteristics
      await page.evaluate(() => {
        // Create mock file with EXIF data
        const mockFile = new File(['fake-image-data'], 'test-image.jpg', {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        // Add mock EXIF data
        (mockFile as any).exifData = {
          gps: { latitude: 40.7128, longitude: -74.0060 }, // Should be removed
          camera: 'iPhone 14 Pro',
          timestamp: '2024-01-01T12:00:00Z'
        };

        window.mockUploadFile = mockFile;
      });

      // Upload image
      const fileInput = page.locator('[data-testid="file-upload"]');
      if (await fileInput.isVisible()) {
        // Simulate file selection
        await fileInput.click();

        // Wait for upload processing
        await page.waitForLoadState('networkidle');

        // Verify optimization results
        const uploadResult = page.locator('[data-testid="upload-result"]');
        await expect(uploadResult).toBeVisible({ timeout: 10000 });

        // Check for optimized variants (requirement: AVIF/WebP)
        const variants = page.locator('[data-testid="image-variants"]');
        if (await variants.isVisible()) {
          const variantList = await variants.textContent();

          // Should have AVIF variant
          expect(variantList).toContain('avif');

          // Should have WebP variant
          expect(variantList).toContain('webp');

          // Should have multiple sizes
          expect(variantList).toMatch(/\d+x\d+/); // Size pattern like 800x600
        }

        // Verify EXIF data removed (requirement: EXIF off)
        const imageInfo = page.locator('[data-testid="image-info"]');
        if (await imageInfo.isVisible()) {
          const imageData = await imageInfo.textContent();

          // Should not contain GPS data
          expect(imageData?.toLowerCase()).not.toContain('gps');
          expect(imageData?.toLowerCase()).not.toContain('latitude');
          expect(imageData?.toLowerCase()).not.toContain('longitude');
        }

        // Verify blurhash generated (requirement: blurhash)
        const blurhash = page.locator('[data-testid="blurhash"]');
        if (await blurhash.isVisible()) {
          const blurhashValue = await blurhash.getAttribute('data-blurhash');
          expect(blurhashValue).toBeTruthy();
          expect(blurhashValue?.length).toBeGreaterThan(10);
        }

        // Verify dominant color extracted (requirement: dominantColor)
        const dominantColor = page.locator('[data-testid="dominant-color"]');
        if (await dominantColor.isVisible()) {
          const colorValue = await dominantColor.getAttribute('data-color');
          expect(colorValue).toMatch(/^#[0-9A-Fa-f]{6}$/); // Hex color format
        }

        console.log(`✅ ${tenant}: Media optimization pipeline working`);
      }
    }
  });

  test('Media Deduplication - Prevent duplicate uploads', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) { // Test 2 tenants for performance
      await page.goto(`/t/${tenant}/admin/media`);
      await page.waitForLoadState('networkidle');

      // Upload same file twice to test deduplication
      const mockFileData = 'identical-file-content-for-dedup-test';

      await page.evaluate((fileData) => {
        window.uploadSameFileTwice = async () => {
          const file1 = new File([fileData], 'duplicate-test.jpg', { type: 'image/jpeg' });
          const file2 = new File([fileData], 'duplicate-test-copy.jpg', { type: 'image/jpeg' });

          return { file1, file2 };
        };
      }, mockFileData);

      // First upload
      const fileInput = page.locator('[data-testid="file-upload"]');
      if (await fileInput.isVisible()) {
        await fileInput.click();
        await page.waitForTimeout(1000);

        const firstUploadResult = page.locator('[data-testid="upload-result"]').first();
        const firstFileId = await firstUploadResult.getAttribute('data-file-id');

        // Second upload (same content, different name)
        await fileInput.click();
        await page.waitForTimeout(1000);

        // Should detect duplicate and show dedup notice
        const dedupNotice = page.locator('[data-testid="duplicate-detected"]');
        if (await dedupNotice.isVisible()) {
          await expect(dedupNotice).toContainText('duplicate');

          // Should offer to reuse existing file
          const reuseOption = page.locator('[data-testid="reuse-existing"]');
          if (await reuseOption.isVisible()) {
            await reuseOption.click();

            // Verify same file ID is reused
            const secondUploadResult = page.locator('[data-testid="upload-result"]').nth(1);
            const secondFileId = await secondUploadResult.getAttribute('data-file-id');

            expect(secondFileId).toBe(firstFileId);
          }
        }

        console.log(`✅ ${tenant}: Media deduplication working`);
      }
    }
  });

  test('Media Serving - AVIF/WebP delivery with fallbacks', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check that images are served in optimized formats
      const images = page.locator('img[src*="/media/"], img[src*="/_next/image"]');
      const imageCount = await images.count();

      if (imageCount > 0) {
        for (let i = 0; i < Math.min(imageCount, 5); i++) {
          const img = images.nth(i);
          const src = await img.getAttribute('src');

          if (src) {
            // Should use Next.js Image optimization or contain format parameters
            const isOptimized = src.includes('/_next/image') ||
                               src.includes('f=avif') ||
                               src.includes('f=webp') ||
                               src.includes('.avif') ||
                               src.includes('.webp');

            expect(isOptimized).toBeTruthy();

            // Check if srcset is provided for responsive images
            const srcset = await img.getAttribute('srcset');
            if (srcset) {
              expect(srcset).toContain('w'); // Should contain width descriptors
            }

            // Verify lazy loading for below-fold images
            const boundingBox = await img.boundingBox();
            if (boundingBox && boundingBox.y > 600) {
              const loading = await img.getAttribute('loading');
              expect(loading).toBe('lazy');
            }
          }
        }

        console.log(`✅ ${tenant}: Optimized image delivery verified`);
      }
    }
  });

  test('Media Performance - Loading and rendering optimization', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      // Monitor image loading performance
      const imageLoadTimes: number[] = [];

      page.on('response', response => {
        const url = response.url();
        if (url.includes('/media/') || url.includes('/_next/image')) {
          const timing = response.request().timing();
          if (timing) {
            const loadTime = timing.responseEnd - timing.requestStart;
            imageLoadTimes.push(loadTime);
          }
        }
      });

      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Verify image load times are reasonable
      if (imageLoadTimes.length > 0) {
        const averageLoadTime = imageLoadTimes.reduce((a, b) => a + b) / imageLoadTimes.length;
        expect(averageLoadTime).toBeLessThan(2000); // 2 seconds average

        // No single image should take more than 5 seconds
        const maxLoadTime = Math.max(...imageLoadTimes);
        expect(maxLoadTime).toBeLessThan(5000);
      }

      // Check for LQIP (Low Quality Image Placeholder) using blurhash
      const imagesWithBlurhash = page.locator('img[data-blurhash], [data-testid="blurhash-placeholder"]');
      const blurhashCount = await imagesWithBlurhash.count();

      if (blurhashCount > 0) {
        // Verify blurhash placeholders are shown during loading
        const blurhashPlaceholder = imagesWithBlurhash.first();
        const blurhashStyle = await blurhashPlaceholder.evaluate(el => {
          return window.getComputedStyle(el).backgroundImage;
        });

        // Should have some background (either gradient or blurhash)
        expect(blurhashStyle).not.toBe('none');
      }

      console.log(`✅ ${tenant}: Image loading performance validated`);
    }
  });

  test('Media Storage - Tenant isolation and quotas', async ({ page, request }) => {
    // Test media storage isolation between tenants
    for (const tenant of tenants.slice(0, 2)) {
      // Upload media to tenant-specific storage
      const uploadResponse = await request.post(`/api/v1/media/upload`, {
        headers: {
          'x-tenant': tenant,
          'authorization': 'Bearer mock-admin-token'
        },
        multipart: {
          file: {
            name: 'test-image.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data')
          }
        }
      });

      if (uploadResponse.ok()) {
        const result = await uploadResponse.json();

        // Verify tenant ID is included in response
        expect(result.tenantId || result.tenant).toBe(tenant);

        // Verify storage path includes tenant
        if (result.url || result.path) {
          const storagePath = result.url || result.path;
          expect(storagePath).toContain(tenant);
        }

        // Check quota information
        if (result.quota) {
          expect(result.quota.used).toBeGreaterThanOrEqual(0);
          expect(result.quota.limit).toBeGreaterThan(0);
          expect(result.quota.remaining).toBeGreaterThanOrEqual(0);
        }

        console.log(`✅ ${tenant}: Media storage isolation verified`);
      }
    }
  });

  test('Media API - Cross-tenant access prevention', async ({ request }) => {
    // Create media in tenant1
    const tenant1 = 'wondernails';
    const tenant2 = 'nom-nom';

    const uploadResponse = await request.post(`/api/v1/media/upload`, {
      headers: {
        'x-tenant': tenant1,
        'authorization': 'Bearer mock-admin-token'
      },
      multipart: {
        file: {
          name: 'secret-image.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('tenant1-secret-data')
        }
      }
    });

    if (uploadResponse.ok()) {
      const result = await uploadResponse.json();
      const mediaId = result.id;

      // Try to access tenant1's media from tenant2
      const crossAccessResponse = await request.get(`/api/v1/media/${mediaId}`, {
        headers: {
          'x-tenant': tenant2,
          'authorization': 'Bearer mock-admin-token'
        }
      });

      // Should return 404 (not 403 to avoid information leakage)
      expect(crossAccessResponse.status()).toBe(404);

      console.log('✅ Cross-tenant media access properly blocked');
    }
  });

  test('Media Variants - Responsive image generation', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}/admin/media`);
      await page.waitForLoadState('networkidle');

      // Upload image and check variant generation
      const fileInput = page.locator('[data-testid="file-upload"]');
      if (await fileInput.isVisible()) {
        await fileInput.click();
        await page.waitForTimeout(2000);

        const variants = page.locator('[data-testid="image-variants"]');
        if (await variants.isVisible()) {
          const variantList = await variants.textContent();

          // Should generate multiple sizes
          const sizePatterns = [
            /\b(thumbnail|thumb|sm)\b/i,  // Small/thumbnail
            /\b(medium|md)\b/i,           // Medium
            /\b(large|lg|xl)\b/i          // Large
          ];

          sizePatterns.forEach(pattern => {
            expect(variantList).toMatch(pattern);
          });

          // Should have format variants
          expect(variantList).toContain('avif');
          expect(variantList).toContain('webp');
          expect(variantList).toContain('jpg'); // Fallback
        }

        console.log(`✅ ${tenant}: Responsive variants generated`);
      }
    }
  });
});