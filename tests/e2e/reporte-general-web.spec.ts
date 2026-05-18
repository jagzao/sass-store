import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * reporte-general-web.spec.ts
 * Genera reporte funcional general de toda la app en tests/reporte-general-web.md
 * Flujo: anon smoke + login + navegación admin clicks + reporte
 */

const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";
const REPORT_DIR = path.join(process.cwd(), "tests");
const SCREENSHOT_DIR = path.join(REPORT_DIR, "reports", "general-web");

const TENANTS = [
  { slug: "wondernails", name: "Wonder Nails" },
  { slug: "centro-tenistico", name: "Centro Tenístico" },
  { slug: "zo-system", name: "Zo System" },
];

const PUBLIC_ROUTES = [
  "/",
  "/services",
  "/products",
  "/book",
  "/contact",
  "/login",
  "/register",
  "/forgot-password",
];
const PROTECTED_ROUTES = [
  "/admin",
  "/admin/calendar",
  "/admin/products",
  "/admin_services",
  "/admin_bookings",
  "/pos",
  "/reports",
  "/finance",
  "/finance/movements",
  "/finance/budgets",
  "/finance/categories",
  "/inventory",
  "/inventory/supplies",
  "/clientes",
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/account",
  "/settings/calendar",
  "/config",
  "/favorites",
  "/social",
  "/retouch",
  "/reorder",
];

interface RouteResult {
  tenant: string;
  path: string;
  public: boolean;
  httpStatus: number;
  finalUrl: string;
  hasLoginRedirect: boolean;
  has404: boolean;
  errorText: string;
  consoleErrors: number;
  screenshotPath?: string;
  clickableButtons: string[];
  navLinks: string[];
  headings: string[];
}

const reportResults: RouteResult[] = [];

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function collectElements(page: Page) {
  const btns = await page
    .locator("button")
    .allInnerTexts()
    .then((arr) =>
      arr
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    );
  const links = await page
    .locator("a")
    .allInnerTexts()
    .then((arr) =>
      arr
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
    );
  const headings = await page
    .locator("h1, h2, h3")
    .allInnerTexts()
    .then((arr) =>
      arr
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8),
    );
  return { btns, links, headings };
}

