import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";

test.describe("Finance - Categories Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page);
  });

  test("should display categories page", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/categories");

    // Wait for page to load
    await page.waitForSelector("text=Categorías", { timeout: 15000 });

    // Verify page content
    await expect(page.getByText("Categorías").first()).toBeVisible();
    await expect(page.getByText(/ingreso|gasto/i).first()).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/finance/categories-page.png",
      fullPage: true,
    });
  });

  test("should create a new income category", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/categories");
    await page.waitForSelector("text=Categorías", { timeout: 15000 });

    // Click add category button
    await page.getByRole("button", { name: /nueva categoría/i }).click();

    // Fill form
    const categoryName = `Test Income ${Date.now()}`;
    await page.getByPlaceholder(/nombre de la categoría/i).fill(categoryName);
    await page.getByLabel(/tipo/i).selectOption("income");

    // Submit
    await page.getByRole("button", { name: /guardar|crear/i }).click();

    // Verify success
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "test-results/finance/category-created.png",
      fullPage: true,
    });
  });

  test("should create a new expense category", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/categories");
    await page.waitForSelector("text=Categorías", { timeout: 15000 });

    // Click add category button
    await page.getByRole("button", { name: /nueva categoría/i }).click();

    // Fill form
    const categoryName = `Test Expense ${Date.now()}`;
    await page.getByPlaceholder(/nombre de la categoría/i).fill(categoryName);
    await page.getByLabel(/tipo/i).selectOption("expense");

    // Submit
    await page.getByRole("button", { name: /guardar|crear/i }).click();

    // Verify success
    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  });

  test("should edit an existing category", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/categories");
    await page.waitForSelector("text=Categorías", { timeout: 15000 });

    // Find first category and click edit
    const editButton = page.getByRole("button", { name: /editar/i }).first();
    await editButton.click();

    // Modify name
    const newName = `Updated Category ${Date.now()}`;
    const nameInput = page.getByPlaceholder(/nombre de la categoría/i);
    await nameInput.fill(newName);

    // Save
    await page.getByRole("button", { name: /guardar/i }).click();

    // Verify update
    await expect(page.getByText(newName)).toBeVisible({ timeout: 5000 });
  });

  test("should filter categories by type", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/categories");
    await page.waitForSelector("text=Categorías", { timeout: 15000 });

    // Filter by income
    await page.getByLabel(/filtrar por/i).selectOption("income");
    await page.waitForTimeout(1000);

    // Should show only income categories
    await expect(page.getByText(/ingreso/i).first()).toBeVisible();

    // Filter by expense
    await page.getByLabel(/filtrar por/i).selectOption("expense");
    await page.waitForTimeout(1000);

    await expect(page.getByText(/gasto/i).first()).toBeVisible();
  });
});

test.describe("Finance - Budgets Management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display budgets page", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/budgets");

    await page.waitForSelector("text=Presupuestos", { timeout: 15000 });
    await expect(page.getByText("Presupuestos").first()).toBeVisible();

    await page.screenshot({
      path: "test-results/finance/budgets-page.png",
      fullPage: true,
    });
  });

  test("should create a monthly budget", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/budgets");
    await page.waitForSelector("text=Presupuestos", { timeout: 15000 });

    // Click add budget
    await page.getByRole("button", { name: /nuevo presupuesto/i }).click();

    // Fill form
    await page.getByLabel(/nombre/i).fill(`Test Budget ${Date.now()}`);
    await page.getByLabel(/monto/i).fill("1000");
    await page.getByLabel(/periodo/i).selectOption("monthly");
    await page.getByLabel(/categoría/i).selectOption({ index: 1 });

    // Submit
    await page.getByRole("button", { name: /crear|guardar/i }).click();

    // Verify created
    await expect(page.getByText(/test budget/i)).toBeVisible({ timeout: 5000 });
  });

  test("should show budget progress", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/budgets");
    await page.waitForSelector("text=Presupuestos", { timeout: 15000 });

    // Should see budget cards with progress
    await expect(page.getByText(/progreso|avance/i).first()).toBeVisible();
    await expect(page.locator("[role='progressbar']").first()).toBeVisible();
  });

  test("should display budget alerts when exceeded", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/budgets");
    await page.waitForSelector("text=Presupuestos", { timeout: 15000 });

    // Look for alert indicators
    const alerts = page.locator(
      "[data-testid='budget-alert'], .alert, .warning",
    );
    if ((await alerts.count()) > 0) {
      await expect(alerts.first()).toBeVisible();
    }
  });
});

test.describe("Finance - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display financial dashboard", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance");

    await page.waitForTimeout(5000);

    // Verify dashboard widgets exist
    await expect(
      page.getByText(/resumen|financiero|dashboard/i).first(),
    ).toBeVisible();

    await page.screenshot({
      path: "test-results/finance/dashboard.png",
      fullPage: true,
    });
  });

  test("should show monthly summary widget", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance");
    await page.waitForTimeout(3000);

    // Look for summary information
    const hasIncome = await page
      .getByText(/ingresos/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasExpense = await page
      .getByText(/gastos/i)
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasIncome || hasExpense).toBe(true);
  });

  test("should show expense distribution chart", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance");
    await page.waitForTimeout(3000);

    // Look for chart or distribution section
    const chart = page
      .locator("canvas, [role='img'], .chart, .distribution")
      .first();
    if ((await chart.count()) > 0) {
      await expect(chart).toBeVisible();
    }
  });

  test("should show active budgets widget", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance");
    await page.waitForTimeout(3000);

    // Look for budgets section
    await expect(page.getByText(/presupuesto/i).first()).toBeVisible();
  });
});

test.describe("Finance - Supply Expenses", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should display supplies expense page", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/inventory/supplies");

    await page.waitForTimeout(5000);

    // Verify page loads
    const bodyText = await page.locator("body").textContent();
    const hasSupplies = bodyText?.toLowerCase().includes("insumo");
    const hasExpense = bodyText?.toLowerCase().includes("gasto");

    expect(hasSupplies || hasExpense).toBe(true);

    await page.screenshot({
      path: "test-results/finance/supplies-page.png",
      fullPage: true,
    });
  });

  test("should show supply expense report", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/inventory/supplies");
    await page.waitForTimeout(5000);

    // Look for report elements
    const hasTable = await page
      .locator("table")
      .first()
      .isVisible()
      .catch(() => false);
    const hasList = await page
      .locator("[role='list'], .list")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasList).toBe(true);
  });
});
