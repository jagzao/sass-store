import { test, expect } from "@playwright/test";

test.describe.serial("Customer & Visit Workflow", () => {
  const tenantSlug = "wondernails";

  test("should create client, add 3 visits, and edit a visit", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // 0. Login
    await page.goto(`/t/${tenantSlug}/login`);
    await page.fill('input[type="email"]', "admin@wondernails.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(`**\/t/${tenantSlug}`);

    // 1. Create Client
    await page.goto(`/t/${tenantSlug}/clientes`);
    await page.getByText("+ Agregar Clienta").click();

    // Fill client form
    const randomId = Math.floor(Math.random() * 10000);
    const clientName = `Visit Tester ${randomId}`;
    await page.waitForSelector('input[name="name"]'); // Wait for form
    await page.fill('input[name="name"]', clientName);
    await page.fill('input[name="email"]', `visit${randomId}@test.com`);
    await page.fill('input[name="phone"]', "5550000000");
    await page.check('input[name="terms"]');
    await page.click('button:has-text("Crear Clienta")');

    // Verify redirect to details
    await expect(page.getByText(clientName)).toBeVisible();
    await expect(page.getByText("Historial de Visitas")).toBeVisible();

    // 2. Add 3 Visits
    const visits = [
      { status: "completed", serviceIndex: 1, obs: "Visit 1: Completed" },
      { status: "scheduled", serviceIndex: 2, obs: "Visit 2: Scheduled" },
      { status: "completed", serviceIndex: 0, obs: "Visit 3: Final" },
    ];

    for (const [index, visit] of visits.entries()) {
      await page.getByRole("button", { name: "Nueva Visita" }).click();
      await expect(page.getByText("Nueva Visita")).toBeVisible(); // Modal title

      // Select status
      await page.locator('select[name="status"]').selectOption(visit.status);

      // Add service
      await page.getByRole("button", { name: "Agregar Servicio" }).click();
      // Wait for service select to appear (it might be dynamic)
      await page.waitForSelector('select[name="serviceId"]');

      // Select a service (using index/nth for simplicity if values vary)
      // Note: In real app, might need to wait for services to load
      await page
        .locator('select[name="serviceId"]')
        .nth(0)
        .selectOption({ index: visit.serviceIndex });

      await page.fill('textarea[name="notes"]', visit.obs);

      // Click "Crear Visita" inside the modal
      await page.getByRole("button", { name: "Crear Visita" }).click();

      // Verify modal closed and visit appears (simple text check)
      await expect(page.getByText(visit.obs)).toBeVisible();
    }

    // 3. Edit a Visit (The last one)
    // Verify the existence of the 3 visits first
    await expect(page.getByText("Visit 1: Completed")).toBeVisible();
    await expect(page.getByText("Visit 2: Scheduled")).toBeVisible();
    await expect(page.getByText("Visit 3: Final")).toBeVisible();

    // Click the "Editar" button for a visit.
    // The component uses title="Editar" for the edit button.
    await page.locator('button[title="Editar"]').first().click();

    // Wait for Edit Modal
    await expect(page.getByText("Editar Visita")).toBeVisible();

    // Update notes
    const updatedNote = "Visit updated by test";
    await page.fill('textarea[name="notes"]', updatedNote);
    await page.getByRole("button", { name: "Actualizar Visita" }).click();

    // Verify update
    await expect(page.getByText(updatedNote)).toBeVisible();
  });
});
