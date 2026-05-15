import { test, expect } from "@playwright/test";

/**
 * Flujo público de reserva CTV (sin login).
 * @tag CTV-BOOK
 */
test.describe("CTV public book flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      "**/api/tenants/centro-tenistico/bookings",
      async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                id: "e2e-booking-id",
                tenantId: "t1",
                status: "pending",
              },
            }),
          });
          return;
        }
        await route.continue();
      },
    );
  });

  test("single-screen book flow: select slot, fill data, confirm @CTV-BOOK", async ({
    page,
  }) => {
    await page.goto("/t/centro-tenistico/book", {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });

    const bookPanel = page.getByTestId("book-session-panel").first();
    await expect(bookPanel).toBeVisible({
      timeout: 60000,
    });

    await expect(page.getByTestId("book-service-select").first()).toBeVisible();

    // Si hoy ya no hay slots disponibles, elegir otro día del carrusel
    const slotCount = await page.locator('[data-testid^="book-time-"]').count();
    if (slotCount === 0) {
      await page.locator('[data-testid^="book-day-"]').nth(2).click();
    }

    const firstSlot = page.locator('[data-testid^="book-time-"]').first();
    await expect(firstSlot).toBeVisible({ timeout: 15000 });
    await firstSlot.click();

    await page.getByTestId("book-customer-name").first().fill("E2E Jugador");
    await page.getByTestId("book-customer-phone").first().fill("5551234567");

    await page.getByTestId("book-submit").first().click();

    await expect(page.getByTestId("book-success").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
