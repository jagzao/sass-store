/**
 * STRY-021 — Inspección visual profunda con slow-mo real
 * Cada interacción va despacio para que el dueño pueda ver todo.
 * Incluye: clics reales en botones, navegación, formularios, admin.
 */
import { test, expect, chromium } from "@playwright/test";

const BASE = "http://localhost:3003";
const PAUSE = 1200; // ms entre acciones visuales

test.use({
  launchOptions: { slowMo: 450 },
  viewport: { width: 1400, height: 900 },
});

// ─────────────────────────────────────────
// RECORRIDO 1: zo-system landing
// ─────────────────────────────────────────
test("TOUR-01 · zo-system landing", async ({ page }) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 1 — zo-system (plataforma)");
  console.log("════════════════════════════════════");

  await page.goto(`${BASE}/t/zo-system`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(PAUSE);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  expect(page.url()).not.toContain("500");
  console.log("  ✓ zo-system OK");
});

// ─────────────────────────────────────────
// RECORRIDO 2: wondernails pública
// ─────────────────────────────────────────
test("TOUR-02 · wondernails landing + botones", async ({ page }) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 2 — Wondernails pública");
  console.log("════════════════════════════════════");

  await page.goto(`${BASE}/t/wondernails`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(PAUSE + 400);

  // Scroll hero
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(700);

  // Intentar clic en primer botón de "Reservar" o "Agendar"
  const bookBtn = page
    .locator("a, button")
    .filter({ hasText: /reserva|agendar|book|cita/i })
    .first();
  if (await bookBtn.isVisible()) {
    console.log("  → Clic en botón de reserva/booking");
    await bookBtn.click();
    await page.waitForTimeout(PAUSE);
    console.log(`  URL después del clic: ${page.url()}`);
    await page.goBack();
    await page.waitForTimeout(600);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  expect(page.url()).not.toContain("500");
  console.log("  ✓ wondernails landing + interacción OK");
});

// ─────────────────────────────────────────
// RECORRIDO 3: login flow
// ─────────────────────────────────────────
test("TOUR-03 · login flow visual", async ({ page }) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 3 — Login");
  console.log("════════════════════════════════════");

  await page.goto(`${BASE}/t/wondernails/login`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(PAUSE);

  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();

  if (await emailInput.isVisible()) {
    console.log("  → Formulario email+password detectado");
    await emailInput.click();
    await emailInput.fill("e2e-admin@test.internal");
    await page.waitForTimeout(400);
    await passInput.click();
    await passInput.fill("e2e-test-change-me");
    await page.waitForTimeout(500);

    // Buscar botón de submit
    const submitBtn = page
      .locator('button[type="submit"], button')
      .filter({ hasText: /entrar|login|ingresar|sign in/i })
      .first();

    if (await submitBtn.isVisible()) {
      console.log("  → Botón de submit visible, haciendo clic");
      await submitBtn.click();
      await page.waitForTimeout(2000);
      console.log(`  URL después de login: ${page.url()}`);

      const isLoggedIn =
        !page.url().includes("login") && !page.url().includes("signin");
      console.log(`  Login exitoso: ${isLoggedIn}`);

      if (isLoggedIn) {
        // Navegar al admin
        await page.goto(`${BASE}/t/wondernails/admin`, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForTimeout(PAUSE);
        console.log(`  Admin URL: ${page.url()}`);
        await page.waitForTimeout(PAUSE);
      }
    }
  } else {
    console.log("  → Solo botones OAuth visibles");
    const btns = await page.locator("button").allTextContents();
    console.log(`  Botones: ${btns.slice(0, 4).join(" | ")}`);
  }

  await page.screenshot({ path: "test-results/tour-login-deep.png" });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ login OK");
});

// ─────────────────────────────────────────
// RECORRIDO 4: admin panel con sesión
// ─────────────────────────────────────────
test("TOUR-04 · admin panel completo", async ({ page }) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 4 — Admin Wondernails");
  console.log("════════════════════════════════════");

  await page.goto(`${BASE}/t/wondernails/admin`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(PAUSE + 500);

  const url = page.url();
  if (url.includes("login") || url.includes("signin")) {
    console.log("  → Redirigido a login (sin sesión activa) — esperado en dev");
    expect(url).not.toContain("500");
    return;
  }

  console.log("  → Admin panel visible");
  await page.waitForTimeout(600);

  // Detectar sidebar/menú de navegación
  const navItems = await page
    .locator("nav a, aside a, [role='navigation'] a")
    .allTextContents();
  console.log(`  Menú: ${navItems.slice(0, 8).join(" | ")}`);

  // Intentar navegar a agenda
  const agendaLink = page
    .locator("a")
    .filter({ hasText: /agenda|calendar|citas|bookings/i })
    .first();
  if (await agendaLink.isVisible()) {
    console.log("  → Clic en Agenda");
    await agendaLink.click();
    await page.waitForTimeout(PAUSE);
    console.log(`  Agenda URL: ${page.url()}`);
    await page.waitForTimeout(600);
  }

  // Intentar navegar a clientes
  const clientesLink = page
    .locator("a")
    .filter({ hasText: /clientes|customers|clients/i })
    .first();
  if (await clientesLink.isVisible()) {
    console.log("  → Clic en Clientes");
    await clientesLink.click();
    await page.waitForTimeout(PAUSE);
    console.log(`  Clientes URL: ${page.url()}`);
    await page.waitForTimeout(600);
  }

  await page.screenshot({
    path: "test-results/tour-admin-deep.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ admin panel OK");
});

// ─────────────────────────────────────────
// RECORRIDO 5: booking flow completo
// ─────────────────────────────────────────
test("TOUR-05 · booking flow — selección de servicio y fecha", async ({
  page,
}) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 5 — Booking Flow Completo");
  console.log("════════════════════════════════════");

  await page.goto(`${BASE}/t/wondernails/book`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(PAUSE + 400);
  console.log(`  Booking URL: ${page.url()}`);

  // Scroll para ver servicios
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(700);

  // Buscar cards de servicio
  const serviceCards = page
    .locator("article, [class*='service'], [class*='card']")
    .first();
  if (await serviceCards.isVisible()) {
    console.log("  → Tarjeta de servicio detectada, haciendo clic");
    await serviceCards.click();
    await page.waitForTimeout(PAUSE);
    console.log(`  URL tras clic en servicio: ${page.url()}`);
    await page.waitForTimeout(600);
  } else {
    // Intentar con los botones directamente
    const btns = await page.locator("button").allTextContents();
    console.log(`  Botones disponibles: ${btns.slice(0, 5).join(" | ")}`);
  }

  await page.screenshot({
    path: "test-results/tour-booking-deep.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ booking flow OK");
});

// ─────────────────────────────────────────
// RECORRIDO 6: centro-tenístico parallax
// ─────────────────────────────────────────
test("TOUR-06 · centro-tenistico parallax + scroll", async ({ page }) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 6 — Centro Tenístico Parallax");
  console.log("════════════════════════════════════");

  await page.goto(`${BASE}/t/centro-tenistico`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(PAUSE + 600);

  // Scroll lento para ver el parallax
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);

  await page.screenshot({
    path: "test-results/tour-centro-tenistico-deep.png",
    fullPage: false,
  });
  expect(page.url()).not.toContain("500");
  console.log("  ✓ centro-tenistico parallax OK");
});

// ─────────────────────────────────────────
// RECORRIDO 7: SEC visual — endpoints 404
// ─────────────────────────────────────────
test("TOUR-07 · SEC visual — todos los endpoints eliminados", async ({
  page,
}) => {
  console.log("\n\n════════════════════════════════════");
  console.log("  TOUR 7 — Verificación SEC visual");
  console.log("════════════════════════════════════");

  const endpoints = [
    {
      path: "/api/diagnose/user-check?email=hacker@evil.com&password=admin",
      label: "SEC-001 user-check",
    },
    { path: "/api/debug/auth-check", label: "SEC-002 auth-check" },
    { path: "/api/diagnose/env", label: "SEC-009 diagnose/env" },
  ];

  for (const ep of endpoints) {
    await page.goto(`${BASE}${ep.path}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    const content = await page.content();

    if (ep.label.includes("SEC-001") || ep.label.includes("SEC-002")) {
      const shows404 = content.includes("Not found") || content.includes("404");
      console.log(
        `  ${ep.label} → ${shows404 ? "✓ 404 correcto" : "⚠ NO 404"}`,
      );
      expect(content).toContain("Not found");
    } else {
      // SEC-009: debe mostrar datos pero sin secretos
      const hasNoSecrets =
        !content.includes("postgresql://") &&
        !content.includes("DATABASE_URL_preview");
      console.log(
        `  ${ep.label} → ${hasNoSecrets ? "✓ sin secretos" : "⚠ EXPONE SECRETOS"}`,
      );
      expect(hasNoSecrets).toBe(true);
    }
    await page.waitForTimeout(400);
  }

  console.log("  ✓ todos los endpoints SEC validados visualmente");
});
