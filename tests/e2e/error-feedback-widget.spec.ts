import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "./helpers/test-helpers";

const TENANT = TEST_CREDENTIALS.tenantSlug;

test.describe("Error to feedback widget", () => {
  test("user can report an error from global error page", async ({ page }) => {
    await page.goto("/_test-error", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("feedback-error-trigger")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("feedback-error-trigger").click();

    await expect(page.getByRole("button", { name: /Problema/i })).toBeVisible();

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();

    const current = (await textarea.inputValue()) ?? "";
    if (current.length < 10) {
      await textarea.fill(`${current} error reportado por usuario final`);
    }

    await page.getByRole("button", { name: /Enviar feedback/i }).click();

    await expect(page.getByText(/Gracias por tu feedback/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("feedback widget is accessible on tenant pages", async ({ page }) => {
    // STRY-034: wondernails reemplazó el botón plano de feedback por Wonder
    // (ver tests/e2e/assistant/wonder-assistant.spec.ts SC-01/SC-02) — este
    // check de "botón de feedback plano" se hace en un tenant que aún lo usa.
    await page.goto("/t/manada-juma", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("button", { name: /Abrir feedback/i }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Abrir feedback/i }).click();

    await expect(
      page.getByText(/Tu opinión nos ayuda a mejorar/i),
    ).toBeVisible();
  });

  test("user can report an error from tenant error page", async ({ page }) => {
    await page.goto(`/t/${TENANT}/_test-error`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("feedback-error-trigger")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("feedback-error-trigger").click();

    await expect(page.getByRole("button", { name: /Problema/i })).toBeVisible();
  });
});
