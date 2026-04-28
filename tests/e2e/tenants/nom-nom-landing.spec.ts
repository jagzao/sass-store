import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const TENANT = "nom-nom";

test.describe("Nom Nom — Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/t/${TENANT}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    // Wait briefly for client-side hydration
    await page.waitForTimeout(2000);
  });

  test("carga sin errores (no 500, no 404)", async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/t/${TENANT}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test("muestra el hero con título de taco", async ({ page }) => {
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 15000 });
    const text = await h1.innerText();
    expect(text.length).toBeGreaterThan(0);
  });

  test("sección de menú se renderiza", async ({ page }) => {
    const menu = page
      .locator("text=Nuestro Menú")
      .or(page.locator("text=Lo mejor de la calle"))
      .first();
    await expect(menu).toBeVisible({ timeout: 15000 });
  });

  test("sección ¿Por qué nom-nom? está visible", async ({ page }) => {
    const section = page.locator("text=¿Por qué nom-nom?");
    await expect(section).toBeVisible({ timeout: 15000 });
  });

  test("sección de catering CTA aparece", async ({ page }) => {
    const cta = page.locator("text=Taco truck a domicilio");
    await expect(cta).toBeVisible({ timeout: 15000 });
  });

  test("botón Cotizar catering está presente", async ({ page }) => {
    const btn = page.locator('a:has-text("Cotizar catering")').first();
    await expect(btn).toBeVisible({ timeout: 15000 });
  });

  test("sección de información de contacto está visible", async ({ page }) => {
    const phone = page.locator("text=Teléfono").first();
    await expect(phone).toBeVisible({ timeout: 15000 });
  });

  test("no renderiza borde dorado de wondernails", async ({ page }) => {
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
});
