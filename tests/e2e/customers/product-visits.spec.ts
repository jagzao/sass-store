import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";
import * as fs from 'fs';

test.describe.serial("Product Visits Workflow", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test("should add products to a visit", async ({ page }) => {
    test.setTimeout(120000);

    // 1. Login
    try {
        await loginAsAdmin(page);
    } catch (e: any) {
        console.log("Login failed in helper, capturing page content to file...");
        console.error("EXACT LOGIN ERROR:", e.stack || e.message || e);
        const content = await page.content();
        fs.writeFileSync('login-page-dump.html', content);
        throw e;
    }

    // 2. Navigate to Customers and Create a new one for testing
    await page.goto(`/t/${tenantSlug}/clientes`);
    
    // Check if we can find the "Agregar Clienta" button, if not try "Crear Clienta" or icon
    const addClientBtn = page.getByRole('button', { name: /Agregar Clienta|Crear Clienta|Nueva Clienta/i }).first();
    // Fallback if role button doesn't work, try strict text
    if (!await addClientBtn.isVisible()) {
        await page.click('text="Agregar Clienta"');
    } else {
        await addClientBtn.click();
    }
    
    await page.waitForURL("**/clientes/nueva");

    const uniqueId = Date.now().toString();
    const customerName = `ProductTest User ${uniqueId}`;
    
    // Fill required fields
    await page.fill('input[name="name"], input[placeholder*="ombre"]', customerName);
    await page.fill('input[type="tel"], input[placeholder*="eléfono"]', "5551234567");
    
    // Wait for the API response
    console.log("Waiting for POST to /customers API...");
    const responsePromise = page.waitForResponse(response => 
      response.url().includes(`/api/tenants/${tenantSlug}/customers`) && 
      response.request().method() === 'POST',
      { timeout: 15000 }
    );

    // Click submit
    await page.click('button[type="submit"]');

    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // Wait for redirection to customer details (not /nueva)
    await page.waitForURL(url => url.pathname.includes('/clientes/') && !url.pathname.endsWith('/nueva'), { timeout: 10000 });

    // 3. Open "Nueva Visita" modal
    // Locate the "Nueva Visita" button. Based on previous test logs, it might be an icon or text.
    // Try text first
    const newVisitBtn = page.getByRole('button', { name: /Nueva Visita|Agregar Visita/i });
    if (await newVisitBtn.isVisible()) {
        await newVisitBtn.click();
    } else {
        // Fallback: look for a plus icon or similar if text is hidden/icon-only
        // For now, assume text is present as per standard UI
        await page.click('text="Nueva Visita"');
    }

    // 4. Verify "Agregar Productos" button exists
    const addProductBtn = page.getByRole('button', { name: "Agregar Productos" });
    await expect(addProductBtn).toBeVisible();

    // 5. Add a product
    await addProductBtn.click();

    // 6. Verify a product row is added
    // We expect a row with product selector, price, quantity, subtotal
    const productRow = page.locator('.grid-cols-12').last(); // Assuming it's the last grid row added
    await expect(productRow).toBeVisible();

    // 7. Select a product (mocking or selecting first available)
    // The selector is a React Select (SearchableSelect). 
    // Usually we interact by clicking the control and typing or clicking an option.
    const productSelect = productRow.locator('div[class*="control"]').first();
    await productSelect.click();
    
    // Select first option from dropdown
    await page.keyboard.press('Enter');

    // 8. Verify subtotal updates (assuming default quantity 1 and some price)
    // We can check if subtotal is not $0.00
    const subtotalDiv = productRow.locator('text=$'); 
    await expect(subtotalDiv).not.toContainText('$0.00');

    // 9. Save the visit
    await page.click('button[type="submit"]');

    // 10. Verify visit is saved (modal closes, toast appears, or list updates)
    // Wait for modal to disappear
    await expect(page.locator('role=dialog')).not.toBeVisible();

    // 11. Reload page or check history to verify persistence
    await page.reload();
    // Find the visit we just created (should be the first one in history)
    // Click edit/view
    // This part depends on the list structure. 
    // For now, just verifying the save action completed successfully is a good first step.
  });
});
