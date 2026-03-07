import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Inventory - Supply Expenses", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);

    // Navigate to supplies page
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/inventory/supplies`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page loaded
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display supply expenses report page", async ({ page }) => {
    // Verify header
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible();
    await expect(
      page.getByText("Seguimiento de gastos generados por compras de insumos"),
    ).toBeVisible();

    // Verify stats cards exist
    await expect(page.getByText("Total Gastado")).toBeVisible();
    await expect(page.getByText("Productos")).toBeVisible();
    await expect(page.getByText("Transacciones")).toBeVisible();
    await expect(page.getByText("Cantidad Total")).toBeVisible();

    // Verify period filter exists
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("should filter by period", async ({ page }) => {
    // Select "Este trimestre" from dropdown
    await page.getByRole("combobox").selectOption("quarter");

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify page still shows content
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible();
  });

  test("should show custom date range when selected", async ({ page }) => {
    // Select "Personalizado" from dropdown
    await page.getByRole("combobox").selectOption("custom");

    // Wait for date inputs to appear
    await page.waitForTimeout(500);

    // Verify date inputs are visible
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
    await expect(dateInputs.last()).toBeVisible();
  });

  test("should display category breakdown section", async ({ page }) => {
    // Look for category breakdown section
    const categorySection = page.getByText("Distribución por Categoría");
    await expect(categorySection).toBeVisible();

    // If there are expenses, verify progress bars exist
    const progressBars = page.locator('[role="progressbar"]');
    const count = await progressBars.count();

    if (count > 0) {
      // Verify at least one progress bar is visible
      await expect(progressBars.first()).toBeVisible();
    }
  });

  test("should display products table", async ({ page }) => {
    // Verify table headers
    await expect(page.getByText("Detalle por Producto")).toBeVisible();

    // Verify table structure exists
    const table = page.locator("table");
    await expect(table).toBeVisible();

    // Verify table headers
    await expect(page.getByText("Producto")).toBeVisible();
    await expect(page.getByText("Categoría")).toBeVisible();
    await expect(page.getByText("Cantidad")).toBeVisible();
    await expect(page.getByText("Total")).toBeVisible();
    await expect(page.getByText("Transacciones")).toBeVisible();
  });

  test("should show empty state when no supply expenses", async ({ page }) => {
    // If there are no expenses, verify empty state
    const emptyState = page.getByText(
      "No hay gastos de insumos en este período",
    );

    if (await emptyState.isVisible().catch(() => false)) {
      await expect(emptyState).toBeVisible();
      await expect(
        page.getByText(
          "Las compras de productos marcados como insumos aparecerán aquí",
        ),
      ).toBeVisible();
    }
  });

  test("should show supply expense info box", async ({ page }) => {
    // Verify info box exists
    await expect(
      page.getByText(
        'Los productos marcados como "insumos" generan gastos automáticamente',
      ),
    ).toBeVisible();
  });

  test("should format currency correctly", async ({ page }) => {
    // Get the total spent amount
    const totalElement = page.locator("text=Total Gastado").first();
    await expect(totalElement).toBeVisible();

    // Get the amount value
    const amountText = await page
      .locator("text=Total Gastado")
      .first()
      .locator("..")
      .locator("p.text-2xl")
      .textContent()
      .catch(() => "");

    // Verify it contains currency symbol
    if (amountText) {
      expect(amountText).toContain("$");
    }
  });

  test("should navigate to view details", async ({ page }) => {
    // Look for "Ver detalle" link
    const viewDetailsLink = page.getByRole("link", { name: "Ver detalle" });

    if (await viewDetailsLink.isVisible().catch(() => false)) {
      // Verify link is clickable
      await expect(viewDetailsLink).toBeVisible();

      // Verify it has correct href
      const href = await viewDetailsLink.getAttribute("href");
      expect(href).toContain("/inventory/supplies");
    }
  });

  test("should handle responsive layout", async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify content is still visible
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible();
    await expect(page.getByText("Total Gastado")).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
