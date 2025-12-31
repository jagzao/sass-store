import { test, expect } from "@playwright/test";

test.describe("Specific User Login - Wondernails", () => {
  const tenantSlug = "wondernails";
  const userEmail = "marialiciavh1984@gmail.com";
  // Allows override via environment variable, defaults to common test password
  const userPassword = process.env.TEST_SPECIFIC_PASSWORD || "admin";

  test(`should login successfully as ${userEmail}`, async ({ page }) => {
    console.log(`Navigating to login page for tenant: ${tenantSlug}`);
    await page.goto(`/t/${tenantSlug}/login`);

    // Wait for network idle to ensure tenant config is loaded
    await page.waitForLoadState("networkidle");

    // Check if we are on the login page
    await expect(page.getByTestId("email-input")).toBeVisible({
      timeout: 10000,
    });

    console.log(`Attempting login with user: ${userEmail}`);

    // Fill credentials
    await page.getByTestId("email-input").fill(userEmail);
    await page.getByTestId("password-input").fill(userPassword);

    // Click Login
    await page.getByTestId("login-btn").click();

    // DEBUG: Check for error messages immediately
    try {
      const errorLocator = page.getByText(
        /Credenciales inválidas|Error|Falló/i,
      );
      if (await errorLocator.isVisible({ timeout: 5000 })) {
        console.error("❌ Login failed with error message:");
        console.error(await errorLocator.textContent());
        throw new Error("Login failed: Invalid credentials or server error.");
      }
    } catch (e) {
      if (e.message.includes("Login failed")) throw e;
      // Ignore timeout if no error message found, continue to URL check
    }

    // Verify successful login
    try {
      // 1. URL should not be login anymore
      await expect(page).not.toHaveURL(/.*login.*/, { timeout: 15000 });

      // 2. Should be on the tenant dashboard/home
      await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}`));

      // 3. Header should likely contain a greeting
      // Using a broad check first to avoid brittleness if exact text changes
      await expect(page.locator("header")).toBeVisible();

      // Optional: Check specifically for "Hola" if that's the standard greeting
      await expect(page.locator("header")).toContainText(/Hola/i);

      console.log("Login successful, user redirected to dashboard.");
    } catch (e) {
      console.error("❌ Login verification failed.");
      console.log("Current URL:", page.url());

      // Save HTML for debugging
      const fs = require("fs");
      const content = await page.content();
      fs.writeFileSync("debug-login.html", content);
      console.log("Saved page content to debug-login.html");

      throw e;
    }
  });
});
