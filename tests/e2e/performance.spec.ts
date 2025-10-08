import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Page load times should meet targets', async ({ page }) => {
    // Test homepage load time
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const homeLoadTime = Date.now() - startTime;

    expect(homeLoadTime).toBeLessThan(3000); // 3 seconds max

    // Test product page load time
    const productStartTime = Date.now();
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const productLoadTime = Date.now() - productStartTime;

    expect(productLoadTime).toBeLessThan(3000);

    // Test tenant-specific page load time
    const tenantStartTime = Date.now();
    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');
    const tenantLoadTime = Date.now() - tenantStartTime;

    expect(tenantLoadTime).toBeLessThan(3000);
  });

  test('Bundle size should be under 250KB', async ({ page }) => {
    await page.goto('/');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');

      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;

      resources.forEach((resource: any) => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;

          if (resource.name.includes('.js')) {
            jsSize += resource.transferSize;
          } else if (resource.name.includes('.css')) {
            cssSize += resource.transferSize;
          }
        }
      });

      return {
        totalSize,
        jsSize,
        cssSize,
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart
      };
    });

    // Bundle size should be under 250KB (256000 bytes)
    expect(metrics.totalSize).toBeLessThan(256000);

    // JavaScript bundle should be reasonable
    expect(metrics.jsSize).toBeLessThan(200000); // 200KB max for JS

    // CSS should be minimal
    expect(metrics.cssSize).toBeLessThan(50000); // 50KB max for CSS

    console.log('Performance metrics:', metrics);
  });

  test('Core Web Vitals should meet targets', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcp = 0;
        let fcp = 0;
        let cls = 0;

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          fcp = entries[0].startTime;
        });
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          cls = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Give some time for metrics to be collected
        setTimeout(() => {
          resolve({ lcp, fcp, cls });
        }, 2000);
      });
    });

    const vitals = webVitals as { lcp: number; fcp: number; cls: number };

    // Core Web Vitals targets
    expect(vitals.lcp).toBeLessThan(2500); // LCP < 2.5s
    expect(vitals.fcp).toBeLessThan(1800); // FCP < 1.8s
    expect(vitals.cls).toBeLessThan(0.1);  // CLS < 0.1

    console.log('Core Web Vitals:', vitals);
  });

  test('Image optimization should be working', async ({ page }) => {
    await page.goto('/');

    // Check that images are using optimized formats
    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // Should use Next.js image optimization or proper formats
        const isOptimized = src.includes('/_next/image') ||
                          src.includes('.webp') ||
                          src.includes('.avif') ||
                          src.startsWith('data:'); // Base64 or lazy loading placeholder

        expect(isOptimized).toBe(true);
      }
    }
  });

  test('Caching headers should be set properly', async ({ page }) => {
    const response = await page.goto('/');

    // Check cache headers
    const cacheControl = response?.headers()['cache-control'];
    const etag = response?.headers()['etag'];

    // Should have some form of caching
    expect(cacheControl || etag).toBeTruthy();

    // Test static asset caching
    await page.goto('/');

    // Check if static assets have long cache times
    const responses = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('_next/static')),
    ].map(p => p.catch(() => null)));

    for (const resp of responses) {
      if (resp) {
        const staticCacheControl = resp.headers()['cache-control'];
        // Static assets should have long cache times
        expect(staticCacheControl).toContain('max-age');
      }
    }
  });
});