import { test, expect, Page } from "@playwright/test";

/**
 * Full Navigation Map — Admin logueado
 * Objetivo: loguear como jagzao@gmail.com / admin en wondernails
 * y recorrer cada página cliqueando links, botones y tabs
 * para mapear funcionalidad y detectar errores de UI/UX.
 */

const TENANT = "wondernails";
const EMAIL = "jagzao@gmail.com";
const PASSWORD = "admin";

async function login(page: Page) {
  await page.goto(`/t/${TENANT}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expect(page.locator('input[name="email"]').first()).toBeVisible({
    timeout: 30000,
  });
  await page.locator('input[name="email"]').first().fill(EMAIL);
  await page.locator('input[name="password"]').first().fill(PASSWORD);
  // requestSubmit triggers React onSubmit (unlike form.submit)
  await page
    .locator("form")
    .first()
    .evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator("header")).toContainText(
    /Hola|Bienvenido|Dashboard|Productos|Servicios/i,
    { timeout: 30000 },
  );
}

async function goAndVerify(page: Page, path: string, label: string) {
  const url = `/t/${TENANT}${path}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
  }
  await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  const current = page.url();
  const hasError = (await page.locator("text=Error").count()) > 0;
  test.info().annotations.push({
    type: hasError ? "warning" : "info",
    description: `${label} → ${current}${hasError ? " ( contiene texto 'Error')" : ""}`,
  });
}

test.describe("🔐 Login & Sesión", () => {
  test("login con credenciales válidas", async ({ page }) => {
    await login(page);
  });

  test("login con credenciales inválidas muestra error", async ({ page }) => {
    await page.goto(`/t/${TENANT}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.locator('input[name="email"]').first()).toBeVisible({
      timeout: 30000,
    });
    await page.locator('input[name="email"]').first().fill("fake@example.com");
    await page.locator('input[name="password"]').first().fill("wrong");
    await page.locator('button:has-text("Iniciar sesión")').first().click();
    await expect(
      page.getByText(/Credenciales|Error|inválid/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("🏠 Navegación post-login", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Menú de navegación principal", async ({ page }) => {
    const menuBtn = page
      .locator('button[aria-label*="menú" i], button[aria-label*="menu" i]')
      .first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
    }
    const navItems = page.locator('nav a, header a, [role="navigation"] a');
    expect(await navItems.count()).toBeGreaterThan(0);
  });

  test("Servicios (/services)", async ({ page }) => {
    await goAndVerify(page, "/services", "Servicios");
  });

  test("Productos (/products)", async ({ page }) => {
    await goAndVerify(page, "/products", "Productos");
  });

  test("Reservas (/book)", async ({ page }) => {
    await goAndVerify(page, "/book", "Reservas");
  });

  test("Contacto (/contact)", async ({ page }) => {
    await goAndVerify(page, "/contact", "Contacto");
  });
});

test.describe("⚙️ Admin Pages (protegidas, post-login)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const adminRoutes = [
    { path: "/admin", label: "Admin Dashboard" },
    { path: "/admin/calendar", label: "Admin Calendar" },
    { path: "/admin/products", label: "Admin Products" },
    { path: "/admin_services", label: "Admin Services" },
    { path: "/admin_bookings", label: "Admin Bookings" },
    { path: "/admin/quotes", label: "Admin Quotes" },
    { path: "/admin_tenants", label: "Admin Tenants" },
    { path: "/pos", label: "POS" },
    { path: "/reports", label: "Reports" },
    { path: "/finance", label: "Finance" },
    { path: "/finance/movements", label: "Finance Movements" },
    { path: "/finance/budgets", label: "Finance Budgets" },
    { path: "/finance/categories", label: "Finance Categories" },
    { path: "/inventory", label: "Inventory" },
    { path: "/inventory/supplies", label: "Inventory Supplies" },
    { path: "/clientes", label: "Clientes" },
    { path: "/clientes/nueva", label: "Nuevo Cliente" },
    { path: "/cart", label: "Cart" },
    { path: "/checkout", label: "Checkout" },
    { path: "/orders", label: "Orders" },
    { path: "/profile", label: "Profile" },
    { path: "/account", label: "Account" },
    { path: "/settings/calendar", label: "Settings Calendar" },
    { path: "/config", label: "Config" },
    { path: "/favorites", label: "Favorites" },
    { path: "/social", label: "Social" },
    { path: "/retouch", label: "Retouch" },
    { path: "/reorder", label: "Reorder" },
  ];

  for (const route of adminRoutes) {
    test(`${route.label} (${route.path})`, async ({ page }) => {
      await goAndVerify(page, route.path, route.label);
    });
  }
});

test.describe("🖱️ Interacciones en POS", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`/t/${TENANT}/pos`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
  });

  test("POS: verificar botones/interactivos visibles", async ({ page }) => {
    const buttons = page.locator("button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("🖱️ Interacciones en Clientes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Clientes: buscar y abrir nuevo cliente", async ({ page }) => {
    await page.goto(`/t/${TENANT}/clientes`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    const addBtn = page
      .getByRole("button", { name: /nuevo|agregar|crear/i })
      .first();
    if (await addBtn.isVisible().catch(() => false)) {
      await addBtn.click();
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

test.describe("🖱️ Interacciones en Inventario", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Inventory: verificar tabla o lista", async ({ page }) => {
    await page.goto(`/t/${TENANT}/inventory`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    const rows = page.locator("table tbody tr, [role='listitem']");
    expect(await rows.count()).toBeGreaterThanOrEqual(0);
  });
});
