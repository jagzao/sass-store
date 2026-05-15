import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Web Map Report — Auto-documentación funcional por pantalla
 * Genera REPORT.md por cada ruta con:
 *  - Screenshot de evidencia
 *  - Estado HTTP/UX
 *  - Botones, links, inputs detectados
 *  - Funcionalidades que un LLM puede validar
 *  - Regresión para futuras ejecuciones
 */
const BASE = "http://localhost:3003";
const TENANT = "wondernails";
const EMAIL = "jagzao@gmail.com";
const PASSWORD = "admin";

interface RouteResult {
  url: string;
  finalUrl: string;
  status: "ok" | "error" | "redirect" | "404";
  title: string;
  errorText: string;
  consoleErrors: number;
  screenshotPath: string;
  elements: {
    buttons: string[];
    links: string[];
    inputs: string[];
    headings: string[];
  };
}

const REPORTS_DIR = path.join(process.cwd(), "tests", "reports");
const SCREENSHOTS_DIR = path.join(REPORTS_DIR, "screenshots");

const PUBLIC_ROUTES = [
  { url: "/", label: "Home" },
  { url: `/t/${TENANT}`, label: "Tenant Home" },
  { url: `/t/${TENANT}/services`, label: "Services" },
  { url: `/t/${TENANT}/products`, label: "Products" },
  { url: `/t/${TENANT}/book`, label: "Book" },
  { url: `/t/${TENANT}/contact`, label: "Contact" },
  { url: `/t/${TENANT}/login`, label: "Login" },
  { url: `/t/${TENANT}/register`, label: "Register" },
  { url: `/t/${TENANT}/forgot-password`, label: "Forgot Password" },
];

const PROTECTED_ROUTES = [
  { url: `/t/${TENANT}/admin`, label: "Admin Dashboard" },
  { url: `/t/${TENANT}/admin/calendar`, label: "Admin Calendar" },
  { url: `/t/${TENANT}/admin/products`, label: "Admin Products" },
  { url: `/t/${TENANT}/admin_services`, label: "Admin Services" },
  { url: `/t/${TENANT}/admin_bookings`, label: "Admin Bookings" },
  { url: `/t/${TENANT}/admin/quotes`, label: "Admin Quotes" },
  { url: `/t/${TENANT}/admin_tenants`, label: "Admin Tenants" },
  { url: `/t/${TENANT}/pos`, label: "POS" },
  { url: `/t/${TENANT}/reports`, label: "Reports" },
  { url: `/t/${TENANT}/finance`, label: "Finance" },
  { url: `/t/${TENANT}/finance/movements`, label: "Finance Movements" },
  { url: `/t/${TENANT}/finance/budgets`, label: "Finance Budgets" },
  { url: `/t/${TENANT}/finance/categories`, label: "Finance Categories" },
  { url: `/t/${TENANT}/inventory`, label: "Inventory" },
  { url: `/t/${TENANT}/inventory/supplies`, label: "Inventory Supplies" },
  { url: `/t/${TENANT}/clientes`, label: "Clientes" },
  { url: `/t/${TENANT}/clientes/nueva`, label: "Nuevo Cliente" },
  { url: `/t/${TENANT}/cart`, label: "Cart" },
  { url: `/t/${TENANT}/checkout`, label: "Checkout" },
  { url: `/t/${TENANT}/orders`, label: "Orders" },
  { url: `/t/${TENANT}/profile`, label: "Profile" },
  { url: `/t/${TENANT}/account`, label: "Account" },
  { url: `/t/${TENANT}/settings/calendar`, label: "Settings Calendar" },
  { url: `/t/${TENANT}/config`, label: "Config" },
  { url: `/t/${TENANT}/favorites`, label: "Favorites" },
  { url: `/t/${TENANT}/social`, label: "Social" },
  { url: `/t/${TENANT}/retouch`, label: "Retouch" },
  { url: `/t/${TENANT}/reorder`, label: "Reorder" },
];

function sanitizeFolderName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function statusEmoji(s: RouteResult["status"]): string {
  switch (s) {
    case "ok":
      return "✅";
    case "redirect":
      return "🔀";
    case "404":
      return "❌";
    case "error":
      return "⚠️";
    default:
      return "❓";
  }
}