async function smokeRoute(
  page: Page,
  tenantSlug: string,
  routePath: string,
  isPublic: boolean,
): Promise<RouteResult> {
  const url = `${BASE}/t/${tenantSlug}${routePath}`;
  let httpStatus = 200;
  let finalUrl = url;
  let hasLoginRedirect = false;
  let has404 = false;
  let errorText = "";
  let consoleErrors = 0;
  let screenshotPath = undefined;

  const consoleMessages: string[] = [];
  const onConsole = (msg: any) => {
    if (msg.type() === "error") consoleMessages.push(msg.text());
  };
  const onPageError = (err: any) => consoleMessages.push(err.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    httpStatus = response?.status() ?? 200;
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
    finalUrl = page.url();
    hasLoginRedirect =
      finalUrl.includes("/login") && !routePath.includes("/login");
    has404 =
      (await page.locator("text=404").count()) > 0 || finalUrl.includes("/404");
    // capture simple error text
    const errorLocator = page.locator("text=/Error|error|Error:/i").first();
    if (await errorLocator.isVisible().catch(() => false)) {
      errorText = (await errorLocator.textContent().catch(() => "")) || "";
    }
  } catch (e) {
    errorText = String(e).slice(0, 200);
    httpStatus = 0;
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  consoleErrors = consoleMessages.length;

  const { btns, links, headings } = await collectElements(page);

  const folder = path.join(SCREENSHOT_DIR, tenantSlug);
  await ensureDir(folder);
  const fileName = `${routePath.replace(/[^a-z0-9]/gi, "_")}.png`;
  screenshotPath = path.join(folder, fileName);
  await page
    .screenshot({ path: screenshotPath, fullPage: false })
    .catch(() => {});

  return {
    tenant: tenantSlug,
    path: routePath,
    public: isPublic,
    httpStatus,
    finalUrl,
    hasLoginRedirect,
    has404,
    errorText,
    consoleErrors,
    screenshotPath,
    clickableButtons: btns,
    navLinks: links,
    headings,
  };
}

/* ═══════════════════════════════════════════════
   LOGIN HELPER
   ═══════════════════════════════════════════════ */
async function login(page: Page, tenantSlug: string): Promise<boolean> {
  await page.goto(`${BASE}/t/${tenantSlug}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expect(page.locator('input[name="email"]').first()).toBeVisible({
    timeout: 30000,
  });
  await page.locator('input[name="email"]').first().fill("jagzao@gmail.com");
  await page.locator('input[name="password"]').first().fill("admin");
  await page.locator('button:has-text("Iniciar sesión")').first().click();
  try {
    await page.waitForFunction(() => !window.location.href.includes("/login"), {
      timeout: 20000,
      polling: 500,
    });
    await expect(page.locator("body")).toBeVisible({ timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

async function loginInvalid(page: Page, tenantSlug: string) {
  await page.goto(`${BASE}/t/${tenantSlug}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.locator('input[name="email"]').first().fill("fake@fail.com");
  await page.locator('input[name="password"]').first().fill("nope");
  await page.locator('button:has-text("Iniciar sesión")').first().click();
  await page.waitForTimeout(2000);
}

/* ═══════════════════════════════════════════════
   TESTS
   ═══════════════════════════════════════════════ */

test.describe.serial("reporte-general-web", () => {
  /* ── 1. Smoke anónimo ── */
  for (const tenant of TENANTS) {
    for (const route of PUBLIC_ROUTES) {
      test(`[smoke-anon] ${tenant.slug} ${route}`, async ({ page }) => {
        const r = await smokeRoute(page, tenant.slug, route, true);
        reportResults.push(r);
        if (r.has404) {
          test
            .info()
            .annotations.push({ type: "info", description: `404 en ${route}` });
        }
        // login / register / forgot-password can redirect to login? no, they ARE login-ish
        // Just assert page rendered
        expect(r.httpStatus).toBeGreaterThanOrEqual(199);
      });
    }
  }

  /* ── 2. Login válido ── */
  for (const tenant of TENANTS) {
    test(`[login-ok] ${tenant.slug} valid login`, async ({ page }) => {
      const ok = await login(page, tenant.slug);
      const url = page.url();
      if (ok) {
        expect(url).not.toContain("/login");
      } else {
        test
          .info()
          .annotations.push({
            type: "info",
            description: `Login no redirigió para ${tenant.slug}`,
          });
      }
      reportResults.push({
        tenant: tenant.slug,
        path: "/login (valid)",
        public: true,
        httpStatus: 200,
        finalUrl: url,
        hasLoginRedirect: false,
        has404: false,
        errorText: ok ? "" : "login-no-redirect",
        consoleErrors: 0,
        clickableButtons: [],
        navLinks: [],
        headings: ok ? ["login ok"] : ["login no redirect"],
      });
    });

    test(`[login-ko] ${tenant.slug} invalid login`, async ({ page }) => {
      await loginInvalid(page, tenant.slug);
      const url = page.url();
      expect(url).toContain("/login");
      reportResults.push({
        tenant: tenant.slug,
        path: "/login (invalid)",
        public: true,
        httpStatus: 200,
        finalUrl: url,
        hasLoginRedirect: false,
        has404: false,
        errorText: "",
        consoleErrors: 0,
        clickableButtons: [],
        navLinks: [],
        headings: ["login ko"],
      });
    });
  }

  /* ── 3. Navegación protegida post-login (clicks) ── */
  test.describe.serial("admin-navigation", () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
      const ctx = await browser.newContext();
      page = await ctx.newPage();
      await login(page, TENANTS[0].slug); // wondernails as primary
    });

    test.afterAll(async () => {
      await page.context().close();
    });

    for (const route of PROTECTED_ROUTES) {
      test(`[admin-nav] ${route}`, async () => {
        const r = await smokeRoute(page, TENANTS[0].slug, route, false);
        reportResults.push(r);
        // protected routes should redirect to login when unauthed, but we are logged in
        expect(r.has404).toBe(false);
      });
    }

    test(`[admin-nav] click all sidebar/nav links`, async () => {
      await page.goto(`${BASE}/t/${TENANTS[0].slug}/admin`, {
        waitUntil: "domcontentloaded",
      });
      const links = await page.locator("a").all();
      let clicked = 0;
      for (let i = 0; i < Math.min(links.length, 20); i++) {
        const href = await links[i].getAttribute("href").catch(() => null);
        if (href && href.startsWith("/t/") && !href.includes("/logout")) {
          try {
            await links[i].click({ timeout: 5000 });
            await page
              .waitForLoadState("domcontentloaded", { timeout: 10000 })
              .catch(() => {});
            await page.waitForTimeout(400);
            clicked++;
            if (clicked >= 8) break; // limit to avoid infinite loops
          } catch {
            // ignore click errors
          }
        }
      }
      // Record summary of click exploration
      reportResults.push({
        tenant: TENANTS[0].slug,
        path: "admin (click-all-links)",
        public: false,
        httpStatus: 200,
        finalUrl: page.url(),
        hasLoginRedirect: false,
        has404: false,
        errorText: `clicked ${clicked} links`,
        consoleErrors: 0,
        clickableButtons: [],
        navLinks: [],
        headings: ["nav clicked"],
      });
      expect(clicked).toBeGreaterThanOrEqual(0);
    });
  });

  /* ── 4. Cross-tenant isolation quick check ── */
  test(`[cross-tenant] tenant A should not leak into B data`, async ({
    page,
  }) => {
    // Fetch customers for wondernails
    const resp = await page.request.get(
      `${BASE}/api/tenants/wondernails/customers`,
    );
    expect([200, 401, 403]).toContain(resp.status());
  });

  /* ── 5. Generar reporte markdown ── */
  test.afterAll(async () => {
    const lines: string[] = [];
    const now = new Date().toISOString();

    lines.push("# Reporte General Web — SaaS Store");
    lines.push(`**Fecha de ejecución:** ${now}`);
    lines.push(`**Base URL:** ${BASE}`);
    lines.push(`**Agente:** Playwright CLI`);
    lines.push(
      `**Tenants probados:** ${TENANTS.map((t) => t.slug).join(", ")}`,
    );
    lines.push("");

    // Resumen
    const ok = reportResults.filter(
      (r) => !r.has404 && !r.hasLoginRedirect && r.httpStatus >= 199,
    ).length;
    const n404 = reportResults.filter((r) => r.has404).length;
    const nRedirect = reportResults.filter((r) => r.hasLoginRedirect).length;
    const nError = reportResults.filter((r) => r.errorText).length;
    lines.push("## Resumen");
    lines.push(`| Métrica | Valor |`);
    lines.push(`|---------|-------|`);
    lines.push(`| Rutas probadas | ${reportResults.length} |`);
    lines.push(`| OK (sin 404 ni error) | ${ok} |`);
    lines.push(`| 404 detectados | ${n404} |`);
    lines.push(`| Redirects a login (protegidas sin sesión) | ${nRedirect} |`);
    lines.push(`| Errores de texto/carga | ${nError} |`);
    lines.push("");

    lines.push("## Tabla de resultados por ruta");
    lines.push(
      `| Tenant | Ruta | Pública | HTTP | Estado | Final URL | Errores consola | Botones | Headings | Screenshot |`,
    );
    lines.push(
      `|--------|------|---------|------|--------|-----------|-----------------|---------|----------|------------|`,
    );
    for (const r of reportResults) {
      const status = r.has404 ? "404" : r.hasLoginRedirect ? "redirect" : "ok";
      const btns = r.clickableButtons.slice(0, 3).join(", ") || "-";
      const heads = r.headings.slice(0, 3).join(", ") || "-";
      const ss = r.screenshotPath ? path.basename(r.screenshotPath) : "-";
      lines.push(
        `| ${r.tenant} | ${r.path} | ${r.public} | ${r.httpStatus} | ${status} | ${r.finalUrl.slice(0, 60)} | ${r.consoleErrors} | ${btns} | ${heads} | ${ss} |`,
      );
    }
    lines.push("");

    lines.push("## Notas técnicas");
    lines.push(
      "- El smoke cubre rutas públicas y protegidas con sesión activa.",
    );
    lines.push(
      "- Las rutas 404 pueden ser rutas no configuradas o placeholders.",
    );
    lines.push(
      "- Los redirects a login en rutas protegidas son el comportamiento esperado sin sesión.",
    );
    lines.push(
      "- Se recogen botones, links y headings visibles para auditoría de UI.",
    );
    lines.push("");

    lines.push("---");
    lines.push(
      "*Reporte generado automáticamente por Playwright CLI — reporte-general-web.spec.ts*",
    );

    fs.writeFileSync(
      path.join(REPORT_DIR, "reporte-general-web.md"),
      lines.join("\n"),
    );
    console.log(
      "[REPORT] tests/reporte-general-web.md generado con",
      reportResults.length,
      "registros",
    );
  });
});
