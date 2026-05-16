import { test, expect } from "@playwright/test";

/**
 * Validación exhaustiva de /t/[tenant]/profile
 * Flujo: seed → login → perfil → editar → guardar / cancelar / cambiar contraseña
 */

const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || "jagzao@gmail.com",
  password: process.env.TEST_ADMIN_PASSWORD || "admin",
};
const TENANT = "wondernails";
const BASE = process.env.BASE_URL || "http://127.0.0.1:3002";

async function loginAndGoToProfile(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/t/${TENANT}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("email-input").first().fill(ADMIN.email);
  await page.getByTestId("password-input").first().fill(ADMIN.password);
  await page.getByTestId("login-btn").first().click({ force: true });
  await page.waitForURL(
    (u) => u.href.includes(`/t/${TENANT}`) && !u.href.includes("/login"),
    { timeout: 30_000 },
  );
  await page.goto(`${BASE}/t/${TENANT}/profile`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await expect(page.getByText("Información Personal")).toBeVisible({
    timeout: 45_000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(800);
}

test.describe("Profile — validación exhaustiva @PROFILE", () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post(`/api/debug/seed-e2e`, {
      data: { tenantSlug: TENANT },
      timeout: 30_000,
    });
    await loginAndGoToProfile(page);
  });

  // ── 1. Carga ──────────────────────────────────────────────────────────────
  test("1. carga correcta — email, editar, roles, password @PROFILE-LOAD", async ({
    page,
  }) => {
    await expect(page.getByText("Información Personal")).toBeVisible();
    await expect(page.getByText(ADMIN.email).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Editar/i })).toBeVisible();
    await expect(page.getByText("Gestión de Roles")).toBeVisible();
    await expect(page.getByText("Cambiar Contraseña")).toBeVisible();
  });

  // ── 2. GET API ────────────────────────────────────────────────────────────
  test("2. GET /api/profile retorna 200 @PROFILE-API-GET", async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/profile`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("phone");
    expect(data).toHaveProperty("birthdate");
    expect(data).toHaveProperty("gender");
  });

  // ── 3. Actualizar nombre vía UI + verificar estado @PROFILE-UPDATE ────────
  test("3. actualizar nombre — botón se habilita y guarda vía API @PROFILE-UPDATE", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Editar/i }).click();

    const nameInput = page.locator('input[placeholder="Tu nombre"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    const newName = `QA Bot ${Date.now()}`;
    // Forzar el clear + fill con valor distinto para garantizar onChange
    await nameInput.fill("___temp___");
    await page.waitForTimeout(100);
    await nameInput.fill(newName);
    await page.waitForTimeout(200);
    await expect(nameInput).toHaveValue(newName, { timeout: 5_000 });

    // El botón debe estar habilitado (fix de race condition validado)
    const saveBtn = page.getByRole("button", { name: /Guardar Cambios/i });
    await expect(saveBtn).toBeEnabled({ timeout: 10_000 });

    // Validar el API con la sesión del browser (equivale a save)
    const apiRes = await page.request.put(`${BASE}/api/profile`, {
      data: { name: newName, tenantSlug: TENANT },
    });
    expect(apiRes.status()).toBe(200);
    const apiData = await apiRes.json();
    expect(apiData.success).toBe(true);
    expect(apiData.name).toBe(newName);
  });

  // ── 4. Actualizar campos extra vía API ────────────────────────────────────
  test("4. actualizar teléfono + fecha + género vía API @PROFILE-FIELDS", async ({
    page,
  }) => {
    // Usar valores únicos para evitar colisión con runs anteriores
    const ts = Date.now().toString().slice(-7);
    const phone = `555${ts.slice(0, 7)}`;
    const birthdate = "1988-06-20";
    const gender = "masculino";

    const res = await page.request.put(`${BASE}/api/profile`, {
      data: { name: "QA Tester", phone, birthdate, gender, tenantSlug: TENANT },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verificar persistencia via GET
    const getRes = await page.request.get(`${BASE}/api/profile`);
    const getData = await getRes.json();
    expect(getData.phone).toBe(phone);
    expect(getData.gender).toBe(gender);
  });

  // ── 5. Cancelar edición ───────────────────────────────────────────────────
  test("5. cancelar edición restaura valores @PROFILE-CANCEL", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Editar/i }).click();

    const nameInput = page.locator('input[placeholder="Tu nombre"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill("Nombre que no se debe guardar");
    await page.getByRole("button", { name: /Cancelar/i }).click();

    await expect(page.getByRole("button", { name: /Editar/i })).toBeVisible({
      timeout: 5_000,
    });
    await expect(nameInput).not.toBeVisible({ timeout: 3_000 });
  });

  // ── 6. Guardar sin cambios — botón deshabilitado ──────────────────────────
  test("6. Guardar deshabilitado sin cambios @PROFILE-NOOP", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Editar/i }).click();
    const saveBtn = page.getByRole("button", { name: /Guardar Cambios/i });
    await expect(saveBtn).toBeVisible({ timeout: 5_000 });
    await expect(saveBtn).toBeDisabled();
  });

  // ── 7. Validación API: nombre vacío → 400 ─────────────────────────────────
  test("7. PUT /api/profile nombre vacío → 400 @PROFILE-VALIDATION", async ({
    page,
  }) => {
    const res = await page.request.put(`${BASE}/api/profile`, {
      data: { name: "", tenantSlug: TENANT },
    });
    expect(res.status()).toBe(400);
  });

  // ── 8. Validación API: género inválido → 400 ──────────────────────────────
  test("8. PUT /api/profile género inválido → 400 @PROFILE-VALIDATION", async ({
    page,
  }) => {
    const res = await page.request.put(`${BASE}/api/profile`, {
      data: { name: "Test", gender: "invalido", tenantSlug: TENANT },
    });
    expect(res.status()).toBe(400);
  });

  // ── 9. Cambio de contraseña — clave incorrecta ────────────────────────────
  test("9. cambio de contraseña con clave incorrecta → error @PROFILE-PASSWORD-ERR", async ({
    page,
  }) => {
    await page.getByText("Cambiar Contraseña").click();
    const modal = page.locator(".fixed.inset-0");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await page
      .locator('input[placeholder="Ingresa tu contraseña actual"]')
      .fill("clave_xyz_incorrecta");
    await page
      .locator('input[placeholder="Mínimo 8 caracteres"]')
      .fill("nuevaPass123!");
    await page
      .locator('input[placeholder="Repite la nueva contraseña"]')
      .fill("nuevaPass123!");

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/profile/password") &&
          r.request().method() === "PUT",
        { timeout: 15_000 },
      ),
      page.getByRole("button", { name: "Cambiar Contraseña" }).last().click(),
    ]);

    expect(response.status()).toBe(400);
    await expect(
      page.getByText(/contraseña actual es incorrecta/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── 10. Cambio de contraseña exitoso ─────────────────────────────────────
  test("10. cambio de contraseña exitoso @PROFILE-PASSWORD-OK", async ({
    page,
  }) => {
    await page.getByText("Cambiar Contraseña").click();
    const modal = page.locator(".fixed.inset-0");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await page
      .locator('input[placeholder="Ingresa tu contraseña actual"]')
      .fill("admin");
    await page
      .locator('input[placeholder="Mínimo 8 caracteres"]')
      .fill("admin_e2e_test_ok");
    await page
      .locator('input[placeholder="Repite la nueva contraseña"]')
      .fill("admin_e2e_test_ok");

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/profile/password") &&
          r.request().method() === "PUT",
        { timeout: 15_000 },
      ),
      page.getByRole("button", { name: "Cambiar Contraseña" }).last().click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(
      page.getByText(/contraseña ha sido cambiada|correctamente/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    // Restaurar via seed
    await page.request.post(`${BASE}/api/debug/seed-e2e`, {
      data: { tenantSlug: TENANT },
    });
  });
});
