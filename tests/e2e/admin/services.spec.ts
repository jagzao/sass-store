import { test, expect, type Page } from "@playwright/test";
import {
  loginAsAdmin,
  navigateToAdminServices,
  setupDialogHandler,
  generateTestName,
  createService,
} from "../helpers/test-helpers";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serviceRow = (page: Page, serviceName: string) =>
  page.getByRole("row", { name: new RegExp(escapeRegExp(serviceName)) });

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
      duration: "1.5",
      featured: true,
    });

    // Verify service appears in list
    const createdRow = serviceRow(page, serviceName);
    await expect(createdRow).toBeVisible({ timeout: 10000 });
    await expect(createdRow.getByText("1.5 h")).toBeVisible();
    await expect(createdRow.getByText("$50.00")).toBeVisible();

    // Cleanup: Delete the test service
    setupDialogHandler(page, "accept");
    await serviceRow(page, serviceName)
      .getByRole("button", { name: "Eliminar" })
      .click();
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
      duration: "1.5",
    });

    // Edit the service
    await serviceRow(page, serviceName)
      .getByRole("button", { name: "Editar" })
      .click();
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
    await expect(
      page.getByText("Click para subir imagen").first(),
    ).toBeVisible();

    // Submit update
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Actualizar Servicio" }).click();

    // Verify updates
    const updatedRow = serviceRow(page, updatedName);
    await expect(updatedRow).toBeVisible({ timeout: 10000 });
    await expect(updatedRow.getByText("$99.00")).toBeVisible();

    // Cleanup
    setupDialogHandler(page, "accept");
    await serviceRow(page, updatedName)
      .getByRole("button", { name: "Eliminar" })
      .click();
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
      duration: "0.5",
    });

    // Verify service exists
    await expect(page.getByText(serviceName)).toBeVisible();

    // Delete service
    setupDialogHandler(page, "accept");
    await serviceRow(page, serviceName)
      .getByRole("button", { name: "Eliminar" })
      .click();

    // Verify deletion
    await expect(page.getByText(serviceName)).not.toBeVisible({
      timeout: 5000,
    });
  });

  test("should clear draft when closing the create form", async ({ page }) => {
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

    // Verify draft was cleared
    const nameInput = page.locator("input[placeholder='Ej: Manicure Premium']");
    await expect(nameInput).toHaveValue("");

    // Close modal
    await page.locator('button:has-text("×")').click();
  });
});
