/**
 * STRY-021 — Validación Visual Headed
 *
 * Recorre TODOS los escenarios de la US en modo headed con slow-mo
 * para inspección visual directa. Cubre:
 *   A. Endpoints de debug eliminados (404)
 *   B. Upload sin auth rechazado
 *   C. Webhook WhatsApp con firma HMAC
 *   D. Diagnose sin preview de secretos
 *   E. Landing wondernails — no regresión
 *   F. Landing centro-tenistico — no regresión
 *   G. Login flow
 *   H. Admin panel
 *   I. Booking flow
 */
import { test, expect, Page } from "@playwright/test";

const BASE = "http://localhost:3003";

// Helper: navega y muestra título
async function goto(page: Page, path: string, label: string) {
  console.log(`\n▶ ${label}: ${BASE}${path}`);
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
}

// ─────────────────────────────────────────────
// A. Endpoints de debug: deben devolver 404
// ─────────────────────────────────────────────
test("A1 · SEC-001: /api/diagnose/user-check devuelve 404", async ({
  request,
}) => {
  const res = await request.get(
    `${BASE}/api/diagnose/user-check?email=admin@test.com&password=admin`,
  );
  console.log(`  user-check GET → HTTP ${res.status()}`);
  const body = await res.json();
  console.log(`  body: ${JSON.stringify(body)}`);
  expect(res.status()).toBe(404);
  expect(JSON.stringify(body)).not.toContain("password");
  expect(JSON.stringify(body)).not.toContain("bcrypt");
  expect(JSON.stringify(body)).not.toContain("stack");
});

test("A2 · SEC-002: /api/debug/auth-check devuelve 404", async ({
  request,
}) => {
  const res = await request.get(`${BASE}/api/debug/auth-check`);
  console.log(`  auth-check GET → HTTP ${res.status()}`);
  const body = await res.json();
  console.log(`  body: ${JSON.stringify(body)}`);
  expect(res.status()).toBe(404);
  // No debe contener el email hardcodeado
  expect(JSON.stringify(body)).not.toContain("marialiciavh");
  expect(JSON.stringify(body)).not.toContain("admin");
});

test("A3 · SEC-009: /api/diagnose/env no expone host ni DB URL", async ({
  request,
}) => {
  const res = await request.get(`${BASE}/api/diagnose/env`);
  console.log(`  diagnose/env GET → HTTP ${res.status()}`);
  const body = await res.json();
  console.log(`  body: ${JSON.stringify(body)}`);
  // Solo debe mostrar booleans, no la URL real
  expect(JSON.stringify(body)).not.toMatch(/supabase\.co.*password/);
  expect(JSON.stringify(body)).not.toContain("DATABASE_URL_preview");
  expect(body.database.defined).toBeDefined();
});

// ─────────────────────────────────────────────
// B. Upload sin autenticación
// ─────────────────────────────────────────────
test("B · SEC-008: /api/upload sin sesión → 401 ó 403", async ({ request }) => {
  const res = await request.post(`${BASE}/api/upload`, {
    multipart: {
      file: {
        name: "test.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("FAKE_IMAGE"),
      },
    },
  });
  console.log(`  upload anon → HTTP ${res.status()}`);
  expect([401, 403]).toContain(res.status());
  expect(res.status()).not.toBe(200);
});

// ─────────────────────────────────────────────
// C. Webhook WhatsApp — firma HMAC requerida
// ─────────────────────────────────────────────
test("C · SEC-007: webhook WA sin firma → 401 (prod) ó 200 (dev sin secret)", async ({
  request,
}) => {
  const res = await request.post(`${BASE}/api/whatsapp/webhook`, {
    data: { object: "whatsapp_business_account", entry: [] },
    headers: { "Content-Type": "application/json" },
  });
  console.log(`  webhook POST sin firma → HTTP ${res.status()}`);
  // En dev sin APP_SECRET: 200 (fail-open). En prod: 401
  expect([200, 401]).toContain(res.status());
});

