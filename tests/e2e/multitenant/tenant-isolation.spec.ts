import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe("Multitenant Isolation", () => {
  test("cart and session state should be isolated between tenants", async ({ page }) => {
    // Tenants to switch between
    const tenant1 = TEST_CREDENTIALS.tenantSlug; // e.g., wondernails
    const tenant2 = "nom-nom"; // A different tenant, as specified in the testing plan

    // Step 1: Visit tenant 1 and add an item to the cart (or trigger some state)
    await page.goto(`/t/${tenant1}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify we are on tenant 1
    await expect(page).toHaveURL(new RegExp(`/t/${tenant1}`));

    // Add a product or service to the cart
    // We try to find the generic "Agregar" or "Reservar" buttons usually available
    const productButton = page.locator('button:has-text("Agregar"), button:has-text("Reservar")').first();
    
    if (await productButton.isVisible()) {
      await productButton.click();
      
      // Look for a cart indicator to verify something was added
      // This is generic and might need adjusting based on the actual UI implementation
      const cartCounter = page.locator('[data-testid="cart-count"], .cart-count');
      if (await cartCounter.isVisible()) {
        await expect(cartCounter).not.toHaveText("0", { timeout: 5000 });
      }
    }

    // Capture the local storage state for tenant1
    const lsTenant1 = await page.evaluate(() => JSON.stringify(window.localStorage));

    // Step 2: Navigate to tenant 2
    await page.goto(`/t/${tenant2}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Verify we are on tenant 2
    await expect(page).toHaveURL(new RegExp(`/t/${tenant2}`));

    // If there is a cart counter, it should be empty or nonexistent
    const cartCounterTenant2 = page.locator('[data-testid="cart-count"], .cart-count');
    if (await cartCounterTenant2.isVisible()) {
      await expect(cartCounterTenant2).toHaveText("0", { timeout: 5000 });
    }

    // Verify we don't see any items from tenant1's cart in the UI
    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(0);
  });

  test("API endpoints should enforce tenant isolation", async ({ page, request }) => {
    const tenant1 = TEST_CREDENTIALS.tenantSlug;
    const tenant2 = "nom-nom";

    // 1. Log in to tenant1
    await page.goto(`/t/${tenant1}/login`);
    const loginVisible = await page.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (loginVisible) {
      await page.fill('input[type="email"]', TEST_CREDENTIALS.adminEmail);
      await page.fill('input[type="password"]', TEST_CREDENTIALS.adminPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(`**\/t/${tenant1}**`);
    }

    // 2. Try to fetch data from tenant2 using the context/cookies of tenant1
    const response = await request.get(`/api/v1/products?tenant=${tenant2}`);
    
    // Depending on the strictness, it should either return only tenant2's public data 
    // or fail because the session belongs to tenant1 if it's an admin endpoint.
    // If it's a public endpoint, it should succeed but only return tenant2 data.
    if (response.ok()) {
      const data = await response.json();
      if (data && data.items && data.items.length > 0) {
        // Assert that none of the returned items belong to tenant1
        for (const item of data.items) {
          expect(item.tenantId || item.tenantSlug).not.toBe(tenant1);
        }
      }
    }
  });
});
