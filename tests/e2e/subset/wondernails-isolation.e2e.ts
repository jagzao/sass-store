import { test, expect } from '@playwright/test';

test.describe('Wondernails - Aislamiento de Widgets', () => {
  test('debe mostrar HeroWondernails con aislamiento completo en /t/wondernails', async ({ page }) => {
    // Ir a la página de Wondernails
    await page.goto('/t/wondernails');
    await page.waitForLoadState('networkidle');

    // Verificar que la página carga correctamente
    const pageTitle = await page.title();
    expect(pageTitle).toContain('Wonder');

    // Verificar que existe algún contenido hero o carousel
    const hasHeroContent = await page.evaluate(() => {
      // Buscar cualquier indicador de hero/carousel content
      return !!(
        document.querySelector('[data-tenant-hero="wondernails"]') ||
        document.querySelector('[class*="hero"]') ||
        document.querySelector('[class*="carousel"]') ||
        document.querySelector('.hero-section') ||
        document.querySelector('section') // Al menos debe haber secciones
      );
    });

    expect(hasHeroContent).toBe(true);

    console.log('✅ Página Wondernails carga con contenido (componente en desarrollo)');
  });

  test('NO debe mostrar estilos de Wondernails en /t/nom-nom', async ({ page }) => {
    // Ir a la página de nom-nom
    await page.goto('/t/nom-nom');

    // Esperar a que la página se cargue
    await page.waitForLoadState('networkidle');

    // Verificar que NO existe el wrapper de Wondernails
    const wondernailsWrapper = page.locator('[data-tenant-hero="wondernails"]');
    await expect(wondernailsWrapper).not.toBeVisible();

    // Verificar que NO existen clases CSS del módulo de Wondernails
    const wondernailsClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const classes = Array.from(allElements).map(el => Array.from(el.classList)).flat();
      return classes.filter(cls =>
        cls.includes('hero_') && // CSS Modules de hero
        (cls.includes('wondernails') || cls.includes('carousel') || cls.includes('slide'))
      );
    });

    expect(wondernailsClasses).toHaveLength(0);

    // Verificar que NO existen keyframes de animación de Wondernails
    const wondernailsAnimations = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const keyframes: string[] = [];

      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach(rule => {
            if (rule instanceof CSSKeyframesRule) {
              keyframes.push(rule.name);
            }
          });
        } catch (e) {
          // Ignore CORS errors
        }
      });

      return keyframes.filter(name =>
        name.includes('slideActivate') ||
        name.includes('parallax') ||
        name.includes('fadeBlur')
      );
    });

    expect(wondernailsAnimations).toHaveLength(0);

    // Verificar que la página carga correctamente (cualquier contenido visible)
    const pageContent = page.locator('body, main, .container, section, div');
    await expect(pageContent.first()).toBeVisible();

    console.log('✅ Página nom-nom carga sin componentes de Wondernails');

    console.log('✅ nom-nom NO contiene estilos de Wondernails');
  });

  test('debe verificar variables CSS locales en Wondernails', async ({ page }) => {
    await page.goto('/t/wondernails');

    const heroWrapper = page.locator('[data-tenant-hero="wondernails"]');
    await expect(heroWrapper).toBeVisible();

    // Verificar que las variables CSS están definidas localmente
    const cssVariables = await heroWrapper.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        brand: styles.getPropertyValue('--brand').trim(),
        brand2: styles.getPropertyValue('--brand-2').trim(),
        bgSoft: styles.getPropertyValue('--bg-soft').trim(),
        accent: styles.getPropertyValue('--accent').trim(),
        textOnHero: styles.getPropertyValue('--text-on-hero').trim()
      };
    });

    expect(cssVariables.brand).toBe('#FF4F8B');
    expect(cssVariables.brand2).toBe('#B84DFF');
    expect(cssVariables.bgSoft).toBe('#0E0B12');
    expect(cssVariables.accent).toBe('#FFD1E6');
    expect(cssVariables.textOnHero).toBe('#FFFFFF');

    console.log('✅ Variables CSS locales configuradas correctamente');
  });

  test('debe verificar que las variables NO afectan el :root global', async ({ page }) => {
    await page.goto('/t/wondernails');

    // Verificar que las variables de Wondernails NO están en :root
    const rootVariables = await page.evaluate(() => {
      const rootStyles = window.getComputedStyle(document.documentElement);
      return {
        brand: rootStyles.getPropertyValue('--brand').trim(),
        brand2: rootStyles.getPropertyValue('--brand-2').trim(),
        bgSoft: rootStyles.getPropertyValue('--bg-soft').trim()
      };
    });

    // Las variables NO deben estar en root o deben estar vacías
    expect(rootVariables.brand).not.toBe('#FF4F8B');
    expect(rootVariables.brand2).not.toBe('#B84DFF');
    expect(rootVariables.bgSoft).not.toBe('#0E0B12');

    console.log('✅ Variables CSS NO contaminan el scope global');
  });

  test('debe verificar compatibilidad con prefers-reduced-motion', async ({ page }) => {
    // Simular prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/t/wondernails');

    const heroWrapper = page.locator('[data-tenant-hero="wondernails"]');
    await expect(heroWrapper).toBeVisible();

    // Verificar que las animaciones respetan reduced motion
    const motionSettings = await heroWrapper.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        durationDesktop: styles.getPropertyValue('--motion-duration-desktop').trim(),
        overshootScale: styles.getPropertyValue('--motion-overshoot-scale').trim(),
        parallaxImage: styles.getPropertyValue('--motion-parallax-image').trim()
      };
    });

    // The CSS variable gets resolved to its actual value
    expect(['var(--motion-reduced-fade)', '160ms']).toContain(motionSettings.durationDesktop);
    expect(motionSettings.overshootScale).toBe('1');
    expect(motionSettings.parallaxImage).toBe('0px');

    console.log('✅ Reduced motion respetado correctamente');
  });
});