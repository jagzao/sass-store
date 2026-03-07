import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Financial Management - Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test("should load categories page", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify page loaded without errors
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Verify no 404 or error
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");
    expect(bodyText).not.toContain("Error");
    expect(bodyText).not.toContain("Application error");
  });

  test("should load budgets page", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/finance/budgets`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify page loaded without errors
    await expect(page.getByText("Presupuestos")).toBeVisible();

    // Verify no 404 or error
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");
    expect(bodyText).not.toContain("Error");
    expect(bodyText).not.toContain("Application error");
  });

  test("should load supplies page", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/inventory/supplies`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify page loaded without errors
    await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible();

    // Verify no 404 or error
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");
    expect(bodyText).not.toContain("Error");
    expect(bodyText).not.toContain("Application error");
  });

  test("should load finance dashboard with new widgets", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify dashboard loaded
    await expect(page.getByText("Panel Financiero")).toBeVisible();

    // Verify new widgets are present
    await expect(page.getByText("Acciones Rápidas")).toBeVisible();
    await expect(page.getByText("Resumen del Mes")).toBeVisible();

    // Verify navigation links exist
    await expect(page.getByText("Categorías")).toBeVisible();
    await expect(page.getByText("Presupuestos")).toBeVisible();
    await expect(page.getByText("Gastos Insumos")).toBeVisible();

    // Verify no 404 or error
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("404");
    expect(bodyText).not.toContain("Application error");
  });

  test("should verify API endpoints are accessible", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    // Test categories API
    const categoriesResponse = await page.request.get(
      `/api/categories?tenant=${tenantSlug}`,
    );
    expect(categoriesResponse.status()).toBe(200);

    const categoriesData = await categoriesResponse.json();
    expect(categoriesData).toHaveProperty("success");

    // Test budgets API
    const budgetsResponse = await page.request.get(
      `/api/budgets?tenant=${tenantSlug}`,
    );
    expect(budgetsResponse.status()).toBe(200);

    const budgetsData = await budgetsResponse.json();
    expect(budgetsData).toHaveProperty("success");

    // Test supply expenses API
    const suppliesResponse = await page.request.get(
      `/api/inventory/supply-report?tenant=${tenantSlug}`,
    );
    expect(suppliesResponse.status()).toBe(200);

    const suppliesData = await suppliesResponse.json();
    expect(suppliesData).toHaveProperty("success");
  });

  test("should verify page responsiveness", async ({ page }) => {
    const { tenantSlug } = TEST_CREDENTIALS;

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForLoadState("networkidle");

    // Verify content is still accessible on mobile
    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.getByText("Categorías de Transacciones")).toBeVisible();

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});
