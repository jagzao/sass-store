import { test, expect } from "@playwright/test";
// import { setupTestTenant } from "../setup/auth-setup";

test.describe.serial("Service CRUD Operations", () => {
  // Use existing tenant for E2E
  const tenantSlug = "wondernails";

  // Removed automated tenant setup as auth-setup is missing in E2E context
  // test.beforeAll(async () => {
  //   const { slug } = await setupTestTenant();
  //   tenantSlug = slug;
  // });

  test("should create, read, update and delete a service", async ({ page }) => {
    test.setTimeout(120000); // Increase timeout for full CRUD flow
    // 0. Register and Login to get access
    const randomSuffix = Math.floor(Math.random() * 10000);
    const email = `service_test_${randomSuffix}@hotmail.com`;
    const password = "Password123!";

    // Login
    await page.goto(`/t/${tenantSlug}/login`);
    await page.fill('input[name="email"]', "admin@wondernails.com");
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard or home
    await page.waitForURL(`**\/t/${tenantSlug}`, { timeout: 30000 });
    await page.waitForLoadState("networkidle");

    // Wait for navigation to dashboard or home
    await page.waitForURL(`**\/t/${tenantSlug}`, { timeout: 15000 });

    // 1. Navigate to Admin Services
    await page.goto(`/t/${tenantSlug}/admin_services`);

    // Check we are on the right page
    await expect(
      page.getByText("Gestiona el catálogo de servicios"),
    ).toBeVisible();

    // 2. Create New Service
    await page.getByRole("button", { name: "+ Nuevo Servicio" }).click();
    await expect(page.getByText("Crear Nuevo Servicio")).toBeVisible();

    const serviceName = "Test Service " + Date.now();
    await page
      .locator("input[placeholder='Ej: Manicure Premium']")
      .fill(serviceName);
    await page
      .locator("textarea[placeholder='Descripción detallada del servicio']")
      .fill("Description for test service");
    await page.locator("input[placeholder='0.00']").fill("50.00");
    await page.locator("input[placeholder='60']").fill("45");

    // Toggle active/featured just to test interaction
    await page.getByRole("checkbox", { name: "Servicio destacado" }).check();

    // Submit
    await page.getByRole("button", { name: "Crear Servicio" }).click();

    // Verify success message/alert or just presence in list
    // (Alert handling might need page.on('dialog'), but the app uses window.alert)
    // For this test we wait for the modal to close and item to appear
    await expect(page.getByText(serviceName)).toBeVisible();
    await expect(page.getByText("45 min")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();

    // 3. Update Service (Testing the specific bug fix for empty image)
    await page.getByRole("button", { name: "Editar" }).first().click();

    await expect(page.getByText("Editar Servicio")).toBeVisible();

    const updatedName = serviceName + " Updated";
    await page
      .locator("input[placeholder='Ej: Manicure Premium']")
      .fill(updatedName);
    await page
      .locator("textarea[placeholder='Descripción detallada del servicio']")
      .fill("Updated via browser automation");
    await page.locator("input[placeholder='0.00']").fill("99.00");

    // Ensure image is empty (simulating the bug condition)
    // The input is hidden, but we can verify the "Click para subir imagen" text is visible, meaning no value.
    await expect(page.getByText("Click para subir imagen")).toBeVisible();

    await page.getByRole("button", { name: "Actualizar Servicio" }).click();

    // Verify update success
    await expect(page.getByText(updatedName)).toBeVisible();
    await expect(page.getByText("$99.00")).toBeVisible();

    // 4. Delete Service
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Eliminar" }).first().click();

    // Verify deletion
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});
