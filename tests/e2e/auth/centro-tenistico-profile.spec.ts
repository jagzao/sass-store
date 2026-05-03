import { expect, test, type Page } from "@playwright/test";

const TENANT = "centro-tenistico";
const USER_EMAIL = process.env.TEST_SPECIFIC_EMAIL || "jagzao@gmail.com";
const USER_PASSWORD = process.env.TEST_SPECIFIC_PASSWORD || "admin";

async function loginToTenantProfile(page: Page) {
  await page.goto(`/t/${TENANT}/login`, { timeout: 60000 });
  const emailInput = page.locator('input[type="email"]');

  if (await emailInput.isVisible().catch(() => false)) {
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.getByTestId("login-btn").click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 30000,
    });
  }
}

test.describe("Centro Tenistico Profile", () => {
  test("redirects unauthenticated access to tenant login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`/t/${TENANT}/profile?welcome=1`);
    await page.waitForURL(`**/t/${TENANT}/login**`, { timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`/t/${TENANT}/login`));
  });

  test("shows welcome flow and allows saving profile fields", async ({
    page,
  }) => {
    await loginToTenantProfile(page);

    await page.goto(`/t/${TENANT}/profile?welcome=1`, { timeout: 60000 });
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(new RegExp(`/t/${TENANT}/profile$`), {
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Guardar Cambios" }),
    ).toBeVisible();

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible();
    const currentPhone = ((await phoneInput.inputValue()) || "").replace(
      /\D/g,
      "",
    );
    const nextPhone =
      currentPhone === "5512345678" ? "5512345679" : "5512345678";
    await phoneInput.fill(nextPhone);

    const saveButton = page.getByRole("button", { name: "Guardar Cambios" });
    await expect(saveButton).toBeEnabled({ timeout: 10000 });
    await saveButton.click();

    await expect(
      page.getByText("Tu perfil fue actualizado correctamente"),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(new RegExp(`/t/${TENANT}/profile$`), {
      timeout: 10000,
    });
  });
});
