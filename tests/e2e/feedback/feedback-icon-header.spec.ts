import { test, expect } from "@playwright/test";

test.describe("Feature: Icono de feedback junto al logo del tenant", () => {
  test("SC-01/SC-04 — icono visible en header default y abre el widget con Opinion preseleccionada", async ({
    page,
  }) => {
    await page.goto("/t/manada-juma");

    const icon = page.getByTestId("feedback-header-icon");
    await expect(icon).toBeVisible();

    await icon.click();

    await expect(
      page.getByText("Tu opinión nos ayuda a mejorar"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Opinión", exact: true }),
    ).toHaveClass(/bg-\[#FF8000\]/);
  });

  test("SC-02 — icono visible y clicable en header transparente sin scroll (wondernails)", async ({
    page,
  }) => {
    // STRY-034: en wondernails el icono del header abre el asistente Wonder
    // (mismo FeedbackWidgetContext.open() que el trigger flotante).
    await page.goto("/t/wondernails");

    const icon = page.getByTestId("feedback-header-icon");
    await expect(icon).toBeVisible();
    await icon.click();

    await expect(page.getByTestId("wonder-chat-panel")).toBeVisible();
  });

  test("SC-05 — trigger flotante de Wonder sigue disponible junto al icono del header (wondernails)", async ({
    page,
  }) => {
    await page.goto("/t/wondernails");

    await expect(page.getByTestId("feedback-header-icon")).toBeVisible();
    await expect(page.getByTestId("wonder-assistant-trigger")).toBeVisible();
  });

  test("SC-06 — icono visible junto al logo en viewport mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/t/wondernails");

    await expect(page.getByTestId("feedback-header-icon")).toBeVisible();
  });

  test("SC-07 — icono presente en distintos tenants con TenantHeader", async ({
    page,
  }) => {
    for (const tenant of ["wondernails", "manada-juma", "centro-tenistico"]) {
      await page.goto(`/t/${tenant}`);
      await expect(page.getByTestId("feedback-header-icon")).toBeVisible();
    }
  });
});
