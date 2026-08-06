import { test, expect } from "@playwright/test";

test.describe("STRY-032 — Cotizador de uñas wondernails", () => {
  test.use({ baseURL: process.env.BASE_URL || "http://127.0.0.1:3002" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/t/wondernails/login", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.getByTestId("email-input").first()).toBeVisible({
      timeout: 60000,
    });
    await page.getByTestId("email-input").first().fill("jagzao@gmail.com");
    await page.getByTestId("password-input").first().fill("admin");
    await page.getByTestId("login-btn").first().click({ force: true });
    await page.waitForURL(
      (url) =>
        url.href.includes("/t/wondernails") && !url.href.includes("/login"),
      { timeout: 60000 },
    );
    await page.waitForLoadState("networkidle").catch(() => {});
  });

  test("SC-01 — boton Cotizar Uñas visible", async ({ page }) => {
    await page.goto("/t/wondernails/clientes");
    await page.getByRole("button", { name: "Ver Expediente" }).first().click();
    await expect(page.locator('[data-testid="btn-new-visit"]')).toHaveText(
      /Cotizar Uñas/,
    );
  });

  test("SC-04/05 — seleccionar opciones actualiza resumen", async ({
    page,
  }) => {
    await page.goto("/t/wondernails/clientes");
    await page.getByRole("button", { name: "Ver Expediente" }).first().click();
    await expect(page.locator('[data-testid="btn-new-visit"]')).toHaveText(
      /Cotizar Uñas/,
    );
    await page.click('[data-testid="btn-new-visit"]');
    await page.getByText("Acrilico", { exact: true }).click();
    await page.getByText("M", { exact: true }).click();
    await page.getByText("Almendra", { exact: true }).click();
    await expect(page.getByTestId("quote-total")).toHaveText("$520");
    await page.getByText("French", { exact: true }).click();
    await expect(page.getByTestId("quote-total")).toHaveText("$570");
    await page.getByText("Cristales", { exact: true }).click();
    await expect(page.getByTestId("quote-total")).toHaveText("$620");
  });

  test("SC-08 — enviar cotizacion por WhatsApp", async ({ page, context }) => {
    await page.goto("/t/wondernails/clientes");
    await page.getByRole("button", { name: "Ver Expediente" }).first().click();
    await expect(page.locator('[data-testid="btn-new-visit"]')).toHaveText(
      /Cotizar Uñas/,
    );
    await page.click('[data-testid="btn-new-visit"]');
    await page.getByText("Acrilico", { exact: true }).click();
    await page.getByText("M", { exact: true }).click();
    await page.getByText("Almendra", { exact: true }).click();
    const [newPage] = await Promise.all([
      context.waitForEvent("page"),
      page.click('button:has-text("WhatsApp")'),
    ]);
    await newPage.waitForURL(/wa\.me|whatsapp\.com/, {
      timeout: 15000,
      waitUntil: "domcontentloaded",
    });
    expect(newPage.url()).toMatch(/wa\.me|whatsapp\.com/);
  });
});
