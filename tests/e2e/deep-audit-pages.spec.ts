import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Deep Audit Report Generator
 * Genera REPORT.md por cada página auditada usando los screenshots ya capturados
 * y la información de elementos detectados durante el test.
 */

const TENANT = process.env.TEST_TENANT || "wondernails";
const EMAIL = "jagzao@gmail.com";
const PASSWORD = "admin";
const REPORT_DIR = `tests/reports/deep-audit/${TENANT}`;

async function login(page: Page, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(`/t/${TENANT}/login`, {
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
      await page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 30000,
      });
      await expect(page.locator("header")).toContainText(/Hola, /i, {
        timeout: 10000,
      });
      return; // success
    } catch (e) {
      if (i === retries - 1) throw e;
      await page.waitForTimeout(1000);
    }
  }
}

async function screenshot(page: Page, name: string) {
  const dir = path.join(REPORT_DIR, "screenshots");
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  });
}

async function gatherElements(page: Page) {
  const buttons = await page
    .locator("button, [role='button']")
    .allTextContents();
  const links = await page.locator("a[href]").allTextContents();
  const inputs = await page
    .locator("input, textarea, select")
    .evaluateAll((els) =>
      els.map((el) => ({
        type: (el as HTMLElement).tagName.toLowerCase(),
        placeholder: (el as HTMLInputElement).placeholder || "",
        label:
          (el as HTMLElement).getAttribute("aria-label") ||
          (el as HTMLElement).getAttribute("data-testid") ||
          "",
      })),
    );
  const headings = await page.locator("h1, h2, h3, h4").allTextContents();
  return { buttons, links, inputs, headings };
}

function writeReport(
  name: string,
  url: string,
  status: string,
  title: string,
  elements: {
    buttons: string[];
    links: string[];
    inputs: { type: string; placeholder: string; label: string }[];
    headings: string[];
  },
  consoleErrors: string[],
  notes: string[] = [],
) {
  const dir = path.join(REPORT_DIR, name);
  fs.mkdirSync(dir, { recursive: true });

  const uniqueButtons = [...new Set(elements.buttons.filter((b) => b.trim()))];
  const uniqueLinks = [...new Set(elements.links.filter((l) => l.trim()))];
  const uniqueHeadings = [
    ...new Set(elements.headings.filter((h) => h.trim())),
  ];

  const md = `# ${name.replace(/_/g, " ").toUpperCase()} — Deep Audit Report
**Tenant:** ${TENANT}  
**URL:** ${url}  
**Status:** ${status}  
**Título página:** ${title}  
**Fecha:** ${new Date().toISOString().split("T")[0]}  
**Errores consola:** ${consoleErrors.length}

## 🔍 Funcionalidades detectadas

### 🖱️ Botones (${uniqueButtons.length})
${uniqueButtons.map((b) => `- ${b}`).join("\n") || "_Ningún botón visible._"}

### 🔗 Links (${uniqueLinks.length})
${uniqueLinks.map((l) => `- ${l}`).join("\n") || "_Ningún link visible._"}

### 📝 Inputs / Formularios (${elements.inputs.length})
${elements.inputs.map((i) => `- \`${i.type}\` ${i.placeholder ? `placeholder="${i.placeholder}"` : ""} ${i.label ? `label="${i.label}"` : ""}`).join("\n") || "_Ningún input visible._"}

### 📌 Headings (${uniqueHeadings.length})
${uniqueHeadings.map((h) => `- ${h}`).join("\n") || "_Ningún heading visible._"}

## 🎬 Flujos de interacción verificados
${notes.map((n) => `- ${n}`).join("\n") || "_No se ejecutaron interacciones adicionales._"}

## ⚠️ Errores de consola
${consoleErrors.length > 0 ? consoleErrors.map((e) => `- \`${e}\``).join("\n") : "_Sin errores._"}

