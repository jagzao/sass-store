import { test, expect } from "@playwright/test";

test.describe("Login Diagnostics", () => {
  test("should check login page and capture screenshot", async ({ page }) => {
    // Navigate to login page
    console.log("Navigating to login page...");
    await page.goto("http://localhost:3001/t/manada-juma/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: "test-results/login-diagnostic.png",
      fullPage: true,
    });

    // Get page content
    const bodyText = await page.locator("body").textContent();
    console.log("Page title:", await page.title());
    console.log("Page content preview:", bodyText?.substring(0, 500));

    // Check for errors
    const has404 = bodyText?.includes("404") || bodyText?.includes("Not Found");
    const hasError = bodyText?.includes("Error") || bodyText?.includes("error");
    const hasLoginForm =
      bodyText?.includes("Inicia sesión") ||
      bodyText?.includes("Correo electrónico");

    console.log("Has 404:", has404);
    console.log("Has Error:", hasError);
    console.log("Has Login Form:", hasLoginForm);

    // Check if elements exist
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-btn"]');

    const emailCount = await emailInput.count();
    const passwordCount = await passwordInput.count();
    const buttonCount = await loginButton.count();

    console.log("Email inputs found:", emailCount);
    console.log("Password inputs found:", passwordCount);
    console.log("Login buttons found:", buttonCount);

    // Try alternative selectors
    const emailByType = page.locator('input[type="email"]');
    const passwordByType = page.locator('input[type="password"]');
    const buttonByType = page.locator('button[type="submit"]');

    console.log("Email by type:", await emailByType.count());
    console.log("Password by type:", await passwordByType.count());
    console.log("Button by type:", await buttonByType.count());

    // Assertions
    expect(has404).toBe(false);

    if (hasLoginForm) {
      console.log("✅ Login form found!");
    } else {
      console.log("⚠️ Login form not found - check screenshot");
    }
  });

  test("should try alternative tenant", async ({ page }) => {
    // Try with different tenant
    console.log("Trying with 'wondernails' tenant...");
    await page.goto("http://localhost:3001/t/wondernails/login", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await page.waitForTimeout(5000);
    await page.screenshot({
      path: "test-results/login-wondernails.png",
      fullPage: true,
    });

    const bodyText = await page.locator("body").textContent();
    const hasLoginForm = bodyText?.includes("Inicia sesión");

    console.log("Wondernails tenant - Has login form:", hasLoginForm);

    if (hasLoginForm) {
      console.log("✅ Wondernails tenant works!");
    }
  });

  test("should attempt manual login", async ({ page }) => {
    await page.goto("http://localhost:3001/t/wondernails/login", {
      waitUntil: "domcontentloaded",
    });

    await page.waitForTimeout(3000);

    // Find email input (try multiple selectors)
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      '[data-testid="email-input"]',
      'input[placeholder*="correo"]',
      'input[placeholder*="email"]',
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        emailInput = element;
        console.log("Found email input with selector:", selector);
        break;
      }
    }

    if (!emailInput) {
      console.log("❌ Could not find email input");
      await page.screenshot({
        path: "test-results/no-email-input.png",
        fullPage: true,
      });
      test.skip(true, "Email input not found");
      return;
    }

    // Fill form
    await emailInput.fill("jagzao@gmail.com");

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill("admin");

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for navigation or error
    await page.waitForTimeout(5000);

    await page.screenshot({
      path: "test-results/after-login.png",
      fullPage: true,
    });

    const url = page.url();
    console.log("Current URL after login:", url);

    // Check if logged in or error
    const bodyText = await page.locator("body").textContent();
    if (
      bodyText?.includes("Credenciales no válidas") ||
      bodyText?.includes("error")
    ) {
      console.log("❌ Login failed - invalid credentials");
    } else if (url.includes("/t/wondernails") && !url.includes("/login")) {
      console.log("✅ Login successful!");
    } else {
      console.log("⚠️ Unknown state after login attempt");
    }
  });
});
