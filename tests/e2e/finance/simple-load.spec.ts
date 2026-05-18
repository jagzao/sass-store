import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

const { tenantSlug } = TEST_CREDENTIALS;

// Helper: true if the page is a login page (any language/text variant)
function isLoginPage(bodyText: string | null): boolean {
  if (!bodyText) return false;
  return (
    bodyText.includes("Inicia") ||
    bodyText.includes("Iniciar") ||
    bodyText.includes("Correo") ||
    bodyText.includes("email") ||
    bodyText.includes("login") ||
    bodyText.includes("Login") ||
    bodyText.includes("password") ||
    bodyText.includes("contraseña")
  );
}

test.describe("Finance Pages - Simple Load Test", () => {
  test("should verify categories page exists", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    // Use heading-based check instead of raw body text:
    // RSC payload may include not-found.tsx as prefetched fallback even when
    // the actual page renders successfully. Check for visible NotFound heading
    // instead of substring "Not Found" anywhere in DOM (which catches the RSC blob).
    const notFoundHeading = page.getByRole("heading", {
      name: "Tenant Not Found",
    });
    expect(await notFoundHeading.isVisible().catch(() => false)).toBe(false);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasContent =
      bodyText?.includes("Categorías") || isLoginPage(bodyText);
    expect(hasContent).toBe(true);
  });

  test("should verify budgets page exists", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/budgets`, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasContent =
      bodyText?.includes("Presupuestos") || isLoginPage(bodyText);
    expect(hasContent).toBe(true);
  });

  test("should verify supplies page exists", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/inventory/supplies`, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasContent =
      bodyText?.includes("Insumos") ||
      bodyText?.includes("Gastos") ||
      bodyText?.includes("Reporte") ||
      isLoginPage(bodyText);
    expect(hasContent).toBe(true);
  });

  test("should verify finance dashboard exists", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasContent =
      bodyText?.includes("Financiero") ||
      bodyText?.includes("Panel") ||
      bodyText?.includes("finance") ||
      bodyText?.includes("Finanzas") ||
      isLoginPage(bodyText);
    expect(hasContent).toBe(true);
  });
});
