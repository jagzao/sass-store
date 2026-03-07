import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";
test.describe("Admin Dashboard Redesign - Full Width Layout", () => {
  const tenantSlug = "wondernails";

  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate as admin
    await loginAsAdmin(page);
    await page.goto(`/t/${tenantSlug}`);
  });

  test("should render the horizontal 3-row layout without the legacy sidebar", async ({ page }) => {
    await page.waitForTimeout(2000); // allow hydration

    // 1. Validate Sidebar is GONE
    const sidebar = page.locator("aside", { hasText: "Inicio" });
    await expect(sidebar).not.toBeVisible();

    // 2. Validate Row 1 (Appointments & Retouches split grid)
    await expect(page.getByText("CITAS DE HOY", { exact: true })).toBeVisible();
    await expect(page.getByText("MONITOR DE RETOQUES", { exact: true })).toBeVisible();

    // 3. Validate Row 2 (Customers Database full width)
    await expect(page.getByText("BD CLIENTAS", { exact: true })).toBeVisible();

    // 4. Validate Row 3 (Business Nav Grid)
    await expect(page.getByText("NEGOCIO", { exact: true })).toBeVisible();
  });

  test("should load the dynamic Calendar Action Button", async ({ page }) => {
    // Look for the calendar button in the new sticky header row structure
    const calendarButton = page.locator('header').getByRole('link', { name: /calendario/i });
    await expect(calendarButton).toBeVisible();
  });

  test("should render the bottom nav grid Fila Fila Fila cards correctly", async ({ page }) => {
    const navGridCards = page.locator("a:has-text('Plantillas Canva')");
    await expect(navGridCards).toBeVisible();
    
    const classList = await navGridCards.getAttribute("class");
    expect(classList).toContain("flex-col");
    expect(classList).toContain("overflow-hidden");
  });
});
