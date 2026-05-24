import { test, expect } from "@playwright/test";
import { loginAsAdmin, navigateToAdminServices } from "../helpers/test-helpers";

const PRODUCTS_URL = `/t/wondernails/admin/products`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Scope all locators inside the wizard overlay */
const wizard = (page: Parameters<typeof loginAsAdmin>[0]) =>
  page.locator('[data-testid="smart-publish-wizard"]');

async function openWizard(page: Parameters<typeof loginAsAdmin>[0]) {
  await page.getByRole("button", { name: /publicar con ia/i }).click();
  await expect(wizard(page)).toBeVisible({ timeout: 8000 });
  await expect(wizard(page).getByText("¿Qué vas a publicar?")).toBeVisible();
}

async function goToStep2(
  page: Parameters<typeof loginAsAdmin>[0],
  price = "350",
) {
  await page.getByPlaceholder("0.00").fill(price);
  await wizard(page)
    .getByRole("button", { name: /continuar/i })
    .click();
  await expect(wizard(page).getByText(/cuéntanos sobre tu/i)).toBeVisible({
    timeout: 5000,
  });
}

function mockGenerate(page: Parameters<typeof loginAsAdmin>[0], delay = 0) {
  return page.route("**/api/smart-publish/generate", async (route) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        imageUrl: null,
        ai: {
          name: "Bolsa Artesanal Premium",
          description:
            "Hermosa bolsa tejida a mano con técnicas ancestrales andinas. Ideal para el uso diario.",
          shortDescription: "Bolsa única tejida a mano",
          category: "Artesanías",
          suggestedSku: "BOLSA-001",
          fallback: false,
        },
      }),
    });
  });
}

function mockSave(page: Parameters<typeof loginAsAdmin>[0]) {
  return page.route("**/api/smart-publish/save", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        type: "product",
        data: {
          id: "test-product-id-e2e",
          name: "Bolsa Artesanal Premium",
          description: "Hermosa bolsa.",
          price: "350.00",
          imageUrl: null,
        },
      }),
    });
  });
}

async function triggerGenerate(page: Parameters<typeof loginAsAdmin>[0]) {
  await wizard(page)
    .getByRole("button", { name: /^texto$/i })
    .click();
  await wizard(page).locator("textarea").fill("Bolsa tejida a mano artesanal");
  await wizard(page)
    .getByRole("button", { name: /generar con ia/i })
    .click();
}

// ─── Tests: Productos ─────────────────────────────────────────────────────────

