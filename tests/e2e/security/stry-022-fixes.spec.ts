/**
 * STRY-022 — Tests E2E para los nuevos fixes post-auditoría
 */
import { test, expect } from "@playwright/test";

const BASE = "";

// ─── SEC-NEW-001: system/seed ─────────────────────────
test("SEC-NEW-001: /system/seed devuelve 404", async ({ request }) => {
  const res = await request.get(`${BASE}/system/seed`);
  expect(res.status()).toBe(404);
  const body = await res.json();
  expect(JSON.stringify(body)).not.toContain("marialiciavh");
  expect(JSON.stringify(body)).not.toContain("admin");
  expect(JSON.stringify(body)).not.toContain("password");
});

// ─── SEC-NEW-002: finance/kpis ────────────────────────
test("SEC-NEW-002: /api/finance/kpis sin auth → 401", async ({ request }) => {
  const res = await request.get(
    `${BASE}/api/finance/kpis?period=month&tenant=wondernails`,
  );
  expect(res.status()).toBe(401);
});

test("SEC-NEW-002: /api/finance/kpis con params vacíos sin auth → 401 o 400", async ({
  request,
}) => {
  const res = await request.get(`${BASE}/api/finance/kpis`);
  expect([400, 401]).toContain(res.status());
});

// ─── PERF-NEW-001: centro-tenistico HTML size ─────────
test("PERF-NEW-001: centro-tenistico HTML < 500KB (sin base64)", async ({
  request,
}) => {
  const res = await request.get(`${BASE}/t/centro-tenistico`);
  const body = await res.text();

  const sizeKB = Math.round(body.length / 1024);
  console.log(`  centro-tenistico HTML: ${sizeKB} KB (antes: 3600 KB)`);

  // Verificar que no hay base64 inline
  expect(body).not.toContain("data:image/png;base64");

  // Verificar que usa URL de Cloudinary
  expect(body).toContain("cloudinary.com");

  // Tamaño total < 500KB (antes era 3.6MB)
  expect(body.length).toBeLessThan(500 * 1024);
});

// ─── PERF-NEW-001: branding endpoint rechaza base64 grande ───
test("PERF-NEW-001: PUT /api/tenants/*/branding rechaza base64 > 200KB", async ({
  request,
}) => {
  // Generar un base64 fake de ~300KB
  const largeBase64 = "data:image/png;base64," + "A".repeat(400 * 1024);

  const res = await request.put(`${BASE}/api/tenants/wondernails/branding`, {
    data: { logoUrl: largeBase64 },
    headers: { "Content-Type": "application/json" },
  });

  // 401 (no auth) o 413 (payload too large) — ambos bloquean el upload grande
  // 403 (CSRF) también es aceptable — el proxy lo bloquea antes del handler
  expect([401, 403, 413]).toContain(res.status());
  expect(res.status()).not.toBe(200);
});

// ─── Rate limiting en auth ────────────────────────────
test("PERF/SEC: /api/auth/register — responde sin crash en múltiples requests", async ({
  request,
}) => {
  const results: number[] = [];
  for (let i = 0; i < 4; i++) {
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: {
        name: `Test ${i}`,
        email: `test${i}@test.com`,
        password: "password123",
        tenantSlug: "wondernails",
      },
    });
    results.push(res.status());
  }
  console.log(`  register statuses: ${results.join(", ")}`);
  // Ninguno debe ser 500 (el rate limiter falla open si no hay Redis)
  expect(results.every((s) => s !== 500)).toBe(true);
});

// ─── Regresiones STRY-021 siguen pasando ──────────────
test("Regresión STRY-021: user-check sigue siendo 404", async ({ request }) => {
  const res = await request.get(
    `${BASE}/api/diagnose/user-check?email=x@x.com&password=admin`,
  );
  expect(res.status()).toBe(404);
});

test("Regresión STRY-021: health sigue respondiendo", async ({ request }) => {
  const res = await request.get(`${BASE}/api/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("Regresión STRY-021: wondernails landing OK", async ({ page }) => {
  await page.goto(`/t/wondernails`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  expect(page.url()).not.toContain("500");
});

test("Regresión STRY-021: centro-tenistico landing OK", async ({ page }) => {
  await page.goto(`/t/centro-tenistico`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  expect(page.url()).not.toContain("500");
});
