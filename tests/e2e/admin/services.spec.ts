import { test, expect } from "@playwright/test";
import {
  loginAsAdmin,
  navigateToAdminServices,
  setupDialogHandler,
  generateTestName,
  createService,
} from "../helpers/test-helpers";

test.describe.serial("Service CRUD Operations", () => {
  test("should create a new service successfully", async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to services page
    await navigateToAdminServices(page);

    // Create service with helper
    const serviceName = generateTestName("Service");
    await createService(page, {
      name: serviceName,
      description: "E2E test service",
      price: "50.00",
      duration: "45",
      featured: true,
    });

    // Verify service appears in list
    await expect(page.getByText(serviceName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("45 min")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();

    // Cleanup: Delete the test service
    setupDialogHandler(page, "accept");
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await expect(page.getByText(serviceName)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("should update an existing service", async ({ page }) => {
    // Login and navigate
    await loginAsAdmin(page);
    await navigateToAdminServices(page);

    // Create a service to update
    const serviceName = generateTestName("Service to Update");
    await createService(page, {
      name: serviceName,
      price: "50.00",
      duration: "45",
    });

    // Edit the service
    await page.getByRole("button", { name: "Editar" }).first().click();
    await expect(page.getByText("Editar Servicio")).toBeVisible();

    // Update fields
    const updatedName = serviceName + " [Updated]";
    await page
      .locator("input[placeholder='Ej: Manicure Premium']")
      .fill(updatedName);
    await page
      .locator("textarea[placeholder='Descripción detallada del servicio']")
      .fill("Updated description via E2E test");
    await page.locator("input[placeholder='0.00']").fill("99.00");

    // Verify empty image handling (bug fix validation)
    await expect(page.getByText("Click para subir imagen")).toBeVisible();

    // Submit update
    await page.getByRole("button", { name: "Actualizar Servicio" }).click();

    // Verify updates
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("$99.00")).toBeVisible();

    // Cleanup
    setupDialogHandler(page, "accept");
    await page.getByRole("button", { name: "Eliminar" }).first().click();
    await expect(page.getByText(updatedName)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("should delete a service", async ({ page }) => {
    // Login and navigate
    await loginAsAdmin(page);
    await navigateToAdminServices(page);

    // Create a service to delete
    const serviceName = generateTestName("Service to Delete");
    await createService(page, {
      name: serviceName,
      price: "25.00",
      duration: "30",
    });

    // Verify service exists
    await expect(page.getByText(serviceName)).toBeVisible();

    // Delete service
    setupDialogHandler(page, "accept");
    await page.getByRole("button", { name: "Eliminar" }).first().click();

    // Verify deletion
    await expect(page.getByText(serviceName)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("should validate form persistence (draft feature)", async ({ page }) => {
    // Login and navigate
    await loginAsAdmin(page);
    await navigateToAdminServices(page);

    // Open create modal
    await page.getByRole("button", { name: "+ Nuevo Servicio" }).click();
    await expect(page.getByText("Crear Nuevo Servicio")).toBeVisible();

    // Fill form partially
    const draftName = generateTestName("Draft Service");
    await page
      .locator("input[placeholder='Ej: Manicure Premium']")
      .fill(draftName);
    await page.locator("input[placeholder='0.00']").fill("75.00");

    // Close modal without submitting (testing persistence)
    await page.locator('button:has-text("×")').click();

    // Re-open modal
    await page.getByRole("button", { name: "+ Nuevo Servicio" }).click();

    // Verify draft was restored
    const nameInput = page.locator("input[placeholder='Ej: Manicure Premium']");
    await expect(nameInput).toHaveValue(draftName);

    // Verify draft indicator is shown
    await expect(page.getByText("Borrador guardado")).toBeVisible();

    // Clean up draft
    await page.getByText("Limpiar").click();
    await expect(nameInput).toHaveValue("");

    // Close modal
    await page.locator('button:has-text("×")').click();
  });
});
