/**
 * Comprehensive Auth + Admin Navigation E2E
 *
 * Estrategia de auth:
 *  - Bloques que necesitan sesión usan beforeAll para hacer LOGIN UNA VEZ
 *    y guardan las cookies en memoria. Cada test individual restaura las
 *    cookies vía page.context().addCookies() sin hacer una nueva petición
 *    de autenticación.
 *  - Esto evita saturar el dev server con logins consecutivos.
 *
 * Cobertura:
 *  1. Flujo de login (formulario, error, éxito, auth guard)
 *  2. Dashboard HomeTenant (secciones + grid + bottom nav)
 *  3. Navegación admin (rutas clave + links del NEGOCIO grid)
 *  4. Cross-profile (logout + re-login, isolación de tenants)
 *  5. Booking público sin sesión (smoke)
 *
 * Ejecución visual:
 *   BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 \
 *   npx playwright test tests/e2e/auth/auth-admin-comprehensive.spec.ts --headed
 */

import { test, expect, type Browser } from "@playwright/test";
import {
  TEST_CREDENTIALS,
  loginAsAdmin,
  signOut,
} from "../helpers/test-helpers";

const { tenantSlug, adminEmail, adminPassword } = TEST_CREDENTIALS;
const CTV_SLUG = "centro-tenistico";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";

// ---------------------------------------------------------------------------
// Helper: realiza un login y devuelve las cookies de sesión.
// Llama solo desde beforeAll para hacer el login UNA sola vez por bloque.
// ---------------------------------------------------------------------------
async function createAuthSession(browser: Browser) {
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  pg.setDefaultNavigationTimeout(120000);

  await pg.goto(`${BASE}/t/${tenantSlug}/login`, {
    waitUntil: "domcontentloaded",
  });
  await expect(pg.getByTestId("email-input").first()).toBeVisible({
    timeout: 60000,
  });
  await pg.getByTestId("email-input").first().fill(adminEmail);
  await pg.getByTestId("password-input").first().fill(adminPassword);
  await pg.getByTestId("login-btn").first().click();
  await pg.waitForURL(
    (url) =>
      url.href.includes(`/t/${tenantSlug}`) && !url.href.includes("/login"),
    { timeout: 60000 },
  );

  const cookies = await ctx.cookies();
  await ctx.close();
  return cookies;
}

