import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/test-helpers';

// Use standard demo tenant configured in the app
const tenantSlug = 'wondernails';
const adminUrl = `/t/${tenantSlug}`;

test.describe('Retouch Monitor & Appointment Details Dashboard', () => {

   test.beforeEach(async ({ page }) => {
     // Navigate directly to the dashboard
     await loginAsAdmin(page);
     await page.goto(adminUrl);
   });

   test('displays the Retouch Monitor section and UI correctly', async ({ page }) => {
      // 1. Wait for dashboard to load
      await expect(page.getByText('CITAS DE HOY', { exact: true })).toBeVisible({ timeout: 15000 });
      
      // 2. Validate Retouch Monitor title changed from old Appointments
      const retouchTitle = page.getByText(/MONITOR DE RETOQUES/i);
      await expect(retouchTitle).toBeVisible();

      const subtitle = page.getByText(/Clientas que visitaron entre hace 15 y 20 d.as sin una cita futura/i);
      await expect(subtitle).toBeVisible();
   });

   test('displays the Calendar Details Modal when clicking an appointment today', async ({ page }) => {
      // Navigate to Calendar Manager Dashboard
      await page.goto(`${adminUrl}/calendar`);
      await expect(page.getByRole('heading', { name: 'Gestión de Calendario' })).toBeVisible({ timeout: 15000 });

      // Inside CITAS DE HOY section, find the 'DETALLE' button if there are appointments.
      // E2E Note: Depends on local seed. We use generic selectors in case there are mock values.
      
      const citasSection = page.getByText('CITAS DE HOY', { exact: true });
      await expect(citasSection).toBeVisible();

      // If there's an appointment we can click 'Detalle'
      const checkEmpty = await page.getByText('No hay citas registradas para hoy.').isVisible();
      if (!checkEmpty) {
          const detailButtons = page.getByRole('button', { name: /Ver Detalles/i });
          
          if (await detailButtons.count() > 0) {
             await detailButtons.first().click();
             
             // Wait for the modal pop up
             const modalTitle = page.getByRole('heading', { name: 'DETALLE DE CITA' });
             await expect(modalTitle).toBeVisible();
             
             // Ensure it shows Costs, service, and Date/time.
             await expect(page.getByText('Costo Total')).toBeVisible();
             await expect(page.getByText('Foto del Diseño')).toBeVisible();
             await expect(page.getByText('Horario')).toBeVisible();

             // Close modal
             await page.getByRole('button', { name: 'Cerrar' }).last().click();
             await expect(modalTitle).not.toBeVisible();
          } else {
             console.log("No appointments seeded to click on.");
          }
      } else {
         console.log("Calendar is empty today for E2E run.");
      }
   });
});
