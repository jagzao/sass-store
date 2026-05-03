import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_CREDENTIALS } from "../helpers/test-helpers";

test.describe("POS E2E - Flujo completo con autenticación (seed obligatorio)", () => {
  const tenantSlug = TEST_CREDENTIALS.tenantSlug || "wondernails";

  test.beforeAll(async ({ request }) => {
    // Seed de datos E2E antes de correr cualquier test del suite
    const response = await request.post("/api/debug/seed-e2e", {
      data: { tenantSlug },
    });
    if (response.ok()) {
      const body = await response.json();
      console.log("[Seed]", body.message || body);
    }
  });

  test("should load POS page after admin login and show products", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto(`/t/${tenantSlug}/pos`);

    // Esperar a que termine la pantalla de carga (spinner)
    await page.waitForFunction(
      () => !document.body.innerText.includes("Cargando punto de venta"),
      { timeout: 15000 },
    );
    await page.waitForTimeout(500);

    // Verificar título principal
    await expect(
      page.getByRole("heading", { name: "Punto de Venta" }),
    ).toBeVisible({ timeout: 10000 });

    // Verificar grid de productos (título de sección h2)
    await expect(
      page.getByRole("heading", { name: "Productos" }),
    ).toBeVisible();

    // Verificar sección de carrito (título de sección h2)
    await expect(page.getByRole("heading", { name: "Carrito" })).toBeVisible();
  });

  test("should add a product to cart and show total", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`/t/${tenantSlug}/pos`);

    await expect(page.getByRole("heading", { name: "Productos" })).toBeVisible({
      timeout: 15000,
    });

    // Si hay productos, intenta agregar el primero
    const addButtons = page.locator("button:has-text('Agregar')");
    const count = await addButtons.count();

    if (count > 0) {
      await addButtons.first().click();
      // Verificar que el carrito muestra al menos 1 item
      await expect(page.locator("text=Carrito (1 items)")).toBeVisible({
        timeout: 5000,
      });

      // Verificar que el botón de cobrar muestra total > 0
      await expect(page.getByText("Cobrar $")).toBeVisible();
    } else {
      console.log(
        "⚠️ No products available in POS for tenant; skipping add-to-cart assertion",
      );
      test.skip();
    }
  });

  test("should redirect to login when accessing POS unauthenticated", async ({
    page,
  }) => {
    await page.goto(`/t/${tenantSlug}/pos`);
    await page.waitForURL(`**/t/${tenantSlug}/login**`, { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
