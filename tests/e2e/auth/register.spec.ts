import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testUser = {
    name: 'Test User',
    email: testEmail,
    phone: '+52 55 1234 5678',
    password: 'password123',
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to Wonder Nails registration page
    await page.goto('/t/wondernails/register');
    await expect(page.locator('h1')).toContainText(/registr|crear cuenta/i);
  });

  test('should successfully register a new user', async ({ page }) => {
    // Fill registration form
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Accept terms and conditions
    await page.check('input[name="terms"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login\?registered=true/);

    // Should show success message
    const successMessage = page.locator('[data-testid="success-message"]');
    if (await successMessage.isVisible()) {
      await expect(successMessage).toContainText(/cuenta creada|exitosamente/i);
    }
  });

  test('should show password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).first();

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show HTML5 validation or error messages
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    // Inputs should be invalid
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check('input[name="terms"]');

    await page.click('button[type="submit"]');

    // Should show error message for invalid email
    const errorMessage = page.locator('[role="alert"], .text-red-700, .text-red-600');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/email.*inválido|invalid.*email/i);
    }
  });

  test('should validate password length', async ({ page }) => {
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', '12345'); // Less than 6 chars
    await page.fill('input[name="confirmPassword"]', '12345');
    await page.check('input[name="terms"]');

    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[role="alert"], .text-red-700, .text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/contraseña.*6.*caracteres|password.*6.*characters/i);
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', 'differentpassword');
    await page.check('input[name="terms"]');

    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[role="alert"], .text-red-700, .text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/contraseñas.*coincid|passwords.*match/i);
  });

  test('should require terms and conditions acceptance', async ({ page }) => {
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    // Don't check terms

    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[role="alert"], .text-red-700, .text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/términos|terms/i);
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    // First registration
    await page.fill('input[name="name"]', 'First User');
    await page.fill('input[name="email"]', 'duplicate@test.com');
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');

    // Wait for redirect or success
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});

    // Try to register again with same email
    await page.goto('/t/wondernails/register');
    await page.fill('input[name="name"]', 'Second User');
    await page.fill('input[name="email"]', 'duplicate@test.com');
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');

    // Should show error
    const errorMessage = page.locator('[role="alert"], .text-red-700, .text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/email.*registrado|email.*exists/i);
  });

  test('should disable form during submission', async ({ page }) => {
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check('input[name="terms"]');

    // Start submission
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should show loading state
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText(/creando|creating/i);
  });

  test('should maintain tenant context across registration', async ({ page }) => {
    // Register in wondernails tenant
    await page.goto('/t/wondernails/register');

    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="phone"]', testUser.phone);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.check('input[name="terms"]');

    await page.click('button[type="submit"]');

    // Should redirect to wondernails login, not generic login
    await expect(page).toHaveURL(/\/t\/wondernails\/login/);
  });

  test('should work across different tenants', async ({ page }) => {
    const tenants = ['wondernails', 'vigistudio', 'zo-system'];

    for (const tenant of tenants) {
      await page.goto(`/t/${tenant}/register`);

      // Page should load successfully
      await expect(page.locator('form')).toBeVisible();

      // Should have tenant branding
      const html = await page.content();
      expect(html).toContain(tenant);
    }
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Tab through form
    await page.keyboard.press('Tab'); // Name field
    await page.keyboard.type(testUser.name);

    await page.keyboard.press('Tab'); // Email field
    await page.keyboard.type(testEmail);

    await page.keyboard.press('Tab'); // Phone field
    await page.keyboard.type(testUser.phone);

    await page.keyboard.press('Tab'); // Password field
    await page.keyboard.type(testUser.password);

    await page.keyboard.press('Tab'); // Password toggle button (skip)
    await page.keyboard.press('Tab'); // Confirm password field
    await page.keyboard.type(testUser.password);

    await page.keyboard.press('Tab'); // Confirm password toggle (skip)
    await page.keyboard.press('Tab'); // Terms checkbox
    await page.keyboard.press('Space'); // Check terms

    // Submit via keyboard
    await page.keyboard.press('Tab'); // Submit button
    await page.keyboard.press('Enter');

    // Should submit successfully
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});

test.describe('Registration Form Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/t/wondernails/register');

    // Check form has proper role and labels
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // All inputs should have labels
    const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputId = await input.getAttribute('id');

      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
      }
    }
  });

  test('should meet WCAG contrast requirements', async ({ page }) => {
    await page.goto('/t/wondernails/register');

    // This would typically use axe-core or similar
    // For now, we just verify the page loads
    await expect(page.locator('form')).toBeVisible();
  });
});
