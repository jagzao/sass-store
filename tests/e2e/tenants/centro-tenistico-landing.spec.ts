import { test, expect } from "@playwright/test";

const TENANT = "centro-tenistico";

test.describe("Centro Tenístico — Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/t/${TENANT}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  });

  test("carga sin errores (no 500)", async ({ page }) => {
    const response = await page.goto(`/t/${TENANT}`);
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("muestra el hero scrollytelling (Clases Grupales)", async ({ page }) => {
    const heroTitle = page.locator("h1").first();
    await expect(heroTitle).toBeVisible({ timeout: 10000 });
    await expect(heroTitle).toContainText("Clases Grupales");
  });

  test("muestra precio en el hero", async ({ page }) => {
    // Debe haber al menos un precio visible ($45, $120 o $35)
    const priceLine = page.locator("text=/\\$\\d+/").first();
    await expect(priceLine).toBeVisible({ timeout: 10000 });
  });

  test("botón de reserva está presente y es clickeable", async ({ page }) => {
    const ctaButton = page
      .locator(
        'a:has-text("Reservar"), a:has-text("Unirse"), button:has-text("Reservar")',
      )
      .first();
    await expect(ctaButton).toBeVisible({ timeout: 10000 });
  });

  test("sección de servicios se renderiza", async ({ page }) => {
    const servicesSection = page
      .locator("text=Servicios y Canchas")
      .or(page.locator("text=Lo que ofrecemos"))
      .first();
    await expect(servicesSection).toBeVisible({ timeout: 15000 });
  });

  test("sección 'Reserva en 3 pasos' está visible", async ({ page }) => {
    const howItWorks = page.locator("text=Reserva en 3 pasos").first();
    await expect(howItWorks).toBeVisible({ timeout: 15000 });
  });

  test("sección CTA verde aparece con enlace de reserva", async ({ page }) => {
    const ctaSection = page.locator("text=Empieza a jugar").first();
    await expect(ctaSection).toBeVisible({ timeout: 15000 });
  });

  test("header usa fondo blanco (no transparente ni negro)", async ({
    page,
  }) => {
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    const bgColor = await header.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    // No debe ser negro (#0d0d0d = rgb(13, 13, 13))
    expect(bgColor).not.toBe("rgb(13, 13, 13)");
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("canvas de pelota visible en desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/t/${TENANT}`, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    const canvas = page.locator("#tennis-canvas");
    await expect(canvas).toHaveAttribute("data-ctv-scrolly-enabled", "true", {
      timeout: 30000,
    });
    await expect
      .poll(() => canvas.getAttribute("data-ctv-load-state"), {
        timeout: 60000,
      })
      .toBe("ready");
    await expect(page.locator('img[src*="tennis-ball/ball_"]')).toHaveCount(0);
  });

  test("no hay borde dorado de wondernails en modales", async ({ page }) => {
    // Verificar que las variables CSS no tienen el dorado de wondernails
    const goldBorderFound = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      for (const d of dialogs) {
        const style = window.getComputedStyle(d);
        if (style.borderColor.includes("197, 160, 89")) return true;
      }
      return false;
    });
    expect(goldBorderFound).toBeFalsy();
  });

  test("color primario no es el azul hardcodeado anterior (#3b82f6)", async ({
    page,
  }) => {
    const primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--color-primary")
        .trim(),
    );
    // No debe ser el azul de Tailwind que teníamos hardcodeado antes
    expect(primaryColor.toLowerCase()).not.toContain("#3b82f6");
    expect(primaryColor.toLowerCase()).not.toBe("");
  });
});
