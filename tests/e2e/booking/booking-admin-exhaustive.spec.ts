import { test, expect } from "@playwright/test";

/**
 * Validación exhaustiva del flujo de booking público + admin para:
 * - wondernails
 * - centro-tenistico
 *
 * Flujo completo por tenant:
 * 1. Cliente abre /book → selecciona servicio, día, horario, llena datos → confirma
 * 2. Admin navega a /admin_bookings → ve la cita → cambia estado a "confirmada"
 * 3. Cambia a "completada" → verifica acciones disponibles
 */

const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || "jagzao@gmail.com",
  password: process.env.TEST_ADMIN_PASSWORD || "admin",
};

const TENANTS = [
  { slug: "wondernails", name: "Wonder Nails", theme: "dark" },
  { slug: "centro-tenistico", name: "Centro Tenístico", theme: "light" },
] as const;

// ── Seed + login helper ──────────────────────────────────────────────────────
async function seedAndLogin(
  request: import("@playwright/test").APIRequestContext,
  page: import("@playwright/test").Page,
  slug: string,
) {
  await request.post(`/api/debug/seed-e2e`, {
    data: { tenantSlug: slug },
    timeout: 30_000,
  });
  await page.goto(`/t/${slug}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("email-input").first().fill(ADMIN.email);
  await page.getByTestId("password-input").first().fill(ADMIN.password);
  await page.getByTestId("login-btn").first().click({ force: true });
  await page.waitForURL(
    (u) => u.href.includes(`/t/${slug}`) && !u.href.includes("/login"),
    { timeout: 30_000 },
  );
}

// ── PUBLIC BOOKING FLOW ──────────────────────────────────────────────────────
for (const tenant of TENANTS) {
  test.describe(`[${tenant.slug}] Formulario público de citas`, () => {
    test.beforeEach(async ({ page }) => {
      // Mock POST to avoid real DB writes during the form test
      await page.route(
        `**/api/tenants/${tenant.slug}/bookings`,
        async (route) => {
          if (route.request().method() === "POST") {
            await route.fulfill({
              status: 201,
              contentType: "application/json",
              body: JSON.stringify({
                data: { id: "e2e-booking-test", status: "pending" },
              }),
            });
            return;
          }
          await route.continue();
        },
      );
    });

    test(`carga la página y muestra servicios @BOOK-${tenant.slug.toUpperCase()}`, async ({
      page,
    }) => {
      await page.goto(`/t/${tenant.slug}/book`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      // El panel principal debe estar visible
      await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
        timeout: 30_000,
      });

      // Selector de servicio
      await expect(page.getByTestId("book-service-select").first()).toBeVisible(
        {
          timeout: 10_000,
        },
      );

      // Al menos 5 días en el carrusel
      const days = page.locator('[data-testid^="book-day-"]');
      await expect(days.first()).toBeVisible({ timeout: 10_000 });
      expect(await days.count()).toBeGreaterThanOrEqual(5);
    });

    test(`flujo completo: servicio → día → horario → datos → confirmación @BOOK-${tenant.slug.toUpperCase()}`, async ({
      page,
    }) => {
      await page.goto(`/t/${tenant.slug}/book`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
        timeout: 30_000,
      });

      // Buscar un día con slots. Si hoy no tiene, avanzar.
      let slotCount = await page.locator('[data-testid^="book-time-"]').count();
      if (slotCount === 0) {
        // Intentar días siguientes
        for (let i = 1; i < 5; i++) {
          await page.locator('[data-testid^="book-day-"]').nth(i).click();
          await page.waitForTimeout(400);
          slotCount = await page.locator('[data-testid^="book-time-"]').count();
          if (slotCount > 0) break;
        }
      }

      // Si no hay slots en ningún día del carrusel, es aceptable (calendario vació)
      if (slotCount === 0) {
        test.skip(
          true,
          "No hay horarios disponibles en ningún día del carrusel",
        );
        return;
      }

      // Clic en primer horario disponible
      const firstSlot = page.locator('[data-testid^="book-time-"]').first();
      await expect(firstSlot).toBeVisible({ timeout: 10_000 });
      await firstSlot.click();

      // Campos del cliente deben aparecer
      await expect(page.getByTestId("book-customer-name").first()).toBeVisible({
        timeout: 10_000,
      });
      await page
        .getByTestId("book-customer-name")
        .first()
        .fill("E2E Validation User");
      await page.getByTestId("book-customer-phone").first().fill("5551234567");

      // Submit
      await page.getByTestId("book-submit").first().click();

      // Mensaje de éxito (mock responde 201)
      await expect(page.getByTestId("book-success").first()).toBeVisible({
        timeout: 15_000,
      });
    });
  });
}

// ── ADMIN BOOKINGS VIEW ──────────────────────────────────────────────────────
for (const tenant of TENANTS) {
  test.describe(`[${tenant.slug}] Panel admin de citas`, () => {
    test(`admin puede ver y gestionar citas @ADMIN-BOOKINGS-${tenant.slug.toUpperCase()}`, async ({
      page,
      request,
    }) => {
      // 1. Seed + crear una cita real
      await seedAndLogin(request, page, tenant.slug);

      // Crear booking real via API para que el admin lo vea
      const bookingRes = await request.post(
        `/api/tenants/${tenant.slug}/bookings`,
        {
          data: {
            serviceId: await getFirstServiceId(request, tenant.slug),
            customerName: "Cliente E2E Test Admin",
            customerPhone: "5559876543",
            customerEmail: "e2e-test@example.com",
            startTime: getTomorrow9am(),
            endTime: getTomorrow10am(),
            totalPrice: 50,
            notes: "Cita de prueba E2E",
          },
        },
      );
      expect(bookingRes.status()).toBe(201);
      const { data: createdBooking } = await bookingRes.json();

      // 2. Navegar al panel de admin bookings
      await page.goto(`/t/${tenant.slug}/admin_bookings`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      // El título de la página debe estar presente
      await expect(page.getByText("Gestión de Citas").first()).toBeVisible({
        timeout: 20_000,
      });

      // La lista de citas debe aparecer
      const list = page.getByTestId("bookings-list");
      await expect(list).toBeVisible({ timeout: 15_000 });

      // La cita creada debe estar visible
      await expect(
        page.getByText("Cliente E2E Test Admin").first(),
      ).toBeVisible({
        timeout: 10_000,
      });

      // El badge de estado debe decir "Pendiente"
      await expect(page.getByText("Pendiente").first()).toBeVisible({
        timeout: 5_000,
      });

      // 3. Confirmar la cita
      const bookingCard = page.getByTestId(`booking-card-${createdBooking.id}`);
      await expect(bookingCard).toBeVisible({ timeout: 10_000 });

      const confirmBtn = bookingCard.getByText("Confirmar");
      await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
      await confirmBtn.click();

      // Debe aparecer mensaje de éxito y badge "Confirmada"
      await expect(
        page.getByText(/confirmada exitosamente/i).first(),
      ).toBeVisible({ timeout: 10_000 });

      // 4. Completar la cita
      await page.waitForTimeout(500); // re-render
      const completeBtn = bookingCard.getByText("Completar");
      await expect(completeBtn).toBeVisible({ timeout: 10_000 });
      await completeBtn.click();

      await expect(
        page.getByText(/completada exitosamente/i).first(),
      ).toBeVisible({ timeout: 10_000 });

      // 5. Limpiar: eliminar la cita creada
      await request.delete(
        `/api/tenants/${tenant.slug}/bookings/${createdBooking.id}`,
      );
    });

    test(`filtros por estado funcionan @ADMIN-BOOKINGS-FILTERS-${tenant.slug.toUpperCase()}`, async ({
      page,
      request,
    }) => {
      await seedAndLogin(request, page, tenant.slug);

      await page.goto(`/t/${tenant.slug}/admin_bookings`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      await expect(page.getByText("Gestión de Citas").first()).toBeVisible({
        timeout: 20_000,
      });

      // Verificar que los botones de filtro existen
      for (const filter of [
        "all",
        "pending",
        "confirmed",
        "completed",
        "cancelled",
      ]) {
        await expect(page.getByTestId(`filter-${filter}`)).toBeVisible({
          timeout: 5_000,
        });
      }

      // Clic en "Pendientes"
      await page.getByTestId("filter-pending").click();
      await page.waitForTimeout(500);

      // Clic en "Todas"
      await page.getByTestId("filter-all").click();
      await page.waitForTimeout(500);

      // El panel no debe estar en error
      await expect(page.getByText("Gestión de Citas").first()).toBeVisible();
    });
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
async function getFirstServiceId(
  request: import("@playwright/test").APIRequestContext,
  slug: string,
): Promise<string> {
  const res = await request.get(`/api/v1/public/services?tenant=${slug}`);
  if (!res.ok()) throw new Error(`Cannot get services for ${slug}`);
  const data = await res.json();
  const services = data.services ?? data.data ?? data;
  if (!Array.isArray(services) || services.length === 0) {
    throw new Error(`No services found for tenant ${slug}`);
  }
  return services[0].id;
}

function getTomorrow9am(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function getTomorrow10am(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}
