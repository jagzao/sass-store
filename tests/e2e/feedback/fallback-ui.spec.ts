import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";

test.describe("Feature: Captura y enrutamiento de feedback", () => {
  test("SC-03 — cuando n8n no responde la UI muestra mensaje de fallback", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/t/wondernails");
    await page.getByRole("button", { name: "Abrir feedback" }).click();
    await page.getByRole("button", { name: "Opinión" }).click();
    await page
      .getByPlaceholder("Cuéntanos qué piensas o qué problema encontraste...")
      .fill("Reporte de fallo para probar almacenamiento local");

    await page.route("**/api/feedback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            feedbackId: "test-id",
            status: "stored",
            message: "Lo guardamos, lo procesaremos más tarde",
          },
        }),
      });
    });

    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(
      page.getByText("Lo guardamos, lo procesaremos más tarde"),
    ).toBeVisible();
  });
});
