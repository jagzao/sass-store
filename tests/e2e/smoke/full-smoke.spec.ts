import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

const { tenantSlug } = TEST_CREDENTIALS;

test.describe("Smoke Suite — Production Gate", () => {
  test.describe.configure({ timeout: 90000 });

  // ─── API Health ────────────────────────────────────────────────────────────

  test("API health check returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  test("Auth session endpoint is reachable", async ({ request }) => {
    const res = await request.get("/api/auth/session");
    expect(res.status()).toBe(200);
  });

  test("Debug endpoints return 404 in production", async ({ request }) => {
    if (process.env.NODE_ENV !== "production") {
      test.skip();
      return;
    }
    const seed = await request.post("/api/debug/seed-e2e");
    expect(seed.status()).toBe(404);
    const diag = await request.get("/api/diagnose/comprehensive");
    expect(diag.status()).toBe(404);
  });

  // ─── Public Pages ──────────────────────────────────────────────────────────

  test("Landing page responds without server error", async ({ request }) => {
    const res = await request.get("/");
    expect([200, 301, 302]).toContain(res.status());
  });

  test("zo-system fallback tenant responds without server error", async ({
    request,
  }) => {
    const res = await request.get("/t/zo-system/");
    expect([200, 301, 302]).toContain(res.status());
  });

  test("Login page is accessible", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/login`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await expect(page.getByTestId("email-input").first()).toBeVisible({
      timeout: 20000,
    });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("Public booking page loads", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/book`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
    expect(body).not.toContain("Internal Server Error");
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe("complete");
  });

  // ─── Authenticated Pages ───────────────────────────────────────────────────

  test.describe("Authenticated smoke", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test("Admin dashboard responds without server error", async ({
      request,
    }) => {
      const res = await request.get(`/t/${tenantSlug}/admin/`);
      expect([200, 301, 302]).toContain(res.status());
    });

    test("Calendar admin loads with stats cards", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/admin/calendar`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");
      const hasCalendarContent =
        body?.includes("Hoy") ||
        body?.includes("citas") ||
        body?.includes("Confirmadas") ||
        body?.includes("Calendario");
      expect(hasCalendarContent).toBe(true);
    });

    test("Finance page loads", async ({ page }) => {
      await page.goto(`/t/${tenantSlug}/finance`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForLoadState("networkidle").catch(() => {});
      const body = await page.locator("body").textContent();
      expect(body).not.toContain("Application error");
      expect(body).not.toContain("Internal Server Error");
    });

    test("Products admin page responds without server error", async ({
      request,
    }) => {
      const res = await request.get(`/t/${tenantSlug}/admin/products`);
      expect([200, 301, 302]).toContain(res.status());
    });

    test("Clientes (CRM) page responds without server error", async ({
      request,
    }) => {
      const res = await request.get(`/t/${tenantSlug}/clientes`);
      expect([200, 301, 302]).toContain(res.status());
    });
  });

  // ─── Key API Endpoints ─────────────────────────────────────────────────────

  test("Tenant bookings API returns valid response", async ({ request }) => {
    const res = await request.get(`/api/tenants/${tenantSlug}/bookings`);
    expect([200, 401, 403]).toContain(res.status());
  });

  test("Calendar settings API returns valid response", async ({ request }) => {
    const res = await request.get(
      `/api/tenants/${tenantSlug}/calendar/settings`,
    );
    expect([200, 401, 403]).toContain(res.status());
  });

  test("Customer match API returns valid response", async ({ request }) => {
    const res = await request.get(
      `/api/tenants/${tenantSlug}/customers/match?name=test`,
    );
    expect([200, 401, 403]).toContain(res.status());
  });

  test("Internal notifications API rejects unauthenticated", async ({
    request,
  }) => {
    const res = await request.get("/api/internal/scheduled-notifications");
    expect([401, 403]).toContain(res.status());
  });
});
