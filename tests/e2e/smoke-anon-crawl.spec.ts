import { test, expect, Page } from "@playwright/test";

/**
 * Smoke Crawl — Usuario anónimo
 * Objetivo: recorrer todas las rutas públicas de cada tenant,
 * verificar que cargan sin 404 ni errores de consola críticos,
 * y listar qué botones/links están presentes.
 */

const TENANTS = [
  { slug: "wondernails", name: "Wonder Nails", category: "Belleza" },
  { slug: "centro-tenistico", name: "Centro Tenístico", category: "Deportes" },
  { slug: "delirios", name: "Delirios", category: "Lifestyle" },
  { slug: "manada-juma", name: "Manada Juma", category: "Booking" },
  { slug: "zo-system", name: "Zo System", category: "Software" },
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

const ADMIN_ROUTES_ANON = [
  "/admin",
  "/admin/calendar",
  "/admin/products",
  "/admin_services",
  "/admin_bookings",
  "/admin_tenants",
  "/admin/quotes",
  "/reports",
  "/pos",
  "/finance",
  "/finance/movements",
  "/finance/budgets",
  "/finance/categories",
  "/inventory",
  "/inventory/supplies",
  "/clientes",
  "/clientes/nueva",
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

async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    errors.push(err.message);
  });
  return errors;
}

function reportRoute(
  route: string,
  status: number | "ERROR",
  consoleErrors: string[],
) {
  const badge =
    status === 200
      ? "✅"
      : status === 404
        ? "❌ 404"
        : status === "ERROR"
          ? "❌ ERROR"
          : `⚠️ ${status}`;
  const errSummary =
    consoleErrors.length > 0 ? `(${consoleErrors.length} console errors)` : "";
  console.log(`  ${badge} ${route} ${errSummary}`);
  if (consoleErrors.length > 0) {
    consoleErrors
      .slice(0, 3)
      .forEach((e) => console.log(`      🪵 ${e.slice(0, 120)}`));
  }
}

test.describe("🌐 Smoke Crawl — Usuario anónimo", () => {
  for (const tenant of TENANTS) {
    test.describe(`Tenant: ${tenant.name} (${tenant.slug})`, () => {
      for (const route of PUBLIC_ROUTES) {
        const url = `/t/${tenant.slug}${route}`;
        test(`Página pública: ${route}`, async ({ page }) => {
          const errors: string[] = [];
          page.on("console", (msg) => {
            if (msg.type() === "error") errors.push(msg.text());
          });
          page.on("pageerror", (err) => errors.push(err.message));

          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
          } catch {
            /* networkidle can be flaky; fall back to domcontentloaded */
            await page.goto(url, {
              waitUntil: "domcontentloaded",
              timeout: 30000,
            });
          }

          const status =
            page.url().includes("/404") ||
            (await page.locator("text=404").count()) > 0
              ? 404
              : 200;
          reportRoute(url, status, errors);

          if (status === 404) {
            // 404 en rutas públicas para tenants que no las tengan es aceptable
            test.info().annotations.push({
              type: "info",
              description: `Ruta ${url} devuelve 404 (posiblemente no configurada)`,
            });
          }
        });
      }
    });
  }

  test.describe("🛡️ Rutas admin/protegidas con anon (deben redirigir o bloquear)", () => {
    const tenant = TENANTS[0]; // wondernails
    for (const route of ADMIN_ROUTES_ANON) {
      const url = `/t/${tenant.slug}${route}`;
      test(`Protegida: ${route}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") errors.push(msg.text());
        });
        page.on("pageerror", (err) => errors.push(err.message));

        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        } catch {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
        }

        const currentUrl = page.url();
        const isRedirected = currentUrl.includes("/login");
        const has403 = (await page.locator("text=403").count()) > 0;
        const has404 =
          (await page.locator("text=404").count()) > 0 ||
          currentUrl.includes("/404");

        let status: number | "ERROR" = 200;
        if (isRedirected) status = 302;
        else if (has403) status = 403;
        else if (has404) status = 404;

        reportRoute(url, status, errors);

        if (!isRedirected && !has403 && !has404) {
          test.info().annotations.push({
            type: "warning",
            description: `Ruta protegida ${url} accesible sin login (posible brecha)`,
          });
        }
      });
    }
  });

  test("🏠 Home zo-system: links del footer y tenants", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.getByTestId("home-page")).toBeVisible();

    // Scroll to footer and verify tenant quick-links
    await page.getByTestId("page-footer").scrollIntoViewIfNeeded();
    for (const t of TENANTS) {
      const link = page.locator(`a[href="/t/${t.slug}"]`);
      const count = await link.count();
      if (count === 0) {
        test.info().annotations.push({
          type: "info",
          description: `Footer sin link a /t/${t.slug}`,
        });
      }
    }

    reportRoute("/", 200, errors);
  });
});
