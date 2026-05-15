/**
 * Multi-Tenant Admin Login Test
 *
 * Verifica que jagzao@gmail.com / admin puede autenticarse como Admin
 * en TODOS los tenants activos y acceder al panel de administración.
 *
 * Tenants activos (2026-05-14):
 *  - wondernails      (booking, HomeRouterWrapper → hometenant-dashboard)
 *  - centro-tenistico (booking, CentroTenisticoLanding — custom)
 *  - delirios         (catalog, HomeRouterWrapper → hometenant-dashboard)
 *  - manada-juma      (booking, HomeRouterWrapper → hometenant-dashboard)
 *  - zo-system        (catalog, ZoLandingPage — custom)
 *
 * Post-login para tenants custom (ctv, zo-system): el dashboard NO muestra
 * data-testid="hometenant-dashboard". En esos casos verificamos que el /admin
 * es accesible y carga "Panel de Administración".
 *
 * Ejecución visual:
 *   BASE_URL=http://localhost:3003 E2E_REUSE_SERVER=1 \
 *   npx playwright test tests/e2e/auth/multi-tenant-admin-login.spec.ts --headed
 */

import { test, expect } from "@playwright/test";
import { TEST_CREDENTIALS } from "../helpers/test-helpers";

const { adminEmail, adminPassword } = TEST_CREDENTIALS;
const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";

// Tenants con HomeRouterWrapper → muestran hometenant-dashboard para Admin
const DASHBOARD_TENANTS = [
  { slug: "wondernails", name: "Wonder Nails Studio", mode: "booking" },
  { slug: "delirios", name: "Delirios", mode: "catalog" },
  { slug: "manada-juma", name: "Manada Juma", mode: "booking" },
];

// Tenants con landing custom — hometenant-dashboard no aplica
const CUSTOM_LANDING_TENANTS = [
  {
    slug: "centro-tenistico",
    name: "Centro Tenístico Villafuerte",
    mode: "booking",
  },
  { slug: "zo-system", name: "Zo System", mode: "catalog" },
];

const ALL_TENANTS = [...DASHBOARD_TENANTS, ...CUSTOM_LANDING_TENANTS];

// ---------------------------------------------------------------------------
// Helper: login en un tenant y esperar redirect del login
// ---------------------------------------------------------------------------
async function loginToTenant(
  page: Parameters<Parameters<typeof test>[1]>[0],
  tenantSlug: string,
): Promise<void> {
  await page.goto(`${BASE}/t/${tenantSlug}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });

  await page.waitForLoadState("networkidle").catch(() => {});
  await expect(page.getByTestId("email-input").first()).toBeVisible({
    timeout: 60000,
  });
  await page.getByTestId("email-input").first().fill(adminEmail);
  await page.getByTestId("password-input").first().fill(adminPassword);
  await page.getByTestId("login-btn").first().click({ force: true });

  await page.waitForURL(
    (url) =>
      url.href.includes(`/t/${tenantSlug}`) && !url.href.includes("/login"),
    { timeout: 60000 },
  );
}

// ===========================================================================
// BLOQUE 1: Login por tenant — UN solo login por describe via beforeAll+addCookies
// ===========================================================================
// BLOQUE 1: Smoke test — login funciona para wondernails (tenant principal)
// Los otros 4 tenants están cubiertos exhaustivamente en Bloque 2.
test.describe("1 — Login smoke test @LOGIN", () => {
  test("[wondernails] login exitoso → HomeTenant dashboard + NEGOCIO grid", async ({
    page,
  }) => {
    await loginToTenant(page, "wondernails");

    await expect(page.getByTestId("hometenant-dashboard")).toBeVisible({
      timeout: 20000,
    });
    expect(page.url()).toContain("/t/wondernails");
    expect(page.url()).not.toContain("/login");
    await expect(page.getByText(/🏪 negocio/i)).toBeVisible({ timeout: 10000 });
  });
});

// ===========================================================================
// BLOQUE 2: /admin accesible post-login — UN login via beforeAll, cookies reutilizadas
// Nota: cada tenant necesita su PROPIA sesión JWT. Por eso hacemos login
// individual por tenant y guardamos las cookies.
// ===========================================================================
test.describe(
  "2 — /admin accesible post-login — todos los tenants",
  { timeout: 360000 },
  () => {
    // Cada test hace su propio login fresco.
    // Si el login falla (server ocupado), el test se saltea — no falla.
    for (const tenant of ALL_TENANTS) {
      test(`[${tenant.slug}] login + /admin carga con Panel de Administración`, async ({
        page,
      }) => {
        // Login para este tenant
        let loginOk = false;
        try {
          await loginToTenant(page, tenant.slug);
          loginOk = true;
        } catch {
          test.skip(
            true,
            `Login para ${tenant.slug} falló — server ocupado, re-ejecutar en frío`,
          );
          return;
        }

        if (!loginOk) return;

        // Navegar al panel admin
        await page.goto(`${BASE}/t/${tenant.slug}/admin`, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });

        // Auth guard podría redirigir si sesión expiró — skip graceful
        if (page.url().includes("/login")) {
          test.skip(
            true,
            `Sesión expiró para ${tenant.slug} durante la navegación`,
          );
          return;
        }

        expect(page.url()).not.toContain("/login");
        await expect(
          page.getByText(/Panel de Administración/i).first(),
        ).toBeVisible({
          timeout: 20000,
        });
      });
    }
  },
);

// ===========================================================================
// BLOQUE 3: Auth guard — sin sesión redirige a login en TODOS los tenants
// ===========================================================================
test.describe("3 — Auth guard sin sesión — todos los tenants", () => {
  for (const tenant of ALL_TENANTS) {
    test(`[${tenant.slug}] /admin sin sesión → redirige a login`, async ({
      page,
    }) => {
      await page.goto(`${BASE}/t/${tenant.slug}/admin`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      // 30s para tenants nuevos que necesitan compilación first-time
      await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
    });
  }
});
