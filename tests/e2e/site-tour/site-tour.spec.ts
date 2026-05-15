/**
 * Site Tour — Full-Site Regression Guard @site-tour
 *
 * Recorre las rutas críticas de toda la aplicación para detectar regresiones
 * antes de un deploy. No prueba flujos completos (eso lo hacen los specs de
 * cada feature); solo verifica que cada sección carga sin errores 500/pantalla
 * blanca y muestra el elemento principal esperado.
 *
 * Uso:
 *   npm run test:e2e:subset -- --headed --slow-mo 300 --grep "@site-tour" --workers=1
 *   npm run test:e2e:subset -- --grep "@site-tour" --workers=1
 */

import * as fs from "fs";
import { test, expect, type Page } from "@playwright/test";

const TENANT = "wondernails";

// Helper: navegar y verificar que la página carga sin errores críticos
async function visitAndVerify(
  page: Page,
  path: string,
  opts: {
    selector?: string;
    text?: string | RegExp;
    allowedStatuses?: number[];
  } = {},
) {
  const { selector = "main", text, allowedStatuses = [200, 301, 302] } = opts;

  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  const status = response?.status() ?? 0;

  expect(
    allowedStatuses,
    `${path} respondió ${status} — se esperaba uno de: ${allowedStatuses.join(", ")}`,
  ).toContain(status);

  // No pantalla blanca ni spinner eterno
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 15_000 });

  // Si se indica un texto o selector específico, verificarlo
  if (text) {
    await expect(page.locator("body")).toContainText(text, { timeout: 10_000 });
  }

  // No debe haber errores 500 renderizados en el body
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  expect(bodyText).not.toMatch(/Application error|Internal Server Error|500/i);
}

// ─────────────────────────────────────────────
// 1. Rutas públicas (sin auth)
// ─────────────────────────────────────────────
test.describe("@site-tour — Rutas públicas", () => {
  test("zo-system landing carga", async ({ page }) => {
    await visitAndVerify(page, "/", { selector: "body" });
  });

  test("tenant zo-system carga", async ({ page }) => {
    await visitAndVerify(page, "/t/zo-system", { selector: "body" });
  });

  test("landing del tenant wondernails carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}`, { selector: "body" });
  });

  test("booking público del tenant carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/book`, {
      selector: "body",
      allowedStatuses: [200, 301, 302, 404], // puede redirigir si no hay servicios
    });
  });
});

// ─────────────────────────────────────────────
// 2. Auth — páginas de login / error
// ─────────────────────────────────────────────
test.describe("@site-tour — Auth", () => {
  test("página de login carga", async ({ page }) => {
    await visitAndVerify(page, "/api/auth/signin", {
      selector: "body",
      allowedStatuses: [200, 301, 302],
    });
  });

  test("auth error page no da 500", async ({ page }) => {
    const response = await page.goto("/api/auth/error?error=Configuration");
    expect(response?.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────
// 3. Health check — API de infraestructura
// ─────────────────────────────────────────────
test.describe("@site-tour — Health", () => {
  test("health endpoint responde ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });
});

// ─────────────────────────────────────────────
// 4. Rutas autenticadas — requieren sesión de admin
// ─────────────────────────────────────────────
test.describe("@site-tour — Admin autenticado", () => {
  // Solo corre si el storageState de auth existe; si no, se marca como skip.
  const AUTH_FILE = "tests/e2e/.auth/user.json";
  const hasAuth = fs.existsSync(AUTH_FILE);

  test.use({ storageState: hasAuth ? AUTH_FILE : undefined });

  test.beforeEach(async () => {
    if (!hasAuth)
      test.skip(
        true,
        "Sin sesión en tests/e2e/.auth/user.json — ejecutar auth setup primero",
      );
  });

  test("admin global — tenants carga", async ({ page }) => {
    await visitAndVerify(page, "/admin/tenants", {
      selector: "body",
      allowedStatuses: [200, 301, 302, 403], // 403 si el usuario no es superadmin
    });
  });

  test("admin social planner carga", async ({ page }) => {
    await visitAndVerify(page, "/admin/social-planner", {
      selector: "body",
      allowedStatuses: [200, 301, 302, 403],
    });
  });

  test("tenant admin dashboard carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/admin`, { selector: "body" });
  });

  test("finance — dashboard del tenant carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/finance`, {
      selector: "body",
      allowedStatuses: [200, 301, 302],
    });
  });

  test("inventory — lista de productos carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/inventory`, {
      selector: "body",
      allowedStatuses: [200, 301, 302],
    });
  });

  test("POS — terminal carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/finance/pos`, {
      selector: "body",
      allowedStatuses: [200, 301, 302],
    });
  });

  test("clientes — listado carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/clientes`, {
      selector: "body",
      allowedStatuses: [200, 301, 302],
    });
  });

  test("social planner del tenant carga", async ({ page }) => {
    await visitAndVerify(page, `/t/${TENANT}/social`, {
      selector: "body",
      allowedStatuses: [200, 301, 302],
    });
  });
});
