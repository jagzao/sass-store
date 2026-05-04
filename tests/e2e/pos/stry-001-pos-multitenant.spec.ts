import { expect, test } from "@playwright/test";

/**
 * STRY-001 — POS robusto + E2E multitenant (activos: wondernails, centro-tenistico).
 * Credencial estándar repo: jagzao@gmail.com / admin
 * @see .agents/sprint/STRY-001-pos-robusto-e2e/testing-usuario.md
 */
const STRY_001_TENANTS = ["wondernails", "centro-tenistico"] as const;

const ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || "jagzao@gmail.com",
  password: process.env.TEST_ADMIN_PASSWORD || "admin",
};

async function loginJagzao(
  page: import("@playwright/test").Page,
  tenantSlug: string,
) {
  await page.goto(`/t/${tenantSlug}/login`, { timeout: 60000 });
  const emailInput = page.getByTestId("email-input").first();
  await expect(emailInput).toBeVisible({ timeout: 30000 });
  await emailInput.fill(ADMIN.email);
  await page.locator('input[type="password"]').first().fill(ADMIN.password);
  await page.getByTestId("login-btn").first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30000,
  });
}

test.describe("STRY-001 pos-robusto", () => {
  /** Evita dos `seed-e2e` en paralelo (mismo proceso / DB) cuando hay varios workers. */
  test.describe.configure({ mode: "serial" });

  for (const tenantSlug of STRY_001_TENANTS) {
    test.describe(`tenant ${tenantSlug}`, () => {
      test.beforeAll(async ({ request }) => {
        const res = await request.post("/api/debug/seed-e2e", {
          data: { tenantSlug },
          timeout: 120_000,
        });
        expect(
          res.ok(),
          `seed-e2e failed for ${tenantSlug}: ${res.status()} ${await res.text()}`,
        ).toBeTruthy();
      });

      test(`D0: /t/{slug}/login loads form (canonical URL)`, async ({
        page,
      }) => {
        const started = Date.now();
        await page.goto(`/t/${tenantSlug}/login`, { timeout: 60000 });
        await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}/login`));
        await expect(page.getByTestId("email-input").first()).toBeVisible({
          timeout: 15000,
        });
        // LoginForm tiene su propio h2; la página también — evitar strict mode.
        await expect(
          page.getByRole("heading", { name: "Inicia sesión en tu cuenta" }),
        ).toBeVisible();
        expect(Date.now() - started).toBeLessThan(20000);
      });

      test(`D1: /t/{slug}/book loads (public navigation)`, async ({ page }) => {
        await page.goto(`/t/${tenantSlug}/book`, { timeout: 60000 });
        await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}/book`));
        await expect(
          page
            .getByText(/servicios|reserva|min|productos disponibles/i)
            .first(),
        ).toBeVisible({ timeout: 20000 });
      });

      test(`D2-D4: login → book → pos navigation`, async ({ page }) => {
        await loginJagzao(page, tenantSlug);
        await page.goto(`/t/${tenantSlug}/book`, { timeout: 60000 });
        await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}/book`));
        await expect(
          page
            .getByText(/servicios|reserva|min|productos disponibles/i)
            .first(),
        ).toBeVisible({ timeout: 20000 });
        await page.goto(`/t/${tenantSlug}/pos`, { timeout: 60000 });
        await page.waitForFunction(
          () => !document.body.innerText.includes("Cargando punto de venta"),
          { timeout: 20000 },
        );
        await expect(
          page.getByRole("heading", { name: "Punto de Venta" }),
        ).toBeVisible({ timeout: 15000 });
      });

      test(`E1: wrong password shows error; /pos still requires login`, async ({
        page,
      }) => {
        await page.context().clearCookies();
        await page.goto(`/t/${tenantSlug}/login`, { timeout: 60000 });
        await expect(page.getByTestId("email-input").first()).toBeVisible({
          timeout: 15000,
        });
        await page.getByTestId("email-input").first().fill(ADMIN.email);
        await page
          .getByTestId("password-input")
          .first()
          .fill("definitely-wrong-password-stry001-e1");
        await page.getByTestId("login-btn").first().click();
        await expect(page.getByTestId("error-message")).toBeVisible({
          timeout: 15000,
        });
        await expect(page.getByTestId("error-message")).toContainText(
          /Credenciales|no válidas|correo|contraseña/i,
        );
        await expect(page).toHaveURL(new RegExp(`/t/${tenantSlug}/login`));
        const body = await page.locator("body").innerText();
        expect(body).not.toMatch(/Application error|Unhandled Runtime Error/i);

        await page.goto(`/t/${tenantSlug}/pos`, { timeout: 60000 });
        await page.waitForURL(`**/t/${tenantSlug}/login**`, { timeout: 15000 });
      });

      test(`E2 / A: redirect to login when opening /pos without session`, async ({
        page,
      }) => {
        await page.context().clearCookies();
        await page.goto(`/t/${tenantSlug}/pos`);
        await page.waitForURL(`**/t/${tenantSlug}/login**`, { timeout: 15000 });
        await expect(page.locator('input[type="email"]')).toBeVisible();
      });

      test(`A: POS page loads after login (Punto de Venta)`, async ({
        page,
      }) => {
        await loginJagzao(page, tenantSlug);
        await page.goto(`/t/${tenantSlug}/pos`, { timeout: 60000 });
        await page.waitForFunction(
          () => !document.body.innerText.includes("Cargando punto de venta"),
          { timeout: 20000 },
        );
        await expect(
          page.getByRole("heading", { name: "Punto de Venta" }),
        ).toBeVisible({ timeout: 15000 });
      });

      test(`A: GET /api/finance/pos/terminals?tenant=… returns 200`, async ({
        page,
      }) => {
        await loginJagzao(page, tenantSlug);
        const res = await page.request.get(
          `/api/finance/pos/terminals?tenant=${encodeURIComponent(tenantSlug)}`,
        );
        expect(res.status(), `terminals API: ${await res.text()}`).toBe(200);
        const json = await res.json();
        expect(Array.isArray(json.data)).toBeTruthy();
      });

      test(`E3: terminals API — other tenant slug no data leak (403 or disjoint ids)`, async ({
        page,
      }) => {
        const otherSlug = STRY_001_TENANTS.find((s) => s !== tenantSlug);
        if (!otherSlug) throw new Error("STRY_001_TENANTS must have 2 slugs");
        await loginJagzao(page, tenantSlug);

        const ownRes = await page.request.get(
          `/api/finance/pos/terminals?tenant=${encodeURIComponent(tenantSlug)}`,
        );
        expect(ownRes.status(), await ownRes.text()).toBe(200);
        const ownJson = (await ownRes.json()) as { data?: { id: string }[] };
        const ownIds = new Set((ownJson.data ?? []).map((t) => t.id));

        const crossRes = await page.request.get(
          `/api/finance/pos/terminals?tenant=${encodeURIComponent(otherSlug)}`,
        );
        expect([200, 403]).toContain(crossRes.status());
        if (crossRes.status() === 403) return;

        const crossJson = (await crossRes.json()) as {
          data?: { id: string }[];
        };
        expect(Array.isArray(crossJson.data)).toBeTruthy();
        for (const row of crossJson.data ?? []) {
          expect(
            ownIds.has(row.id),
            `terminal id must not appear in both tenants: ${row.id}`,
          ).toBe(false);
        }
      });
    });
  }

  test.describe("STRY-001 CA-3", () => {
    test("terminals without auth returns 401", async ({ request }) => {
      const res = await request.get(
        "/api/finance/pos/terminals?tenant=wondernails",
      );
      expect(res.status()).toBe(401);
    });
  });
});
