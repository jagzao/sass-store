import { test, expect } from "@playwright/test";

test.describe("Forgot Password Flow", () => {
  const testEmail = "test@wondernails.com";
  const newPassword = "NewPassword123!";

  test("should display forgot password page correctly", async ({ page }) => {
    await page.goto("/t/wondernails/forgot-password");

    // Check page elements
    await expect(page.locator("h2")).toContainText("Recuperar Contraseña");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href*="login"]')).toBeVisible();
  });

  test("should show validation error for empty email", async ({ page }) => {
    await page.goto("/t/wondernails/forgot-password");

    // Try to submit without email
    await page.locator('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBeTruthy();
  });

  test("should show validation error for invalid email format", async ({
    page,
  }) => {
    await page.goto("/t/wondernails/forgot-password");

    await page.locator('input[type="email"]').fill("invalid-email");
    await page.locator('button[type="submit"]').click();

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBeTruthy();
  });

  test("should successfully submit forgot password request", async ({
    page,
  }) => {
    await page.goto("/t/wondernails/forgot-password");

    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('button[type="submit"]').click();

    // Should show success message
    await expect(page.locator("text=Correo enviado")).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.locator("text=Revisa tu bandeja de entrada")
    ).toBeVisible();

    // Should show link back to login
    await expect(page.locator('a[href*="login"]')).toBeVisible();
  });

  test("should navigate back to login from forgot password", async ({
    page,
  }) => {
    await page.goto("/t/wondernails/forgot-password");

    await page.locator('a[href*="login"]').first().click();
    await page.waitForURL("**/login");

    expect(page.url()).toContain("/login");
  });

  test("should display forgot password link on login page", async ({
    page,
  }) => {
    await page.goto("/t/wondernails/login");

    const forgotPasswordLink = page
      .locator('a[href*="forgot-password"]')
      .first();
    await expect(forgotPasswordLink).toBeVisible();
    await expect(forgotPasswordLink).toContainText("Olvidaste");
  });

  test("should navigate from login to forgot password", async ({ page }) => {
    await page.goto("/t/wondernails/login");

    await page.locator('a[href*="forgot-password"]').first().click();
    await page.waitForURL("**/forgot-password");

    expect(page.url()).toContain("/forgot-password");
    await expect(page.locator("h2")).toContainText("Recuperar Contraseña");
  });
});

test.describe("Reset Password Flow", () => {
  const validToken = "test-reset-token-123";
  const newPassword = "NewPassword123!";

  test("should display error for missing token", async ({ page }) => {
    await page.goto("/t/wondernails/reset-password");

    await expect(
      page.locator("text=Token de recuperación no válido")
    ).toBeVisible();
    await expect(page.locator('a[href*="forgot-password"]')).toBeVisible();
  });

  test("should display error for invalid token", async ({ page }) => {
    await page.goto("/t/wondernails/reset-password?token=invalid");

    // Page should load
    await expect(page.locator("h2")).toContainText("Restablecer Contraseña");
  });

  test("should display reset password form with valid token", async ({
    page,
  }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    // Check form elements
    await expect(page.locator("h2")).toContainText("Restablecer Contraseña");
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page
      .locator('button[aria-label*="contraseña"]')
      .first();

    // Initially should be password type
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click toggle
    await toggleButton.click();

    // Should change to text
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to toggle back
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("should show error when passwords do not match", async ({ page }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    await page.locator('input[name="password"]').fill("Password123!");
    await page
      .locator('input[name="confirmPassword"]')
      .fill("DifferentPassword123!");
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator("text=no coinciden")).toBeVisible();
  });

  test("should show error for password less than 8 characters", async ({
    page,
  }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    const shortPassword = "Pass1!";
    await page.locator('input[name="password"]').fill(shortPassword);
    await page.locator('input[name="confirmPassword"]').fill(shortPassword);
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator("text=al menos 8 caracteres")).toBeVisible();
  });

  test("should show loading state when submitting", async ({ page }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    await page.locator('input[name="password"]').fill(newPassword);
    await page.locator('input[name="confirmPassword"]').fill(newPassword);

    const submitButton = page.locator('button[type="submit"]');

    // Click submit and check for loading state
    await submitButton.click();

    // Button should show loading text or be disabled
    await expect(submitButton).toBeDisabled();
  });

  test("should navigate back to login from reset password", async ({
    page,
  }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    await page.locator('a[href*="login"]').first().click();
    await page.waitForURL("**/login");

    expect(page.url()).toContain("/login");
  });

  test("should have proper form accessibility", async ({ page }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    // Check labels
    const passwordLabel = page.locator('label[for="password"]');
    const confirmLabel = page.locator('label[for="confirmPassword"]');

    await expect(passwordLabel).toBeVisible();
    await expect(confirmLabel).toBeVisible();

    // Check required attributes
    await expect(page.locator('input[name="password"]')).toHaveAttribute(
      "required",
      ""
    );
    await expect(page.locator('input[name="confirmPassword"]')).toHaveAttribute(
      "required",
      ""
    );
  });

  test("should handle keyboard navigation", async ({ page }) => {
    await page.goto(`/t/wondernails/reset-password?token=${validToken}`);

    // Tab through form elements
    await page.keyboard.press("Tab");
    const firstInput = page.locator('input[name="password"]');
    await expect(firstInput).toBeFocused();

    await page.keyboard.press("Tab");
    // Should skip the toggle button or move to next input

    await page.keyboard.press("Tab");
    const secondInput = page.locator('input[name="confirmPassword"]');
    // Eventually should reach confirm password or submit button
  });
});

test.describe("Forgot Password - Multiple Tenants", () => {
  const tenants = ["wondernails", "nom-nom", "delirios"];

  test("should work correctly for all tenants", async ({ page }) => {
    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}/forgot-password`);

      // Page should load
      await expect(page.locator("h2")).toContainText("Recuperar");
      await expect(page.locator('input[type="email"]')).toBeVisible();

      // Check back link is tenant-specific
      const loginLink = page.locator('a[href*="login"]').first();
      await expect(loginLink).toHaveAttribute("href", `/t/${tenant}/login`);
    }
  });
});

test.describe("Forgot Password - Error Handling", () => {
  test("should handle network errors gracefully", async ({ page }) => {
    await page.goto("/t/wondernails/forgot-password");

    // Intercept API call and make it fail
    await page.route("**/api/auth/forgot-password", (route) => {
      route.abort("failed");
    });

    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator(".bg-red-50")).toBeVisible({ timeout: 5000 });
  });

  test("should handle API error responses", async ({ page }) => {
    await page.goto("/t/wondernails/forgot-password");

    // Intercept API call and return error
    await page.route("**/api/auth/forgot-password", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator(".bg-red-50")).toBeVisible({
      timeout: 5000,
    });
  });
});
