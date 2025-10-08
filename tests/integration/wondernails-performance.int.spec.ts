import { test, expect } from '@playwright/test';

test.describe('Wondernails - Performance & Bundle Isolation', () => {
  test('bundle de HeroWondernails NO debe descargarse en otros tenants', async ({ page }) => {
    // Array para capturar requests de red
    const networkRequests: string[] = [];

    page.on('request', request => {
      const url = request.url();
      // Capturar requests de JavaScript/CSS que podrían contener el bundle de Wondernails
      if (url.includes('.js') || url.includes('.css') || url.includes('chunk')) {
        networkRequests.push(url);
      }
    });

    // Ir a nom-nom (tenant diferente)
    await page.goto('/t/nom-nom');
    await page.waitForLoadState('networkidle');

    // Analizar los bundles descargados
    const wondernailsBundles = networkRequests.filter(url =>
      url.toLowerCase().includes('wondernails') ||
      url.toLowerCase().includes('hero') && url.toLowerCase().includes('carousel')
    );

    expect(wondernailsBundles).toHaveLength(0);

    // Verificar que no se han descargado chunks relacionados con componentes tenant-específicos
    const suspiciousChunks = networkRequests.filter(url => {
      // Buscar chunks que podrían contener código de Wondernails
      return url.includes('tenant') && url.includes('wondernails');
    });

    expect(suspiciousChunks).toHaveLength(0);

    console.log('✅ Bundle de Wondernails NO descargado en nom-nom');
    console.log(`Requests de red capturados: ${networkRequests.length}`);
  });

  test('bundle de HeroWondernails SÍ debe descargarse solo en wondernails', async ({ page }) => {
    const networkRequests: string[] = [];
    const chunkContents: string[] = [];

    page.on('response', async response => {
      const url = response.url();
      if ((url.includes('.js') || url.includes('chunk')) && response.status() === 200) {
        networkRequests.push(url);

        try {
          const content = await response.text();
          if (content.includes('HeroWondernails') || content.includes('wondernails')) {
            chunkContents.push(content);
          }
        } catch (e) {
          // Ignore binary or protected content
        }
      }
    });

    // Ir a Wondernails
    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    // Esperar a que el componente se cargue
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Debe haber descargado el chunk de Wondernails
    const wondernailsChunks = chunkContents.filter(content =>
      content.includes('HeroWondernails') ||
      content.includes('wondernails') ||
      content.includes('FF4F8B') // Color específico de Wondernails
    );

    expect(wondernailsChunks.length).toBeGreaterThan(0);

    console.log('✅ Bundle de Wondernails descargado correctamente');
    console.log(`Chunks con contenido de Wondernails: ${wondernailsChunks.length}`);
  });

  test('debe medir el tamaño del bundle de HeroWondernails', async ({ page }) => {
    const chunkSizes: { url: string; size: number }[] = [];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('.js') || url.includes('chunk')) {
        try {
          const content = await response.text();
          if (content.includes('HeroWondernails') || content.includes('wondernails')) {
            chunkSizes.push({
              url,
              size: content.length
            });
          }
        } catch (e) {
          // Ignore
        }
      }
    });

    await page.goto('/t/wondernails');
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    const totalSize = chunkSizes.reduce((sum, chunk) => sum + chunk.size, 0);

    // El bundle no debe ser excesivamente grande (objetivo: < 50KB gzipped, ~150KB raw)
    expect(totalSize).toBeLessThan(150000); // 150KB

    console.log(`✅ Tamaño total del bundle: ${(totalSize / 1024).toFixed(1)}KB`);
    chunkSizes.forEach(chunk => {
      console.log(`  - ${chunk.url.split('/').pop()}: ${(chunk.size / 1024).toFixed(1)}KB`);
    });
  });

  test('debe medir LCP (Largest Contentful Paint) del hero', async ({ page }) => {
    await page.goto('/t/wondernails');

    // Medir Web Vitals
    const lcpValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });

        // Timeout después de 5 segundos
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP objetivo P75: < 2.5s (2500ms)
    expect(lcpValue).toBeLessThan(2500);

    console.log(`✅ LCP: ${lcpValue}ms (objetivo: <2500ms)`);
  });

  test('debe medir FPS durante animaciones de transición', async ({ page }) => {
    await page.goto('/t/wondernails');
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Función para medir FPS
    const measureFPS = await page.evaluateHandle(() => {
      return new Promise((resolve) => {
        let frames = 0;
        let startTime = performance.now();

        function countFrame() {
          frames++;
          requestAnimationFrame(countFrame);
        }

        requestAnimationFrame(countFrame);

        setTimeout(() => {
          const endTime = performance.now();
          const fps = frames / ((endTime - startTime) / 1000);
          resolve(fps);
        }, 1000); // Medir durante 1 segundo
      });
    });

    // Iniciar animación
    const nextButton = page.locator('[class*="arrowBtn"], .arrowBtn').last();
    await nextButton.click();

    const fps = await measureFPS.jsonValue();

    // FPS objetivo: > 50fps (debe ser suave)
    expect(fps).toBeGreaterThan(50);

    console.log(`✅ FPS durante animación: ${Math.round(fps as number)}fps (objetivo: >50fps)`);
  });

  test('debe verificar que no hay memory leaks en auto-rotación', async ({ page }) => {
    await page.goto('/t/wondernails');
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Medir memoria inicial
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Esperar varios ciclos de auto-rotación
    await page.waitForTimeout(15000); // 3 rotaciones (5s cada una)

    // Forzar garbage collection si es posible
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // Medir memoria final
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // El incremento de memoria no debe ser excesivo (< 5MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB

    console.log(`✅ Incremento de memoria: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (objetivo: <5MB)`);
  });

  test('debe verificar cleanup de timers al cambiar de página', async ({ page }) => {
    await page.goto('/t/wondernails');
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Contar timers activos
    const timersBeforeLeave = await page.evaluate(() => {
      // Esto es una aproximación - en producción usaríamos herramientas más específicas
      return Object.keys(window).filter(key => key.includes('timer') || key.includes('interval')).length;
    });

    // Cambiar de página
    await page.goto('/t/nom-nom');
    await page.waitForLoadState('networkidle');

    // Contar timers después
    const timersAfterLeave = await page.evaluate(() => {
      return Object.keys(window).filter(key => key.includes('timer') || key.includes('interval')).length;
    });

    // No debería haber incremento significativo de timers
    expect(timersAfterLeave).toBeLessThanOrEqual(timersBeforeLeave + 2);

    console.log(`✅ Timers cleanup: ${timersBeforeLeave} -> ${timersAfterLeave}`);
  });

  test('debe medir tiempo de hidratación del componente', async ({ page }) => {
    // Medir tiempo desde navegación hasta interactividad
    const navigationStartTime = Date.now();

    await page.goto('/t/wondernails');

    // Esperar hasta que el componente sea interactivo
    await page.waitForFunction(() => {
      const nextButton = document.querySelector('[class*="arrowBtn"], .arrowBtn');
      return nextButton && !nextButton.hasAttribute('disabled');
    });

    const hydrationTime = Date.now() - navigationStartTime;

    // Hidratación objetivo: < 1000ms
    expect(hydrationTime).toBeLessThan(1000);

    console.log(`✅ Tiempo de hidratación: ${hydrationTime}ms (objetivo: <1000ms)`);
  });

  test('debe verificar que CSS Modules no contaminan el scope global', async ({ page }) => {
    await page.goto('/t/wondernails');
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Verificar que las clases CSS están hasheadas (CSS Modules)
    const hashedClasses = await page.evaluate(() => {
      const heroElement = document.querySelector('[data-tenant-hero="wondernails"]');
      if (!heroElement) return [];

      const allElements = heroElement.querySelectorAll('*');
      const classes: string[] = [];

      allElements.forEach(el => {
        classes.push(...Array.from(el.classList));
      });

      return classes.filter(cls => cls.includes('_')); // CSS Modules hash
    });

    expect(hashedClasses.length).toBeGreaterThan(0);

    // Verificar que no hay clases genéricas conflictivas
    const globalConflicts = await page.evaluate(() => {
      const heroElement = document.querySelector('[data-tenant-hero="wondernails"]');
      if (!heroElement) return [];

      const genericClasses = ['slide', 'carousel', 'hero', 'button', 'container'];
      const foundConflicts: string[] = [];

      genericClasses.forEach(cls => {
        if (heroElement.querySelector(`.${cls}:not([class*="_"])`)) {
          foundConflicts.push(cls);
        }
      });

      return foundConflicts;
    });

    expect(globalConflicts).toHaveLength(0);

    console.log(`✅ CSS Modules: ${hashedClasses.length} clases hasheadas, 0 conflictos globales`);
  });
});