test.describe.serial("🗺️ Web Map Report", () => {
  const results: RouteResult[] = [];
  let page: Page;
  const testDate = new Date().toISOString();

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    page = await ctx.newPage();

    // Login
    await page.goto(`${BASE}/t/${TENANT}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.locator('input[name="email"]').first()).toBeVisible({
      timeout: 30000,
    });
    await page.locator('input[name="email"]').first().fill(EMAIL);
    await page.locator('input[name="password"]').first().fill(PASSWORD);
    await page.locator('button:has-text("Iniciar sesión")').first().click();
    await expect(page.locator("header")).toContainText(
      /Hola|Bienvenido|Dashboard|Productos|Servicios/i,
      { timeout: 30000 },
    );
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  async function detectElements(p: Page): Promise<RouteResult["elements"]> {
    const buttons = await p
      .locator("button")
      .allInnerTexts()
      .then((arr) =>
        arr
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20),
      );
    const links = await p
      .locator("a")
      .allInnerTexts()
      .then((arr) =>
        arr
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20),
      );
    const inputs = await p
      .locator("input, select, textarea")
      .evaluateAll((els: any[]) =>
        els
          .map(
            (e) =>
              (e as HTMLInputElement).placeholder ||
              (e as HTMLInputElement).name ||
              (e as HTMLInputElement).type ||
              e.tagName.toLowerCase(),
          )
          .filter(Boolean),
      );
    const headings = await p
      .locator("h1, h2, h3")
      .allInnerTexts()
      .then((arr) =>
        arr
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 10),
      );
    return { buttons, links, inputs, headings };
  }

  async function visit(route: {
    url: string;
    label: string;
  }): Promise<RouteResult> {
    const consoleErrors: string[] = [];
    const handler = (msg: any) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    };
    page.on("console", handler);
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    let status: RouteResult["status"] = "ok";
    let finalUrl = route.url;
    let title = "";
    let errorText = "";

    const folderName = sanitizeFolderName(route.label);
    const routeDir = path.join(SCREENSHOTS_DIR, folderName);
    if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
    const screenshotFileName = `${sanitizeFolderName(route.label)}.png`;
    const screenshotPath = path.join(routeDir, screenshotFileName);

    let elements: RouteResult["elements"] = {
      buttons: [],
      links: [],
      inputs: [],
      headings: [],
    };

    try {
      await page.goto(`${BASE}${route.url}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page
        .waitForLoadState("networkidle", { timeout: 15000 })
        .catch(() => {});
      finalUrl = page.url();
      title = await page.title().catch(() => "");

      if (finalUrl.includes("/login") && !route.url.includes("/login")) {
        status = "redirect";
      } else if (
        finalUrl.includes("/404") ||
        (await page.locator("text=404").count()) > 0
      ) {
        status = "404";
      } else {
        const hasErrorText =
          (await page.getByText(/Error|error|Error:/i).count()) > 0;
        if (hasErrorText) {
          status = "error";
          errorText =
            (await page
              .getByText(/Error|error|Error:/i)
              .first()
              .textContent()
              .catch(() => "")) || "";
        }
      }

      elements = await detectElements(page);
      await page
        .screenshot({ path: screenshotPath, fullPage: false })
        .catch(() => {});
    } catch (e) {
      status = "error";
      errorText = String(e).slice(0, 200);
      await page
        .screenshot({ path: screenshotPath, fullPage: false })
        .catch(() => {});
    }

    page.off("console", handler);

    // Build functional REPORT.md
    const md: string[] = [];
    md.push(`# ${route.label} — Test Report`);
    md.push(`**Fecha última prueba:** ${testDate.split("T")[0]}`);
    md.push(`**URL:** ${BASE}${route.url}`);
    md.push(`**URL Final:** ${finalUrl}`);
    md.push(`**Status:** ${statusEmoji(status)} ${status.toUpperCase()}`);
    md.push(`**Título página:** ${title}`);
    md.push(`**Errores consola:** ${consoleErrors.length}`);
    md.push("");

    md.push("## 🔍 Funcionalidades detectadas");
    md.push("");

    md.push("### 🖱️ Botones");
    if (elements.buttons.length === 0) md.push("_Ningún botón visible._");
    else elements.buttons.forEach((b) => md.push(`- ${b}`));
    md.push("");

    md.push("### 🔗 Links");
    if (elements.links.length === 0) md.push("_Ningún link visible._");
    else elements.links.forEach((l) => md.push(`- ${l}`));
    md.push("");

    md.push("### 📝 Inputs / Formularios");
    if (elements.inputs.length === 0) md.push("_Ningún input visible._");
    else elements.inputs.forEach((i) => md.push(`- ${i}`));
    md.push("");

    md.push("### 📌 Headings");
    if (elements.headings.length === 0) md.push("_Ningún heading visible._");
    else elements.headings.forEach((h) => md.push(`- ${h}`));
    md.push("");

    md.push("## 📋 Checklist de validación (para LLM / QA)");
    md.push("- [ ] La página carga sin errores de consola críticos");
    md.push("- [ ] Se ven los botones principales y responden al click");
    md.push("- [ ] Se ven los links de navegación");
    md.push(
      "- [ ] Los formularios (si aplica) tienen labels y placeholders legibles",
    );
    md.push("- [ ] No hay elementos rotos (imágenes, iconos, fuentes)");
    md.push("- [ ] Responsive: la UI no se rompe en viewport 1280x720");
    md.push("");

    md.push("## 🖼️ Evidencia");
    md.push(`![Screenshot](${screenshotFileName})`);
    md.push("");

    if (consoleErrors.length > 0) {
      md.push("## ⚠️ Errores de consola");
      consoleErrors
        .slice(0, 5)
        .forEach((e) => md.push(`- \`${e.slice(0, 120)}\``));
      md.push("");
    }

    if (errorText) {
      md.push("## 🐛 Error detectado");
      md.push(errorText);
      md.push("");
    }

    md.push("---");
    md.push("*Generado automáticamente por Playwright Web Map Report*");

    fs.writeFileSync(path.join(routeDir, "REPORT.md"), md.join("\n"));

    return {
      url: route.url,
      finalUrl,
      status,
      title,
      errorText,
      consoleErrors: consoleErrors.length,
      screenshotPath: path
        .relative(REPORTS_DIR, screenshotPath)
        .replace(/\\/g, "/"),
      elements,
    };
  }

  for (const route of PUBLIC_ROUTES) {
    test(`PÚBLICA  ${route.url}`, async () => {
      const r = await visit(route);
      results.push(r);
      expect(["ok", "404"]).toContain(r.status);
    });
  }

  for (const route of PROTECTED_ROUTES) {
    test(`PROTEGIDA ${route.url}`, async () => {
      const r = await visit(route);
      results.push(r);
      expect(["ok", "redirect", "404"]).toContain(r.status);
    });
  }

  test.afterAll(async () => {
    fs.writeFileSync(
      path.join(REPORTS_DIR, "web-map-report.json"),
      JSON.stringify(results, null, 2),
    );

    const lines: string[] = [];
    lines.push("# 🗺️ Web Map Report - SaaS Store");
    lines.push(`**Fecha:** ${testDate}`);
    lines.push(`**URL Base:** ${BASE}`);
    lines.push(`**Tenant:** ${TENANT}`);
    lines.push("");
    lines.push("## 📊 Resumen");
    const ok = results.filter((r) => r.status === "ok").length;
    const redirect = results.filter((r) => r.status === "redirect").length;
    const notFound = results.filter((r) => r.status === "404").length;
    const error = results.filter((r) => r.status === "error").length;
    lines.push(`| Status | Cantidad |`);
    lines.push(`|--------|----------|`);
    lines.push(`| ${statusEmoji("ok")} OK | ${ok} |`);
    lines.push(`| ${statusEmoji("redirect")} Redirect (login) | ${redirect} |`);
    lines.push(`| ${statusEmoji("404")} 404 | ${notFound} |`);
    lines.push(`| ${statusEmoji("error")} Error | ${error} |`);
    lines.push("");
    lines.push("## 🔗 Rutas Públicas");
    lines.push(
      "| Ruta | Status | Estado | Título | Errores consola | Fecha | Reporte |",
    );
    lines.push(
      "|------|--------|--------|--------|-----------------|-------|---------|",
    );
    for (const r of results.filter((x) =>
      PUBLIC_ROUTES.some((p) => p.url === x.url),
    )) {
      const folder = sanitizeFolderName(
        PUBLIC_ROUTES.find((p) => p.url === r.url)?.label || "",
      );
      lines.push(
        `| ${r.url} | ${statusEmoji(r.status)} | ${r.status} | ${r.title.slice(0, 50)} | ${r.consoleErrors} | ${testDate.split("T")[0]} | [Ver](./screenshots/${folder}/REPORT.md) |`,
      );
    }
    lines.push("");
    lines.push("## 🔒 Rutas Protegidas (logged in)");
    lines.push(
      "| Ruta | Status | Estado | URL final | Errores consola | Fecha | Reporte |",
    );
    lines.push(
      "|------|--------|--------|-----------|-----------------|-------|---------|",
    );
    for (const r of results.filter((x) =>
      PROTECTED_ROUTES.some((p) => p.url === x.url),
    )) {
      const folder = sanitizeFolderName(
        PROTECTED_ROUTES.find((p) => p.url === r.url)?.label || "",
      );
      const note = r.errorText ? r.errorText.slice(0, 60) : "";
      lines.push(
        `| ${r.url} | ${statusEmoji(r.status)} | ${r.status} | ${r.finalUrl.slice(0, 60)} | ${r.consoleErrors} | ${testDate.split("T")[0]} | [Ver](./screenshots/${folder}/REPORT.md) |`,
      );
      if (note) lines[lines.length - 1] += ` <!-- ${note} -->`;
    }
    lines.push("");
    lines.push("---");
    lines.push("*Generado automáticamente por Playwright*");

    fs.writeFileSync(
      path.join(REPORTS_DIR, "web-map-report.md"),
      lines.join("\n"),
    );
    console.log(
      "[WebMapReport] Report saved to tests/reports/web-map-report.md",
    );
  });
});