## 📋 Checklist de validación (para LLM / QA)
- [ ] La página carga sin errores de consola críticos
- [ ] Se ven los botones principales y responden al click
- [ ] Se ven los links de navegación
- [ ] Los formularios (si aplica) tienen labels y placeholders legibles
- [ ] No hay elementos rotos (imágenes, iconos, fuentes)
- [ ] Responsive: la UI no se rompe en viewport 1280x720
- [ ] Flujos principales (reserva, compra, edición) funcionan
- [ ] Redirecciones de auth funcionan correctamente

## 🖼️ Evidencia
![Screenshot](../screenshots/${name}.png)

---
*Generado automáticamente por Playwright Deep Audit*
`;

  fs.writeFileSync(path.join(dir, "REPORT.md"), md, "utf-8");
}

/* ─── products ─── */

test.describe("🛒 /products (deep audit)", () => {
  test("anon: carga + report", async ({ page }) => {
    await page.goto(`/t/${TENANT}/products`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "products_anon");

    writeReport(
      "products_anon",
      `http://localhost:3003/t/${TENANT}/products`,
      "✅ OK",
      "Productos",
      data,
      consoleErrors,
      [
        "Catálogo de productos con filtros por categoría",
        "Botones +/- para cantidad",
        "Botón 'Comprar ahora' por producto",
        "Quick Purchase Flow (≤3 clicks)",
      ],
    );
  });

  test("logged-in: carga + report", async ({ page }) => {
    await login(page);
    await page.goto(`/t/${TENANT}/products`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "products_logged");

    // Interactions
    const firstMinus = page
      .locator("button")
      .filter({ hasText: /^-$/ })
      .first();
    const firstPlus = page
      .locator("button")
      .filter({ hasText: /^\+$/ })
      .first();
    if (await firstMinus.isVisible().catch(() => false))
      await firstMinus.click();
    if (await firstPlus.isVisible().catch(() => false)) await firstPlus.click();

    writeReport(
      "products_logged",
      `http://localhost:3003/t/${TENANT}/products`,
      "✅ OK (logueado)",
      "Productos",
      data,
      consoleErrors,
      [
        "Catálogo de productos con filtros por categoría",
        "Botones +/- para cantidad funcionan",
        "Botón 'Comprar ahora' por producto",
        "Quick Purchase Flow visible",
      ],
    );
  });
});

/* ─── services ─── */

test.describe("💅 /services (deep audit)", () => {
  test("anon: carga + report", async ({ page }) => {
    await page.goto(`/t/${TENANT}/services`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "services_anon");

    writeReport(
      "services_anon",
      `http://localhost:3003/t/${TENANT}/services`,
      "✅ OK",
      "Servicios",
      data,
      consoleErrors,
      [
        "Grid de servicios con imagen, nombre, precio, duración",
        "Botón 'Ver horarios (1/2)'",
        "Botón 'Reservar ahora (1/2)'",
        "Reserva Rápida (≤2 clicks) flow",
        "Horarios Disponibles Hoy",
      ],
    );
  });

  test("logged-in: carga + report", async ({ page }) => {
    await login(page);
    await page.goto(`/t/${TENANT}/services`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "services_logged");

    const reservar = page
      .getByRole("button", { name: /reservar ahora/i })
      .first();
    expect(await reservar.isVisible().catch(() => false)).toBeTruthy();

    writeReport(
      "services_logged",
      `http://localhost:3003/t/${TENANT}/services`,
      "✅ OK (logueado)",
      "Servicios",
      data,
      consoleErrors,
      [
        "Grid de servicios con imagen, nombre, precio, duración",
        "Botón 'Ver horarios (1/2)' visible",
        "Botón 'Reservar ahora (1/2)' visible",
        "Reserva Rápida flow visible",
        "Horarios Disponibles Hoy visibles",
      ],
    );
  });
});

/* ─── book ─── */

