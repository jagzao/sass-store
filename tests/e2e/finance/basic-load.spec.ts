import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe("Financial Pages - Basic Load Tests", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test("should load categories page (public check)", async ({ page }) => {
    // Navigate without login - just check page loads
    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
      timeout: 60000, // 60 seconds timeout
    });

    // Wait a bit for page to render
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({
      path: "test-results/categories-page.png",
      fullPage: true,
    });

    // Check if page loaded (either with content or login redirect)
    const bodyText = await page.locator("body").textContent();

    // Page should either show categories or redirect to login
    const hasCategories =
      bodyText?.includes("Categorías") || bodyText?.includes("categorías");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");
    const is404 = bodyText?.includes("404") || bodyText?.includes("Not Found");

    console.log("Page content sample:", bodyText?.substring(0, 200));
    console.log("Has categories:", hasCategories);
    console.log("Has login:", hasLogin);
    console.log("Is 404:", is404);

    // Page should load (either categories or login page, but not 404)
    expect(is404).toBe(false);
    expect(hasCategories || hasLogin).toBe(true);
  });

  test("should load budgets page (public check)", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/budgets`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/budgets-page.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    const hasBudgets =
      bodyText?.includes("Presupuestos") || bodyText?.includes("presupuestos");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");
    const is404 = bodyText?.includes("404") || bodyText?.includes("Not Found");

    console.log("Budgets page - Has budgets:", hasBudgets);
    console.log("Budgets page - Has login:", hasLogin);

    expect(is404).toBe(false);
    expect(hasBudgets || hasLogin).toBe(true);
  });

  test("should load supplies page (public check)", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/inventory/supplies`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/supplies-page.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    const hasSupplies =
      bodyText?.includes("Insumos") || bodyText?.includes("insumos");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");
    const is404 = bodyText?.includes("404") || bodyText?.includes("Not Found");

    console.log("Supplies page - Has supplies:", hasSupplies);
    console.log("Supplies page - Has login:", hasLogin);

    expect(is404).toBe(false);
    expect(hasSupplies || hasLogin).toBe(true);
  });

  test("should load finance dashboard (public check)", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "test-results/finance-dashboard.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    const hasFinance =
      bodyText?.includes("Financiero") || bodyText?.includes("financiero");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("login");
    const is404 = bodyText?.includes("404") || bodyText?.includes("Not Found");

    console.log("Finance page - Has finance:", hasFinance);
    console.log("Finance page - Has login:", hasLogin);

    expect(is404).toBe(false);
    expect(hasFinance || hasLogin).toBe(true);
  });

  test("should verify API endpoints structure", async ({ request }) => {
    // Test that API endpoints exist (will return 401 or 200, but not 404)
    const categoriesResponse = await request.get(
      `/api/categories?tenant=${tenantSlug}`,
    );
    const budgetsResponse = await request.get(
      `/api/budgets?tenant=${tenantSlug}`,
    );
    const suppliesResponse = await request.get(
      `/api/inventory/supply-report?tenant=${tenantSlug}`,
    );

    console.log("Categories API status:", categoriesResponse.status());
    console.log("Budgets API status:", budgetsResponse.status());
    console.log("Supplies API status:", suppliesResponse.status());

    // Endpoints should exist (return 200, 401, or 403, but not 404)
    expect(categoriesResponse.status()).not.toBe(404);
    expect(budgetsResponse.status()).not.toBe(404);
    expect(suppliesResponse.status()).not.toBe(404);

    // All should be 200, 401, or 403
    expect([200, 401, 403]).toContain(categoriesResponse.status());
    expect([200, 401, 403]).toContain(budgetsResponse.status());
    expect([200, 401, 403]).toContain(suppliesResponse.status());
  });
});
