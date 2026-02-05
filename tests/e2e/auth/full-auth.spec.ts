import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe.serial("Authentication Flows", () => {
  const { tenantSlug } = TEST_CREDENTIALS;
  const randomSuffix = Math.floor(Math.random() * 100000);
  const newUserEmail = `auto_auth_${randomSuffix}@test.com`;
  const newUserPass = "Password123!";
  const newUserName = "Auto Auth User";

  test("should register a new user successfully", async ({ page }) => {
    // 1. Navigate to Register
    await page.goto(`/t/${tenantSlug}/register`);

    // 2. Fill Form
    await page.fill('input[name="name"]', newUserName);
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="phone"]', "5555555555");
    await page.fill('input[name="password"]', newUserPass);
    await page.fill('input[name="confirmPassword"]', newUserPass);
    await page.check('input[name="terms"]');

    // 3. Submit
    await page.click('button:has-text("Crear cuenta")');

    // 4. Verification
    // Should pass if redirected to login or auto-logged in.
    // The expected behavior is to redirect to login with a success parameter
    await expect(page).toHaveURL(/.*login\?registered=true.*/);
  });

  test("should login with the newly created user", async ({ page }) => {
    // Login with the user created in previous test
    await page.goto(`/t/${tenantSlug}/login`);
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="password"]', newUserPass);
    await page.click('button:has-text("Iniciar sesión")');

    // Verify redirect to dashboard/home
    await page.waitForLoadState("networkidle");
    await expect(page.locator("header")).toContainText(/Hola/i);
  });

  test("should initiate Google OAuth flow", async ({ page }) => {
    await page.goto(`/t/${tenantSlug}/login`);

    // Click Google Button
    // Note: We cannot fully automate Google login without complex setup,
    // but we can verify it redirects to Google's domain.
    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
    await googleButton.click();

    // Verify URL change to accounts.google.com
    await page.waitForLoadState("networkidle");

    // If config is missing, it might stay on page or error.
    // If correct, it goes to accounts.google.com...
    // We check if the URL contains google.com
    // Note: This might flaky if run headless in some CIs that block google,
    // but locally/Vercel it usually tries to redirect.

    try {
      await expect(page).toHaveURL(/.*accounts\.google\.com.*/);
    } catch (e) {
      // If it fails, check if we are on an error page (which is the current bug)
      const content = await page.content();
      if (
        content.includes("Something went wrong") ||
        content.includes("Error")
      ) {
        throw new Error(
          "Google Login failed: App showed error page instead of redirecting.",
        );
      }
      throw e;
    }
  });

  test("should login with admin credentials", async ({ page }) => {
    // This verifies the 'standard' admin account often used
    await page.goto(`/t/${tenantSlug}/login`);
    await page.fill('input[name="email"]', TEST_CREDENTIALS.adminEmail);
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button:has-text("Iniciar sesión")');

    // Verify success
    await expect(page.getByText("Credenciales inválidas")).not.toBeVisible();
    await expect(page.locator("header")).toContainText(/Hola/i);
  });
});
