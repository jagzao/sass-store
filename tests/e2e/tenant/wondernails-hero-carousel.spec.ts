import { test, expect } from "@playwright/test";

test.describe("Feature: Hero carousel de wondernails no reinicia su animacion de entrada", () => {
  test("SC-01 — el texto del slide principal no regresa a opacidad baja tras aparecer (sin flicker por swap de datos)", async ({
    page,
  }) => {
    await page.goto("/t/wondernails", { waitUntil: "domcontentloaded" });

    let reachedVisible = false;
    let regressed = false;

    for (let i = 0; i < 12; i++) {
      const opacity = await page.evaluate(() => {
        const items = document.querySelectorAll(
          '[data-testid="carousel-item"]',
        );
        const main = items[1];
        const title = main?.querySelector('div[class*="title"]');
        return title ? parseFloat(getComputedStyle(title).opacity) : 0;
      });

      if (opacity >= 0.85) {
        reachedVisible = true;
      } else if (reachedVisible && opacity < 0.5) {
        regressed = true;
      }

      await page.waitForTimeout(400);
    }

    expect(reachedVisible).toBe(true);
    expect(regressed).toBe(false);
  });

  test("SC-02 — el titulo del slide principal es visible pocos segundos despues de cargar", async ({
    page,
  }) => {
    await page.goto("/t/wondernails", { waitUntil: "domcontentloaded" });

    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            const items = document.querySelectorAll(
              '[data-testid="carousel-item"]',
            );
            const main = items[1];
            const title = main?.querySelector('div[class*="title"]');
            return title ? parseFloat(getComputedStyle(title).opacity) : 0;
          }),
        { timeout: 5000 },
      )
      .toBeGreaterThan(0.8);
  });
});
