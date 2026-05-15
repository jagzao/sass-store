import { test, expect } from "@playwright/test";
import { gotoTenantLogin } from "../utils/wait-for-login";

test.describe("Login OAuth error messaging", () => {
  test("shows actionable Configuration copy on tenant login (dev)", async ({
    page,
  }) => {
    await gotoTenantLogin(page, "wondernails", "?error=Configuration");

    const box = page.getByTestId("auth-error").first();
    await expect(box).toBeVisible({ timeout: 15000 });
    await expect(box).toContainText(/configuración/i);
    // next start (Playwright webServer) runs NODE_ENV=production; dev copy mentions Google OAuth.
    await expect(box).toContainText(/Google|administrador/i);
  });
});
