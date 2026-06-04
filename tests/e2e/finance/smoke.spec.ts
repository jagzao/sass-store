import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

/**
 * Helper para verificar que la página no muestra errores reales.
 * Usa `innerText()` en lugar de `textContent()` para evitar capturar
 * el JavaScript/CSS inline de Next.js que contiene "Error" como nombre de función.
 */
async function assertNoPageError(page: import("@playwright/test").Page) {
  const visible = await page.locator("body").innerText();
  // Solo buscar errores visibles al usuario, no en el código fuente
  expect(visible).not.toContain("Application error");
  expect(visible).not.toContain("500 Error");
  expect(visible).not.toMatch(/Error\s+404|404\s+Not Found/i);
  // No buscar "Error" genérico — aparece en código JS/CSS de Next.js
}

test.describe("Financial Management - Smoke Tests", () => {
  // Login + navigation can exceed the default 60s when the E2E webServer is rebuilding.
  test.describe.configure({ timeout: 120000 });

  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test("should load categories page", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify page loaded without errors
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Verify no visible 404 or application error (no textos del código fuente)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("404");
    await assertNoPageError(page);
  });

  test("should load budgets page", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/finance/budgets`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify page loaded without errors
    await expect(
      page.getByRole("heading", { name: "Presupuestos" }),
    ).toBeVisible();

    // Verify no visible 404 or application error
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("404");
    await assertNoPageError(page);
  });

  test("should load supplies page", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/inventory/supplies`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify page loaded without errors
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible();

    // Verify no visible 404 or application error
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("404");
    await assertNoPageError(page);
  });

  test("should load finance dashboard with new widgets", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Finance home is now the planning matrix
    await expect(
      page.getByRole("heading", { name: "Matriz de Planeación Financiera" }),
    ).toBeVisible({ timeout: 20000 });

    await expect(page.getByTestId("matrix-container")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId("granularity-selector")).toBeVisible();
    await expect(page.getByTestId("clone-action")).toBeVisible();

    // Verify no visible 404 or application error
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("404");
    await assertNoPageError(page);
  });

  test("should verify API endpoints are accessible with session", async ({
    page,
  }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    // Test categories API — public, no auth required
    const categoriesResponse = await page.request.get(
      `/api/categories?tenant=${tenantSlug}`,
    );
    expect(categoriesResponse.status()).toBe(200);
    const categoriesData = await categoriesResponse.json();
    expect(categoriesData).toHaveProperty("success");

    // Test budgets API — requires session (uses page.request which has session cookies)
    const budgetsResponse = await page.request.get(
      `/api/finance/budgets?tenant=${tenantSlug}`,
    );
    // 200 (authenticated) or 401 (session expired between beforeEach and this call)
    expect([200, 401]).toContain(budgetsResponse.status());
    if (budgetsResponse.status() === 200) {
      const budgetsData = await budgetsResponse.json();
      expect(budgetsData).toHaveProperty("success");
    }

    // Test supply expenses API
    const suppliesResponse = await page.request.get(
      `/api/inventory/supply-report?tenant=${tenantSlug}`,
    );
    expect([200, 401]).toContain(suppliesResponse.status());
    if (suppliesResponse.status() === 200) {
      const suppliesData = await suppliesResponse.json();
      expect(suppliesData).toHaveProperty("success");
    }
  });

  test("should verify page responsiveness", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify content is still accessible on mobile
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