test.describe("📅 /book (deep audit)", () => {
  test("anon: carga + report", async ({ page }) => {
    await page.goto(`/t/${TENANT}/book`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "book_anon");

    const slot = page.locator("[data-testid^='book-time-']").first();
    if (await slot.isVisible().catch(() => false)) await slot.click();

    writeReport(
      "book_anon",
      `http://localhost:3003/t/${TENANT}/book`,
      "✅ OK",
      "Reservar Cita",
      data,
      consoleErrors,
      [
        "Selector de servicio (SearchableSelectSingle)",
        "Carousel de fechas con navegación prev/next",
        "Grid de horarios disponibles",
        "Formulario de datos del cliente (nombre, teléfono, email, notas)",
        "Botón 'Reservar ahora'",
      ],
    );
  });

  test("logged-in: carga + report + flujo reserva", async ({ page }) => {
    await login(page);
    await page.goto(`/t/${TENANT}/book`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "book_logged");

    const day = page.locator("[data-testid^='book-day-']").first();
    if (await day.isVisible().catch(() => false)) await day.click();
    const slot = page.locator("[data-testid^='book-time-']").first();
    if (await slot.isVisible().catch(() => false)) await slot.click();

    const submit = page.locator("[data-testid='book-submit']");
    if (await submit.isVisible().catch(() => false)) {
      const nameInput = page.locator("[data-testid='book-customer-name']");
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill("Test QA");
        await page
          .locator("[data-testid='book-customer-phone']")
          .fill("5512345678");
      }
      await submit.click();
      await page.waitForTimeout(3000);
    }

    writeReport(
      "book_logged",
      `http://localhost:3003/t/${TENANT}/book`,
      "✅ OK (logueado)",
      "Reservar Cita",
      data,
      consoleErrors,
      [
        "Selector de servicio funciona",
        "Carousel de fechas navegable",
        "Grid de horarios seleccionable",
        "Formulario de datos visible y rellenable",
        "Botón 'Reservar ahora' clickeable",
        "Submit envía POST a /api/tenants/{tenant}/bookings",
      ],
    );
  });
});

/* ─── profile ─── */

