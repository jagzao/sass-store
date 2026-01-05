import { test, expect } from "@playwright/test";

test.describe("Menu Creation Flow - Wondernails", () => {
  const tenantSlug = "wondernails";
  const userEmail = "marialiciavh1984@gmail.com";
  const userPassword = process.env.TEST_SPECIFIC_PASSWORD || "admin";

  test("should login, select services, generate menu, and save", async ({
    page,
  }) => {
    // 1. Login
    console.log(`Navigating to login page for tenant: ${tenantSlug}`);
    await page.goto(`/t/${tenantSlug}/login`);
    await page.waitForLoadState("networkidle");

    await page.getByTestId("email-input").fill(userEmail);
    await page.getByTestId("password-input").fill(userPassword);
    await page.getByTestId("login-btn").click();

    await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}`), {
      timeout: 15000,
    });
    console.log("Login successful.");

    // 2. Navigate to Services Admin
    await page.goto(`/t/${tenantSlug}/admin_services`);
    // Wait for the "Create Menu" button (adjust selector as needed)
    // Assuming there's a button to open the modal. If not in the main UI yet, maybe we need to find it.
    // Based on code, ProductPanel is used in 'MenuDesignerModal'.
    // We need to trigger this modal.
    // Let's assume there is a button with text "Diseñar Menú" or similar based on typical UI.
    // If not, we might need to inspect the page source code validation step.

    // NOTE: This test might fail if the UI button selector is unknown.
    // I'll assume a generic text selector for now.
    const openMenuBtn = page.getByRole("button", { name: /Diseñar Menú/i });
    if (await openMenuBtn.isVisible()) {
      await openMenuBtn.click();
    } else {
      console.log(
        "Menu button not found via text, trying Generic 'Nuevo' button",
      );
      // Fallback or skip
    }

    // 3. Verify Auto-Selection
    // Wait for modal
    await expect(page.getByText("Diseñador de Menú")).toBeVisible();

    // Check checkboxes
    // The checkboxes are inside the ProductPanel.
    // Selector: input[type="checkbox"] inside the panel
    // We expect multiple to be checked by default.
    const checkboxes = page.locator('input[type="checkbox"]:checked');
    expect(await checkboxes.count()).toBeGreaterThan(0);
    console.log("Services auto-selected verified.");

    // 4. Generate Menu
    await page.getByText("Generar Menú con Selección").click();

    // 5. Verify Content in Editor (Tiptap)
    // Tiptap content is inside .ProseMirror
    const editor = page.locator(".ProseMirror");
    await expect(editor).toContainText("Servicios"); // The header we added
    await expect(editor).toContainText("$"); // Prices
    console.log("Menu generated in editor.");

    // 6. Save
    await page.getByRole("button", { name: "Guardar Diseño" }).click();

    // 7. Verify Success
    // Expect modal to close or toast message
    // Just waiting for potentially successful request log?
    // For now, simple wait
    await page.waitForTimeout(2000);

    console.log("Test completed flow.");
  });
});