test.describe("SmartPublishWizard — Productos", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(PRODUCTS_URL);
    await page.waitForLoadState("networkidle");
  });

  test("botón Publicar con IA visible en página de productos", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /publicar con ia/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("wizard abre con paso 1 correcto (tipo + precio)", async ({ page }) => {
    await openWizard(page);
    await expect(
      wizard(page).getByText("Artículo físico o digital"),
    ).toBeVisible();
    await expect(
      wizard(page).getByText("Tratamiento, consulta, etc."),
    ).toBeVisible();
    await expect(page.getByPlaceholder("0.00")).toBeVisible();
  });

  test("paso 1: Continuar deshabilitado sin precio", async ({ page }) => {
    await openWizard(page);
    await expect(
      wizard(page).getByRole("button", { name: /continuar/i }),
    ).toBeDisabled();
    await page.getByPlaceholder("0.00").fill("250");
    await expect(
      wizard(page).getByRole("button", { name: /continuar/i }),
    ).toBeEnabled();
  });

  test("paso 1 → paso 2: avanza con precio", async ({ page }) => {
    await openWizard(page);
    await goToStep2(page, "150");
  });

  test("paso 2: tabs Foto / Texto / Ambos cambian la UI", async ({ page }) => {
    await openWizard(page);
    await goToStep2(page, "100");

    // Default: Ambos — both visible
    await expect(
      wizard(page).getByText("Tomar foto o seleccionar"),
    ).toBeVisible();
    await expect(wizard(page).locator("textarea")).toBeVisible();

    // Texto only
    await wizard(page)
      .getByRole("button", { name: /^texto$/i })
      .click();
    await expect(wizard(page).locator("textarea")).toBeVisible();
    await expect(
      wizard(page).getByText("Tomar foto o seleccionar"),
    ).not.toBeVisible();

    // Foto only
    await wizard(page)
      .getByRole("button", { name: /^foto$/i })
      .click();
    await expect(
      wizard(page).getByText("Tomar foto o seleccionar"),
    ).toBeVisible();
    await expect(wizard(page).locator("textarea")).not.toBeVisible();
  });

  test("paso 2: Generar con IA deshabilitado sin input", async ({ page }) => {
    await openWizard(page);
    await goToStep2(page);
    await wizard(page)
      .getByRole("button", { name: /^texto$/i })
      .click();

    const generarBtn = wizard(page).getByRole("button", {
      name: /generar con ia/i,
    });
    await expect(generarBtn).toBeDisabled();

    await wizard(page).locator("textarea").fill("Tapete artesanal");
    await expect(generarBtn).toBeEnabled();
  });

  test("paso 2: botón Atrás vuelve al paso 1", async ({ page }) => {
    await openWizard(page);
    await goToStep2(page);
    await wizard(page).getByText("← Atrás").click();
    await expect(wizard(page).getByText("¿Qué vas a publicar?")).toBeVisible();
  });

  test("cerrar wizard con botón X regresa a la lista", async ({ page }) => {
    await openWizard(page);
    await wizard(page)
      .getByRole("button", { name: /cerrar/i })
      .click();
    await expect(wizard(page)).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /publicar con ia/i }),
    ).toBeVisible();
  });

  test("paso 3: pantalla de carga visible mientras IA trabaja", async ({
    page,
  }) => {
    await mockGenerate(page, 1500); // 1.5s delay so Playwright catches loading
    await openWizard(page);
    await goToStep2(page);
    await triggerGenerate(page);

    await expect(wizard(page).getByText("IA trabajando...")).toBeVisible({
      timeout: 5000,
    });
  });

  test("paso 4: review muestra contenido IA editable", async ({ page }) => {
    await mockGenerate(page);
    await openWizard(page);
    await goToStep2(page, "350");
    await triggerGenerate(page);

    await expect(
      wizard(page).getByText("Revisa y edita si quieres"),
    ).toBeVisible({ timeout: 12000 });

    // AI name pre-filled using data-testid
    const nameInput = wizard(page).getByTestId("wizard-name-input");
    await expect(nameInput).toHaveValue("Bolsa Artesanal Premium");

    // Editable
    await nameInput.fill("Bolsa Artesanal Editada");
    await expect(nameInput).toHaveValue("Bolsa Artesanal Editada");

    // Price display inside wizard
    await expect(wizard(page).getByText("$350.00 MXN")).toBeVisible();
  });

  test("flujo completo: generar → guardar → pantalla de éxito", async ({
    page,
  }) => {
    await mockGenerate(page);
    await mockSave(page);

    await openWizard(page);
    await goToStep2(page, "350");
    await triggerGenerate(page);

    await expect(
      wizard(page).getByText("Revisa y edita si quieres"),
    ).toBeVisible({ timeout: 12000 });

    // Click Publicar button (scoped to wizard)
    await wizard(page)
      .getByRole("button", { name: /^publicar$/i })
      .click();

    // Success screen
    await expect(wizard(page).getByText("¡Publicado con éxito!")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      wizard(page).getByText("Bolsa Artesanal Premium"),
    ).toBeVisible();
    await expect(
      wizard(page).getByRole("button", { name: /agregar otro/i }),
    ).toBeVisible();
    await expect(
      wizard(page).getByRole("link", { name: /ver producto creado/i }),
    ).toBeVisible();
  });

  test("success → Agregar otro resetea wizard al paso 1", async ({ page }) => {
    await mockGenerate(page);
    await mockSave(page);

    await openWizard(page);
    await goToStep2(page, "100");
    await triggerGenerate(page);

    await expect(
      wizard(page).getByText("Revisa y edita si quieres"),
    ).toBeVisible({ timeout: 12000 });

    await wizard(page)
      .getByRole("button", { name: /^publicar$/i })
      .click();
    await expect(wizard(page).getByText("¡Publicado con éxito!")).toBeVisible({
      timeout: 10000,
    });

    await wizard(page)
      .getByRole("button", { name: /agregar otro/i })
      .click();

    // Back to step 1
    await expect(wizard(page).getByText("¿Qué vas a publicar?")).toBeVisible();
    await expect(page.getByPlaceholder("0.00")).toHaveValue("");
  });
});

// ─── Tests: Servicios ─────────────────────────────────────────────────────────

test.describe("SmartPublishWizard — Servicios", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminServices(page);
  });

  test("botón Publicar con IA visible en página de servicios", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /publicar con ia/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("wizard abre desde servicios con tipo Servicio seleccionable", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /publicar con ia/i }).click();
    await expect(wizard(page)).toBeVisible({ timeout: 8000 });
    await expect(wizard(page).getByText("¿Qué vas a publicar?")).toBeVisible();

    // Select service type (scoped to wizard to avoid page buttons)
    await wizard(page)
      .getByRole("button", { name: /servicio/i })
      .click();

    await page.getByPlaceholder("0.00").fill("500");
    await expect(
      wizard(page).getByRole("button", { name: /continuar/i }),
    ).toBeEnabled();
  });
});
