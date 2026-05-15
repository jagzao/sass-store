import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Financial Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Matriz de Planeación Financiera")).toBeVisible(
      { timeout: 10000 },
    );
  });

  test("should display financial matrix board", async ({ page }) => {
    await expect(
      page.getByText("Matriz de Planeación Financiera"),
    ).toBeVisible();
    await expect(page.getByText("Granularidad")).toBeVisible();
    await expect(page.getByText("Fecha inicio")).toBeVisible();
    await expect(page.getByText("Fecha fin")).toBeVisible();
    await expect(page.getByText("Entidad/Subcuenta")).toBeVisible();
    await expect(page.getByText("Clonar")).toBeVisible();
  });

  test("should display matrix table headers when data loads", async ({
    page,
  }) => {
    // Wait for potential data load or empty state
    await page.waitForTimeout(3000);
    const hasCategoriesHeader = await page
      .getByText("Categorías")
      .first()
      .isVisible()
      .catch(() => false);
    const hasIngresos = await page
      .getByText("Ingresos")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEgresos = await page
      .getByText("Egresos")
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/Sin datos|No hay datos financieros/)
      .isVisible()
      .catch(() => false);

    expect(
      hasCategoriesHeader || hasEmptyState || hasIngresos || hasEgresos,
    ).toBe(true);
  });

  test("should display granularity options", async ({ page }) => {
    const select = page.locator("select[data-testid='granularity-selector']");
    await expect(select).toBeVisible();
    const options = await select.locator("option").allTextContents();
    expect(options).toContain("Semana");
    expect(options).toContain("Quincena");
    expect(options).toContain("Mes");
    expect(options).toContain("Año");
  });

  test("should navigate to categories page via URL", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();
  });

  test("should navigate to budgets page via URL", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/finance/budgets`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Gestiona tus presupuestos")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByText("Matriz de Planeación Financiera"),
    ).toBeVisible();
    await expect(page.getByText("Granularidad")).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
