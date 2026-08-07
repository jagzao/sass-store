import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";

test.describe("Feature: Captura y enrutamiento de feedback", () => {
  test("SC-05 — UI rechaza cuarto envío dentro de 15 minutos", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // STRY-034: wondernails reemplazó el botón plano de feedback por Wonder.
    await page.goto("/t/manada-juma");

    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Abrir feedback" }).click();
      await page
        .getByPlaceholder("Cuéntanos qué piensas o qué problema encontraste...")
        .fill(`Mensaje de prueba número ${i + 1} para verificar rate limit`);

      await page.route("**/api/feedback", async (route, request) => {
        if (request.method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              data: {
                feedbackId: `fb-${i}`,
                status: "sent",
                message: "Gracias por tu feedback",
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.getByRole("button", { name: "Enviar feedback" }).click();
      await expect(
        page.getByText("Gracias por tu feedback").first(),
      ).toBeVisible({ timeout: 5000 });
    }

    await page.getByRole("button", { name: "Abrir feedback" }).click();
    await page
      .getByPlaceholder("Cuéntanos qué piensas o qué problema encontraste...")
      .fill("Cuarto mensaje que debería ser rechazado");

    await page.unroute("**/api/feedback");

    await page.route("**/api/feedback", async (route, request) => {
      if (request.method() === "POST") {
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: {
              message: "Demasiados mensajes. Espera unos minutos.",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(
      page.getByText("Demasiados mensajes. Espera unos minutos."),
    ).toBeVisible();
  });
});