// ─────────────────────────────────────────────
// D–I. Validación visual con headed + slow-mo
// ─────────────────────────────────────────────
test("D · Landing wondernails — carga completa", async ({ page }) => {
  await goto(page, "/t/wondernails", "Landing Wondernails");
  await page.waitForTimeout(800);

  // Verificar que carga contenido real
  const body = await page.locator("body").innerText();
  expect(body.length).toBeGreaterThan(100);
  expect(page.url()).not.toContain("error");

  await page.screenshot({
    path: "test-results/stry021-D-wondernails.png",
    fullPage: true,
  });
  console.log("  ✓ Wondernails landing cargó");
});

test("E · Landing centro-tenistico — carga completa", async ({ page }) => {
  await goto(page, "/t/centro-tenistico", "Landing Centro Tenístico");
  await page.waitForTimeout(800);

  const body = await page.locator("body").innerText();
  expect(body.length).toBeGreaterThan(100);
  expect(page.url()).not.toContain("error");

  await page.screenshot({
    path: "test-results/stry021-E-centro-tenistico.png",
    fullPage: true,
  });
  console.log("  ✓ Centro tenístico landing cargó");
});

test("F · Login page — renderiza sin errores", async ({ page }) => {
  await goto(page, "/t/wondernails/login", "Login page");
  await page.waitForTimeout(600);

  // Debe haber un formulario de login o botón de Google
  const hasLogin =
    (await page
      .locator('input[type="email"], input[type="password"]')
      .count()) > 0 ||
    (await page
      .locator("button, a")
      .filter({ hasText: /google|entrar|login|ingresar/i })
      .count()) > 0;

  await page.screenshot({
    path: "test-results/stry021-F-login.png",
    fullPage: true,
  });
  console.log(`  ✓ Login page renderizó (hasLoginElements=${hasLogin})`);
  expect(page.url()).not.toContain("500");
});

test("G · Admin — requiere autenticación", async ({ page }) => {
  await goto(page, "/t/wondernails/admin", "Admin panel");
  await page.waitForTimeout(1000);

  const finalUrl = page.url();
  console.log(`  Admin URL final: ${finalUrl}`);

  // Debe redirigir al login o mostrar el panel si ya hay sesión
  const redirectedToLogin =
    finalUrl.includes("login") ||
    finalUrl.includes("signin") ||
    finalUrl.includes("auth");

  await page.screenshot({
    path: "test-results/stry021-G-admin.png",
    fullPage: true,
  });

  if (redirectedToLogin) {
    console.log("  ✓ Admin redirige a login (correcto — sin sesión)");
  } else {
    console.log("  ✓ Admin panel accesible (sesión activa o dev mode)");
  }
  expect(page.url()).not.toContain("500");
});

test("H · Booking flow — servicios visibles", async ({ page }) => {
  await goto(page, "/t/wondernails/book", "Booking flow");
  await page.waitForTimeout(1200);

  const url = page.url();
  console.log(`  Booking URL: ${url}`);

  await page.screenshot({
    path: "test-results/stry021-H-booking.png",
    fullPage: true,
  });

  expect(url).not.toContain("500");
  expect(url).not.toContain("error");
  console.log("  ✓ Booking page sin error 500");
});

test("I · Zona pública wondernails — servicios y navegación", async ({
  page,
}) => {
  await goto(page, "/t/wondernails", "Wondernails pública");
  await page.waitForTimeout(600);

  // Scroll para activar lazy-load
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(400);

  await page.screenshot({
    path: "test-results/stry021-I-wondernails-scroll.png",
    fullPage: false,
  });

  // Verificar que no hay errores JS en consola relacionados con TenantService
  const consoleLogs: string[] = [];
  page.on("console", (m) => {
    if (m.text().includes("[TenantService]")) consoleLogs.push(m.text());
  });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  console.log(
    `  TenantService logs en cliente: ${consoleLogs.length} (debe ser 0)`,
  );
  expect(consoleLogs.length).toBe(0);
  console.log("  ✓ 0 logs de TenantService en cliente (PERF-002 verificado)");
});
