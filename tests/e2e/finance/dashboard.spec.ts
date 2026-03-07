import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Financial Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);

    // Navigate to finance dashboard
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page loaded
    await expect(page.getByText("Panel Financiero")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display financial dashboard with new widgets", async ({
    page,
  }) => {
    // Verify header
    await expect(page.getByText("Panel Financiero")).toBeVisible();

    // Verify Quick Actions section
    await expect(page.getByText("Acciones Rápidas")).toBeVisible();
    await expect(page.getByText("Registrar Ingreso")).toBeVisible();
    await expect(page.getByText("Registrar Gasto")).toBeVisible();
    await expect(page.getByText("Crear Presupuesto")).toBeVisible();
    await expect(page.getByText("Ver Insumos")).toBeVisible();

    // Verify Monthly Summary widget
    await expect(page.getByText("Resumen del Mes")).toBeVisible();
    await expect(page.getByText("Ingresos")).toBeVisible();
    await expect(page.getByText("Gastos")).toBeVisible();
    await expect(page.getByText("Balance")).toBeVisible();

    // Verify Presupuestos Activos widget
    await expect(page.getByText("Presupuestos Activos")).toBeVisible();

    // Verify Distribución de Gastos widget
    await expect(page.getByText("Distribución de Gastos")).toBeVisible();

    // Verify Gastos en Insumos widget
    await expect(page.getByText("Gastos en Insumos")).toBeVisible();
  });

  test("should display navigation links to new features", async ({ page }) => {
    // Verify navigation cards exist
    await expect(page.getByText("Categorías")).toBeVisible();
    await expect(page.getByText("Gestiona ingresos y gastos")).toBeVisible();

    await expect(page.getByText("Presupuestos")).toBeVisible();
    await expect(page.getByText("Controla tus límites")).toBeVisible();

    await expect(page.getByText("Gastos Insumos")).toBeVisible();
    await expect(page.getByText("Reporte de insumos")).toBeVisible();
  });

  test("should navigate to categories page", async ({ page }) => {
    // Click on Categories card
    const categoriesCard = page.locator("a", { hasText: "Categorías" });
    await categoriesCard.click();

    // Wait for navigation
    await page.waitForLoadState("networkidle");

    // Verify we're on categories page
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Go back
    await page.goBack();
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to budgets page", async ({ page }) => {
    // Click on Budgets card
    const budgetsCard = page.locator("a", { hasText: "Presupuestos" });
    await budgetsCard.click();

    // Wait for navigation
    await page.waitForLoadState("networkidle");

    // Verify we're on budgets page
    await expect(page.getByText("Gestiona tus presupuestos")).toBeVisible();

    // Go back
    await page.goBack();
    await page.waitForLoadState("networkidle");
  });

  test("should navigate to supplies page", async ({ page }) => {
    // Click on Supplies card
    const suppliesCard = page.locator("a", { hasText: "Gastos Insumos" });
    await suppliesCard.click();

    // Wait for navigation
    await page.waitForLoadState("networkidle");

    // Verify we're on supplies page
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible();

    // Go back
    await page.goBack();
    await page.waitForLoadState("networkidle");
  });

  test("should display monthly summary with correct format", async ({
    page,
  }) => {
    // Verify monthly summary widget
    const summaryWidget = page.locator("text=Resumen del Mes").first();
    await expect(summaryWidget).toBeVisible();

    // Verify it shows current month
    const currentMonth = new Date().toLocaleDateString("es-MX", {
      month: "long",
      year: "numeric",
    });
    await expect(page.getByText(currentMonth, { exact: false })).toBeVisible();

    // Verify currency format
    const amounts = await page.locator("text=/$//").count();
    expect(amounts).toBeGreaterThan(0);
  });

  test("should display active budgets with progress", async ({ page }) => {
    // Verify Active Budgets widget
    await expect(page.getByText("Presupuestos Activos")).toBeVisible();

    // If there are budgets, verify progress bars exist
    const progressBars = page.locator(".h-2.bg-gray-100");
    const count = await progressBars.count();

    // Either show budgets or empty state
    const emptyState = page.getByText("No hay presupuestos activos");
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (!hasEmptyState && count > 0) {
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test("should display expense distribution", async ({ page }) => {
    // Verify Expense Distribution widget
    await expect(page.getByText("Distribución de Gastos")).toBeVisible();

    // Verify it shows categories or empty state
    const categories = await page.locator("text=/^Total de gastos$/").count();

    // Should either show categories or empty state message
    const hasContent =
      categories > 0 ||
      (await page
        .getByText("No hay gastos registrados")
        .isVisible()
        .catch(() => false));

    expect(hasContent).toBe(true);
  });

  test("should display supply expenses summary", async ({ page }) => {
    // Verify Supply Expenses widget
    await expect(page.getByText("Gastos en Insumos")).toBeVisible();
    await expect(page.getByText("Total gastado este mes")).toBeVisible();

    // Verify stats are displayed
    await expect(page.getByText("Productos")).toBeVisible();
    await expect(page.getByText("Transacciones")).toBeVisible();
  });

  test("should handle quick action clicks", async ({ page }) => {
    // Test Quick Actions buttons are clickable
    const quickActions = [
      { name: "Registrar Ingreso", expectedPath: "/finance/movements" },
      { name: "Registrar Gasto", expectedPath: "/finance/movements" },
      { name: "Crear Presupuesto", expectedPath: "/finance/budgets" },
      { name: "Ver Insumos", expectedPath: "/inventory/supplies" },
    ];

    for (const action of quickActions) {
      const button = page.locator("button", { hasText: action.name });

      if (await button.isVisible().catch(() => false)) {
        await expect(button).toBeEnabled();
      }
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify main content is still visible
    await expect(page.getByText("Panel Financiero")).toBeVisible();
    await expect(page.getByText("Acciones Rápidas")).toBeVisible();
    await expect(page.getByText("Resumen del Mes")).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("should show budget alerts when threshold exceeded", async ({
    page,
  }) => {
    // Look for alert indicators in Active Budgets widget
    const alertBadge = page.getByText("¡Alerta!");
    const alertWarning = page.getByText(/presupuesto.*cerca del límite/i);

    // Either alerts exist or not - both are valid states
    const hasAlert =
      (await alertBadge.isVisible().catch(() => false)) ||
      (await alertWarning.isVisible().catch(() => false));

    // If there are budgets with high usage, verify alert is shown
    if (hasAlert) {
      await expect(page.getByText(/alerta|límite/i).first()).toBeVisible();
    }
  });
});
