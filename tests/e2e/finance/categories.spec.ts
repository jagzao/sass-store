import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Financial Management - Categories", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);

    // Navigate to categories page
    const { tenantSlug } = TEST_CREDENTIALS;
    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
    });

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify page loaded
    await expect(
      page.getByRole("heading", { name: "Categorías de Transacciones" }),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("should display categories page with stats", async ({ page }) => {
    // Verify header
    await expect(
      page.getByRole("heading", { name: "Categorías de Transacciones" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Organiza tus ingresos y gastos en categorías personalizables",
      ),
    ).toBeVisible();

    // Verify stats cards exist
    await expect(page.getByText("Total").first()).toBeVisible();
    await expect(page.getByText("Ingresos").first()).toBeVisible();
    await expect(page.getByText("Gastos").first()).toBeVisible();
    await expect(page.getByText("Por Defecto").first()).toBeVisible();

    // Verify filter tabs
    await expect(page.getByRole("button", { name: "Todas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ingresos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Gastos" })).toBeVisible();
  });

  test("should filter categories by type", async ({ page }) => {
    // Click on "Ingresos" tab
    await page.getByRole("button", { name: "Ingresos" }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify showing filtered results text
    const resultsText = page.getByText(/Mostrando \d+ de/);
    await expect(resultsText).toBeVisible();

    // Click on "Gastos" tab
    await page.getByRole("button", { name: "Gastos" }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify showing filtered results
    await expect(resultsText).toBeVisible();
  });

  test("should search categories", async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder("Buscar categoría...");
    await searchInput.fill("Aliment");

    // Wait for search to apply
    await page.waitForTimeout(500);

    // Verify showing search results
    const resultsText = page.getByText(/Mostrando \d+ de/);
    await expect(resultsText).toBeVisible();
  });

  test("should open create category modal", async ({ page }) => {
    // Click "Nueva Categoría" button
    await page.getByRole("button", { name: "Nueva Categoría" }).click();

    // Verify modal opened — check for unique modal button "Crear Categoría"
    await expect(
      page.getByRole("button", { name: "Crear Categoría" }),
    ).toBeVisible({ timeout: 5000 });

    // Verify form placeholder is visible (unique to modal)
    await expect(
      page.getByPlaceholder("Ej: Alimentación, Salario, etc."),
    ).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancelar" }).click();

    // Verify modal closed — "Crear Categoría" button gone
    await expect(
      page.getByRole("button", { name: "Crear Categoría" }),
    ).not.toBeVisible({ timeout: 3000 });
  });

  test("should create a new expense category", async ({ page }) => {
    // Click "Nueva Categoría" button
    await page.getByRole("button", { name: "Nueva Categoría" }).click();

    // Select "Gasto" type
    await page.getByLabel("Gasto").first().click();

    // Fill category name
    await page
      .getByPlaceholder("Ej: Alimentación, Salario, etc.")
      .fill("Test Categoría E2E");

    // Fill description
    await page
      .getByPlaceholder("Descripción opcional de la categoría")
      .fill("Categoría creada en test E2E");

    // Select a color (first color in palette)
    const colorButtons = page
      .locator('button[style*="background-color"]')
      .first();
    await colorButtons.click();

    // Select an icon
    await page.getByPlaceholder("Buscar icono...").fill("wallet");
    await page.waitForTimeout(500);
    await page.locator('button[title*="Wallet"]').first().click();

    // Check "Es gasto fijo"
    await page.getByLabel("Es un gasto fijo").check();

    // Submit form
    await page.getByRole("button", { name: "Crear Categoría" }).click();

    // Wait for success and modal to close
    await page.waitForTimeout(2000);

    // Verify category was created by searching for it
    const searchInput = page.getByPlaceholder("Buscar categoría...");
    await searchInput.fill("Test Categoría E2E");
    await page.waitForTimeout(500);

    // Verify the new category appears in the list
    await expect(page.getByText("Test Categoría E2E")).toBeVisible();
  });

  test("should validate required fields in category form", async ({ page }) => {
    // Click "Nueva Categoría" button
    await page.getByRole("button", { name: "Nueva Categoría" }).click();

    // Try to submit without filling name
    await page.getByRole("button", { name: "Crear Categoría" }).click();

    // Verify validation error
    await expect(page.getByText("El nombre es requerido")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Cancelar" }).click();
  });

  test("should restore default categories", async ({ page }) => {
    // Click "Restaurar por defecto" button
    await page.getByRole("button", { name: "Restaurar por defecto" }).click();

    // Verify confirmation dialog appears
    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toContain("categorías por defecto");
      await dialog.accept();
    });

    // Wait for operation to complete
    await page.waitForTimeout(2000);

    // Verify stats updated
    await expect(page.getByText("Total")).toBeVisible();
  });

  test.skip("should edit a category", async ({ page }) => {
    // First create a category
    await page.getByRole("button", { name: "Nueva Categoría" }).click();
    await page.getByLabel("Gasto").first().click();
    await page
      .getByPlaceholder("Ej: Alimentación, Salario, etc.")
      .fill("Categoría para Editar");
    await page.getByRole("button", { name: "Crear Categoría" }).click();
    await page.waitForTimeout(2000);

    // Find and click edit button on the new category
    const categoryRow = page.locator("text=Categoría para Editar").first();
    await expect(categoryRow).toBeVisible();

    // Hover over the category to reveal edit button
    await categoryRow.hover();
    await page.waitForTimeout(500);

    // Click edit button — try multiple selectors (title attr or aria-label)
    const editButton = page
      .locator('button[title="Editar"], button[aria-label="Editar"]')
      .first();
    const editVisible = await editButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (!editVisible) {
      // Fallback: click any button near the category row
      await categoryRow.locator("..").locator("button").last().click();
    } else {
      await editButton.click();
    }

    // Verify edit modal opened
    await expect(page.getByText("Editar Categoría")).toBeVisible();

    // Modify name
    const nameInput = page.getByPlaceholder("Ej: Alimentación, Salario, etc.");
    await nameInput.fill("Categoría Editada E2E");

    // Save changes
    await page.getByRole("button", { name: "Actualizar" }).click();

    // Wait for update
    await page.waitForTimeout(2000);

    // Verify updated
    await expect(page.getByText("Categoría Editada E2E")).toBeVisible();
  });
});
