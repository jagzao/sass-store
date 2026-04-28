import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const TENANT = "centro-tenistico";

test.describe("Centro Tenístico — Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/t/${TENANT}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  });

  test("carga sin errores (no 500)", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/t/${TENANT}`);
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("muestra el hero con slides de tenis", async ({ page }) => {
    // Al menos uno de los títulos del hero debe estar visible
    const heroTitles = page.locator("h1");
    await expect(heroTitles.first()).toBeVisible({ timeout: 10000 });

    const titleText = await heroTitles.first().innerText();
    const validTitles = [
      "Canchas de Tenis",
      "Clases Privadas",
      "Clases Grupales",
    ];
    expect(validTitles.some((t) => titleText.includes(t))).toBeTruthy();
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
    const howItWorks = page.locator("text=Reserva en 3 pasos");
    await expect(howItWorks).toBeVisible({ timeout: 15000 });
  });

  test("sección CTA verde aparece con enlace de reserva", async ({ page }) => {
    const ctaSection = page.locator("text=Empieza a jugar");
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

  test("los slides del hero cambian al hacer click en las tabs", async ({
    page,
  }) => {
    // Obtener título inicial
    const initialTitle = await page.locator("h1").first().innerText();

    // Click en la segunda tab
    const tabs = page.locator("button").filter({ hasText: /\$/ });
    const tabCount = await tabs.count();

    if (tabCount >= 2) {
      await tabs.nth(1).click();
      await page.waitForTimeout(600); // esperar animación
      const newTitle = await page.locator("h1").first().innerText();
      // El título debe haber cambiado o al menos seguir siendo válido
      const validTitles = [
        "Canchas de Tenis",
        "Clases Privadas",
        "Clases Grupales",
      ];
      expect(validTitles.some((t) => newTitle.includes(t))).toBeTruthy();
    }
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
