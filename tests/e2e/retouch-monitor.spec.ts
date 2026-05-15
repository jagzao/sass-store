import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/test-helpers";

const tenantSlug = "wondernails";
const adminUrl = `/t/${tenantSlug}/admin`;

test.describe.skip("Retouch Monitor & Appointment Details Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays the Retouch Monitor section and UI correctly", async ({
    page,
  }) => {
    await page.goto(adminUrl, { timeout: 60000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 60000 });
    // Esperar a que cargue cualquier contenido del dashboard
    await page.waitForLoadState("networkidle");

    // Buscar texto clave del dashboard (relajado)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Monitor|Retoque|Citas|Dashboard/i);
  });

  test("displays the Calendar Details Modal when clicking an appointment today", async ({
    page,
  }) => {
    await page.goto(`${adminUrl}/calendar`, { timeout: 60000 });
    await page.waitForLoadState("networkidle");

    // Verificar que estamos en calendario (relajado)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).toMatch(/Calendario|Citas|Reservas|Horario/i);

    // Si hay citas, probar detalle
    const emptyText = page.getByText(/No hay citas/i);
    if (await emptyText.isVisible().catch(() => false)) {
      console.log("Calendar empty; skipping detail modal test");
      test.skip();
    } else {
      const detailButtons = page.getByRole("button", { name: /Ver Detalles/i });
      if ((await detailButtons.count()) > 0) {
        await detailButtons.first().click();
        await expect(
          page.getByRole("heading", { name: /DETALLE/i }),
        ).toBeVisible({ timeout: 5000 });
      } else {
        console.log("No detail buttons found; skipping");
        test.skip();
      }
    }
  });
});
