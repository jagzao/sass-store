import { test, expect } from "@playwright/test";

test.describe("Mobile Carousel Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Simular un dispositivo móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/t/wondernails");
  });

  test("should allow swipe navigation between carousel items", async ({
    page,
  }) => {
    // Esperar a que el carrusel se cargue
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Obtener el título del primer slide visible
    const firstSlideTitle = await page.locator(".title").first().textContent();

    // Realizar un swipe a la izquierda para ir al siguiente slide
    const carousel = page.locator('[data-testid="carousel-container"]');
    await carousel.dragTo(carousel, {
      sourcePosition: { x: 300, y: 300 },
      targetPosition: { x: 50, y: 300 },
    });

    // Esperar a que se complete la animación
    await page.waitForTimeout(1000);

    // Verificar que el título ha cambiado
    const secondSlideTitle = await page.locator(".title").first().textContent();
    expect(secondSlideTitle).not.toBe(firstSlideTitle);

    // Realizar un swipe a la derecha para volver al slide anterior
    await carousel.dragTo(carousel, {
      sourcePosition: { x: 50, y: 300 },
      targetPosition: { x: 300, y: 300 },
    });

    // Esperar a que se complete la animación
    await page.waitForTimeout(1000);

    // Verificar que el título ha vuelto al original
    const thirdSlideTitle = await page.locator(".title").first().textContent();
    expect(thirdSlideTitle).toBe(firstSlideTitle);
  });

  test("should allow adding to cart by clicking on product image", async ({
    page,
  }) => {
    // Esperar a que el carrusel se cargue
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Hacer clic en la imagen del carrusel
    await page.locator(".imgWrap").first().click();

    // Verificar que se muestra una notificación o que el carrito se actualiza
    // Esto depende de cómo se implemente la notificación en tu aplicación
    await expect(page.locator('[data-testid="cart-notification"]'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Si no hay notificación, verificar que el carrito se actualizó
        return expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
      });
  });

  test("should allow booking by clicking on service image", async ({
    page,
  }) => {
    // Esperar a que el carrusel se cargue
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Navegar a un slide de servicio (no producto)
    // Esto podría requerir navegar a un slide específico
    const carousel = page.locator('[data-testid="carousel-container"]');
    await carousel.dragTo(carousel, {
      sourcePosition: { x: 300, y: 300 },
      targetPosition: { x: 50, y: 300 },
    });

    await page.waitForTimeout(1000);

    // Hacer clic en la imagen del carrusel
    await page.locator(".imgWrap").first().click();

    // Verificar que se navega a la página de reserva
    await expect(page).toHaveURL(/\/booking/);
  });

  test("should maintain VER MÁS button functionality alongside image click", async ({
    page,
  }) => {
    // Esperar a que el carrusel se cargue
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Hacer clic en el botón VER MÁS
    await page.locator(".seeMore").first().click();

    // Verificar que se abre la vista de detalles
    await expect(page.locator(".detail")).toBeVisible();

    // Cerrar la vista de detalles
    await page.locator('[data-testid="close-detail"]').click();

    // Verificar que la vista de detalles se cerró
    await expect(page.locator(".detail")).not.toBeVisible();

    // Ahora hacer clic en la imagen para agregar al carrito
    await page.locator(".imgWrap").first().click();

    // Verificar que se muestra una notificación o que el carrito se actualiza
    await expect(page.locator('[data-testid="cart-notification"]'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Si no hay notificación, verificar que el carrito se actualizó
        return expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
      });
  });

  test("should support keyboard navigation for carousel", async ({ page }) => {
    // Esperar a que el carrusel se cargue
    await page.waitForSelector('[data-testid="carousel-container"]');

    // Enfocar el carrusel
    await page.locator('[data-testid="carousel-container"]').focus();

    // Obtener el título del primer slide visible
    const firstSlideTitle = await page.locator(".title").first().textContent();

    // Presionar la flecha derecha para ir al siguiente slide
    await page.keyboard.press("ArrowRight");

    // Esperar a que se complete la animación
    await page.waitForTimeout(1000);

    // Verificar que el título ha cambiado
    const secondSlideTitle = await page.locator(".title").first().textContent();
    expect(secondSlideTitle).not.toBe(firstSlideTitle);

    // Presionar la flecha izquierda para volver al slide anterior
    await page.keyboard.press("ArrowLeft");

    // Esperar a que se complete la animación
    await page.waitForTimeout(1000);

    // Verificar que el título ha vuelto al original
    const thirdSlideTitle = await page.locator(".title").first().textContent();
    expect(thirdSlideTitle).toBe(firstSlideTitle);
  });
});
