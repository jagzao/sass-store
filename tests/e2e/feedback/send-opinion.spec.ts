import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";

test.describe("Feature: Captura y enrutamiento de feedback", () => {
  test("SC-01 — usuario envía opinión sobre usabilidad y ve confirmación", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    // STRY-034: wondernails reemplazó el botón plano de feedback por Wonder.
    await page.goto("/t/manada-juma");
    await page.getByRole("button", { name: "Abrir feedback" }).click();
    await page.getByRole("button", { name: "Opinión" }).click();
    await page
      .getByPlaceholder("Cuéntanos qué piensas o qué problema encontraste...")
      .fill("Me parece muy útil la nueva navegación del sitio");

    await page.route("**/api/feedback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            feedbackId: "test-id",
            status: "sent",
            message: "Gracias por tu feedback",
          },
        }),
      });
    });

    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByText("Gracias por tu feedback")).toBeVisible();
  });
});