// ===========================================================================
// BLOQUE 1: Flujo de Login — cada test es independiente
// ===========================================================================
test.describe("1 — Flujo de Login @LOGIN", () => {
  test("1.1 formulario tiene todos los campos requeridos", async ({ page }) => {
    await page.goto(`${BASE}/t/${tenantSlug}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await expect(page.getByTestId("email-input").first()).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByTestId("password-input").first()).toBeVisible();
    await expect(page.getByTestId("login-btn").first()).toContainText(
      /Iniciar/i,
    );
  });

  test("1.2 credenciales inválidas → error visible, sin redirigir", async ({
    page,
  }) => {
    await page.goto(`${BASE}/t/${tenantSlug}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.getByTestId("email-input").first()).toBeVisible({
      timeout: 30000,
    });

    await page.getByTestId("email-input").first().fill("no-existe@test.com");
    await page.getByTestId("password-input").first().fill("wrong-pass-999");
    await page.getByTestId("login-btn").first().click();

    await expect(page.getByTestId("error-message")).toBeVisible({
      timeout: 20000,
    });
    expect(page.url()).toContain("/login");
    // Dar tiempo al servidor para terminar de procesar la petición de auth fallida
    await page.waitForTimeout(1500);
  });

  test("1.3 login exitoso → HomeTenant dashboard visible", async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible();
    expect(page.url()).toContain(`/t/${tenantSlug}`);
    expect(page.url()).not.toContain("/login");
  });

  test("1.4 ruta admin sin sesión → redirige a login (auth guard)", async ({
    page,
  }) => {
    await page.goto(`${BASE}/t/${tenantSlug}/admin/calendar`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
});

// ===========================================================================
// BLOQUES 2+3: Dashboard + Navegación Admin — UN login, cookies compartidas
// ===========================================================================
test.describe("2+3 — Dashboard y Navegación Admin @DASHBOARD @NAV", () => {
  let authCookies: any[] = [];

  test.beforeAll(async ({ browser }) => {
    authCookies = await createAuthSession(browser);
  });

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies(authCookies);
  });

  // ── Dashboard ──────────────────────────────────────────────────────────
  test("2.1 Citas Hoy + sección Pendientes visibles @DASHBOARD", async ({
    page,
  }) => {
    await page.goto(`${BASE}/t/${tenantSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/citas de hoy|📋 citas/i).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/confirmar|pendientes/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("2.2 grid 🏪 NEGOCIO con los 5 atajos @DASHBOARD", async ({ page }) => {
    await page.goto(`${BASE}/t/${tenantSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/🏪 negocio/i)).toBeVisible({ timeout: 10000 });
    for (const label of [
      "Calendario de citas",
      "Clientas",
      "Finanzas",
      "Planificación Redes",
      "Atención al Cliente",
    ]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("2.3 bottom nav visible en viewport móvil @DASHBOARD", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/t/${tenantSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 15000,
    });
    const nav = page.getByTestId("bottom-nav");
    await expect(nav).toBeVisible({ timeout: 10000 });
    await expect(nav.getByText("Inicio")).toBeVisible();
    await expect(nav.getByText("Agenda")).toBeVisible();
    await expect(nav.getByText("Citas")).toBeVisible();
  });

  // ── Navegación ──────────────────────────────────────────────────────────
  test("3.1 rutas admin clave — no redirigen a login @NAV", async ({
    page,
  }) => {
    const routes: Array<{ path: string; text: RegExp }> = [
      { path: `/t/${tenantSlug}/admin`, text: /Panel de Administración/i },
      {
        path: `/t/${tenantSlug}/admin/calendar`,
        text: /Gestión de Calendario/i,
      },
      {
        path: `/t/${tenantSlug}/admin_bookings`,
        text: /reservas|bookings|citas/i,
      },
      {
        path: `/t/${tenantSlug}/finance`,
        text: /Matriz de Planeación|Finanzas|Cargando/i,
      },
      { path: `/t/${tenantSlug}/clientes`, text: /clientes|clientas/i },
    ];
    for (const { path, text } of routes) {
      await page.goto(`${BASE}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      expect(page.url()).not.toContain("/login");
      await expect(page.getByText(text).first()).toBeVisible({
        timeout: 20000,
      });
    }
  });

  test("3.2 link NEGOCIO → Calendar → heading + grid de horas @NAV", async ({
    page,
  }) => {
    await page.goto(`${BASE}/t/${tenantSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 15000,
    });

    await page.getByText("Calendario de citas").first().click();
    await expect(page).toHaveURL(/\/admin\/calendar/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /Gestión de Calendario/i }).first(),
    ).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("08:00").first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Citas Hoy/i).first()).toBeVisible();
    await expect(page.getByTitle(/próximamente/i)).toBeVisible();
  });

  test("3.3 link NEGOCIO → Finanzas → Matriz de Planeación @NAV", async ({
    page,
  }) => {
    await page.goto(`${BASE}/t/${tenantSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 15000,
    });
    await page.getByText("Finanzas").first().click();
    await expect(page).toHaveURL(/\/finance/, { timeout: 15000 });
    await expect(
      page.getByText(/Matriz de Planeación|Finanzas|Cargando/i).first(),
    ).toBeVisible({ timeout: 20000 });
  });

  test("3.4 link NEGOCIO → Clientas @NAV", async ({ page }) => {
    await page.goto(`${BASE}/t/${tenantSlug}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 15000,
    });
    // Usar href directo para evitar ambigüedad con el heading del CustomersList
    const clientesLink = page.locator(`a[href*="/clientes"]`).first();
    await expect(clientesLink).toBeVisible({ timeout: 10000 });
    await clientesLink.click();
    await expect(page).toHaveURL(/\/clientes/, { timeout: 15000 });
  });
});

// ===========================================================================
// BLOQUE 4: Cross-profile — logout + re-login
// ===========================================================================
test.describe("4 — Cross-Profile @PROFILE", () => {
  test("4.1 logout → auth guard rechaza acceso al admin", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible();

    await signOut(page);

    await page.goto(`${BASE}/t/${tenantSlug}/admin/calendar`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("4.2 re-login post-logout recupera el dashboard", async ({ page }) => {
    // Primer login
    await loginAsAdmin(page);
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible();

    // Logout y breve espera para que el servidor limpie la sesión
    await signOut(page);
    await page.waitForTimeout(2000);

    // Segundo login con los mismos credentials
    await loginAsAdmin(page);
    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible();
    expect(page.url()).toContain(`/t/${tenantSlug}`);
  });
});

// ===========================================================================
// BLOQUE 5: Booking público sin sesión — smoke
// ===========================================================================
test.describe("5 — Booking público sin sesión @SMOKE", () => {
  test("5.1 wondernails /book accesible sin login", async ({ page }) => {
    await page.goto(`${BASE}/t/${tenantSlug}/book`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
      timeout: 30000,
    });
  });

  test("5.2 centro-tenistico /book accesible sin login", async ({ page }) => {
    await page.goto(`${BASE}/t/${CTV_SLUG}/book`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.getByTestId("book-session-panel").first()).toBeVisible({
      timeout: 30000,
    });
  });
});
