/**
 * STRY-021 — Security Hardening E2E Tests
 *
 * Valida que los endpoints críticos estén correctamente bloqueados
 * y que los flujos normales de usuario no se hayan roto.
 */

import { test, expect } from "@playwright/test";

// BASE_URL no necesario — Playwright usa el baseURL del config (puerto 3002).
// Para requests directas (request fixture) usamos "" + path relativo.
const BASE_URL = "";

test.describe("STRY-021 — Endpoints de debug eliminados", () => {
  test("SEC-001: /api/diagnose/user-check devuelve 404", async ({
    request,
  }) => {
    const res = await request.get(
      `${BASE_URL}/api/diagnose/user-check?email=test@test.com&password=admin`,
    );
    expect(res.status()).toBe(404);
  });

  test("SEC-001: /api/diagnose/user-check POST es rechazado", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/diagnose/user-check`, {
      data: { email: "test@test.com", password: "admin" },
    });
    // 404: handler retorna not-found
    // 405: method not allowed
    // 403: CSRF check del proxy intercepta antes del handler (también correcto)
    expect([403, 404, 405]).toContain(res.status());
    // Lo que NO debe ocurrir es 200 (credential oracle funcionando)
    expect(res.status()).not.toBe(200);
  });

  test("SEC-002: /api/debug/auth-check devuelve 404", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/debug/auth-check`);
    expect(res.status()).toBe(404);
  });

  test("SEC-002: Respuesta de 404 no filtra información interna", async ({
    request,
  }) => {
    const res = await request.get(`${BASE_URL}/api/debug/auth-check`);
    const body = await res.json();
    // No debe contener emails, contraseñas, ni stack traces
    const bodyStr = JSON.stringify(body);
    expect(bodyStr).not.toContain("marialiciavh");
    expect(bodyStr).not.toContain("password");
    expect(bodyStr).not.toContain("stack");
  });
});

test.describe("STRY-021 — Upload requiere autenticación", () => {
  test("SEC-008: POST /api/upload sin sesión es rechazado (401 auth o 403 CSRF)", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/upload`, {
      multipart: {
        file: {
          name: "test.jpg",
          mimeType: "image/jpeg",
          buffer: Buffer.from("fake-image-data"),
        },
      },
    });
    // 401: sin sesión (auth check en el handler)
    // 403: CSRF faltante (middleware intercepta antes del handler)
    // Ambos son aceptables — la request es rechazada
    expect([401, 403]).toContain(res.status());
    // Lo que NO debe ocurrir es 200 (upload exitoso sin auth)
    expect(res.status()).not.toBe(200);
  });
});

test.describe("STRY-021 — Webhook de WhatsApp con firma", () => {
  test("SEC-007: POST /api/whatsapp/webhook sin firma devuelve 401 en prod o 200 en dev", async ({
    request,
  }) => {
    const res = await request.post(`${BASE_URL}/api/whatsapp/webhook`, {
      data: { object: "whatsapp_business_account", entry: [] },
      headers: { "Content-Type": "application/json" },
    });
    // En dev sin APP_SECRET configurado: 200 (fail-open)
    // En prod/staging con APP_SECRET: 401
    expect([200, 401]).toContain(res.status());
  });

  test("SEC-007: Verificación GET del webhook sigue funcionando", async ({
    request,
  }) => {
    const token = "test-verify-token";
    const challenge = "test-challenge-123";
    const res = await request.get(
      `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=${challenge}`,
    );
    // 403 si el token no coincide (normal en test), nunca 500
    expect([200, 403]).toContain(res.status());
  });
});

test.describe("STRY-021 — Flujos críticos no rotos (regresión)", () => {
  test("Landing de wondernails carga correctamente", async ({ page }) => {
    await page.goto(`${BASE_URL}/t/wondernails`);
    await expect(page).not.toHaveURL(/error|500/);
    // La página debe tener algún contenido visible
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("Landing de centro-tenistico carga correctamente", async ({ page }) => {
    await page.goto(`${BASE_URL}/t/centro-tenistico`);
    await expect(page).not.toHaveURL(/error|500/);
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("Health endpoint responde OK", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
  });
});

test.describe("STRY-021 — PERF-002: Logs de TenantService reducidos", () => {
  test("Navegar a wondernails produce menos de 5 logs de TenantService", async ({
    page,
  }) => {
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("[TenantService]")) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/t/wondernails`);
    await page.waitForLoadState("networkidle");

    // Antes del fix: 15-19 logs. Después: 0 en cliente (los logs son server-side).
    // En cliente no deberían llegar logs de TenantService en absoluto.
    expect(consoleLogs.length).toBe(0);
  });
});
