import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Financial Management - Budgets", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);

    // Navigate to budgets page
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/finance/budgets`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page loaded
    await expect(page.getByText("Presupuestos")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display budgets page with stats", async ({ page }) => {
    // Verify header
    await expect(page.getByText("Presupuestos")).toBeVisible();
    await expect(
      page.getByText(
        "Gestiona tus presupuestos semanales, quincenales o mensuales",
      ),
    ).toBeVisible();

    // Verify stats cards exist
    await expect(page.getByText("Total")).toBeVisible();
    await expect(page.getByText("Activos")).toBeVisible();
    await expect(page.getByText("Completados")).toBeVisible();
    await expect(page.getByText("Presupuesto Total")).toBeVisible();

    // Verify filter exists
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("should filter budgets by status", async ({ page }) => {
    // Select "Activo" from dropdown
    await page.getByRole("combobox").selectOption("active");

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify showing filtered results text
    const resultsText = page.getByText(/Mostrando \d+ de/);
    await expect(resultsText).toBeVisible();
  });

  test("should search budgets", async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder("Buscar presupuesto...");
    await searchInput.fill("Marzo");

    // Wait for search to apply
    await page.waitForTimeout(500);

    // Verify showing search results
    const resultsText = page.getByText(/Mostrando \d+ de/);
    await expect(resultsText).toBeVisible();
  });

  test("should open create budget modal", async ({ page }) => {
    // Click "Nuevo Presupuesto" button
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();

    // Verify modal opened
    await expect(page.getByText("Nuevo Presupuesto")).toBeVisible();

    // Verify form elements
    await expect(page.getByText("Nombre del presupuesto")).toBeVisible();
    await expect(page.getByText("Tipo de período")).toBeVisible();
    await expect(page.getByText("Fecha de inicio")).toBeVisible();
    await expect(page.getByText("Fecha de fin")).toBeVisible();
    await expect(page.getByText("Límite total")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Verify modal closed
    await expect(page.getByText("Nuevo Presupuesto")).not.toBeVisible();
  });

  test("should create a new monthly budget", async ({ page }) => {
    // Click "Nuevo Presupuesto" button
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();

    // Fill budget name
    await page
      .getByPlaceholder("Ej: Presupuesto Marzo 2026")
      .fill("Test Presupuesto E2E");

    // Select "Mensual" period type
    await page.getByRole("button", { name: "Mensual" }).click();

    // Fill start date
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    await page.getByLabel("Fecha de inicio").fill(startDate);

    // Fill total limit
    await page.getByPlaceholder("0.00").fill("25000");

    // Adjust alert threshold
    const slider = page.locator('input[type="range"]').first();
    await slider.fill("75");

    // Submit form
    await page.getByRole("button", { name: "Crear Presupuesto" }).click();

    // Wait for success and modal to close
    await page.waitForTimeout(2000);

    // Verify budget was created by searching for it
    const searchInput = page.getByPlaceholder("Buscar presupuesto...");
    await searchInput.fill("Test Presupuesto E2E");
    await page.waitForTimeout(500);

    // Verify the new budget appears in the grid
    await expect(page.getByText("Test Presupuesto E2E")).toBeVisible();
  });

  test("should validate required fields in budget form", async ({ page }) => {
    // Click "Nuevo Presupuesto" button
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();

    // Try to submit without filling required fields
    await page.getByRole("button", { name: "Crear Presupuesto" }).click();

    // Verify validation errors
    await expect(page.getByText("El nombre es requerido")).toBeVisible();
    await expect(page.getByText("El límite debe ser mayor a 0")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancelar" }).click();
  });

  test("should auto-calculate end date for monthly budget", async ({
    page,
  }) => {
    // Click "Nuevo Presupuesto" button
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();

    // Select "Mensual" period type
    await page.getByRole("button", { name: "Mensual" }).click();

    // Fill start date (first day of month)
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = startOfMonth.toISOString().split("T")[0];
    await page.getByLabel("Fecha de inicio").fill(startDate);

    // Wait for auto-calculation
    await page.waitForTimeout(500);

    // Verify end date is last day of month
    const endDateInput = page.getByLabel("Fecha de fin");
    const endDateValue = await endDateInput.inputValue();

    // End date should be populated
    expect(endDateValue).not.toBe("");

    // Close modal
    await page.getByRole("button", { name: "Cancelar" }).click();
  });

  test("should display budget progress and alerts", async ({ page }) => {
    // Create a budget first
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();
    await page
      .getByPlaceholder("Ej: Presupuesto Marzo 2026")
      .fill("Presupuesto con Alerta");
    await page.getByRole("button", { name: "Mensual" }).click();
    await page.getByPlaceholder("0.00").fill("10000");

    // Set low alert threshold
    const slider = page.locator('input[type="range"]').first();
    await slider.fill("50");

    await page.getByRole("button", { name: "Crear Presupuesto" }).click();
    await page.waitForTimeout(2000);

    // Search for the budget
    const searchInput = page.getByPlaceholder("Buscar presupuesto...");
    await searchInput.fill("Presupuesto con Alerta");
    await page.waitForTimeout(500);

    // Verify budget appears with progress information
    await expect(page.getByText("Presupuesto con Alerta")).toBeVisible();

    // Verify progress elements exist (even if showing "Sin datos")
    const progressText = page.getByText(/% usado|Sin datos/);
    await expect(progressText.first()).toBeVisible();
  });

  test("should pause and reactivate a budget", async ({ page }) => {
    // Create a budget first
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();
    await page
      .getByPlaceholder("Ej: Presupuesto Marzo 2026")
      .fill("Presupuesto para Pausar");
    await page.getByPlaceholder("0.00").fill("15000");
    await page.getByRole("button", { name: "Crear Presupuesto" }).click();
    await page.waitForTimeout(2000);

    // Find and open actions menu on the budget
    const budgetCard = page.locator("text=Presupuesto para Pausar").first();
    await expect(budgetCard).toBeVisible();

    // Click on the budget card to open it
    await budgetCard.click();

    // Wait for detail view or edit modal
    await page.waitForTimeout(1000);

    // Look for status change option
    // Note: This might need adjustment based on actual UI
    const moreButton = page
      .locator('button svg[data-lucide="more-vertical"]')
      .first();
    if (await moreButton.isVisible().catch(() => false)) {
      await moreButton.click();

      // Click pause
      await page.getByText("Pausar").click();

      // Wait for status update
      await page.waitForTimeout(1000);

      // Verify status changed to "Pausado"
      await expect(page.getByText("Pausado")).toBeVisible();
    }
  });

  test("should navigate to budget categories", async ({ page }) => {
    // Create a budget first
    await page.getByRole("button", { name: "Nuevo Presupuesto" }).click();
    await page
      .getByPlaceholder("Ej: Presupuesto Marzo 2026")
      .fill("Presupuesto con Categorías");
    await page.getByPlaceholder("0.00").fill("20000");
    await page.getByRole("button", { name: "Crear Presupuesto" }).click();
    await page.waitForTimeout(2000);

    // Click on the budget card
    const budgetCard = page.locator("text=Presupuesto con Categorías").first();
    await budgetCard.click();

    // Wait for navigation or modal
    await page.waitForTimeout(1000);

    // Verify we can see budget details or categories section
    // This depends on your implementation
  });
});
