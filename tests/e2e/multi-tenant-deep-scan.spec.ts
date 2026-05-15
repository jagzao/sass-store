import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Multi-Tenant Deep Scan
 * Escanea TODAS las rutas conocidas de los tenants wondernails y centro-tenistico.
 * Detecta: 404, errores de consola, redirecciones inesperadas, textos de error visibles.
 * Genera reporte por tenant con screenshot por pantalla.
 */

const BASE = process.env.BASE_URL || "http://localhost:3003";
const EMAIL = "jagzao@gmail.com";
const PASSWORD = "admin";

const TENANTS = [
  { slug: "wondernails", name: "Wonder Nails" },
  { slug: "centro-tenistico", name: "Centro Tenístico" },
];

// Rutas públicas (no requieren login)
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

// Rutas protegidas (requieren login)
const PROTECTED_ROUTES = [
  "/admin",
  "/admin/calendar",
  "/admin/products",
  "/admin/content",
  "/admin/quotes",
  "/admin_services",
  "/admin_bookings",
  "/admin_tenants",
  "/admin_products",
  "/pos",
  "/reports",
  "/finance",
  "/finance/movements",
  "/finance/budgets",
  "/finance/categories",
  "/inventory",
  "/inventory/supplies",
  "/clientes",
  "/clientes/nueva",
  "/clientes/test",
  "/cart",
  "/checkout",
  "/checkout/success",
  "/orders",
  "/profile",
  "/account",
  "/settings/calendar",
  "/config",
  "/favorites",
  "/social",
  "/retouch",
  "/reorder",
  "/booking",
];

// Rutas con parámetros dinámicos (se prueban con IDs dummy)
const DYNAMIC_ROUTES = [
  { pattern: "/booking/{id}", ids: ["test-booking-123", "nonexistent"] },
  { pattern: "/clientes/{id}", ids: ["test-client-123", "nonexistent"] },
  {
    pattern: "/services/{serviceId}/inventory",
    ids: ["test-service-123", "nonexistent"],
  },
  { pattern: "/admin/quotes/{id}", ids: ["test-quote-123", "nonexistent"] },
];

interface ScanResult {
  tenant: string;
  url: string;
  finalUrl: string;
  status: "ok" | "error" | "redirect" | "404" | "500" | "timeout";
  title: string;
  consoleErrors: string[];
  visibleErrors: string[];
  screenshotPath: string;
  loadTimeMs: number;
}

const REPORTS_DIR = path.join(process.cwd(), "tests", "reports", "deep-scan");

