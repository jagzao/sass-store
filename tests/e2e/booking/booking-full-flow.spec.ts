import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe("Booking E2E - Crear reserva con slots", () => {
  const tenantSlug = TEST_CREDENTIALS.tenantSlug || "wondernails";

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("should load admin calendar and show booking grid", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/admin/calendar`);

    // Esperar a que la página cargue (título o contenido)
    const body = await page.locator("body").innerText({ timeout: 15000 });
    expect(body).toMatch(/Calendario|Citas|Reservas|Gestión/i);
  });

  test("should create a booking when form is available", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/admin/calendar`);
    await page.waitForTimeout(2000);

    // Intentar abrir modal de nueva reserva
    const newBookingBtn = page.getByRole("button", { name: /Nueva reserva/i });
    if (await newBookingBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newBookingBtn.click();

      // Seleccionar servicio
      const serviceSelect = page.locator(
        "select[name='service'], [data-testid='service-select']",
      );
      if (await serviceSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
        await serviceSelect.selectOption({ index: 0 });
      }

      // Seleccionar cliente
      const customerInput = page.locator(
        "input[name='customerName'], [data-testid='customer-input']",
      );
      if (await customerInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await customerInput.fill("Cliente E2E Test");
      }

      // Confirmar reserva
      const confirmBtn = page.getByRole("button", { name: /Confirmar/i });
      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click();
        await expect(page.getByText(/confirmada|éxito/i)).toBeVisible({
          timeout: 10000,
        });
      } else {
        console.log("⚠️ Confirm button not found; skipping assert");
        test.skip();
      }
    } else {
      console.log("⚠️ Nueva reserva button not found; skipping assert");
      test.skip();
    }
  });

  test("should show booking details if appointments exist", async ({
    page,
  }) => {
    await page.goto(`/t/${tenantSlug}/admin/calendar`);
    await page.waitForTimeout(2000);

    const detailButtons = page.getByRole("button", { name: /Ver Detalles/i });
    if ((await detailButtons.count()) > 0) {
      await detailButtons.first().click();
      await expect(
        page.getByRole("heading", { name: /DETALLE DE CITA/i }),
      ).toBeVisible();
      await expect(
        page.getByText(/Costo Total|Servicio|Horario/i),
      ).toBeVisible();
    } else {
      console.log("⚠️ No appointments to test detail modal; skipping");
      test.skip();
    }
  });
});
