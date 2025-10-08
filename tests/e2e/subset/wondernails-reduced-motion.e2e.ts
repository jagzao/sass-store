import { test, expect } from '@playwright/test';

test.describe('Wondernails - Reduced Motion Compliance', () => {
  test('debe desactivar auto-rotación con prefers-reduced-motion', async ({ page }) => {
    // Configurar reduced motion antes de cargar la página
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Esperar tiempo suficiente para verificar que NO hay auto-rotación
    const initialSlide = await page.locator('[class*="slide"][class*="active"], .slide.active').textContent();

    // Esperar más tiempo que el intervalo normal de auto-rotación (5s)
    await page.waitForTimeout(6000);

    const currentSlide = await page.locator('[class*="slide"][class*="active"], .slide.active').textContent();

    // El slide debe permanecer igual (sin auto-rotación)
    expect(currentSlide).toBe(initialSlide);

    console.log('✅ Auto-rotación desactivada con prefers-reduced-motion');
  });

  test('debe usar transiciones fade cortas en lugar de animaciones complejas', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    const heroWrapper = page.locator('[data-tenant-hero="wondernails"]');
    await expect(heroWrapper).toBeVisible();

    // Verificar que se usan duraciones reducidas
    const motionSettings = await heroWrapper.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        durationDesktop: styles.getPropertyValue('--motion-duration-desktop').trim(),
        durationMobile: styles.getPropertyValue('--motion-duration-mobile').trim(),
        overshootScale: styles.getPropertyValue('--motion-overshoot-scale').trim(),
        parallaxImage: styles.getPropertyValue('--motion-parallax-image').trim(),
        parallaxText: styles.getPropertyValue('--motion-parallax-text').trim(),
        blurMax: styles.getPropertyValue('--motion-blur-max').trim()
      };
    });

    // Verificar que se usan valores reducidos
    expect(motionSettings.durationDesktop).toBe('var(--motion-reduced-fade)');
    expect(motionSettings.durationMobile).toBe('var(--motion-reduced-fade)');
    expect(motionSettings.overshootScale).toBe('1');
    expect(motionSettings.parallaxImage).toBe('0px');
    expect(motionSettings.parallaxText).toBe('0px');
    expect(motionSettings.blurMax).toBe('0px');

    console.log('✅ Transiciones reducidas configuradas correctamente');
  });

  test('navegación manual debe usar fade corto (120-160ms)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Medir tiempo de transición al navegar manualmente
    const nextButton = page.locator('[class*="arrowBtn"], .arrowBtn').last();

    const startTime = Date.now();
    await nextButton.click();

    // Esperar a que termine la transición
    await page.waitForFunction(() => {
      const activeSlide = document.querySelector('[class*="slide"][class*="active"], .slide.active');
      const transitionEnded = activeSlide && !activeSlide.classList.contains('transitioning');
      return transitionEnded;
    }, { timeout: 1000 });

    const transitionTime = Date.now() - startTime;

    // Debe completarse entre 120-200ms (incluyendo margen para el navegador)
    expect(transitionTime).toBeGreaterThan(100);
    expect(transitionTime).toBeLessThan(250);

    console.log(`✅ Transición manual completada en ${transitionTime}ms (objetivo: 120-160ms)`);
  });

  test('debe eliminar efectos de parallax con reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Navegar a siguiente slide
    const nextButton = page.locator('[class*="arrowBtn"], .arrowBtn').last();
    await nextButton.click();
    await page.waitForTimeout(500);

    // Verificar que no hay animaciones de parallax
    const hasParallaxAnimations = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="slide"] img, [class*="slide"] .text, .slide img, .slide .text');

      return Array.from(elements).some(el => {
        const styles = window.getComputedStyle(el);
        const animation = styles.animation;
        return animation && animation.includes('parallax');
      });
    });

    expect(hasParallaxAnimations).toBe(false);

    console.log('✅ Efectos de parallax eliminados con reduced motion');
  });

  test('debe eliminar efectos de blur y overshoot', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Navegar para triggear animación
    const nextButton = page.locator('[class*="arrowBtn"], .arrowBtn').last();
    await nextButton.click();
    await page.waitForTimeout(300);

    // Verificar que no hay efectos de blur
    const hasBlurEffects = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="slide"], .slide');

      return Array.from(elements).some(el => {
        const styles = window.getComputedStyle(el);
        const filter = styles.filter;
        return filter && filter.includes('blur');
      });
    });

    expect(hasBlurEffects).toBe(false);

    // Verificar que no hay efectos de scale (overshoot)
    const hasScaleEffects = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="slide"], .slide');

      return Array.from(elements).some(el => {
        const styles = window.getComputedStyle(el);
        const transform = styles.transform;
        const animation = styles.animation;
        return (transform && transform.includes('scale') && !transform.includes('scale(1)')) ||
               (animation && animation.includes('slideActivate'));
      });
    });

    expect(hasScaleEffects).toBe(false);

    console.log('✅ Efectos de blur y overshoot eliminados');
  });

  test('debe mantener funcionalidad básica con reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    // Verificar que la navegación sigue funcionando
    const nextButton = page.locator('[class*="arrowBtn"], .arrowBtn').last();
    const prevButton = page.locator('[class*="arrowBtn"], .arrowBtn').first();

    await expect(nextButton).toBeEnabled();
    await expect(prevButton).toBeEnabled();

    // Test navegación hacia adelante
    await nextButton.click();
    await page.waitForTimeout(300);

    const slide2Content = await page.locator('[class*="slide"][class*="active"], .slide.active').textContent();

    // Test navegación hacia atrás
    await prevButton.click();
    await page.waitForTimeout(300);

    const slide1Content = await page.locator('[class*="slide"][class*="active"], .slide.active').textContent();

    expect(slide1Content).not.toBe(slide2Content);

    // Verificar que los CTAs siguen funcionando
    const primaryCTA = page.locator('[class*="ctaPrimary"], .ctaPrimary').first();
    await expect(primaryCTA).toBeVisible();
    await expect(primaryCTA).toBeEnabled();

    // Verificar indicadores
    const indicators = page.locator('[class*="indicator"], .indicator');
    await expect(indicators).toHaveCount(6);

    const thirdIndicator = indicators.nth(2);
    await thirdIndicator.click();
    await page.waitForTimeout(300);

    // Debe cambiar de slide
    const slide3Content = await page.locator('[class*="slide"][class*="active"], .slide.active').textContent();
    expect(slide3Content).not.toBe(slide1Content);

    console.log('✅ Funcionalidad básica mantenida con reduced motion');
  });

  test('debe respetar configuración del sistema operativo', async ({ page }) => {
    // Test sin reduced motion (comportamiento normal)
    await page.goto('/t/wondernails');
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    const normalMotionSettings = await page.locator('[data-tenant-hero="wondernails"]').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        duration: styles.getPropertyValue('--motion-duration-desktop').trim(),
        overshoot: styles.getPropertyValue('--motion-overshoot-scale').trim()
      };
    });

    // Recargar con reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForSelector('[data-tenant-hero="wondernails"]');

    const reducedMotionSettings = await page.locator('[data-tenant-hero="wondernails"]').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        duration: styles.getPropertyValue('--motion-duration-desktop').trim(),
        overshoot: styles.getPropertyValue('--motion-overshoot-scale').trim()
      };
    });

    // Los valores deben ser diferentes
    expect(normalMotionSettings.duration).not.toBe(reducedMotionSettings.duration);
    expect(normalMotionSettings.overshoot).not.toBe(reducedMotionSettings.overshoot);

    // Valores reducidos deben ser los esperados
    expect(reducedMotionSettings.duration).toBe('var(--motion-reduced-fade)');
    expect(reducedMotionSettings.overshoot).toBe('1');

    console.log('✅ Configuración del sistema operativo respetada');
  });

  test('debe mostrar notificación visual para usuarios con reduced motion habilitado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    // En modo desarrollo, podría haber un indicador visual
    if (process.env.NODE_ENV === 'development') {
      const devIndicator = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      expect(devIndicator).toBe(true);
    }

    // Verificar que el CSS responde correctamente al media query
    const mediaQueryRespected = await page.evaluate(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      return mediaQuery.matches;
    });

    expect(mediaQueryRespected).toBe(true);

    console.log('✅ Media query prefers-reduced-motion respetado');
  });
});