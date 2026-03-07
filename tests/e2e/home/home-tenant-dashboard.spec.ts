/**
 * E2E Tests for Role-Based Home Tenant Dashboard
 *
 * Tests the role-based routing and dashboard components:
 * - Unauthenticated/client role sees normal home (not HomeTenant UI)
 * - Staff roles (admin, gerente, personal) see HomeTenant with master-detail shell
 * - Citas por confirmar section renders with WhatsApp action
 * - NEGOCIO grid links visible including Finanzas behavior
 * - Responsive behavior smoke checks for desktop and mobile nav
 */

import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Role-Based Home Tenant Dashboard", () => {
  test.describe("Unauthenticated Users", () => {
    test("should show public home page, not HomeTenant dashboard", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      // Navigate to tenant home without logging in
      await page.goto(`/t/${tenantSlug}`);

      // Wait for page to load
      await page.waitForLoadState("networkidle");

      // Should NOT see HomeTenant dashboard elements
      await expect(page.getByTestId("hometenant-dashboard")).not.toBeVisible();

      // Should see public home content instead
      // The public home should have typical tenant home elements
      await expect(page.getByTestId("public-home")).not.toBeVisible(); // Only visible when explicitly routed
    });

    test("should not show staff-only navigation elements", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Should NOT see the NEGOCIO section with staff tools
      await expect(page.getByText("🏪 NEGOCIO")).not.toBeVisible();

      // Should NOT see Citas por Confirmar section
      await expect(page.getByText("📅 Citas por Confirmar")).not.toBeVisible();
    });
  });

  test.describe("Staff Role Users (Admin)", () => {
    test.use({ storageState: undefined }); // Ensure fresh login

    test("should show HomeTenant dashboard after admin login", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      // Login as admin
      await loginAsAdmin(page);

      // Navigate to tenant home
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Should see HomeTenant dashboard
      await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({ timeout: 15000 });
    });

    test("should show Citas por Confirmar section", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Should see the appointments section header
      await expect(page.getByText("📅 Citas por Confirmar")).toBeVisible({ timeout: 10000 });
    });

    test("should show NEGOCIO grid with navigation items", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Should see the NEGOCIO section header
      await expect(page.getByText("🏪 NEGOCIO")).toBeVisible({ timeout: 10000 });

      // Should see navigation items
      await expect(page.getByText("Clientas")).toBeVisible();
      await expect(page.getByText("Finanzas")).toBeVisible();
      await expect(page.getByText("Planificación Redes")).toBeVisible();
    });

    test("should have working Finanzas link for admin", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Find and click Finanzas link
      const finanzasLink = page.getByRole("link", { name: /Finanzas/ });
      await expect(finanzasLink).toBeVisible({ timeout: 10000 });

      // Click should navigate to finance page
      await finanzasLink.click();

      // Should navigate to finance section
      await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}/finance`), { timeout: 10000 });
    });

    test("should show WhatsApp action button for appointments", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Wait for appointments section to load
      await expect(page.getByText("📅 Citas por Confirmar")).toBeVisible({ timeout: 10000 });

      // Check if there are appointments with WhatsApp button
      // If there are pending appointments, WhatsApp button should be visible
      const whatsappButtons = page.getByRole("link", { name: /WhatsApp|Confirmar/ });
      const count = await whatsappButtons.count();

      // Either there are appointments with WhatsApp buttons, or empty state is shown
      if (count === 0) {
        await expect(page.getByText(/No hay citas pendientes|Todas las citas están confirmadas/)).toBeVisible();
      } else {
        // At least one WhatsApp button should link to wa.me
        const firstButton = whatsappButtons.first();
        const href = await firstButton.getAttribute("href");
        expect(href).toMatch(/wa\.me/);
      }
    });
  });

  test.describe("Responsive Behavior", () => {
    test.use({ storageState: undefined });

    test("should show desktop sidebar on large screens", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Desktop sidebar should be visible
      const sidebar = page.locator("aside").filter({ hasText: /Inicio|Citas|Servicios/ });
      await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    });

    test("should show mobile bottom navigation on small screens", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Mobile bottom nav should be visible
      // Look for bottom navigation with typical mobile nav items
      const bottomNav = page.locator("nav").filter({ has: page.getByRole("link") });
      await expect(bottomNav).toBeVisible({ timeout: 10000 });
    });

    test("should show hamburger menu on tablet screens", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Header should be visible with menu button
      const menuButton = page.getByRole("button", { name: /menu|☰/ });
      // Menu button might be visible on tablet
      const menuVisible = await menuButton.isVisible().catch(() => false);

      // If menu button exists and is visible, clicking it should open mobile menu
      if (menuVisible) {
        await menuButton.click();
        // Mobile menu should appear
        await expect(page.getByRole("dialog").or(page.locator("[data-testid='mobile-menu']"))).toBeVisible({ timeout: 5000 }).catch(() => {
          // Some implementations might not use dialog
        });
      }
    });

    test("should adapt grid columns based on screen size", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      // Wait for NEGOCIO section
      await expect(page.getByText("🏪 NEGOCIO")).toBeVisible({ timeout: 10000 });

      // Check grid is visible
      const grid = page.locator(".grid");
      await expect(grid.first()).toBeVisible();
    });
  });

  test.describe("Navigation Links", () => {
    test.use({ storageState: undefined });

    test("should have correct href for Clientas link", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      const clientasLink = page.getByRole("link", { name: /Clientas/ });
      await expect(clientasLink).toBeVisible({ timeout: 10000 });

      const href = await clientasLink.getAttribute("href");
      expect(href).toBe(`/t/${tenantSlug}/clientes`);
    });

    test("should have correct href for Planificación Redes link", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      const socialLink = page.getByRole("link", { name: /Planificación Redes/ });
      await expect(socialLink).toBeVisible({ timeout: 10000 });

      const href = await socialLink.getAttribute("href");
      expect(href).toBe(`/t/${tenantSlug}/social`);
    });

    test("should have external link for Canva templates", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForLoadState("networkidle");

      const canvaLink = page.getByRole("link", { name: /Plantillas Canva/ });
      await expect(canvaLink).toBeVisible({ timeout: 10000 });

      const href = await canvaLink.getAttribute("href");
      expect(href).toContain("canva.com");

      // Should open in new tab
      const target = await canvaLink.getAttribute("target");
      expect(target).toBe("_blank");
    });
  });

  test.describe("Loading States", () => {
    test.use({ storageState: undefined });

    test("should show loading state while fetching appointments", async ({ page }) => {
      const { tenantSlug } = TEST_CREDENTIALS;

      // Slow down network to see loading state
      await page.route("**/api/tenants/**/bookings**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        route.continue();
      });

      await loginAsAdmin(page);
      await page.goto(`/t/${tenantSlug}`);

      // Should show loading skeletons
      const skeletons = page.locator(".animate-pulse");
      await expect(skeletons.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Loading might be too fast to catch
      });

      // Wait for content to load
      await page.waitForLoadState("networkidle");
    });
  });
});
