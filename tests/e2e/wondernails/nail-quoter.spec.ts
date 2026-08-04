import { test, expect } from "@playwright/test";

test.describe("STRY-032 — Cotizador de uñas wondernails", () => {
  test.use({ baseURL: process.env.BASE_URL || "http://127.0.0.1:3002" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "jagzao@gmail.com");
    await page.fill('[data-testid="password-input"]', "admin");
    await page.click('[data-testid="login-submit"]');
    await page.waitForURL(/\/t\/wondernails/);
  });

  test("SC-01 — boton Cotizar Uñas visible", async ({ page }) => {
    await page.goto("/t/wondernails/admin/customers");
    await page.click("text=Ana Garcia Lopez");
    await expect(page.locator('[data-testid="btn-new-visit"]')).toHaveText(
      /Cotizar Uñas/,
    );
  });

  test("SC-04/05 — seleccionar opciones actualiza resumen", async ({
    page,
  }) => {
    await page.goto("/t/wondernails/admin/customers");
    await page.click("text=Ana Garcia Lopez");
    await page.click('[data-testid="btn-new-visit"]');
    await page.click("text=Acrilico");
    await page.click("text=M");
    await page.click("text=Almendra");
    await page.click("text=French");
    await expect(page.locator("text=$520")).toBeVisible();
    await page.click("text=Cristales");
    await expect(page.locator("text=$570")).toBeVisible();
  });

  test("SC-08 — enviar cotizacion por WhatsApp", async ({ page, context }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.click("text=Acrilico"),
      page.click("text=M"),
      page.click("text=Almendra"),
      page.click('button:has-text("WhatsApp")'),
    ]);
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain("wa.me");
  });
});
