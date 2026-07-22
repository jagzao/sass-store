import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";

test.describe("Feature: Captura y enrutamiento de feedback", () => {
  test("SC-04 — admin consulta listado de feedback de su tenant", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.route("**/api/feedback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                id: "fb-1",
                category: "opinion",
                message: "Excelente servicio",
                status: "sent",
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
          },
        }),
      });
    });

    await page.goto("/admin/feedback");

    await expect(page.getByText("Feedback de usuarios")).toBeVisible();
    await expect(page.getByText("Excelente servicio")).toBeVisible();
    await expect(page.getByText("opinion").first()).toBeVisible();
  });
});
