import { test, expect } from "@playwright/test";

/**
 * Demo con video: ejecutar con
 *   npx playwright test tests/e2e/demo/centro-tenistico-book-demo.spec.ts --video=on
 */
test.use({ video: "on", navigationTimeout: 120000 });

test("demo: CTV book session UI @CTV-BOOK-DEMO", async ({ page }) => {
  await page.route(
    "**/api/tenants/centro-tenistico/bookings",
    async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ data: { id: "demo-id", status: "pending" } }),
        });
        return;
      }
      await route.continue();
    },
  );

  await page.goto("/t/centro-tenistico/book", {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  // Esperar network idle para asegurar carga completa con video overhead
  await page.waitForLoadState("networkidle", { timeout: 60000 });

  await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
    timeout: 60000,
  });

  // Si no hay slots disponibles hoy, pasar al siguiente día
  const slotCount = await page.locator('[data-testid^="book-time-"]').count();
  if (slotCount === 0) {
    await page.locator('[data-testid^="book-day-"]').nth(3).click();
    await page.waitForTimeout(500);
  }

  const firstSlot = page.locator('[data-testid^="book-time-"]').first();
  await expect(firstSlot).toBeVisible({ timeout: 15000 });
  await firstSlot.click();

  await page.getByTestId("book-customer-name").first().fill("Demo Club");
  await page.getByTestId("book-customer-phone").first().fill("5550001111");
  await page.getByTestId("book-submit").first().click();
  await expect(page.getByTestId("book-success").first()).toBeVisible({
    timeout: 15000,
  });
});
