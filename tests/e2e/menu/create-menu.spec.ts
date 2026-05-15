import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe("Menu Creation Flow - Wondernails", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test("should login, open menu designer, create new design, and save", async ({
    page,
  }) => {
    // 1. Login via helper (ensures session is established)
    await loginAsAdmin(page);
    console.log("Login successful.");

    // 2. Navigate to Services Admin
    await page.goto(`/t/${tenantSlug}/admin_services`);
    await expect(
      page.getByText("Gestiona el catálogo de servicios"),
    ).toBeVisible({ timeout: 10000 });

    // Click "Menú" button to open modal
    const openMenuBtn = page.getByTestId("menu-designer-btn");
    await expect(openMenuBtn).toBeVisible();
    await openMenuBtn.click();

    // 3. Verify modal opens (list of designs)
    await expect(page.getByText("Mis Diseños de Menú")).toBeVisible();

    // Click "Crear Nuevo Diseño" to enter editor
    await page.getByText("Crear Nuevo Diseño").click();

    // 4. Verify editor loads
    await expect(
      page.getByRole("heading", { name: "Productos y Servicios" }),
    ).toBeVisible();

    // 5. Save the new design
    await page.getByRole("button", { name: "Guardar Cambios" }).click();

    // 6. Wait for save feedback (alert dialog)
    await page.waitForTimeout(2000);

    console.log("Test completed flow.");
  });
});
