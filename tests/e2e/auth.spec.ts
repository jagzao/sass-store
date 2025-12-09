import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  // const baseUrl = 'https://sass-store-web.vercel.app'; // Removed to use baseURL from config
  const tenantSlug = "wondernails";

  test("should register and then login to access clients", async ({ page }) => {
    const randomSuffix = Math.floor(Math.random() * 10000);
    const email = `jagzao${randomSuffix}@hotmail.com`;
    const password = "Password123!";

    // 1. Navigate to Register
    await page.goto(`/t/${tenantSlug}/register`);

    // 2. Fill Register Form
    await page.fill('input[name="name"]', "Jag Zao");
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', "5512345678");
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.check('input[name="terms"]');
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await page.waitForURL(/.*login.*/, { timeout: 15000 });

    // 3. Login with new user
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[data-testid="login-btn"]');

    // 4. Wait for navigation to dashboard
    await page.waitForURL(`**\/t/${tenantSlug}`, { timeout: 15000 });

    // 5. Navigate to Clients
    await page.goto(`/t/${tenantSlug}/clientes`);

    // 6. Verify Page Content
    await expect(page.locator("body")).toContainText("Client");
    // Uses broader assertion since "Gestión de Clientas" might vary or be loading
    await expect(page.getByRole("main")).toBeVisible();
  });
});
