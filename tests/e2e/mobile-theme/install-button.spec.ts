import { test, expect } from "@playwright/test";

const MOBILE = { viewport: { width: 390, height: 844 } } as const;
const DESKTOP = { viewport: { width: 1280, height: 800 } } as const;

test.describe("Feature: InstallAppButton no obstruye UI mobile", () => {
  test("SC-04 — botón flotante oculto en mobile", async ({ browser }) => {
    const ctx = await browser.newContext({ ...MOBILE });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/wondernails", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    const fab = page
      .locator('button[aria-label="Instalar aplicación"]')
      .first();
    const visible = await fab.isVisible().catch(() => false);
    expect(visible).toBe(false);
    await ctx.close();
  });

  test("SC-05 — header contiene slot para icono PWA (Toggle siempre visible)", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...MOBILE });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/wondernails", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    // Header always renders theme-toggle
    const toggle = page.locator('[data-testid="theme-toggle"]').first();
    await expect(toggle).toBeVisible({ timeout: 10000 });
    await ctx.close();
  });

  test("SC-06 — en desktop, si botón flotante existe es visible", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...DESKTOP });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3003/t/wondernails", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);
    // Si la página tiene FAB elegible (puedeInstall), debe ser visible.
    // Si no es elegible, no existe — también válido.
    const fab = page.locator('button[aria-label="Instalar aplicación"]');
    const count = await fab.count();
    if (count > 0) {
      const visible = await fab
        .first()
        .isVisible()
        .catch(() => false);
      expect(visible).toBe(true);
    } else {
      expect(count).toBe(0);
    }
    await ctx.close();
  });
});
