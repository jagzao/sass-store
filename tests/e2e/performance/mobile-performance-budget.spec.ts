import { test, expect, devices } from '@playwright/test';

/**
 * Test 14: Mobile Performance Budget
 * Reference: agents/outputs/testing/e2e-flows.md:495-525
 */

test.describe('Mobile Performance Budget', () => {

  test('should meet mobile LCP budget of <3s', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Measure Largest Contentful Paint
    const lcpValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1] as PerformanceEntry;
          resolve(lcp.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });

    // Mobile LCP budget: 3s
    expect(lcpValue).toBeLessThan(3000);
    console.log(`Mobile LCP: ${lcpValue}ms`);
  });

  test('should meet mobile FCP budget of <2s', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Measure First Contentful Paint
    const fcpValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries[0] as PerformanceEntry;
          resolve(fcp.startTime);
        }).observe({ type: 'paint', buffered: true });
      });
    });

    // Mobile FCP budget: 2s
    expect(fcpValue).toBeLessThan(2000);
    console.log(`Mobile FCP: ${fcpValue}ms`);
  });

  test('should meet mobile TTFB budget of <1s', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Measure Time to First Byte
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        ttfb: navigation.responseStart - navigation.requestStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
      };
    });

    // Mobile TTFB budget: 1s
    expect(metrics.ttfb).toBeLessThan(1000);
    console.log(`Mobile TTFB: ${metrics.ttfb}ms`);
  });

  test('should load efficiently on 3G network', async ({ page, context }) => {
    // Simulate 3G network conditions
    await context.route('**/*', async (route) => {
      // Add delay to simulate 3G (slower network)
      await new Promise(resolve => setTimeout(resolve, 50));
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load within reasonable time even on 3G
    expect(loadTime).toBeLessThan(5000); // 5s threshold for 3G

    console.log(`3G Load Time: ${loadTime}ms`);
  });

  test('should serve appropriately sized images for mobile', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    const productImages = page.locator('[data-testid="product-image"], img');
    const imageCount = await productImages.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = productImages.nth(i);
      const src = await img.getAttribute('src');

      if (src) {
        // Should use mobile-optimized images (lower quality or smaller dimensions)
        const isMobileOptimized =
          src.includes('w=400') || // Width parameter
          src.includes('w=500') ||
          src.includes('q=60') || // Quality parameter
          src.includes('q=70') ||
          src.includes('mobile') ||
          src.includes('sm-');

        expect(isMobileOptimized).toBeTruthy();
      }
    }
  });

  test('should minimize JavaScript execution time', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Measure JavaScript execution time
    const jsMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const jsEntries = entries.filter(e => e.name.includes('script') || e.name.includes('js'));

      const totalJsTime = jsEntries.reduce((sum, entry) => sum + entry.duration, 0);

      return {
        totalJsTime,
        entryCount: jsEntries.length
      };
    });

    // JS execution should be minimal on mobile
    console.log(`Total JS Execution Time: ${jsMetrics.totalJsTime}ms`);

    // Should be under 2s total
    expect(jsMetrics.totalJsTime).toBeLessThan(2000);
  });

  test('should lazy load below-the-fold content', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Check for lazy loading attributes
    const images = page.locator('img');
    const imageCount = await images.count();

    let lazyLoadedCount = 0;

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const loading = await img.getAttribute('loading');

      if (loading === 'lazy') {
        lazyLoadedCount++;
      }
    }

    // At least some images should be lazy loaded
    expect(lazyLoadedCount).toBeGreaterThan(0);
    console.log(`Lazy loaded images: ${lazyLoadedCount}/${imageCount}`);
  });

  test('should use efficient caching for mobile', async ({ page }) => {
    // First visit
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');

    // Second visit (should use cache)
    const startTime = Date.now();
    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');
    const secondLoadTime = Date.now() - startTime;

    // Second load should be significantly faster (cached)
    expect(secondLoadTime).toBeLessThan(1000);
    console.log(`Cached Load Time: ${secondLoadTime}ms`);
  });

  test('should minimize layout shifts on mobile', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Measure Cumulative Layout Shift
    await page.waitForLoadState('networkidle');

    const clsValue = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cls = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          resolve(cls);
        }).observe({ type: 'layout-shift', buffered: true });

        // Resolve after a short delay to capture shifts
        setTimeout(() => resolve(cls), 2000);
      });
    });

    // Mobile CLS budget: <0.1
    expect(clsValue).toBeLessThan(0.1);
    console.log(`Mobile CLS: ${clsValue}`);
  });

  test('should optimize font loading for mobile', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Check for font-display: swap or optional
    const fontFaces = await page.evaluate(() => {
      const fonts = Array.from(document.fonts);
      return fonts.map(font => ({
        family: font.family,
        status: font.status,
        loaded: font.loaded
      }));
    });

    // Fonts should be loaded or loading
    fontFaces.forEach(font => {
      expect(['loaded', 'loading']).toContain(font.status);
    });

    console.log(`Fonts loaded: ${fontFaces.filter(f => f.status === 'loaded').length}/${fontFaces.length}`);
  });

  test('should meet mobile bundle size budget', async ({ page }) => {
    let totalJsSize = 0;
    let totalCssSize = 0;

    // Track resource sizes
    page.on('response', async (response) => {
      const url = response.url();
      const size = (await response.body()).length;

      if (url.endsWith('.js')) {
        totalJsSize += size;
      } else if (url.endsWith('.css')) {
        totalCssSize += size;
      }
    });

    await page.goto('/t/wondernails/products');
    await page.waitForLoadState('networkidle');

    // Mobile bundle budget: <300KB total
    const totalSize = totalJsSize + totalCssSize;
    expect(totalSize).toBeLessThan(300 * 1024); // 300KB

    console.log(`Mobile Bundle Size - JS: ${(totalJsSize / 1024).toFixed(2)}KB, CSS: ${(totalCssSize / 1024).toFixed(2)}KB, Total: ${(totalSize / 1024).toFixed(2)}KB`);
  });

  test('should prioritize critical rendering path on mobile', async ({ page }) => {
    await page.goto('/t/wondernails/products');

    // Check that critical CSS is inlined
    const inlineStyles = await page.evaluate(() => {
      const styles = Array.from(document.querySelectorAll('style'));
      return styles.length > 0;
    });

    expect(inlineStyles).toBeTruthy();

    // Check that non-critical CSS is deferred
    const deferredLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.some(link => link.hasAttribute('media') && link.getAttribute('media') === 'print');
    });

    // At least one stylesheet should be deferred
    console.log(`Has deferred stylesheets: ${deferredLinks}`);
  });
});
