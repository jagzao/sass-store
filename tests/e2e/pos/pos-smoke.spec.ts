import { test, expect } from "@playwright/test";

test.describe("POS Page E2E", () => {
  const tenantSlug = "wondernails";

  test("should redirect to login when accessing POS without session", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/pos`);
    // Wait for redirect to login
    await page.waitForURL(`**/t/${tenantSlug}/login**`, { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
