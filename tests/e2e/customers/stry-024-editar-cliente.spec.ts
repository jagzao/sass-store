import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../helpers/test-helpers";

const BASE = process.env.BASE_URL || "http://localhost:3003";

test.describe("@stry-024 Editar datos personales del cliente desde el expediente", () => {
  const tenant = "wondernails";
  const customersUrl = `${BASE}/t/${tenant}/clientes`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("ESC-01: Happy path — editar y guardar datos personales", async ({
    page,
  }) => {
    await page.goto(customersUrl);
    await page.waitForSelector('button:has-text("Ver Expediente")', {
      state: "visible",
      timeout: 10000,
    });

    await page.locator('button:has-text("Ver Expediente")').first().click();

    await page.waitForSelector("text=Expediente de Clienta", {
      state: "visible",
    });
    await page.waitForSelector('[data-testid="btn-edit-customer"]', {
      state: "visible",
    });

    await page.click('[data-testid="btn-edit-customer"]');

    await expect(page.locator('[data-testid="input-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-birthday"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-address"]')).toBeVisible();
    await expect(page.locator('[data-testid="select-status"]')).toBeVisible();

    await page.fill('[data-testid="input-phone"]', "5551234567");
    await page.fill('[data-testid="input-email"]', "test@example.com");
    await page.fill('[data-testid="input-address"]', "Calle Principal 123");
    await page.fill('[data-testid="input-birthday"]', "1990-05-15");
    await page.selectOption('[data-testid="select-status"]', "inactive");

    await page.click('[data-testid="btn-save-customer"]');

    await expect(
      page.locator('[data-testid="btn-edit-customer"]'),
    ).toBeVisible();

    await expect(page.getByText("5551234567").first()).toBeVisible();
    await expect(page.getByText("test@example.com").first()).toBeVisible();
    await expect(page.getByText("Calle Principal 123").first()).toBeVisible();
    await expect(page.getByText("Inactiva").first()).toBeVisible();
  });

  test("ESC-02: Validacion — email invalido", async ({ page }) => {
    await page.goto(customersUrl);
    await page.waitForSelector('button:has-text("Ver Expediente")', {
      state: "visible",
      timeout: 10000,
    });

    await page.locator('button:has-text("Ver Expediente")').first().click();
    await page.waitForSelector('[data-testid="btn-edit-customer"]', {
      state: "visible",
    });
    await page.click('[data-testid="btn-edit-customer"]');

    // Clear name to trigger validation
    await page.fill('[data-testid="input-name"]', "");
    await page.fill('[data-testid="input-phone"]', "5550000000");
    await page.fill('[data-testid="input-email"]', "invalid-email");
    await page.click('[data-testid="btn-save-customer"]');

    await expect(page.locator("text=El nombre es obligatorio.")).toBeVisible();

    // Now fill name and test email validation
    await page.fill('[data-testid="input-name"]', "Penelope Vega");
    await page.click('[data-testid="btn-save-customer"]');
    await expect(
      page.locator("text=El correo electrónico no es válido."),
    ).toBeVisible();
  });

  test("ESC-03: Cancelar edicion", async ({ page }) => {
    await page.goto(customersUrl);
    await page.waitForSelector('button:has-text("Ver Expediente")', {
      state: "visible",
      timeout: 10000,
    });

    await page.locator('button:has-text("Ver Expediente")').first().click();
    await page.waitForSelector('[data-testid="btn-edit-customer"]', {
      state: "visible",
    });

    await page.click('[data-testid="btn-edit-customer"]');
    await page.fill('[data-testid="input-phone"]', "9999999999");
    await page.click('[data-testid="btn-cancel-edit"]');

    await expect(
      page.locator('[data-testid="btn-edit-customer"]'),
    ).toBeVisible();
    await expect(page.locator("text=9999999999")).not.toBeVisible();
  });

  test("ESC-05: Pagina completa — boton Editar visible", async ({ page }) => {
    await page.goto(customersUrl);
    await page.waitForSelector('button:has-text("Ver Expediente")', {
      state: "visible",
      timeout: 10000,
    });

    await page.locator('button:has-text("Ver Expediente")').first().click();
    await page.waitForSelector("text=Expediente de Clienta", {
      state: "visible",
    });

    const openFullPage = page.locator("text=Abrir en pagina completa").first();
    if (await openFullPage.isVisible().catch(() => false)) {
      const href = await openFullPage.getAttribute("href");
      if (href) {
        await page.goto(`${BASE}${href}`);
        await page.waitForSelector('[data-testid="btn-edit-customer"]', {
          state: "visible",
        });
        await page.click('[data-testid="btn-edit-customer"]');
        await expect(page.locator('[data-testid="input-phone"]')).toBeVisible();
        await page.click('[data-testid="btn-cancel-edit"]');
        await expect(
          page.locator('[data-testid="btn-edit-customer"]'),
        ).toBeVisible();
      }
    }
  });
});
