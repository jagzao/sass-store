import { test, expect } from "@playwright/test";

test.describe("STRY-028 Social Content Generation", () => {
  test.describe.configure({ mode: "serial" });

  test("SC-01: Generate produces draft posts preview", async ({ page }) => {
    await page.route("**/api/v1/social/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            generatedPosts: [
              {
                id: "ai-generated-0",
                title: "Promo Manicura",
                content: "20% descuento esta semana 📅",
                platforms: ["facebook", "instagram"],
                format: "post",
                scheduledAt: "2026-08-05T14:00:00.000Z",
                status: "draft",
                contentType: "promotional",
              },
              {
                id: "ai-generated-1",
                title: "Tip de cuidado",
                content: "Hidrata tus cutículas 💅",
                platforms: ["instagram"],
                format: "story",
                scheduledAt: "2026-08-12T19:00:00.000Z",
                status: "draft",
                contentType: "tip",
              },
            ],
            summary: {
              totalPosts: 2,
              postsByFormat: { post: 1, reel: 0, story: 1 },
              postsByType: {
                promotional: 1,
                before_after: 0,
                trending: 0,
                tip: 1,
              },
              dateRange: { start: "2026-08-01", end: "2026-08-31" },
            },
          },
          meta: {
            requestId: "e2e-sc01",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
        }),
      });
    });

    await page.goto("http://localhost:3003/t/wondernails/social", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page
      .getByRole("button", { name: /generar/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    const generateBtn = page
      .getByRole("button", { name: /Generar \d+ publicaciones/i })
      .first();
    await generateBtn.click();
    await page.waitForTimeout(3000);

    await expect(page.getByText(/Vista previa/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Promo Manicura")).toBeVisible();
    await expect(page.getByText("Tip de cuidado")).toBeVisible();
  });

  test("SC-04: n8n unavailable shows friendly error", async ({ page }) => {
    await page.route("**/api/v1/social/generate", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            message: "Servicio de generación no disponible. Intenta más tarde.",
            type: "NetworkError",
          },
          meta: {
            requestId: "e2e-sc04",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
        }),
      });
    });

    await page.goto("http://localhost:3003/t/wondernails/social", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page
      .getByRole("button", { name: /generar/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    const generateBtn = page
      .getByRole("button", { name: /Generar \d+ publicaciones/i })
      .first();
    await generateBtn.click();
    await page.waitForTimeout(3000);

    await expect(
      page.getByText(/Servicio de generación no disponible/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("SC-03: Invalid content mix disables generate button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3003/t/wondernails/social", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page
      .getByRole("button", { name: /generar/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    const slider = page.locator('input[type="range"]').first();
    await slider.waitFor({ state: "visible", timeout: 5000 });
    await slider.focus();
    await slider.press("Home");
    await page.waitForTimeout(500);

    await expect(page.getByText(/El total debe sumar 100%/i)).toBeVisible();

    const generateBtn = page
      .getByRole("button", { name: /Generar \d+ publicaciones/i })
      .first();
    if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(generateBtn).toBeDisabled();
    }
  });
});
