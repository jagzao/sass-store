import { test, expect } from "@playwright/test";

test.describe("Feature: ThemeToggle en header", () => {
  test("SC-12 — toggle visible en header de tenant", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/wondernails", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    const toggle = page.locator('[data-testid="theme-toggle"]').first();
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });

  test("SC-13 — click en toggle cambia data-mode y persiste en localStorage", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/wondernails", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1500);

    const initial = await page.locator("html").getAttribute("data-mode");
    const toggle = page.locator('[data-testid="theme-toggle"]').first();
    await toggle.click();
    await page.waitForTimeout(800);

    const after = await page.locator("html").getAttribute("data-mode");
    expect(after).not.toBe(initial);

    const stored = await page.evaluate(() =>
      localStorage.getItem("theme-mode"),
    );
    expect(stored).toContain(after);
    await ctx.close();
  });

  test("SC-14 — tema persiste tras recarga", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/wondernails", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1500);
    const toggle = page.locator('[data-testid="theme-toggle"]').first();
    await toggle.click();
    await page.waitForTimeout(500);
    const after = await page.locator("html").getAttribute("data-mode");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const reloaded = await page.locator("html").getAttribute("data-mode");
    expect(reloaded).toBe(after);
    await ctx.close();
  });

  test("SC-15 — sin FOUC blanco en zo-system", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/zo-system", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    const bg = await page
      .locator("body")
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgb(255, 255, 255)");
    await ctx.close();
  });
});
