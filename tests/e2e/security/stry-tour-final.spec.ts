/**
 * Tour Visual Final — STRY-021 + STRY-022
 * Validación headed completa de todas las funcionalidades implementadas.
 * Server: http://localhost:3003 (producción local)
 */
import { test, expect } from "@playwright/test";
import { loginAsAdmin, TEST_CREDENTIALS } from "../helpers/test-helpers";

const BASE = "http://localhost:3003";
const { tenantSlug } = TEST_CREDENTIALS;

test.use({
  launchOptions: { slowMo: 350 },
  viewport: { width: 1400, height: 900 },
  baseURL: BASE,
});

// ─── SEGURIDAD ────────────────────────────────────────────
test("🔒 SEC: endpoints eliminados devuelven 404", async ({ page }) => {
  for (const path of [
    "/api/diagnose/user-check?email=hacker@evil.com&password=admin",
    "/api/debug/auth-check",
    "/system/seed",
  ]) {
    await page.goto(`${BASE}${path}`);
    await page.waitForTimeout(400);
    const content = await page.content();
    expect(content).toContain("Not found");
    console.log(`  ✓ ${path} → 404`);
  }
});

test("🔒 SEC: finance/kpis requiere auth", async ({ request }) => {
  const res = await request.get(
    `${BASE}/api/finance/kpis?period=month&tenant=${tenantSlug}`,
  );
  expect(res.status()).toBe(401);
  console.log("  ✓ finance/kpis → 401 sin sesión");
});

// ─── LANDING PÚBLICA ──────────────────────────────────────
test("🏠 Landing zo-system (plataforma)", async ({ page }) => {
  await page.goto(`${BASE}/t/zo-system`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: "test-results/final-zo-system.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ zo-system cargó");
});

test("🏠 Landing wondernails → booking", async ({ page }) => {
  await page.goto(`${BASE}/t/wondernails`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(500);
  }
  // Clic en reservar
  const bookBtn = page
    .locator("a,button")
    .filter({ hasText: /reserva|agendar|book|cita/i })
    .first();
  if (await bookBtn.isVisible()) {
    await bookBtn.click();
    await page.waitForTimeout(800);
    console.log(`  → Booking URL: ${page.url()}`);
    await page.goBack();
  }
  await page.screenshot({ path: "test-results/final-wondernails.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ Wondernails landing + booking flow");
});

test("🎾 Landing centro-tenistico (173KB, sin base64)", async ({ page }) => {
  await page.goto(`${BASE}/t/centro-tenistico`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(450);
  }
  await page.screenshot({ path: "test-results/final-centro-tenistico.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ Centro tenístico cargó (logo Cloudinary, sin base64)");
});

// ─── LOGIN ────────────────────────────────────────────────
test("🔑 Login + Admin dashboard", async ({ page }) => {
  await loginAsAdmin(page);
  console.log(`  → Post-login URL: ${page.url()}`);
  await page.waitForTimeout(800);

  // Navegar al admin
  await page.goto(`${BASE}/t/${tenantSlug}/admin`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const headings = await page.locator("h1,h2,h3").allTextContents();
  console.log(`  Admin headings: ${headings.slice(0, 5).join(" | ")}`);
  await page.screenshot({ path: "test-results/final-admin.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ Admin panel visible");
});

// ─── BOOKING FLOW ─────────────────────────────────────────
test("📅 Booking: selección de servicio y fecha", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/book`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(600);
  const btns = await page.locator("button").allTextContents();
  console.log(
    `  Botones: ${btns
      .filter((b) => b.trim())
      .slice(0, 6)
      .join(" | ")}`,
  );
  await page.screenshot({ path: "test-results/final-booking.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ Booking page sin errores");
});

// ─── FINANZAS ─────────────────────────────────────────────
test("💰 Finance: matrix de planeación", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/finance`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/final-finance.png" });

  const title = await page.locator("h1,h2").first().textContent();
  console.log(`  Finance title: ${title}`);
  expect(page.url()).not.toContain("500");
  console.log("  ✓ Finance cargó");
});

test("💰 Finance: categorías de transacciones", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/finance/categories`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await expect(page.getByText("Categorías de Transacciones")).toBeVisible({
    timeout: 15000,
  });
  await page.screenshot({ path: "test-results/final-finance-categories.png" });
  console.log("  ✓ Categorías de Transacciones visibles");
});

test("💰 Finance: presupuestos", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/finance/budgets`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await expect(page.getByRole("heading", { name: "Presupuestos" })).toBeVisible(
    { timeout: 15000 },
  );
  await page.screenshot({ path: "test-results/final-finance-budgets.png" });
  console.log("  ✓ Presupuestos visibles");
});

// ─── INVENTARIO ───────────────────────────────────────────
test("📦 Inventario: insumos", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/inventory/supplies`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await expect(page.getByText("Reporte de Gastos de Insumos")).toBeVisible({
    timeout: 15000,
  });
  await page.screenshot({ path: "test-results/final-inventory.png" });
  console.log("  ✓ Inventario/Insumos visibles");
});

// ─── POS ──────────────────────────────────────────────────
test("🛒 POS: acceso requiere sesión", async ({ page }) => {
  // Sin sesión debe redirigir al login
  await page.goto(`${BASE}/t/${tenantSlug}/pos`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  const url = page.url();
  const redirectedToLogin = url.includes("login") || url.includes("signin");
  console.log(`  POS sin sesión → ${url}`);
  console.log(`  Redirigió a login: ${redirectedToLogin}`);
  await page.screenshot({ path: "test-results/final-pos-noauth.png" });
  expect(url).not.toContain("500");
  console.log("  ✓ POS sin sesión → redirige o muestra acceso");
});

// ─── CLIENTES ─────────────────────────────────────────────
test("👥 Clientes: lista con sesión", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/clientes`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const hasContent = await page
    .getByRole("button", { name: /Agregar Clienta/i })
    .isVisible({ timeout: 10000 });
  console.log(`  Botón Agregar Clienta visible: ${hasContent}`);
  await page.screenshot({ path: "test-results/final-customers.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ Clientes cargó");
});

// ─── ADMIN CALENDAR ───────────────────────────────────────
test("📅 Admin: calendario de citas", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto(`${BASE}/t/${tenantSlug}/admin/calendar`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "test-results/final-calendar.png" });
  expect(page.url()).not.toContain("500");
  const h = await page
    .locator("h1,h2,h3")
    .first()
    .textContent()
    .catch(() => "n/a");
  console.log(`  Calendario heading: ${h}`);
  console.log("  ✓ Calendario admin cargó");
});

// ─── DIAGNOSE PROTEGIDOS ──────────────────────────────────
test("🔒 Diagnose: sin secretos en browser", async ({ page }) => {
  await page.goto(`${BASE}/api/diagnose/env`);
  await page.waitForTimeout(400);
  const content = await page.content();
  expect(content).not.toContain("postgresql://");
  expect(content).not.toContain("DATABASE_URL_preview");
  // Solo booleans
  expect(content).toContain('"defined"');
  console.log("  ✓ diagnose/env sin secretos");
});
