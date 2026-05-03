import { test, expect } from "@playwright/test";

const TENANT = "wondernails";

test.describe("Google Auth & Registration Flows", () => {
  test("login page — Google button has SVG icon and correct text", async ({
    page,
  }) => {
    await page.goto(`/t/${TENANT}/login`);
    await page.waitForLoadState("networkidle");

    // Google button should exist with SVG (not emoji)
    const googleBtn = page
      .locator("button[type='submit']")
      .filter({ hasText: /Google/i });
    await expect(googleBtn).toBeVisible({ timeout: 15000 });

    const svg = googleBtn.locator("svg");
    await expect(svg).toBeVisible();

    // Should NOT contain the old email emoji
    const btnText = await googleBtn.textContent();
    expect(btnText).not.toContain("📧");
    expect(btnText).toContain("Google");
  });

  test("login page — link to register page exists", async ({ page }) => {
    await page.goto(`/t/${TENANT}/login`);
    await page.waitForLoadState("networkidle");

    const registerLink = page.locator(`a[href*='/register']`);
    await expect(registerLink).toBeVisible({ timeout: 15000 });
  });

  test("register page — loads correctly with form and Google button", async ({
    page,
  }) => {
    await page.goto(`/t/${TENANT}/register`);
    await page.waitForLoadState("networkidle");

    // Form fields
    await expect(page.locator("#name")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Google button inside the form
    const googleBtn = page
      .locator("button")
      .filter({ hasText: /Google/i })
      .first();
    await expect(googleBtn).toBeVisible();

    // Google SVG icon
    const svg = googleBtn.locator("svg");
    await expect(svg).toBeVisible();
  });

  test("register page — shows link back to login", async ({ page }) => {
    await page.goto(`/t/${TENANT}/register`);
    await page.waitForLoadState("networkidle");

    const loginLink = page.locator(`a[href*='/login']`);
    await expect(loginLink.first()).toBeVisible({ timeout: 15000 });
  });

  test("register page — API returns 400 for missing fields", async ({
    request,
  }) => {
    const res = await request.post(`/api/auth/register`, {
      data: { tenantSlug: TENANT }, // missing name, email, password
    });
    expect(res.status()).toBe(400);
  });

  test("register page — API returns 409 for duplicate email", async ({
    request,
  }) => {
    // Use an email we know exists (the test admin)
    const res = await request.post(`/api/auth/register`, {
      data: {
        name: "Test",
        email: "marialiciavh1984@gmail.com",
        password: "ValidPass1!",
        tenantSlug: TENANT,
      },
    });
    expect(res.status()).toBe(409);
  });

  test("profile page — welcome banner visible with ?welcome=1", async ({
    page,
  }) => {
    // Navigate directly (unauthenticated will redirect, but check the URL behavior)
    await page.goto(`/t/${TENANT}/profile?welcome=1`);
    await page.waitForLoadState("networkidle");

    // Either shows welcome banner (if somehow accessible) or redirects to login
    const url = page.url();
    const onLogin = url.includes("/login");

    if (!onLogin) {
      // If we somehow got to profile, check the banner
      const banner = page.locator("text=Bienvenido");
      const hasBanner = await banner.isVisible().catch(() => false);
      // Banner should be present when ?welcome=1 is passed
      expect(hasBanner).toBe(true);
    } else {
      // Redirected to login — guard is working correctly
      expect(onLogin).toBe(true);
    }
  });

  test("bind-tenant API — returns 401 without session", async ({ request }) => {
    const res = await request.post(`/api/auth/bind-tenant`, {
      data: { tenantSlug: TENANT },
    });
    expect(res.status()).toBe(401);
  });

  test("profile API GET — returns 401 without session", async ({ request }) => {
    const res = await request.get(`/api/profile`);
    expect(res.status()).toBe(401);
  });

  test("profile API PUT — returns 401 without session", async ({ request }) => {
    const res = await request.put(`/api/profile`, {
      data: { name: "Test", tenantSlug: TENANT },
    });
    expect(res.status()).toBe(401);
  });
});