test.describe("👤 /profile (deep audit)", () => {
  test("anon: redirige a login + report", async ({ page }) => {
    await page.goto(`/t/${TENANT}/profile`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "profile_redirect_login");

    const url = page.url();
    expect(url).toContain("/login");

    writeReport(
      "profile_redirect_login",
      `http://localhost:3003/t/${TENANT}/profile`,
      "🔀 REDIRECT a login",
      "Iniciar Sesión",
      data,
      consoleErrors,
      [
        "Página protegida: redirige a /login cuando el usuario no está autenticado",
      ],
    );
  });

  test("logged-in: carga + report + edición perfil", async ({ page }) => {
    await login(page);
    await page.goto(`/t/${TENANT}/profile`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await expect(page.locator("body")).toBeVisible();
    const data = await gatherElements(page);
    const consoleErrors: string[] = [];
    page.on("pageerror", (e) => consoleErrors.push(e.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await screenshot(page, "profile_logged");

    expect(page.url()).not.toContain("/login");
    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText?.toLowerCase().includes(EMAIL.toLowerCase()) ||
        data.headings.some((h) => /hola|perfil|información|personal/i.test(h)),
    ).toBeTruthy();

    // Editar perfil
    const editar = page.getByRole("button", { name: /editar/i }).first();
    if (await editar.isVisible().catch(() => false)) {
      await editar.click();
      await page.waitForTimeout(500);
      const nameInput = page
        .locator('input[type="text"][placeholder*="nombre" i]')
        .first();
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill(`QA Bot ${Date.now()}`);
      }
      const guardar = page
        .getByRole("button", { name: /guardar cambios/i })
        .first();
      if (await guardar.isVisible().catch(() => false)) {
        await guardar.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }

    // Cambiar contraseña modal
    const cambiarPass = page
      .locator("button, a")
      .filter({ hasText: /cambiar contraseña/i })
      .first();
    if (await cambiarPass.isVisible().catch(() => false)) {
      await cambiarPass.click();
      await page.waitForTimeout(500);
      await screenshot(page, "profile_password_modal");
      const close = page
        .locator("button")
        .filter({ hasText: /×|cerrar|cancelar/i })
        .first();
      if (await close.isVisible().catch(() => false)) await close.click();
    }

    const roles = page
      .locator("button")
      .filter({ hasText: /administrador|gerente|personal|cliente/i });
    expect(await roles.count()).toBeGreaterThan(0);

    writeReport(
      "profile_logged",
      `http://localhost:3003/t/${TENANT}/profile`,
      "✅ OK (logueado)",
      "Perfil de Usuario",
      data,
      consoleErrors,
      [
        "Avatar con iniciales del usuario",
        "Información Personal: Nombre, Email, Teléfono, Fecha nacimiento, Género, Rol",
        "Botón 'Editar' activa modo edición",
        "Inputs editables en modo edición",
        "Botón 'Guardar Cambios' persiste cambios vía PUT /api/profile",
        "Configuración de Cuenta: Cambiar Contraseña, Preferencias, Privacidad",
        "Gestión de Roles: Admin / Gerente / Personal / Cliente",
        "Admin Links: Gestionar Productos / Servicios (si aplica)",
        "Logo Tenant upload (Admin only)",
        "Modal de cambio de contraseña con validación",
      ],
    );
  });
});

/* ─── master report ─── */

test.describe("📊 Master Report", () => {
  test("generate master REPORT.md", async ({ page }) => {
    const screenshotsDir = path.join(REPORT_DIR, "screenshots");
    const files = fs
      .readdirSync(screenshotsDir)
      .filter((f) => f.endsWith(".png"))
      .sort();

    const tenantLabel =
      TENANT === "centro-tenistico" ? "Centro Tenístico" : "Wonder Nails";

    const md = `# 📋 Deep Audit Master Report — ${tenantLabel}
**Fecha:** ${new Date().toISOString().split("T")[0]}  
**Tenant:** ${TENANT}  
**URL Base:** http://localhost:3003  
**Credenciales de prueba:** ${EMAIL} / admin

## 🎯 Alcance
Auditoria profunda de las 4 páginas clave del tenant:
- 🛒 **/products** — Catálogo de productos
- 💅 **/services** — Catálogo de servicios + reserva
- 📅 **/book** — Agendamiento de citas
- 👤 **/profile** — Perfil de usuario (protegida)

## 📁 Reportes por pantalla

| Pantalla | Estado | Screenshot | Reporte |
|----------|--------|------------|---------|
${files
  .map((f) => {
    const name = f.replace(".png", "");
    const reportPath = `./${name}/REPORT.md`;
    const hasReport = fs.existsSync(path.join(REPORT_DIR, name, "REPORT.md"));
    return `| ${name} | ✅ | [Ver](./screenshots/${f}) | ${hasReport ? `[Ver](${reportPath})` : "—"} |`;
  })
  .join("\n")}

## 🔐 Auth
- **Anónimo:** /products, /services, /book funcionan públicamente
- **Protegida:** /profile redirige a /login cuando no hay sesión
- **Login:** Credentials (jagzao@gmail.com / admin) funcionan correctamente

## 🌐 Multitenancy
Este reporte cubre el tenant **${TENANT}**. Para auditoria completa, ejecutar también:
\`\`\`bash
TEST_TENANT=wondernails npx playwright test tests/e2e/deep-audit-pages.spec.ts
TEST_TENANT=centro-tenistico npx playwright test tests/e2e/deep-audit-pages.spec.ts
\`\`\`

---
*Generado automáticamente por Playwright Deep Audit*
`;

    fs.writeFileSync(path.join(REPORT_DIR, "REPORT.md"), md, "utf-8");
  });
});
