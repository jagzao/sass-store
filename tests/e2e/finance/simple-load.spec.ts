import { test, expect } from "@playwright/test";

test.describe("Finance Pages - Simple Load Test", () => {
  test("should verify categories page exists", async ({ page }) => {
    // Simple navigation without login helper
    await page.goto("http://localhost:3001/t/manada-juma/finance/categories", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    // Wait for content
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: "test-results/categories-simple.png",
      fullPage: true,
    });

    // Get content
    const bodyText = await page.locator("body").textContent();
    console.log("Page content preview:", bodyText?.substring(0, 300));

    // Page should exist (not 404)
    expect(bodyText).not.toContain("404");
    expect(bodyText).not.toContain("Not Found");

    // Should show either categories content or login form
    const hasCategories = bodyText?.includes("Categorías");
    const hasLogin =
      bodyText?.includes("Inicia sesión") || bodyText?.includes("Correo");

    console.log("Has categories:", hasCategories);
    console.log("Has login:", hasLogin);

    expect(hasCategories || hasLogin).toBe(true);
  });

  test("should verify budgets page exists", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance/budgets", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "test-results/budgets-simple.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasBudgets = bodyText?.includes("Presupuestos");
    const hasLogin = bodyText?.includes("Inicia sesión");

    expect(hasBudgets || hasLogin).toBe(true);
  });

  test("should verify supplies page exists", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/inventory/supplies", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "test-results/supplies-simple.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasSupplies = bodyText?.includes("Insumos");
    const hasLogin = bodyText?.includes("Inicia sesión");

    expect(hasSupplies || hasLogin).toBe(true);
  });

  test("should verify finance dashboard exists", async ({ page }) => {
    await page.goto("http://localhost:3001/t/manada-juma/finance", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "test-results/finance-simple.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");

    const hasFinance =
      bodyText?.includes("Financiero") || bodyText?.includes("Panel");
    const hasLogin = bodyText?.includes("Inicia sesión");

    expect(hasFinance || hasLogin).toBe(true);
  });
});
