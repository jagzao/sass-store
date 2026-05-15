import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_CREDENTIALS } from "../helpers/test-helpers";

const { tenantSlug } = TEST_CREDENTIALS;

test.describe("Finance - Categories Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display categories page", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText(/ingreso|gasto|Ingresos|Gastos/i).first(),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/finance/categories-page.png",
      fullPage: true,
    });
  });

  test.skip("should create a new income category", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible({
      timeout: 15000,
    });

    // Click "Nueva Categoría" button
    await page.getByRole("button", { name: /nueva categoría/i }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).toBeVisible();

    // Select "Ingreso" radio
    await page.getByRole("radio", { name: /ingreso/i }).check();

    // Fill name
    const categoryName = `Test Income ${Date.now()}`;
    await page.getByPlaceholder(/ej: alimentación|salario/i).fill(categoryName);

    // Submit
    await page.getByRole("button", { name: /crear categoría/i }).click();

    // Wait for modal heading to disappear (modal closes)
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).not.toBeVisible({ timeout: 10000 });
    // Wait for toast or list refresh
    await page.waitForTimeout(2000);
    await expect(page.getByText(categoryName).first()).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: "test-results/finance/category-created.png",
      fullPage: true,
    });
  });

  test.skip("should create a new expense category", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /nueva categoría/i }).click();
    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).toBeVisible();

    // Select "Gasto" radio
    await page.getByRole("radio", { name: /gasto/i }).check();

    const categoryName = `Test Expense ${Date.now()}`;
    await page.getByPlaceholder(/ej: alimentación|salario/i).fill(categoryName);

    await page.getByRole("button", { name: /crear categoría/i }).click();

    await expect(
      page.getByRole("heading", { name: "Nueva Categoría" }),
    ).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  });

  test.skip("should edit an existing category", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible({
      timeout: 15000,
    });

    // Wait for categories to load (seed includes "Servicios" which is non-default)
    await expect(page.getByText("Servicios")).toBeVisible({ timeout: 10000 });

    // Hover over the "Servicios" row to reveal edit button, then click
    const serviciosRow = page.getByText("Servicios").locator("xpath=../../..");
    await serviciosRow.hover();

    const editButton = page
      .locator("button[title='Editar']")
      .filter({ has: page.locator("svg") })
      .first();
    await editButton.click({ force: true });

    await expect(page.getByText("Editar Categoría")).toBeVisible();

    const newName = `Updated Category ${Date.now()}`;
    await page.getByPlaceholder(/ej: alimentación|salario/i).fill(newName);

    await page.getByRole("button", { name: /actualizar/i }).click();

    await expect(page.getByText("Editar Categoría")).not.toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
  });

  test("should filter categories by type", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible({
      timeout: 15000,
    });

    // Click "Ingresos" tab
    await page.getByRole("button", { name: "Ingresos" }).click();
    await page.waitForTimeout(500);

    // Should show income categories
    await expect(page.getByText("Ingreso").first()).toBeVisible();

    // Click "Gastos" tab
    await page.getByRole("button", { name: "Gastos" }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Gasto").first()).toBeVisible();
  });
});

test.describe("Finance - Budgets Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display budgets page", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/budgets`);

    await expect(page.getByText("Presupuestos").first()).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: "test-results/finance/budgets-page.png",
      fullPage: true,
    });
  });

  test("should trigger create budget action", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/budgets`);
    await expect(page.getByText("Presupuestos").first()).toBeVisible({
      timeout: 15000,
    });

    // Click add budget button (dummy component shows alert)
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /nuevo presupuesto/i }).click();

    // After accepting alert, still on page
    await expect(page.getByText("Presupuestos").first()).toBeVisible();
  });

  test("should show budgets page content", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/budgets`);
    await expect(page.getByText("Presupuestos").first()).toBeVisible({
      timeout: 15000,
    });

    // Should see explanatory text
    await expect(page.getByText(/gestiona tus presupuestos/i)).toBeVisible();
  });
});

test.describe("Finance - Dashboard (Matrix)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display financial matrix page", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`);

    await expect(
      page.getByText(/matriz de planeación financiera/i),
    ).toBeVisible({ timeout: 15000 });

    await page.screenshot({
      path: "test-results/finance/dashboard.png",
      fullPage: true,
    });
  });

  test("should show matrix filters", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`);
    await expect(
      page.getByText(/matriz de planeación financiera/i),
    ).toBeVisible({ timeout: 15000 });

    // Granularity selector exists
    await expect(
      page.locator("[data-testid='granularity-selector']"),
    ).toBeVisible();
  });

  test("should show matrix date range picker", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`);
    await expect(
      page.getByText(/matriz de planeación financiera/i),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.locator("[data-testid='date-range-picker']"),
    ).toBeVisible();
  });

  test("should show clone action form", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`);
    await expect(
      page.getByText(/matriz de planeación financiera/i),
    ).toBeVisible({ timeout: 15000 });

    await expect(page.locator("[data-testid='clone-action']")).toBeVisible();
  });
});
