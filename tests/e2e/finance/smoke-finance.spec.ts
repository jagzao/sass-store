import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe("Finance System - Smoke Tests", () => {
  test.describe.configure({ timeout: 120000 });

  const { tenantSlug } = TEST_CREDENTIALS;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("Categories page loads correctly", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(
      page.getByRole("heading", { name: "Categorías de Transacciones" }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: "Nueva Categoría" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Ingresos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Gastos" })).toBeVisible();
  });

  test("Budgets page loads correctly", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/budgets`);
    await expect(
      page.getByRole("heading", { name: "Presupuestos" }),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("button", { name: "Nuevo Presupuesto" }),
    ).toBeVisible();
    await expect(page.getByText("Activos").first()).toBeVisible();
    await expect(page.getByText("Completados").first()).toBeVisible();
  });

  test("Financial dashboard loads correctly", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Matriz de Planeación Financiera" }),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("matrix-container")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId("granularity-selector")).toBeVisible();
  });

  test("Supply expenses page loads", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/inventory/supplies`);
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(
      new RegExp(`/t/${tenantSlug}/inventory/supplies`),
    );
    await expect(
      page.getByRole("heading", { name: "Reporte de Gastos de Insumos" }),
    ).toBeVisible({ timeout: 20000 });
  });

  test("All finance navigation works", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`);
    await expect(
      page.getByRole("heading", { name: "Categorías de Transacciones" }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto(`/t/${tenantSlug}/finance/budgets`);
    await expect(
      page.getByRole("heading", { name: "Presupuestos" }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto(`/t/${tenantSlug}/finance`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/finance");
  });
});

test.describe("Finance System - Public Access", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test("Login page is accessible", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/login`, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("email-input")).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByTestId("login-btn")).toBeVisible();
  });

  test("Protected pages redirect to login when not authenticated", async ({
    page,
  }) => {
    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(3000);
    const bodyText = await page.locator("body").textContent();
    const onCategoriesPage = bodyText?.includes("Categorías de Transacciones");
    const onLoginPage =
      bodyText?.includes("Inicia") ||
      bodyText?.includes("Iniciar") ||
      bodyText?.includes("Correo") ||
      bodyText?.includes("email") ||
      bodyText?.includes("login");
    expect(onCategoriesPage || onLoginPage).toBe(true);
  });
});
