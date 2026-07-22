import { test, expect } from "@playwright/test";

test.describe("Feature: zo-system default dark", () => {
  test("SC-10 — zo-system carga en modo oscuro sin preferencia", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/zo-system", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2500);

    const dataMode = await page.locator("html").getAttribute("data-mode");
    expect(dataMode).toBe("dark");

    const bg = await page
      .locator("body")
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // dark = rgb con valores bajos
    const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(m).not.toBeNull();
    if (m) {
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      expect(luminance).toBeLessThan(0.2);
    }
    await ctx.close();
  });

  test("SC-11 — preferencia guardada tiene prioridad sobre default zo-system", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/zo-system", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1500);
    // Forzar light (raw value sin comillas JSON)
    await page.evaluate(() => {
      localStorage.setItem("theme-mode", "light");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500);

    const dataMode = await page.locator("html").getAttribute("data-mode");
    expect(dataMode).toBe("light");
    await ctx.close();
  });
});
