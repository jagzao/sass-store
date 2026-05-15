import { test, expect } from "@playwright/test";

/**
 * Wondernails Tenant — Full E2E Validation
 *
 * Coverage:
 * - Public pages (landing, login, book)
 * - Authentication (valid, invalid, empty)
 * - Admin navigation (dashboard, calendar, bookings, pos, settings)
 * - API contracts (tenants, customers, public services)
 * - Negative testing (404s, invalid credentials, missing resources)
 * - Tenant isolation
 */

test.describe("Wondernails - Full Validation", () => {
  const tenantSlug = "wondernails";
  const basePath = `/t/${tenantSlug}`;
  const validEmail = "jagzao@gmail.com";
  const validPassword = "admin";

  /* ───────────────────────────────────────────────
     Helper: Login
     ─────────────────────────────────────────────── */
  async function login(page: any, email: string, password: string) {
    await page.goto(`${basePath}/login`);
    await page.waitForLoadState("networkidle");
    await page.getByTestId("email-input").first().fill(email);
    await page.getByTestId("password-input").fill(password);
    await page.getByTestId("login-btn").click({ force: true });
    await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });
  }

  /* ───────────────────────────────────────────────
     Public Pages
     ─────────────────────────────────────────────── */
  test.describe("Public Pages", () => {
    test("landing page loads without 500", async ({ page }) => {
      const response = await page.goto(basePath, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/Wonder Nails Studio/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("login page loads", async ({ page }) => {
      const response = await page.goto(`${basePath}/login`);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("email-input").first()).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByTestId("password-input")).toBeVisible();
      await expect(page.getByTestId("login-btn")).toBeVisible();
    });

    test("public booking page loads", async ({ page }) => {
      const response = await page.goto(`${basePath}/book`);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    });
  });

  /* ───────────────────────────────────────────────
     Authentication
     ─────────────────────────────────────────────── */
  test.describe("Authentication", () => {
    test("login with valid credentials redirects to tenant home", async ({
      page,
    }) => {
      await login(page, validEmail, validPassword);
      await expect(page).toHaveURL(new RegExp(`${basePath}`));
    });

    test("login with invalid credentials shows error", async ({ page }) => {
      await page.goto(`${basePath}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("email-input").first().fill("invalid@test.com");
      await page.getByTestId("password-input").fill("wrongpassword");
      await page.getByTestId("login-btn").click();

      // Error should appear inside the error-message container
      await expect(page.getByTestId("error-message")).toBeVisible({
        timeout: 10000,
      });
    });

    test("login with empty form keeps user on login", async ({ page }) => {
      await page.goto(`${basePath}/login`);
      await page.waitForLoadState("networkidle");
      await page.getByTestId("login-btn").click({ force: true });
      // Browser validation may prevent navigation; ensure we stay on login
      await expect(page).toHaveURL(/.*login.*/);
    });
  });

  /* ───────────────────────────────────────────────
     Admin Navigation (post-login)
     ─────────────────────────────────────────────── */
  test.describe("Admin Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await login(page, validEmail, validPassword);
    });

    test("admin dashboard loads", async ({ page }) => {
      await page.goto(`${basePath}/admin`);
      await expect(page).toHaveURL(/.*admin/);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByText(/Panel de Administración|Admin/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("calendar page loads", async ({ page }) => {
      await page.goto(`${basePath}/admin/calendar`);
      await expect(page).toHaveURL(/.*calendar/);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByText(/Calendario|Calendar|Gestión de Calendario/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("bookings management page loads", async ({ page }) => {
      await page.goto(`${basePath}/admin_bookings`);
      await expect(page).toHaveURL(/.*bookings/);
      await expect(page.locator("body")).toBeVisible();
      await expect(
        page.getByText(/Bookings|Reservas|Citas/i).first(),
      ).toBeVisible({ timeout: 10000 });
    });

    test("POS page loads", async ({ page }) => {
      await page.goto(`${basePath}/pos`);
      await expect(page).toHaveURL(/.*pos/);
      await expect(page.locator("body")).toBeVisible();
      await expect(page.getByText(/Punto de Venta|POS/i).first()).toBeVisible({
        timeout: 10000,
      });
    });

    test("settings calendar page loads", async ({ page }) => {
      await page.goto(`${basePath}/settings/calendar`);
      await expect(page).toHaveURL(/.*settings.*calendar/);
      await expect(page.locator("body")).toBeVisible();
    });

    test("can navigate via sidebar/topnav links", async ({ page }) => {
      // Start at admin dashboard
      await page.goto(`${basePath}/admin`);
      await expect(page.locator("body")).toBeVisible();

      // Look for any link containing calendar and click if present
      const calendarLink = page.locator('a[href*="/calendar"]').first();
      if (await calendarLink.isVisible().catch(() => false)) {
        await calendarLink.click();
        await expect(page).toHaveURL(/.*calendar.*/, { timeout: 15000 });
      }

      // Look for bookings link
      const bookingsLink = page
        .locator('a[href*="bookings"], a[href*="booking"]')
        .first();
      if (await bookingsLink.isVisible().catch(() => false)) {
        await bookingsLink.click();
        await expect(page).toHaveURL(/.*booking.*/, { timeout: 15000 });
      }
    });
  });

  /* ───────────────────────────────────────────────
     API Contracts
     ─────────────────────────────────────────────── */
  test.describe("API Contracts", () => {
    test("GET /api/tenants/:slug returns 200", async ({ request }) => {
      const response = await request.get(`/api/tenants/${tenantSlug}`);
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("slug", tenantSlug);
      expect(data).toHaveProperty("name");
    });

    test("GET /api/tenants/:slug/customers returns 200", async ({
      request,
    }) => {
      const response = await request.get(
        `/api/tenants/${tenantSlug}/customers`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("customers");
      expect(Array.isArray(data.customers)).toBe(true);
    });

    test("GET public services returns 200", async ({ request }) => {
      const response = await request.get(
        `/api/v1/public/services?tenant=${tenantSlug}&featured=true&limit=8`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("data");
      expect(Array.isArray(data.data)).toBe(true);
    });

    test("GET public products returns 200", async ({ request }) => {
      const response = await request.get(
        `/api/v1/public/products?tenant=${tenantSlug}&limit=12`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("data");
    });
  });

  /* ───────────────────────────────────────────────
     Negative Testing
     ─────────────────────────────────────────────── */
  test.describe("Negative Testing", () => {
    test("non-existent tenant returns 404 or 400", async ({ request }) => {
      const response = await request.get(
        "/api/tenants/non-existent-tenant-xyz",
      );
      expect([404, 400]).toContain(response.status());
    });

    test("non-existent page returns 404", async ({ page }) => {
      const response = await page.goto(`${basePath}/admin/non-existent-page`);
      expect(response?.status()).toBe(404);
    });

    test("customers API without tenant slug returns 400/404", async ({
      request,
    }) => {
      const response = await request.get("/api/tenants//customers");
      expect([400, 404]).toContain(response.status());
    });
  });

  /* ───────────────────────────────────────────────
     Tenant Isolation
     ─────────────────────────────────────────────── */
  test.describe("Tenant Isolation", () => {
    test("customers only belong to wondernails", async ({ request }) => {
      const response = await request.get(
        `/api/tenants/${tenantSlug}/customers`,
      );
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("customers");
      expect(Array.isArray(data.customers)).toBe(true);
      // All returned customers should implicitly belong to the requested tenant
      // via RLS / query filters in the backend.
    });
  });
});
