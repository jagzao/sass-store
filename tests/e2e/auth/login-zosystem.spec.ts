import { test, expect } from "@playwright/test";

test.describe("Zo System Login Debug", () => {
  const tenantSlug = "zo-system";

  test("should load login page without 404", async ({ page }) => {
    console.log(`Navigating to login page for tenant: ${tenantSlug}`);
    const response = await page.goto(`/t/${tenantSlug}/login`);

    // Check status code
    if (response) {
      console.log(`Response status: ${response.status()}`);
      expect(response.status(), "Page should return 200").toBe(200);
    }

    // Check for 404 text content just in case status is 200 but content is 404 (soft 404)
    const content = await page.content();
    const is404 =
      content.includes("Página no encontrada") ||
      content.includes("The page you are looking for does not exist");
    expect(is404, "Page content should not indicate 404").toBe(false);

    // Verify login form is visible
    await expect(page.getByTestId("email-input")).toBeVisible();
  });
});
