import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../helpers/test-helpers";

test.describe.serial("Customer & Visit Workflow", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test("should create client and schedule a new visit from customer file", async ({
    page,
  }) => {
    test.setTimeout(180000);

    // 0) Login
    await loginAsAdmin(page);

    // 1) Open customers page and create a client
    await page.goto(`/t/${tenantSlug}/clientes`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: "+ Agregar Clienta" }),
    ).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "+ Agregar Clienta" }).click();

    const randomId = Date.now();
    const clientName = `Visit Tester ${randomId}`;
    const clientPhone = `555${String(randomId).slice(-7)}`;
    const clientEmail = `visit-${randomId}@test.com`;

    await expect(
      page.getByRole("heading", { name: /Agregar Nueva Clienta/i }),
    ).toBeVisible({ timeout: 10000 });

    await page
      .locator('input[placeholder="Ej: María García López"]')
      .fill(clientName);
    await page.locator('input[placeholder="Ej: 555-1234"]').fill(clientPhone);
    await page
      .locator('input[placeholder="Ej: maria@example.com"]')
      .fill(clientEmail);

    const createCustomerResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tenants/${tenantSlug}/customers`) &&
        response.request().method() === "POST",
      { timeout: 20000 },
    );

    await page.getByRole("button", { name: /Crear Clienta/i }).click();

    const customerResponse = await createCustomerResponse;
    expect(customerResponse.status()).toBe(201);

    const customerPayload = await customerResponse.json();
    const customerId = customerPayload?.customer?.id;
    expect(customerId).toBeTruthy();

    // 2) Open customer file directly
    await page.goto(`/t/${tenantSlug}/clientes/${customerId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Historial de Visitas/i)).toBeVisible({
      timeout: 20000,
    });

    // 3) Open new visit modal from customer file
    const newVisitButton = page.getByTestId("btn-new-visit");
    await expect(newVisitButton).toBeVisible({ timeout: 15000 });
    await newVisitButton.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: /^Nueva Visita$/ }),
    ).toBeVisible({ timeout: 10000 });

    // 4) Add a service to enable submit
    const serviceName = `Visit Service ${randomId}`;
    const serviceResponse = await page.request.post(
      `/api/tenants/${tenantSlug}/services`,
      {
        data: {
          name: serviceName,
          description: "Service created by E2E for visit flow",
          price: 399,
          duration: 60,
          featured: false,
          active: true,
        },
      },
    );

    expect(serviceResponse.status()).toBe(201);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.getByTestId("btn-new-visit").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Agregar Servicio/i }).click();

    // react-select opens a combobox input; choose a service option by keyboard
    const serviceCombobox = page.getByRole("combobox", { name: "Servicio" });
    await expect(serviceCombobox).toBeVisible({ timeout: 10000 });
    await serviceCombobox.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    // 4.25) Validate quote action does not crash and opens success modal
    const quoteButton = page.getByRole("button", { name: /Cotización/i });
    await expect(quoteButton).toBeVisible({ timeout: 10000 });
    await quoteButton.click();

    await expect(page.getByText(/¡Cotización Creada!/i)).toBeVisible({
      timeout: 20000,
    });
    await page
      .locator('button:has-text("Cerrar")')
      .filter({ hasNot: page.locator("svg") })
      .first()
      .click();

    // Quote success close also closes Nueva Visita modal, reopen it
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByTestId("btn-new-visit").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /Agregar Servicio/i }).click();
    const serviceComboboxAfterQuote = page.getByRole("combobox", {
      name: "Servicio",
    });
    await expect(serviceComboboxAfterQuote).toBeVisible({ timeout: 10000 });
    await serviceComboboxAfterQuote.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    // 4.5) Validate WhatsApp action from Nueva Visita modal
    const whatsappButton = page.getByTestId("btn-whatsapp-visit");
    await expect(whatsappButton).toBeVisible({ timeout: 10000 });

    const [whatsappPopup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 20000 }),
      whatsappButton.click(),
    ]);

    await expect
      .poll(() => whatsappPopup.url(), { timeout: 15000 })
      .toMatch(/wa\.me|whatsapp\.com/);
    await expect(whatsappPopup.url()).toContain("text=");
    await whatsappPopup.close();

    const createVisitResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tenants/${tenantSlug}/customers/`) &&
        response.url().includes("/visits") &&
        response.request().method() === "POST",
      { timeout: 20000 },
    );

    const createBookingResponse = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tenants/${tenantSlug}/bookings`) &&
        response.request().method() === "POST",
      { timeout: 20000 },
    );

    await page.getByRole("button", { name: /^Visita$/ }).click();

    const visitResponse = await createVisitResponse;
    expect(visitResponse.status()).toBe(201);

    const bookingResponse = await createBookingResponse;
    expect(bookingResponse.status()).toBe(201);
    const bookingPayload = await bookingResponse.json();
    const bookingId = bookingPayload?.data?.id;
    expect(bookingId).toBeTruthy();

    // 5) Verify new visit appears in history table
    await expect(page.getByText("Historial de Visitas")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator("tbody tr").first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Programada")).toBeVisible({ timeout: 15000 });

    // 6) Validate the synced booking exists in pending bookings feed
    await expect
      .poll(
        async () => {
          const bookingsRes = await page.request.get(
            `/api/tenants/${tenantSlug}/bookings?status=pending`,
          );

          if (!bookingsRes.ok()) return false;
          const bookingsPayload = await bookingsRes.json();
          const bookings = bookingsPayload?.bookings || [];

          return bookings.some(
            (booking: any) =>
              booking.id === bookingId && booking.customerName === clientName,
          );
        },
        {
          timeout: 20000,
        },
      )
      .toBe(true);
  });
});
