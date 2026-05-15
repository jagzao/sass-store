import { test, expect } from "@playwright/test";

/**
 * Multi-tenant public booking flow.
 * Validates que el formulario de reserva funciona para todos los tenants
 * que tienen servicios configurados. Sin login, flujo de guest.
 */

const TENANTS_WITH_SERVICES = [
  { slug: "wondernails", name: "Wonder Nails Studio" },
  { slug: "centro-tenistico", name: "Centro Tenístico" },
];

// manada-juma es booking pero aún no tiene servicios configurados
const TENANTS_BOOKING_NO_SERVICES = [
  { slug: "manada-juma", name: "Manada Juma" },
];

// Tenants catalog sin servicios de agendado
const TENANTS_NO_SERVICES = ["delirios"];

for (const tenant of TENANTS_WITH_SERVICES) {
  test.describe(`Public booking — ${tenant.name} (${tenant.slug})`, () => {
    test.beforeEach(async ({ page }) => {
      // Mock el POST para no crear datos reales en cada ejecución de tests
      await page.route(
        `**/api/tenants/${tenant.slug}/bookings`,
        async (route) => {
          if (route.request().method() === "POST") {
            await route.fulfill({
              status: 201,
              contentType: "application/json",
              body: JSON.stringify({
                data: { id: `e2e-${tenant.slug}-booking`, status: "pending" },
              }),
            });
            return;
          }
          await route.continue();
        },
      );
    });

    test(`renders booking panel with services @BOOK-${tenant.slug.toUpperCase()}`, async ({
      page,
    }) => {
      await page.goto(`/t/${tenant.slug}/book`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });

      // Panel principal del formulario debe estar visible
      await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
        timeout: 60000,
      });

      // Selector de servicios debe estar presente
      await expect(page.getByTestId("book-service-select").first()).toBeVisible(
        {
          timeout: 10000,
        },
      );

      // Debe mostrar al menos un día en el carrusel
      const dayButtons = page.locator('[data-testid^="book-day-"]');
      await expect(dayButtons.first()).toBeVisible({ timeout: 10000 });
      expect(await dayButtons.count()).toBeGreaterThanOrEqual(5);
    });

    test(`complete booking flow: select slot → fill data → submit @BOOK-${tenant.slug.toUpperCase()}`, async ({
      page,
    }) => {
      await page.goto(`/t/${tenant.slug}/book`, {
        waitUntil: "domcontentloaded",
        timeout: 120000,
      });

      await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
        timeout: 60000,
      });

      // Si hoy no hay slots disponibles, avanzar al siguiente día
      let slotCount = await page.locator('[data-testid^="book-time-"]').count();
      if (slotCount === 0) {
        await page.locator('[data-testid^="book-day-"]').nth(2).click();
        await page.waitForTimeout(300);
        slotCount = await page.locator('[data-testid^="book-time-"]').count();
      }

      expect(slotCount).toBeGreaterThan(0);

      // Seleccionar primer slot disponible
      const firstSlot = page.locator('[data-testid^="book-time-"]').first();
      await firstSlot.click();

      // Campos del cliente (guest flow: sin login)
      const customerNameField = page.getByTestId("book-customer-name").first();
      const customerPhoneField = page
        .getByTestId("book-customer-phone")
        .first();
      await expect(customerNameField).toBeVisible({ timeout: 5000 });

      await customerNameField.fill("E2E Test User");
      await customerPhoneField.fill("5551234567");

      // Enviar el formulario
      await page.getByTestId("book-submit").first().click();

      // Verificar mensaje de éxito (mock responde 201)
      await expect(page.getByTestId("book-success").first()).toBeVisible({
        timeout: 15000,
      });
    });
  });
}

test.describe("Tenants sin servicios — mensaje informativo", () => {
  for (const slug of TENANTS_NO_SERVICES) {
    test(`${slug}: muestra mensaje de agenda no disponible`, async ({
      page,
    }) => {
      await page.goto(`/t/${slug}/book`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await expect(page.getByText(/Agenda no disponible/i).first()).toBeVisible(
        { timeout: 15000 },
      );
    });
  }

  // manada-juma es booking pero sin servicios aún (primer load puede tardar)
  for (const tenant of TENANTS_BOOKING_NO_SERVICES) {
    test(`${tenant.slug}: booking sin servicios → muestra agenda no disponible`, async ({
      page,
    }) => {
      await page.goto(`/t/${tenant.slug}/book`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      await expect(page.getByText(/Agenda no disponible/i).first()).toBeVisible(
        { timeout: 30000 },
      );
    });
  }
});
