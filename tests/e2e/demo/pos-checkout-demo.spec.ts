import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_CREDENTIALS } from "../helpers/test-helpers";

/**
 * Demo Video Template
 * Genera un video .webm del flujo completo del feature.
 * Uso: npx playwright test tests/e2e/demo/ --video=on --project=chromium
 */

const tenantSlug = TEST_CREDENTIALS.tenantSlug || "wondernails";

test("[DEMO] POS Checkout completo", async ({ page }) => {
  // 1. Login como admin
  await loginAsAdmin(page);

  // 2. Navegar a POS
  await page.goto(`/t/${tenantSlug}/pos`);
  await page.waitForFunction(
    () => !document.body.innerText.includes("Cargando punto de venta"),
    { timeout: 15000 },
  );

  // 3. Verificar que carga la UI
  await expect(
    page.getByRole("heading", { name: "Punto de Venta" }),
  ).toBeVisible();

  // 4. (Opcional) Agregar producto al carrito si hay productos
  const addButtons = page.locator("button:has-text('Agregar')");
  if ((await addButtons.count()) > 0) {
    await addButtons.first().click();
    await expect(page.getByText("Carrito (1 items)")).toBeVisible({
      timeout: 5000,
    });
  }

  // 5. Pausa para que el video sea claro
  await page.waitForTimeout(1000);
});
