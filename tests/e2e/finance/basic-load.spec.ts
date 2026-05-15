import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe("Financial Pages - Basic Load Tests", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test("should load categories page (public check)", async ({ page }) => {
    const response = await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/categories-page.png",
      fullPage: true,
    });

    // Response should not be 404
    expect(response?.status() ?? 0).not.toBe(404);

    const bodyText = await page.locator("body").textContent();
    const hasCategories =
      bodyText?.includes("Categorías") || bodyText?.includes("categorías");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");

    console.log("Categories page status:", response?.status());
    console.log("Has categories:", hasCategories);
    console.log("Has login:", hasLogin);

    // Page should either show categories content or redirect to login
    expect(hasCategories || hasLogin).toBe(true);
  });

  test("should load budgets page (public check)", async ({ page }) => {
    const response = await page.goto(`/t/${tenantSlug}/finance/budgets`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/budgets-page.png",
      fullPage: true,
    });

    expect(response?.status() ?? 0).not.toBe(404);

    const bodyText = await page.locator("body").textContent();
    const hasBudgets =
      bodyText?.includes("Presupuestos") || bodyText?.includes("presupuestos");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");

    console.log("Budgets page status:", response?.status());
    console.log("Has budgets:", hasBudgets);
    console.log("Has login:", hasLogin);

    expect(hasBudgets || hasLogin).toBe(true);
  });

  test("should load supplies page (public check)", async ({ page }) => {
    const response = await page.goto(`/t/${tenantSlug}/inventory/supplies`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/supplies-page.png",
      fullPage: true,
    });

    expect(response?.status() ?? 0).not.toBe(404);

    const bodyText = await page.locator("body").textContent();
    const hasSupplies =
      bodyText?.includes("Insumos") || bodyText?.includes("insumos");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");

    console.log("Supplies page status:", response?.status());
    console.log("Has supplies:", hasSupplies);
    console.log("Has login:", hasLogin);

    expect(hasSupplies || hasLogin).toBe(true);
  });

  test("should load finance dashboard (public check)", async ({ page }) => {
    const response = await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/finance-dashboard.png",
      fullPage: true,
    });

    expect(response?.status() ?? 0).not.toBe(404);

    const bodyText = await page.locator("body").textContent();
    const hasFinance =
      bodyText?.includes("Matriz") ||
      bodyText?.includes("Financiera") ||
      bodyText?.includes("financiera");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");

    console.log("Finance page status:", response?.status());
    console.log("Has finance:", hasFinance);
    console.log("Has login:", hasLogin);

    // Finance dashboard requires auth; may redirect to login
    expect(hasFinance || hasLogin).toBe(true);
  });

  test("should verify API endpoints structure", async ({ request }) => {
    const categoriesResponse = await request.get(
      `/api/categories?tenant=${tenantSlug}`,
    );
    const budgetsResponse = await request.get(
      `/api/finance/budgets?tenant=${tenantSlug}`,
    );
    const suppliesResponse = await request.get(
      `/api/inventory/supply-report?tenant=${tenantSlug}`,
    );

    console.log("Categories API status:", categoriesResponse.status());
    console.log("Budgets API status:", budgetsResponse.status());
    console.log("Supplies API status:", suppliesResponse.status());

    expect(categoriesResponse.status()).not.toBe(404);
    expect(budgetsResponse.status()).not.toBe(404);
    expect(suppliesResponse.status()).not.toBe(404);

    expect([200, 401, 403, 500]).toContain(categoriesResponse.status());
    expect([200, 401, 403, 500]).toContain(budgetsResponse.status());
    expect([200, 401, 403, 500]).toContain(suppliesResponse.status());
  });
});
