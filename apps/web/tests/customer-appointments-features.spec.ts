import { test, expect } from "@playwright/test";

test.describe("Customer Management & Appointments Dashboard", () => {
  const TENANT_SLUG = "zo-system";

  test("should load the admin dashboard and navigate to customers", async ({ page }) => {
    // 1. Visit the admin dashboard directly
    await page.goto(`/t/${TENANT_SLUG}/admin`);
    
    // We expect the navigation or cards to be present. Wait for network to be idle.
    await page.waitForLoadState("networkidle");
    
    // Check if the overall "Panel de Administración" header is there
    await expect(page.getByText(/Panel de Administración/i).first()).toBeVisible();
  });

  test("should explicitly display the 'Precio a Cobrar' in the dashboard appointments section", async ({ page }) => {
    await page.goto(`/t/${TENANT_SLUG}/admin`);
    
    // Check for the explicit text "NUEVAS CLIENTAS POR CONFIRMAR ESTA SEMANA"
    const sectionTitle = page.getByText(/NUEVAS CLIENTAS POR CONFIRMAR ESTA SEMANA/i);
    await expect(sectionTitle).toBeVisible();

    // Check if there are appointments rendering the custom price block (if there are appointments > 0)
    // Wait for the block to appear or fallback if there are no pending appointments
    const noAppointmentsMsg = page.getByText(/Todas las citas están confirmadas/i);
    const hasNoAppointments = await noAppointmentsMsg.isVisible();

    if (!hasNoAppointments) {
      const priceElement = page.getByText(/Precio a Cobrar:/i).first();
      await expect(priceElement).toBeVisible();
    }
  });

  test("should display live real prices and columns in the Calendar page", async ({ page }) => {
    await page.goto(`/t/${TENANT_SLUG}/admin/calendar`);
    await page.waitForLoadState("networkidle");

    // Check for the explicit title "CITAS DE HOY"
    const todayAppointmentsTitle = page.getByText(/CITAS DE HOY/i).first();
    await expect(todayAppointmentsTitle).toBeVisible();
    
    // The calendar page should also display 'Precio a Cobrar:'
    const noAppointmentsTodayMsg = page.getByText(/No hay citas registradas para hoy/i);
    const hasNoAppointmentsToday = await noAppointmentsTodayMsg.isVisible();

    if (!hasNoAppointmentsToday) {
      const priceElement = page.getByText(/Precio a Cobrar:/i).first();
      await expect(priceElement).toBeVisible();
    }
  });

  test("should navigate to customers and have the new birthday and medical history fields in the form", async ({ page }) => {
    // Navigate straight to customers page
    await page.goto(`/t/${TENANT_SLUG}/admin/clientes`);
    await page.waitForLoadState("networkidle");

    // The header 'Cumpleaños' must be present in the table
    const birthdayColumn = page.getByText("Cumpleaños");
    await expect(birthdayColumn).toBeVisible();

    // Open the creation modal for a new customer
    const createButton = page.getByRole('button', { name: /\+ Nueva Clienta|Crear/i }).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Verify the new fields exist in the modal/form
      await expect(page.getByText("Fecha de Cumpleaños")).toBeVisible();
      await expect(page.getByText("⚕️ Historial Médico")).toBeVisible();
      await expect(page.getByText(/Condiciones Médicas \(Diabetes, Psoriasis/i)).toBeVisible();
      await expect(page.getByText("Alergias Conocidas")).toBeVisible();
      await expect(page.getByText("Medicamentos Actuales")).toBeVisible();
    }
  });

});
