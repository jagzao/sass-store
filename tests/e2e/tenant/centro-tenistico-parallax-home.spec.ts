import { test, expect } from "@playwright/test";

/**
 * Home Centro Tenístico — scrollytelling Canvas + GSAP (sin <img> de sprites en DOM).
 * @tag STRY-021 CTV-PARALLAX
 */
test.describe("Centro Tenístico parallax home @CTV-PARALLAX", () => {
  test("single canvas, no sprite imgs in DOM, frame advances on scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/centro-tenistico", {
      waitUntil: "networkidle",
      timeout: 120000,
    });

    await expect(
      page.getByRole("heading", { name: "Clases Grupales" }),
    ).toBeVisible({
      timeout: 60000,
    });

    await expect(page.locator('img[src*="tennis-ball/ball_"]')).toHaveCount(0);

    const content = page.locator(".ctv-scrolly-content");
    await expect(content).toHaveAttribute("data-ctv-scrolly-enabled", "true");

    await expect
      .poll(() => content.getAttribute("data-ctv-load-state"), {
        timeout: 60000,
      })
      .toBe("ready");

    const canvas = page.locator("#hero-canvas");
    await expect(canvas).toHaveCount(1);

    const frameAtTop = await canvas.getAttribute("data-ctv-frame");
    expect(Number(frameAtTop)).toBeGreaterThanOrEqual(0);
    const xAtTop = Number(await canvas.getAttribute("data-ctv-x"));
    const yAtTop = Number(await canvas.getAttribute("data-ctv-y"));
    const scaleAtTop = Number(await canvas.getAttribute("data-ctv-scale"));
    expect(scaleAtTop).toBeGreaterThan(1);

    const hasBallPixelsTop = await page.evaluate(() => {
      const el = document.querySelector(
        "#hero-canvas",
      ) as HTMLCanvasElement | null;
      if (!el) return false;
      const ctx = el.getContext("2d");
      if (!ctx) return false;
      const { width, height } = el;
      const data = ctx.getImageData(0, 0, width, height).data;
      for (let i = 3; i < data.length; i += 32) {
        if (data[i] > 12) return true;
      }
      return false;
    });
    expect(hasBallPixelsTop).toBe(true);

    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight * 0.55),
    );
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-ctv-frame")), {
        timeout: 10000,
      })
      .toBeGreaterThan(Number(frameAtTop));
    await expect
      .poll(
        async () => {
          const x = Number(await canvas.getAttribute("data-ctv-x"));
          return Math.abs(x - xAtTop);
        },
        {
          timeout: 15000,
        },
      )
      .toBeGreaterThan(80);
    await expect
      .poll(
        async () => {
          const y = Number(await canvas.getAttribute("data-ctv-y"));
          return Math.abs(y - yAtTop);
        },
        {
          timeout: 15000,
        },
      )
      .toBeGreaterThan(40);

    const frameMid = Number(await canvas.getAttribute("data-ctv-frame"));
    expect(frameMid).toBeGreaterThan(Number(frameAtTop));
    const xMid = Number(await canvas.getAttribute("data-ctv-x"));
    const yMid = Number(await canvas.getAttribute("data-ctv-y"));
    const scaleMid = Number(await canvas.getAttribute("data-ctv-scale"));
    expect(Math.abs(xMid - xAtTop)).toBeGreaterThan(80);
    expect(Math.abs(yMid - yAtTop)).toBeGreaterThan(40);
    expect(scaleMid).not.toBe(scaleAtTop);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const frameBack = Number(await canvas.getAttribute("data-ctv-frame"));
    expect(frameBack).toBeLessThanOrEqual(frameMid);

    await expect(page.getByTestId("ctv-hero-cta-group")).toBeVisible();
    await page.getByTestId("ctv-hero-cta-group").click({ trial: true });
  });

  test("servicios card gets ball-focus zoom on overlap", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/t/centro-tenistico", {
      waitUntil: "networkidle",
      timeout: 120000,
    });

    await expect(
      page.getByRole("heading", { name: "Clases Grupales" }),
    ).toBeVisible({ timeout: 60000 });

    await expect
      .poll(() =>
        page
          .locator(".ctv-scrolly-content")
          .getAttribute("data-ctv-load-state"),
      )
      .toBe("ready");

    const serviciosCard = page.locator('[data-ctv-focus-card="servicios"]');
    await expect(serviciosCard).toBeVisible();

    await page
      .getByRole("heading", { name: "Servicios y Canchas" })
      .scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));

    await expect
      .poll(() => serviciosCard.getAttribute("data-ctv-ball-focused"), {
        timeout: 20000,
      })
      .toBe("true");
  });

  test("canvas hidden on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/t/centro-tenistico", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    await expect(
      page.getByRole("heading", { name: "Clases Grupales" }),
    ).toBeVisible({
      timeout: 60000,
    });

    await expect(page.locator("#hero-canvas")).toHaveCount(0);
    await expect(page.locator(".ctv-scrolly-content")).toHaveAttribute(
      "data-ctv-scrolly-enabled",
      "false",
    );
  });
});
