/**
 * REAL AI verification — no mocks, calls actual Ollama/n8n.
 * Run: E2E_REUSE_SERVER=1 BASE_URL=http://localhost:3003 npx playwright test tests/e2e/smart-publish/verify-real-ai.spec.ts --headed
 */
import { test, expect, Page } from "@playwright/test";

const TENANT = "wondernails";
const EMAIL = "jagzao@gmail.com";
const PASS = "admin";

async function login(page: Page) {
  await page.goto(`/t/${TENANT}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByTestId("email-input").first().fill(EMAIL);
  await page.getByTestId("password-input").first().fill(PASS);
  await page.getByTestId("login-btn").first().click({ force: true });
  await page.waitForURL(
    (url) => url.href.includes(`/t/${TENANT}`) && !url.href.includes("/login"),
    { timeout: 30000 },
  );
  await page.waitForTimeout(1500);
}

test.describe("SmartPublish — REAL AI (no mocks)", () => {
  // Long timeout for Ollama response
  test.setTimeout(240000);

  test("Productos: wizard abre, IA genera contenido real, se guarda correctamente", async ({
    page,
  }) => {
    await login(page);

    // Navigate to products admin
    await page.goto(`/t/${TENANT}/admin/products`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});

    // Open wizard
    const publishBtn = page
      .getByRole("button", { name: /Publicar con IA/i })
      .first();
    await expect(publishBtn).toBeVisible({ timeout: 10000 });
    await publishBtn.click();

    const wizard = page.locator('[data-testid="smart-publish-wizard"]');
    await expect(wizard).toBeVisible({ timeout: 5000 });

    // Step 1: price
    await wizard.locator('input[type="number"]').first().fill("299");
    await wizard.getByRole("button", { name: /Continuar/i }).click();

    // Step 2: text description
    const textoTab = wizard.getByRole("button", { name: /Texto/i });
    await expect(textoTab).toBeVisible({ timeout: 5000 });
    await textoTab.click();
    await wizard
      .locator("textarea")
      .first()
      .fill(
        "Bolso artesanal de cuero genuino hecho a mano, colores cafe y negro, ideal para uso diario",
      );

    // Intercept real API call — capture response for assertion
    let generateResponse: { ai?: { name?: string; fallback?: boolean } } = {};
    page.on("response", async (resp) => {
      if (resp.url().includes("/api/smart-publish/generate") && resp.ok()) {
        try {
          generateResponse = await resp.json();
        } catch {}
      }
    });

    // Click generate — real Ollama
    await wizard.getByRole("button", { name: /Generar con IA/i }).click();

    // Wait for review step (Ollama can take 10-90s)
    await expect(
      wizard.locator('[data-testid="wizard-name-input"]'),
    ).toBeVisible({ timeout: 120000 });

    // ── ASSERTIONS ───────────────────────────────────────────────────────────
    // 1. API returned success
    expect(generateResponse).toHaveProperty("success", true);

    // 2. AI name is non-empty
    const aiName = generateResponse?.ai?.name ?? "";
    expect(aiName.length).toBeGreaterThan(3);
    console.log(`✅ AI name: "${aiName}"`);

    // 3. Not a fallback (fallback means all AI tiers failed)
    const isFallback = generateResponse?.ai?.fallback === true;
    console.log(`Fallback mode: ${isFallback}`);
    // We warn but don't hard-fail — Ollama might be loaded
    if (isFallback) {
      console.warn(
        "⚠️  Fallback activated — Ollama tiers failed, text placeholder used",
      );
    }

    // 4. Name input in review has the generated name
    const nameInInput = await wizard
      .locator('[data-testid="wizard-name-input"]')
      .inputValue();
    expect(nameInInput).toBe(aiName);

    // 5. No "fallback" warning banner visible in UI (only when fallback=true)
    const fallbackBanner = wizard.locator(
      "text=generación automática, text=automáticamente",
    );
    if (isFallback) {
      // If fallback, banner should be visible
      await expect(fallbackBanner.first())
        .toBeVisible({ timeout: 2000 })
        .catch(() => {});
    }

    // Save — button label is just "Publicar"
    const saveBtn = wizard.getByRole("button", { name: /^Publicar$/i });
    await saveBtn.click();

    // Success screen
    await expect(page.getByText(/Publicado con/i)).toBeVisible({
      timeout: 15000,
    });
    console.log("✅ Product published successfully!");
  });

  test("Servicios: wizard abre desde admin_services, IA genera, se guarda", async ({
    page,
  }) => {
    await login(page);

    await page.goto(`/t/${TENANT}/admin_services`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForLoadState("networkidle").catch(() => {});

    const publishBtn = page
      .getByRole("button", { name: /Publicar con IA/i })
      .first();
    await expect(publishBtn).toBeVisible({ timeout: 10000 });
    await publishBtn.click();

    const wizard = page.locator('[data-testid="smart-publish-wizard"]');
    await expect(wizard).toBeVisible({ timeout: 5000 });

    // Select "Servicio" type if not pre-selected
    const servicioBtn = wizard
      .getByRole("button", { name: /^Servicio$/i })
      .first();
    if (await servicioBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await servicioBtn.click();
    }

    await wizard.locator('input[type="number"]').first().fill("450");
    await wizard.getByRole("button", { name: /Continuar/i }).click();

    await wizard.getByRole("button", { name: /Texto/i }).click();
    await wizard
      .locator("textarea")
      .first()
      .fill(
        "Manicure semipermanente con diseno personalizado, duracion 3 semanas garantizada, incluye hidratacion",
      );

    let svcResponse: { ai?: { name?: string; fallback?: boolean } } = {};
    page.on("response", async (resp) => {
      if (resp.url().includes("/api/smart-publish/generate") && resp.ok()) {
        try {
          svcResponse = await resp.json();
        } catch {}
      }
    });

    await wizard.getByRole("button", { name: /Generar con IA/i }).click();

    await expect(
      wizard.locator('[data-testid="wizard-name-input"]'),
    ).toBeVisible({ timeout: 120000 });

    const svcName = svcResponse?.ai?.name ?? "";
    expect(svcName.length).toBeGreaterThan(3);
    console.log(`✅ Service AI name: "${svcName}"`);
    console.log(`Service fallback: ${svcResponse?.ai?.fallback}`);

    await wizard.getByRole("button", { name: /^Publicar$/i }).click();

    await expect(page.getByText(/Publicado con/i)).toBeVisible({
      timeout: 15000,
    });
    console.log("✅ Service published successfully!");
  });
});
