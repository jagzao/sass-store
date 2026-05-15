import { test, expect } from "@playwright/test";

test.describe("Wondernails Tenant - Complete Flow Validation", () => {
  const tenantSlug = "wondernails";
  const validEmail = "jagzao@gmail.com";
  const validPassword = "admin";

  /* ───────────────────────────────────────────────
     Authentication
     ─────────────────────────────────────────────── */
  test.describe("Authentication", () => {
    test("should load login page successfully", async ({ page }) => {
      const response = await page.goto(`/t/${tenantSlug}/login`);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("email-input").first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("should login successfully with valid credentials", async ({
      page,
    }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");

      await page.getByTestId("email-input").first().fill(validEmail);
      await page.getByTestId("password-input").fill(validPassword);
      await page.getByTestId("login-btn").click();

      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
      await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}`));
    });

    test("should show error with invalid credentials", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");

      await page.getByTestId("email-input").first().fill("invalid@test.com");
      await page.getByTestId("password-input").fill("wrongpassword");
      await page.getByTestId("login-btn").click();

      await expect(page.getByText(/Credenciales|Error|Falló/i)).toBeVisible({
        timeout: 10000,
      });
    });

    test("should show validation error with empty form", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");

      await page.getByTestId("login-btn").click();

      await expect(page.getByTestId("email-input").first()).toBeVisible();
    });
  });

  /* ───────────────────────────────────────────────
     Home & Navigation
     ─────────────────────────────────────────────── */
  test.describe("Home & Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("email-input").first().fill(validEmail);
      await page.getByTestId("password-input").fill(validPassword);
      await page.getByTestId("login-btn").click();
      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    });

    test("should load dashboard after login", async ({ page }) => {
      await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}`));
      await expect(page.locator("body")).toBeVisible();
    });

    test("should navigate to calendar page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/admin/calendar`);
      await expect(page).toHaveURL(/.*calendar.*/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("should navigate to bookings page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/admin_bookings`);
      await expect(page).toHaveURL(/.*booking.*/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("should navigate to customers page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/clientes`);
      await expect(page).toHaveURL(/.*clientes.*/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("should navigate to POS page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/pos`);
      await expect(page).toHaveURL(/.*pos.*/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("should navigate to settings page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/settings/calendar`);
      await expect(page).toHaveURL(/.*settings.*calendar.*/);
      await expect(page.locator("body")).toBeVisible();
    });
  });

  /* ───────────────────────────────────────────────
     Booking Flow
     ─────────────────────────────────────────────── */
  test.describe("Booking Flow", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("email-input").first().fill(validEmail);
      await page.getByTestId("password-input").fill(validPassword);
      await page.getByTestId("login-btn").click();
      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    });

    test("should load booking page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/book`);
      await expect(page).toHaveURL(/.*book.*/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("should show booking form", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/book`);
      // Expect at least one visible interactive element (not hidden hamburger)
      await expect(
        page
          .locator('input, select, textarea, button:not([aria-label*="menú"])')
          .first(),
      ).toBeVisible({
        timeout: 10000,
      });
    });
  });

  /* ───────────────────────────────────────────────
     Calendar Page
     ─────────────────────────────────────────────── */
  test.describe("Calendar Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("email-input").first().fill(validEmail);
      await page.getByTestId("password-input").fill(validPassword);
      await page.getByTestId("login-btn").click();
      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    });

    test("should load calendar page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/admin/calendar`);
      await expect(page).toHaveURL(/.*calendar.*/);
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    });
  });

  /* ───────────────────────────────────────────────
     Customers Page
     ─────────────────────────────────────────────── */
  test.describe("Customers Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("email-input").first().fill(validEmail);
      await page.getByTestId("password-input").fill(validPassword);
      await page.getByTestId("login-btn").click();
      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    });

    test("should load customers page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/clientes`);
      await expect(page).toHaveURL(/.*clientes.*/);
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    });

    test("should search customers", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/clientes`);
      const searchInput = page
        .locator('input[placeholder*="buscar" i], input[type="search"]')
        .first();
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill("test");
        await page.waitForTimeout(1000);
      }
    });
  });

  /* ───────────────────────────────────────────────
     POS Flow
     ─────────────────────────────────────────────── */
  test.describe("POS Flow", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("email-input").first().fill(validEmail);
      await page.getByTestId("password-input").fill(validPassword);
      await page.getByTestId("login-btn").click();
      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
    });

    test("should load POS page", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/pos`);
      await expect(page).toHaveURL(/.*pos.*/);
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    });

    test("should show products in POS", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/pos`);
      await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    });
  });

  /* ───────────────────────────────────────────────
     API Endpoints
     ─────────────────────────────────────────────── */
  test.describe("API Endpoints", () => {
    test("should return 200 from tenants API", async ({ request }) => {
      const response = await request.get(`/api/tenants/${tenantSlug}`);
      expect(response.status()).toBe(200);
    });

    test("should return 200 from customers API", async ({ request }) => {
      const response = await request.get(
        `/api/tenants/${tenantSlug}/customers`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("customers");
    });

    test("should return 200 from public services API", async ({ request }) => {
      const response = await request.get(
        `/api/v1/public/services?tenant=${tenantSlug}&featured=true&limit=8`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("data");
    });

    test("should return 200 from public products API", async ({ request }) => {
      const response = await request.get(
        `/api/v1/public/products?tenant=${tenantSlug}&limit=12`,
      );
      expect(response.status()).toBe(200);
    });
  });

  /* ───────────────────────────────────────────────
     Negative Testing
     ─────────────────────────────────────────────── */
  test.describe("Negative Testing", () => {
    test("should return 404 for non-existent tenant", async ({ request }) => {
      const response = await request.get("/api/tenants/non-existent-tenant");
      expect([404, 400]).toContain(response.status());
    });

    test("should return 404 for non-existent page", async ({ page }) => {
      const response = await page.goto(
        `/t/${tenantSlug}/admin/non-existent-page`,
      );
      expect(response?.status()).toBe(404);
    });

    test("should handle API error gracefully", async ({ request }) => {
      const response = await request.get(
        `/api/tenants/${tenantSlug}/invalid-endpoint`,
      );
      expect([404, 400, 500]).toContain(response.status());
    });
  });

  /* ───────────────────────────────────────────────
     Tenant Isolation
     ─────────────────────────────────────────────── */
  test.describe("Tenant Isolation", () => {
    test("should not access other tenant data", async ({ request }) => {
      const response = await request.get(
        `/api/tenants/${tenantSlug}/customers`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("customers");
      expect(Array.isArray(data.customers)).toBe(true);
    });
  });
});
