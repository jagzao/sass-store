import { test, expect } from "@playwright/test";
import { loginAs, TEST_CREDENTIALS } from "./helpers/test-helpers";

/**
 * STRY-023 — Sesiones deportivas (centro-tenistico)
 * grep: sesiones-deportivas | STRY-023
 */

const TENANT = "centro-tenistico";
const BASE = `/t/${TENANT}`;

test.describe("STRY-023 sesiones-deportivas @sesiones-deportivas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(
      page,
      TENANT,
      TEST_CREDENTIALS.adminEmail,
      TEST_CREDENTIALS.adminPassword,
    );
  });

  test("SC-04: admin sessions page loads", async ({ page }) => {
    await page.goto(`${BASE}/admin/sessions`);
    await expect(page.getByTestId("admin-sessions-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("btn-new-session")).toBeVisible();
  });

  test("SC-04: create session via admin UI", async ({ page }) => {
    await page.goto(`${BASE}/admin/sessions`);
    await page.getByTestId("btn-new-session").click();
    await expect(page.getByTestId("session-form-modal")).toBeVisible();

    const title = `E2E Clase ${Date.now()}`;
    await page.getByTestId("session-title-input").fill(title);
    await page.getByTestId("session-capacity-input").fill("8");
    await page.getByTestId("session-save-btn").click();

    await expect(page.getByText(title)).toBeVisible({ timeout: 15000 });
  });

  test("SC-06: public enrollment page loads", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`${BASE}/sessions`);
    await expect(page.getByTestId("public-sessions-page")).toBeVisible({
      timeout: 15000,
    });
  });

  test("SC-11: wondernails has no sports sessions module", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/t/wondernails/sessions", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("public-sessions-page")).not.toBeVisible({
      timeout: 10000,
    });
  });
});
