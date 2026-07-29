import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TEST_CREDENTIALS } from "./helpers/test-helpers";

const TENANT = TEST_CREDENTIALS.tenantSlug;

test.describe("Error to feedback widget", () => {
  test("feedback widget does not render on global error page without tenant", async ({
    page,
  }) => {
    await page.goto("/test-error", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("feedback-error-trigger")).not.toBeVisible();
  });

  test("user can report an error from tenant error page", async ({ page }) => {
    await page.goto(`/t/${TENANT}/test-error`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("feedback-error-trigger")).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId("feedback-error-trigger").click();

    await expect(
      page.getByRole("button", { name: "Problema", exact: true }),
    ).toBeVisible();

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();

    const current = (await textarea.inputValue()) ?? "";
    if (current.length < 10) {
      await textarea.fill(`${current} error reportado por usuario final`);
    }

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/feedback") && resp.status() === 200,
    );

    await page.getByRole("button", { name: /Enviar feedback/i }).click();

    await expect(responsePromise).resolves.toBeTruthy();
  });

  test("feedback widget is accessible on tenant pages", async ({ page }) => {
    await page.goto(`/t/${TENANT}`, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("button", { name: /Abrir feedback/i }),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Abrir feedback/i }).click();

    await expect(
      page.getByText(/Tu opinión nos ayuda a mejorar/i),
    ).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="feedback-widget-panel"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  for (const slug of ["zo-system", "centro-tenistico"]) {
    test(`feedback widget opens without contrast errors on ${slug}`, async ({
      page,
    }) => {
      await page.goto(`/t/${slug}`, { waitUntil: "domcontentloaded" });

      await expect(
        page.getByRole("button", { name: /Abrir feedback/i }),
      ).toBeVisible({ timeout: 10000 });

      await page.getByRole("button", { name: /Abrir feedback/i }).click();

      await expect(
        page.getByText(/Tu opinión nos ayuda a mejorar/i),
      ).toBeVisible();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid="feedback-widget-panel"]')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