function sanitize(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function statusEmoji(s: ScanResult["status"]): string {
  switch (s) {
    case "ok":
      return "✅";
    case "redirect":
      return "🔀";
    case "404":
      return "❌";
    case "500":
      return "💥";
    case "timeout":
      return "⏱️";
    case "error":
      return "⚠️";
    default:
      return "❓";
  }
}

async function doLogin(page: Page, tenant: string) {
  await page.goto(`${BASE}/t/${tenant}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expect(page.locator('input[name="email"]').first()).toBeVisible({
    timeout: 30000,
  });
  await page.locator('input[name="email"]').first().fill(EMAIL);
  await page.locator('input[name="password"]').first().fill(PASSWORD);
  await page
    .locator("form")
    .first()
    .evaluate((f: HTMLFormElement) => f.requestSubmit());
  await expect(page.locator("header")).toContainText(
    /Hola|Bienvenido|Dashboard|Productos|Servicios|Inicio/i,
    { timeout: 30000 },
  );
}

async function scanPage(
  page: Page,
  tenant: string,
  route: string,
  screenshotDir: string,
): Promise<ScanResult> {
  const url = `${BASE}/t/${tenant}${route}`;
  const consoleErrors: string[] = [];
  const handler = (msg: any) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  page.on("console", handler);
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  let status: ScanResult["status"] = "ok";
  let finalUrl = url;
  let title = "";
  const visibleErrors: string[] = [];
  const start = Date.now();

  const screenshotFile = `${sanitize(tenant)}_${sanitize(route)}.png`;
  const screenshotPath = path.join(screenshotDir, screenshotFile);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
    finalUrl = page.url();
    title = await page.title().catch(() => "");

    if (
      finalUrl.includes("/404") ||
      (await page.locator("text=404").count()) > 0
    ) {
      status = "404";
    } else if (
      (await page.locator("text=500, text=Internal Server Error").count()) > 0
    ) {
      status = "500";
    } else if (finalUrl.includes("/login") && !route.includes("/login")) {
      status = "redirect";
    }

    // Detect visible error texts
    const errorTexts = await page.locator("body").evaluate((el) => {
      const text = el.textContent || "";
      const markers = [
        "Something went wrong",
        "Internal Server Error",
        "Application error",
        "Failed to load",
        "Error loading",
        "Unexpected error",
        "No autorizado",
        "Unauthorized",
      ];
      return markers.filter((m) => text.includes(m));
    });
    visibleErrors.push(...errorTexts);
    if (visibleErrors.length > 0 && status === "ok") status = "error";

    await page
      .screenshot({ path: screenshotPath, fullPage: false })
      .catch(() => {});
  } catch (e) {
    status = "timeout";
    await page
      .screenshot({ path: screenshotPath, fullPage: false })
      .catch(() => {});
  }

  page.off("console", handler);
  const loadTimeMs = Date.now() - start;

  return {
    tenant,
    url: `/t/${tenant}${route}`,
    finalUrl,
    status,
    title,
    consoleErrors,
    visibleErrors,
    screenshotPath: path
      .relative(REPORTS_DIR, screenshotPath)
      .replace(/\\/g, "/"),
    loadTimeMs,
  };
}

for (const tenant of TENANTS) {
  test.describe.serial(`🔬 Deep Scan — ${tenant.name} (${tenant.slug})`, () => {
    let page: Page;
    const results: ScanResult[] = [];
    const testDate = new Date().toISOString();
    const tenantDir = path.join(REPORTS_DIR, sanitize(tenant.slug));
    const screenshotDir = path.join(tenantDir, "screenshots");

    test.beforeAll(async ({ browser }) => {
      if (!fs.existsSync(screenshotDir))
        fs.mkdirSync(screenshotDir, { recursive: true });
      const ctx = await browser.newContext();
      page = await ctx.newPage();
    });

    test.afterAll(async () => {
      await page.context().close();

      // Generate per-tenant REPORT.md
      const lines: string[] = [];
      lines.push(`# 🔬 Deep Scan Report — ${tenant.name}`);
      lines.push(`**Fecha:** ${testDate}`);
      lines.push(`**Tenant:** ${tenant.slug}`);
      lines.push(`**URL Base:** ${BASE}`);
      lines.push("");

      const ok = results.filter((r) => r.status === "ok").length;
      const redirect = results.filter((r) => r.status === "redirect").length;
      const notFound = results.filter((r) => r.status === "404").length;
      const error = results.filter((r) => r.status === "error").length;
      const serverError = results.filter((r) => r.status === "500").length;
      const timeout = results.filter((r) => r.status === "timeout").length;

      lines.push("## 📊 Resumen");
      lines.push(`| Status | Cantidad |`);
      lines.push(`|--------|----------|`);
      lines.push(`| ${statusEmoji("ok")} OK | ${ok} |`);
      lines.push(`| ${statusEmoji("redirect")} Redirect | ${redirect} |`);
      lines.push(`| ${statusEmoji("404")} 404 | ${notFound} |`);
      lines.push(`| ${statusEmoji("error")} Error UI | ${error} |`);
      lines.push(`| ${statusEmoji("500")} 500 | ${serverError} |`);
      lines.push(`| ${statusEmoji("timeout")} Timeout | ${timeout} |`);
      lines.push("");

      lines.push("## 🔗 Rutas Públicas");
      lines.push(
        "| Ruta | Status | Estado | Título | Consola | UI Errors | Load (ms) |",
      );
      lines.push(
        "|------|--------|--------|--------|---------|-----------|-----------|",
      );
      for (const r of results.filter((x) =>
        PUBLIC_ROUTES.some((p) => x.url.endsWith(p)),
      )) {
        const uiErrs =
          r.visibleErrors.length > 0
            ? r.visibleErrors.join(", ").slice(0, 40)
            : "";
        lines.push(
          `| ${r.url} | ${statusEmoji(r.status)} | ${r.status} | ${r.title.slice(0, 40)} | ${r.consoleErrors.length} | ${uiErrs} | ${r.loadTimeMs} |`,
        );
      }
      lines.push("");

      lines.push("## 🔒 Rutas Protegidas (post-login)");
      lines.push(
        "| Ruta | Status | Estado | Título | Consola | UI Errors | Load (ms) |",
      );
      lines.push(
        "|------|--------|--------|--------|---------|-----------|-----------|",
      );
      for (const r of results.filter((x) =>
        PROTECTED_ROUTES.some((p) => x.url.endsWith(p)),
      )) {
        const uiErrs =
          r.visibleErrors.length > 0
            ? r.visibleErrors.join(", ").slice(0, 40)
            : "";
        lines.push(
          `| ${r.url} | ${statusEmoji(r.status)} | ${r.status} | ${r.title.slice(0, 40)} | ${r.consoleErrors.length} | ${uiErrs} | ${r.loadTimeMs} |`,
        );
      }
      lines.push("");

      lines.push("## 🔀 Rutas Dinámicas");
      lines.push(
        "| Ruta | Status | Estado | Título | Consola | UI Errors | Load (ms) |",
      );
      lines.push(
        "|------|--------|--------|--------|---------|-----------|-----------|",
      );
      for (const r of results.filter((x) =>
        DYNAMIC_ROUTES.some((d) => {
          const base = d.pattern
            .replace("/{id}", "")
            .replace("/{serviceId}", "");
          return x.url.includes(base);
        }),
      )) {
        const uiErrs =
          r.visibleErrors.length > 0
            ? r.visibleErrors.join(", ").slice(0, 40)
            : "";
        lines.push(
          `| ${r.url} | ${statusEmoji(r.status)} | ${r.status} | ${r.title.slice(0, 40)} | ${r.consoleErrors.length} | ${uiErrs} | ${r.loadTimeMs} |`,
        );
      }
      lines.push("");

      lines.push("---");
      lines.push("*Generado automáticamente por Playwright*");

      fs.writeFileSync(path.join(tenantDir, "REPORT.md"), lines.join("\n"));
      fs.writeFileSync(
        path.join(tenantDir, "report.json"),
        JSON.stringify(results, null, 2),
      );
      console.log(
        `[DeepScan] Report saved to tests/reports/deep-scan/${sanitize(tenant.slug)}/REPORT.md`,
      );
    });

    // ─── PÚBLICAS (sin login) ───
    for (const route of PUBLIC_ROUTES) {
      test(`PÚBLICA ${route}`, async () => {
        const r = await scanPage(page, tenant.slug, route, screenshotDir);
        results.push(r);
        expect(["ok", "404", "redirect"]).toContain(r.status);
      });
    }

    // ─── PROTEGIDAS (con login) ───
    test("login", async () => {
      await doLogin(page, tenant.slug);
    });

    for (const route of PROTECTED_ROUTES) {
      test(`PROTEGIDA ${route}`, async () => {
        const r = await scanPage(page, tenant.slug, route, screenshotDir);
        results.push(r);
        expect(["ok", "404", "redirect", "error"]).toContain(r.status);
      });
    }

    // ─── DINÁMICAS (con login) ───
    for (const dyn of DYNAMIC_ROUTES) {
      for (const id of dyn.ids) {
        const route = dyn.pattern
          .replace("/{id}", `/${id}`)
          .replace("/{serviceId}", `/${id}`);
        test(`DINÁMICA ${route}`, async () => {
          const r = await scanPage(page, tenant.slug, route, screenshotDir);
          results.push(r);
          expect(["ok", "404", "redirect", "error"]).toContain(r.status);
        });
      }
    }
  });
}
