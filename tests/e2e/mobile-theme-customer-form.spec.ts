import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/test-helpers";

const TENANTS = ["wondernails"];
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";

async function loginToTenant(
  page,
  tenantSlug: string,
  email: string,
  password: string,
) {
  await page.goto(`${BASE}/t/${tenantSlug}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.getByTestId("email-input").first()).toBeVisible({
    timeout: 60000,
  });
  await page.getByTestId("email-input").first().fill(email);
  await page.getByTestId("password-input").first().fill(password);
  await page.getByTestId("login-btn").first().click({ force: true });

  await page.waitForURL(
    (url) =>
      url.href.includes(`/t/${tenantSlug}`) && !url.href.includes("/login"),
    { timeout: 60000 },
  );
}

for (const tenantSlug of TENANTS) {
  test.describe(`@stry-029 ${tenantSlug} theme and mobile UI`, () => {
    test.use({ viewport: MOBILE_VIEWPORT });

    test("user menu has opaque background and readable text", async ({
      page,
    }) => {
      await loginAs(page, tenantSlug, "jagzao@gmail.com", "admin");

      await page.click("#user-menu-button");
      const menu = page.locator('[role="menu"]');
      await expect(menu).toBeVisible();

      const bg = await menu.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );
      expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    });

    test("customer form fields are readable", async ({ page }) => {
      await loginAs(page, tenantSlug, "jagzao@gmail.com", "admin");

      await page.goto(`/t/${tenantSlug}/clientes/nueva`);
      const input = page.locator('input[aria-label="Nombre Completo"]').first();
      await expect(input).toBeVisible();

      const color = await input.evaluate(
        (el) => window.getComputedStyle(el).color,
      );
      const bg = await input.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      );
      expect(color).not.toBe(bg);
    });

    test("theme toggle changes mode and persists", async ({ page }) => {
      await loginAs(page, tenantSlug, "jagzao@gmail.com", "admin");

      const toggle = page.locator('[data-testid="theme-toggle"]');
      await expect(toggle).toBeVisible();

      const initialMode = await page.evaluate(() =>
        localStorage.getItem("theme-mode"),
      );
      await toggle.click();
      await page.waitForTimeout(200);
      const newMode = await page.evaluate(() =>
        localStorage.getItem("theme-mode"),
      );
      expect(newMode).not.toBe(initialMode);
    });
  });
}

test.describe("@stry-029 zo-system theme and dark default", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("zo-system admin pages render readable customer form", async ({
    page,
  }) => {
    await loginToTenant(page, "zo-system", "jagzao@gmail.com", "admin");

    await page.goto(`${BASE}/t/zo-system/clientes/nueva`);
    const input = page.locator('input[aria-label="Nombre Completo"]').first();
    await expect(input).toBeVisible();

    const color = await input.evaluate(
      (el) => window.getComputedStyle(el).color,
    );
    const bg = await input.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );
    expect(color).not.toBe(bg);
  });

  test("zo-system loads in dark mode with no prior preference", async ({
    page,
  }) => {
    await page.goto("/t/zo-system/login");
    await page.evaluate(() => localStorage.removeItem("theme-mode"));
    await page.reload();

    const bg = await page.evaluate(
      () => window.getComputedStyle(document.body).backgroundColor,
    );
    // dark background from default dark theme (#0D0D0D)
    expect(bg).toBe("rgb(13, 13, 13)");

    const mode = await page.evaluate(() =>
      document.documentElement.getAttribute("data-mode"),
    );
    expect(mode).toBe("dark");
  });

  test("theme toggle changes mode and persists on zo-system", async ({
    page,
  }) => {
    await loginToTenant(page, "zo-system", "jagzao@gmail.com", "admin");

    const toggle = page.locator('[data-testid="theme-toggle"]');
    await expect(toggle).toBeVisible();

    const initialMode = await page.evaluate(() =>
      localStorage.getItem("theme-mode"),
    );
    await toggle.click();
    await page.waitForTimeout(200);
    const newMode = await page.evaluate(() =>
      localStorage.getItem("theme-mode"),
    );
    expect(newMode).not.toBe(initialMode);
  });
});
