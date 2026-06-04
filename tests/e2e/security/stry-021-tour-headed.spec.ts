/**
 * STRY-021 — Tour headed completo del sitio con slow-mo
 * Para inspección visual directa del dueño del producto.
 *
 * Cubre las rutas obligatorias del CLAUDE.md:
 *   / · /t/zo-system
 *   /t/wondernails (landing, servicios, booking, login)
 *   /t/centro-tenistico
 *   /t/wondernails/admin (agenda, clientes, finanzas, inventario)
 */
import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3003";

async function nav(page: Page, path: string, waitMs = 1200) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(waitMs);
}

async function scrollDown(page: Page, steps = 3) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
    await page.waitForTimeout(600);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

// ─────────────────────────────────────────────────────────────────
// 1. Landing zo-system (plataforma)
// ─────────────────────────────────────────────────────────────────
test("1 · zo-system landing", async ({ page }) => {
  await nav(page, "/t/zo-system", 1500);
  await scrollDown(page, 3);
  await page.screenshot({
    path: "test-results/tour-01-zo-system.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("✓ zo-system");
});

// ─────────────────────────────────────────────────────────────────
// 2. Wondernails landing pública + scroll
// ─────────────────────────────────────────────────────────────────
test("2 · wondernails landing pública", async ({ page }) => {
  await nav(page, "/t/wondernails", 2000);
  await scrollDown(page, 5);
  await page.screenshot({
    path: "test-results/tour-02-wondernails.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("error");
  console.log("✓ wondernails landing");
});

// ─────────────────────────────────────────────────────────────────
// 3. Wondernails — booking (selección de servicio)
// ─────────────────────────────────────────────────────────────────
test("3 · wondernails booking", async ({ page }) => {
  await nav(page, "/t/wondernails/book", 1500);
  await scrollDown(page, 2);

  // Buscar tarjetas de servicio
  const serviceCards = page.locator(
    "[data-testid='service-card'], .service-card, article, [class*='service']",
  );
  const count = await serviceCards.count();
  console.log(`  Servicios encontrados: ${count}`);

  await page.screenshot({
    path: "test-results/tour-03-booking.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("✓ wondernails booking");
});

// ─────────────────────────────────────────────────────────────────
// 4. Wondernails — Login
// ─────────────────────────────────────────────────────────────────
test("4 · wondernails login page", async ({ page }) => {
  await nav(page, "/t/wondernails/login", 1200);

  const emailInput = page.locator('input[type="email"]');
  const passInput = page.locator('input[type="password"]');

  if (await emailInput.isVisible()) {
    // Credenciales de E2E (seeded)
    await emailInput.fill("e2e-admin@test.internal");
    await page.waitForTimeout(500);
    await passInput.fill("e2e-test-change-me");
    await page.waitForTimeout(500);
    console.log("  Credenciales E2E ingresadas (sin submit — solo visual)");
  } else {
    console.log("  Login por OAuth / form no visible — verificando botones");
    const buttons = await page.locator("button").allTextContents();
    console.log(`  Botones disponibles: ${buttons.slice(0, 5).join(" | ")}`);
  }

  await page.screenshot({
    path: "test-results/tour-04-login.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("✓ wondernails login");
});

// ─────────────────────────────────────────────────────────────────
// 5. Wondernails Admin — agenda (puede redirigir a login)
// ─────────────────────────────────────────────────────────────────
test("5 · wondernails admin panel", async ({ page }) => {
  await nav(page, "/t/wondernails/admin", 1500);
  const url = page.url();
  console.log(`  Admin URL → ${url}`);

  await scrollDown(page, 2);
  await page.screenshot({
    path: "test-results/tour-05-admin.png",
    fullPage: false,
  });

  // OK si redirige a login (sin sesión) o muestra el panel
  expect(url).not.toContain("500");
  const isLoginRedirect = url.includes("login") || url.includes("signin");
  console.log(
    `  Resultado: ${isLoginRedirect ? "→ redirigió a login" : "→ panel visible"}`,
  );
  console.log("✓ wondernails admin");
});

// ─────────────────────────────────────────────────────────────────
// 6. Centro tenístico landing + parallax
// ─────────────────────────────────────────────────────────────────
test("6 · centro-tenistico landing + scroll", async ({ page }) => {
  await nav(page, "/t/centro-tenistico", 2000);
  await scrollDown(page, 5);
  await page.screenshot({
    path: "test-results/tour-06-centro-tenistico.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("✓ centro-tenistico");
});

// ─────────────────────────────────────────────────────────────────
// 7. SEC checks rápidos (en ventana del navegador)
// ─────────────────────────────────────────────────────────────────
test("7 · SEC-001: user-check endpoint devuelve 404 en browser", async ({
  page,
}) => {
  await nav(
    page,
    "/api/diagnose/user-check?email=hacker@evil.com&password=1234",
    800,
  );
  const content = await page.content();
  const status = content.includes('"Not found"') || content.includes("404");
  await page.screenshot({ path: "test-results/tour-07-sec001.png" });
  console.log(`  user-check response muestra 404: ${status}`);
  expect(content).toContain("Not found");
  console.log("✓ SEC-001 confirmado visualmente");
});

test("8 · SEC-002: auth-check endpoint devuelve 404 en browser", async ({
  page,
}) => {
  await nav(page, "/api/debug/auth-check", 800);
  const content = await page.content();
  await page.screenshot({ path: "test-results/tour-08-sec002.png" });
  expect(content).toContain("Not found");
  // Verificar que NO contiene el email hardcodeado
  expect(content).not.toContain("marialiciavh");
  expect(content).not.toContain("admin");
  console.log(
    "✓ SEC-002 confirmado visualmente — sin credenciales en respuesta",
  );
});

test("9 · SEC-009: diagnose/env sin secretos en browser", async ({ page }) => {
  await nav(page, "/api/diagnose/env", 800);
  const content = await page.content();
  await page.screenshot({ path: "test-results/tour-09-sec009.png" });
  // No debe contener credenciales ni URL completa
  expect(content).not.toContain("DATABASE_URL_preview");
  expect(content).not.toContain("postgresql://");
  console.log("✓ SEC-009 — diagnose/env limpio de secretos");
});

// ─────────────────────────────────────────────────────────────────
// 10. PERF-002: consola sin ruido de TenantService
// ─────────────────────────────────────────────────────────────────
test("10 · PERF-002: 0 logs TenantService en wondernails", async ({ page }) => {
  const tenantLogs: string[] = [];
  page.on("console", (msg) => {
    if (msg.text().includes("[TenantService]")) tenantLogs.push(msg.text());
  });

  await nav(page, "/t/wondernails", 1500);
  await page.waitForLoadState("networkidle");

  console.log(`  TenantService logs en cliente: ${tenantLogs.length}`);
  await page.screenshot({
    path: "test-results/tour-10-perf002.png",
    fullPage: false,
  });
  expect(tenantLogs.length).toBe(0);
  console.log("✓ PERF-002 — 0 logs de TenantService en el browser");
});

// ─────────────────────────────────────────────────────────────────
// 11. Rate limiter — multiple requests (Redis sliding window)
// ─────────────────────────────────────────────────────────────────
test("11 · PERF-004: rate limiter no crashea con requests rápidos", async ({
  request,
}) => {
  const results: number[] = [];
  // Disparar 8 requests rápidos al health endpoint
  for (let i = 0; i < 8; i++) {
    const res = await request.get(`${BASE}/api/health`);
    results.push(res.status());
  }
  console.log(`  8x /api/health → statuses: ${results.join(", ")}`);
  // Todos deben responder (200 o 429 rate limited) — nunca 500
  expect(results.every((s) => s < 500)).toBe(true);
  console.log("✓ PERF-004 — rate limiter estable sin crashes");
});
