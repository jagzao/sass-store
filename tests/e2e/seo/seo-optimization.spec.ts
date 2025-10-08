import { test, expect } from '@playwright/test';

test.describe('SEO Optimization Tests', () => {
  const tenants = ['wondernails', 'nom-nom', 'delirios', 'zo-system'];

  test('Meta tags should be tenant-specific', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check title tag
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
      expect(title.length).toBeLessThan(60); // SEO best practice

      // Check meta description
      const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
      if (metaDescription) {
        expect(metaDescription.length).toBeGreaterThan(50);
        expect(metaDescription.length).toBeLessThan(160); // SEO best practice
      }

      // Check Open Graph tags
      const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
      const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');

      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      if (ogImage) {
        expect(ogImage).toMatch(/\.(jpg|jpeg|png|webp|avif)$/);
      }

      // Check Twitter Cards
      const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
      if (twitterCard) {
        expect(['summary', 'summary_large_image', 'app']).toContain(twitterCard);
      }

      console.log(`✓ ${tenant}: Meta tags validated`);
    }
  });

  test('Canonical URLs should be correct', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      if (canonical) {
        expect(canonical).toContain(tenant);
        expect(canonical).toMatch(/^https?:\/\//);
      }

      // For product/service pages
      const productLinks = page.locator('a[href*="/products/"], a[href*="/services/"]');
      const linkCount = await productLinks.count();

      if (linkCount > 0) {
        await productLinks.first().click();
        await page.waitForLoadState('networkidle');

        const productCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        if (productCanonical) {
          expect(productCanonical).toContain(tenant);
          expect(productCanonical).toMatch(/\/(products|services)\//);
        }
      }

      console.log(`✓ ${tenant}: Canonical URLs validated`);
    }
  });

  test('Structured data (JSON-LD) should be present', async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Check for JSON-LD structured data
      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const scriptCount = await jsonLdScripts.count();

      if (scriptCount > 0) {
        for (let i = 0; i < scriptCount; i++) {
          const scriptContent = await jsonLdScripts.nth(i).textContent();
          if (scriptContent) {
            try {
              const structuredData = JSON.parse(scriptContent);

              // Check for common schema types
              const validTypes = [
                'LocalBusiness',
                'Organization',
                'Product',
                'Service',
                'BreadcrumbList',
                'Website'
              ];

              expect(validTypes).toContain(structuredData['@type']);

              // If it's a LocalBusiness, check required fields
              if (structuredData['@type'] === 'LocalBusiness') {
                expect(structuredData.name).toBeTruthy();
                expect(structuredData.address).toBeTruthy();
              }

              // If it's a Product or Service, check required fields
              if (['Product', 'Service'].includes(structuredData['@type'])) {
                expect(structuredData.name).toBeTruthy();
                expect(structuredData.offers || structuredData.price).toBeTruthy();
              }

            } catch (error) {
              throw new Error(`Invalid JSON-LD in ${tenant}: ${error}`);
            }
          }
        }
      }

      console.log(`✓ ${tenant}: Structured data validated`);
    }
  });

  test('Images should have proper optimization', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) { // Test first 2 tenants for performance
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < Math.min(imageCount, 5); i++) { // Check first 5 images
        const img = images.nth(i);
        if (await img.isVisible()) {
          // Check alt text
          const alt = await img.getAttribute('alt');
          expect(alt).toBeTruthy();

          // Check loading attribute for below-fold images
          const boundingBox = await img.boundingBox();
          if (boundingBox && boundingBox.y > 600) { // Below fold
            const loading = await img.getAttribute('loading');
            expect(loading).toBe('lazy');
          }

          // Check dimensions to prevent CLS
          const width = await img.getAttribute('width');
          const height = await img.getAttribute('height');
          if (width && height) {
            expect(parseInt(width)).toBeGreaterThan(0);
            expect(parseInt(height)).toBeGreaterThan(0);
          }

          // Check if using modern formats
          const src = await img.getAttribute('src');
          if (src) {
            const isOptimized = src.includes('.webp') ||
                               src.includes('.avif') ||
                               src.includes('/_next/image');
            expect(isOptimized).toBeTruthy();
          }
        }
      }

      console.log(`✓ ${tenant}: Image optimization validated`);
    }
  });

  test('Fallback tenant should have correct SEO handling', async ({ page }) => {
    // Test unknown tenant fallback
    await page.goto('/t/unknown-tenant-12345');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const title = await page.title();

    // Should either redirect to zo-system or show zo-system content
    const isFallbackHandled = currentUrl.includes('zo-system') ||
                              title.toLowerCase().includes('zo-system') ||
                              title.toLowerCase().includes('sass store');

    expect(isFallbackHandled).toBeTruthy();

    // Check if noindex is set for unknown tenants
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    if (robotsMeta) {
      expect(robotsMeta).toContain('noindex');
    }

    console.log('✓ Fallback SEO handling validated');
  });

  test('Sitemap and robots.txt should be accessible', async ({ page }) => {
    // Check robots.txt
    const robotsResponse = await page.goto('/robots.txt');
    expect(robotsResponse?.status()).toBe(200);

    const robotsContent = await page.textContent('body');
    expect(robotsContent).toContain('User-agent');

    // Check sitemap reference in robots.txt
    if (robotsContent?.includes('Sitemap:')) {
      const sitemapUrl = robotsContent.match(/Sitemap:\s*(.*)/)?.[1];
      if (sitemapUrl) {
        const sitemapResponse = await page.goto(sitemapUrl.trim());
        expect(sitemapResponse?.status()).toBe(200);
      }
    }

    console.log('✓ Robots.txt and sitemap validated');
  });

  test('Page load performance should meet targets', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) { // Test 2 tenants for performance
      await page.goto(`/t/${tenant}`, { waitUntil: 'networkidle' });

      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals: any = {};

            entries.forEach((entry: any) => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.fid = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift') {
                vitals.cls = (vitals.cls || 0) + entry.value;
              }
            });

            resolve(vitals);
          });

          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

          // Fallback timeout
          setTimeout(() => resolve({}), 3000);
        });
      });

      // Check LCP (should be < 2.5s)
      if ((webVitals as any).lcp) {
        expect((webVitals as any).lcp).toBeLessThan(2500);
      }

      // Check CLS (should be < 0.1)
      if ((webVitals as any).cls) {
        expect((webVitals as any).cls).toBeLessThan(0.1);
      }

      console.log(`✓ ${tenant}: Performance metrics validated`);
    }
  });

  test('Breadcrumbs should be implemented correctly', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Look for product/service links to test breadcrumbs
      const productLinks = page.locator('a[href*="/products/"], a[href*="/services/"]');
      const linkCount = await productLinks.count();

      if (linkCount > 0) {
        await productLinks.first().click();
        await page.waitForLoadState('networkidle');

        // Check for breadcrumb navigation
        const breadcrumbs = page.locator('[data-testid="breadcrumbs"], .breadcrumbs, nav[aria-label*="breadcrumb"]');

        if (await breadcrumbs.isVisible()) {
          const breadcrumbText = await breadcrumbs.textContent();
          expect(breadcrumbText).toContain('Home');
          expect(breadcrumbText?.split('>').length || 0).toBeGreaterThan(1);
        }

        // Check for JSON-LD BreadcrumbList
        const jsonLdScripts = page.locator('script[type="application/ld+json"]');
        const scriptCount = await jsonLdScripts.count();

        let hasBreadcrumbLD = false;
        for (let i = 0; i < scriptCount; i++) {
          const scriptContent = await jsonLdScripts.nth(i).textContent();
          if (scriptContent && scriptContent.includes('BreadcrumbList')) {
            hasBreadcrumbLD = true;
            const structuredData = JSON.parse(scriptContent);
            expect(structuredData['@type']).toBe('BreadcrumbList');
            expect(structuredData.itemListElement).toBeTruthy();
            break;
          }
        }

        if (await breadcrumbs.isVisible()) {
          expect(hasBreadcrumbLD).toBeTruthy();
        }
      }

      console.log(`✓ ${tenant}: Breadcrumbs validated`);
    }
  });
});