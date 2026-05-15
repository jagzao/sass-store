import { test, expect } from "@playwright/test";
import { gotoTenantLogin } from "../utils/wait-for-login";

test.describe("Google OAuth redirect", () => {
  test("clicking Google button redirects to Google accounts", async ({
    page,
  }) => {
    await gotoTenantLogin(page, "wondernails");

    const googleButton = page
      .locator("button[type='submit']")
      .filter({ hasText: /Google/i })
      .first();

    await expect(googleButton).toBeVisible({ timeout: 15000 });
    await googleButton.click();

    await page.waitForURL(/accounts\.google\.com/, { timeout: 30000 });
    await expect(page).toHaveURL(/accounts\.google\.com/);
  });
});
