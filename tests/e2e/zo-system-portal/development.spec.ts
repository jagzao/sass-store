import { test, expect } from "@playwright/test";

async function loginZoSystem(page: import("@playwright/test").Page) {
  await page.goto("/t/zo-system/login", {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.fill('[data-testid="email-input"]', "jagzao@gmail.com");
  await page.fill('[data-testid="password-input"]', "admin");
  await page.getByTestId("login-btn").first().click();
  // Wait for session to be established (zo-system landing has no dashboard test-id)
  await page.waitForURL(
    (url) => url.href.includes("/t/zo-system") && !url.href.includes("/login"),
    { timeout: 60000 },
  );
  await page.waitForTimeout(2000);
}

test.describe("Feature: portal de cliente /t/zo-system/development", () => {
  test("SC-07 — portal redirige a login si visitante anónimo", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/t/zo-system/development");
    await page.waitForURL(/\/t\/zo-system\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("callbackUrl");
    await ctx.close();
  });

  test("SC-08 — portal autenticado muestra proyecto seed y sprints", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginZoSystem(page);
    await page.goto("/t/zo-system/development", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);

    const text = (await page.locator("body").innerText()) ?? "";
    expect(text).toContain("Sass Store");
    expect(text).toContain("Sprint");
    await ctx.close();
  });

  test("SC-09 — portal incluye CTA a /services", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await loginZoSystem(page);
    await page.goto("/t/zo-system/development", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(2000);
    const cta = page.locator('a[href="/t/zo-system/services"]').first();
    await expect(cta).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });
});
