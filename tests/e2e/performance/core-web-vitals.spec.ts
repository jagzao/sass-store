import { test, expect } from '@playwright/test';

test.describe('Performance Tests - Core Web Vitals', () => {
  const tenants = ['wondernails', 'nom-nom', 'delirios', 'zo-system'];

  test('Page load times should meet targets', async ({ page }) => {
    for (const tenant of tenants) {
      const startTime = Date.now();

      await page.goto(`/t/${tenant}`, { waitUntil: 'networkidle' });

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Check First Contentful Paint
      const fcpMetric = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
                observer.disconnect();
                return;
              }
            }
          });
          observer.observe({ entryTypes: ['paint'] });

          // Fallback timeout
          setTimeout(() => {
            observer.disconnect();
            resolve(null);
          }, 2000);
        });
      });

      if (fcpMetric) {
        // FCP should be under 1.8s (good threshold)
        expect(fcpMetric as number).toBeLessThan(1800);
      }

      console.log(`✓ ${tenant}: Load time ${loadTime}ms, FCP ${fcpMetric}ms`);
    }
  });

  test('Bundle size should be under 250KB', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) { // Test 2 tenants for performance
      const resources: Array<{ url: string, size: number, type: string }> = [];

      page.on('response', response => {
        const url = response.url();
        if (url.includes('/_next/static/') || url.includes('.js') || url.includes('.css')) {
          resources.push({
            url,
            size: 0, // Will be filled by network analysis
            type: url.includes('.js') ? 'javascript' : url.includes('.css') ? 'css' : 'other'
          });
        }
      });

      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Get actual transfer sizes
      const resourceSizes = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return entries.map(entry => ({
          url: entry.name,
          size: entry.transferSize || entry.decodedBodySize || 0,
          type: entry.name.includes('.js') ? 'javascript' :
                entry.name.includes('.css') ? 'css' : 'other'
        }));
      });

      // Calculate total bundle size
      let totalJSSize = 0;
      let totalCSSSize = 0;

      for (const resource of resourceSizes) {
        if (resource.type === 'javascript' && resource.url.includes('/_next/static/')) {
          totalJSSize += resource.size;
        } else if (resource.type === 'css' && resource.url.includes('/_next/static/')) {
          totalCSSSize += resource.size;
        }
      }

      const totalBundleSize = totalJSSize + totalCSSSize;

      // Should be under 250KB (250,000 bytes)
      expect(totalBundleSize).toBeLessThan(250000);

      console.log(`✓ ${tenant}: Bundle size ${Math.round(totalBundleSize / 1024)}KB (JS: ${Math.round(totalJSSize / 1024)}KB, CSS: ${Math.round(totalCSSSize / 1024)}KB)`);
    }
  });

  test('Core Web Vitals should meet targets', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Measure Core Web Vitals using Web Vitals API
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals: any = {};

          // LCP Observer
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // FID Observer (if available)
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              vitals.fid = (entry as any).processingStart - entry.startTime;
            }
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // CLS Observer
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            for (const entry of entries) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            vitals.cls = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Resolve after 3 seconds
          setTimeout(() => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
            resolve(vitals);
          }, 3000);
        });
      });

      const vitals = webVitals as any;

      // LCP should be under 2.5s (good threshold)
      if (vitals.lcp) {
        expect(vitals.lcp).toBeLessThan(2500);
      }

      // FID should be under 100ms (good threshold)
      if (vitals.fid) {
        expect(vitals.fid).toBeLessThan(100);
      }

      // CLS should be under 0.1 (good threshold)
      if (vitals.cls !== undefined) {
        expect(vitals.cls).toBeLessThan(0.1);
      }

      console.log(`✓ ${tenant}: LCP ${vitals.lcp}ms, FID ${vitals.fid || 'N/A'}ms, CLS ${vitals.cls || 'N/A'}`);
    }
  });

  test('Image optimization should be working', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();

      let optimizedCount = 0;
      let totalImages = 0;

      for (let i = 0; i < Math.min(imageCount, 10); i++) { // Check first 10 images
        const img = images.nth(i);
        if (await img.isVisible()) {
          totalImages++;

          const src = await img.getAttribute('src');
          const loading = await img.getAttribute('loading');
          const width = await img.getAttribute('width');
          const height = await img.getAttribute('height');

          // Check for optimization indicators
          const isOptimized = src && (
            src.includes('/_next/image') ||
            src.includes('.webp') ||
            src.includes('.avif') ||
            src.includes('?w=') ||
            src.includes('?q=')
          );

          if (isOptimized) {
            optimizedCount++;
          }

          // Check lazy loading for below-fold images
          const boundingBox = await img.boundingBox();
          if (boundingBox && boundingBox.y > 600) {
            expect(loading).toBe('lazy');
          }

          // Check dimensions to prevent CLS
          if (width && height) {
            expect(parseInt(width)).toBeGreaterThan(0);
            expect(parseInt(height)).toBeGreaterThan(0);
          }
        }
      }

      // At least 70% of images should be optimized
      if (totalImages > 0) {
        const optimizationRate = optimizedCount / totalImages;
        expect(optimizationRate).toBeGreaterThan(0.7);
      }

      console.log(`✓ ${tenant}: ${optimizedCount}/${totalImages} images optimized (${Math.round((optimizedCount/totalImages)*100)}%)`);
    }
  });

  test('Caching headers should be set properly', async ({ page }) => {
    const cacheableResources: Array<{ url: string, headers: Record<string, string> }> = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/_next/static/') ||
          url.includes('.js') ||
          url.includes('.css') ||
          url.includes('.png') ||
          url.includes('.jpg') ||
          url.includes('.webp')) {
        cacheableResources.push({
          url,
          headers: response.headers()
        });
      }
    });

    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    for (const resource of cacheableResources.slice(0, 10)) { // Check first 10 resources
      const headers = resource.headers;

      // Should have cache control
      const cacheControl = headers['cache-control'];
      expect(cacheControl).toBeTruthy();

      // Static assets should have long cache times
      if (resource.url.includes('/_next/static/')) {
        expect(cacheControl).toMatch(/max-age=\d+/);
        const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '0');
        expect(maxAge).toBeGreaterThan(86400); // At least 1 day
      }

      // Should have ETag or Last-Modified
      const etag = headers['etag'];
      const lastModified = headers['last-modified'];
      expect(etag || lastModified).toBeTruthy();
    }

    console.log(`✓ Cache headers validated for ${cacheableResources.length} resources`);
  });

  test('JavaScript execution should be efficient', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);

      // Measure JavaScript execution time
      const jsMetrics = await page.evaluate(() => {
        const start = performance.now();

        // Simulate user interactions
        const buttons = document.querySelectorAll('button');
        if (buttons.length > 0) {
          buttons[0].click();
        }

        const executionTime = performance.now() - start;

        // Get long tasks (tasks that block main thread for >50ms)
        const longTasks = performance.getEntriesByType('longtask');

        return {
          executionTime,
          longTaskCount: longTasks.length,
          totalBlockingTime: longTasks.reduce((total: number, task: any) => total + task.duration, 0)
        };
      });

      // Execution should be under 50ms for simple interactions
      expect(jsMetrics.executionTime).toBeLessThan(50);

      // Should have minimal long tasks
      expect(jsMetrics.longTaskCount).toBeLessThan(5);

      // Total blocking time should be under 300ms
      expect(jsMetrics.totalBlockingTime).toBeLessThan(300);

      console.log(`✓ ${tenant}: JS execution ${jsMetrics.executionTime.toFixed(2)}ms, ${jsMetrics.longTaskCount} long tasks`);
    }
  });

  test('Memory usage should be reasonable', async ({ page }) => {
    for (const tenant of tenants.slice(0, 2)) {
      await page.goto(`/t/${tenant}`);
      await page.waitForLoadState('networkidle');

      // Simulate some user interactions
      const links = page.locator('a').first();
      if (await links.isVisible()) {
        await links.hover();
      }

      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        await buttons.hover();
      }

      // Check memory usage (if performance.memory is available)
      const memoryInfo = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });

      if (memoryInfo) {
        // Should not use excessive memory (under 50MB)
        expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);

        console.log(`✓ ${tenant}: Memory usage ${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`);
      }
    }
  });

  test('Network requests should be optimized', async ({ page }) => {
    const requests: Array<{ url: string, size: number, duration: number }> = [];

    page.on('response', async response => {
      const request = response.request();
      const timing = request.timing();

      requests.push({
        url: response.url(),
        size: parseInt(response.headers()['content-length'] || '0'),
        duration: timing ? timing.responseEnd - timing.requestStart : 0
      });
    });

    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    // Total requests should be reasonable (under 50 for initial page load)
    expect(requests.length).toBeLessThan(50);

    // No single request should take too long (under 2 seconds)
    const slowRequests = requests.filter(req => req.duration > 2000);
    expect(slowRequests.length).toBe(0);

    // Large files should be compressed
    const largeFiles = requests.filter(req => req.size > 100000); // > 100KB
    for (const file of largeFiles) {
      // Large files should be images or already compressed assets
      const isCompressible = file.url.includes('.jpg') ||
                            file.url.includes('.png') ||
                            file.url.includes('.webp') ||
                            file.url.includes('.avif') ||
                            file.url.includes('/_next/static/');
      expect(isCompressible).toBeTruthy();
    }

    console.log(`✓ Network: ${requests.length} requests, ${slowRequests.length} slow, ${largeFiles.length} large files`);
  });

  test('Progressive loading should work', async ({ page }) => {
    await page.goto('/t/wondernails');

    // Check if critical content loads first
    const criticalContent = page.locator('h1, .hero, .main-content').first();
    await expect(criticalContent).toBeVisible({ timeout: 1000 });

    // Secondary content can load later
    const secondaryContent = page.locator('.secondary, .footer, .sidebar');
    if (await secondaryContent.count() > 0) {
      // Secondary content should eventually load
      await expect(secondaryContent.first()).toBeVisible({ timeout: 3000 });
    }

    // Check for loading states
    const loadingStates = page.locator('.loading, .skeleton, [aria-busy="true"]');
    const hasLoadingStates = await loadingStates.count() > 0;

    // If loading states exist, they should eventually disappear
    if (hasLoadingStates) {
      await expect(loadingStates.first()).toBeHidden({ timeout: 5000 });
    }

    console.log('✓ Progressive loading validated');
  });
});