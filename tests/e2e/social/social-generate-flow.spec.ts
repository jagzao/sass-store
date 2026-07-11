import { test, expect } from "@playwright/test";

test.describe("STRY-028 — Generación real con GLM-4.5-flash", () => {
  test.describe.configure({ mode: "serial" });

  test("SC-01: Generar contenido real desde wondernails", async ({ page }) => {
    await page.goto("http://localhost:3003/t/wondernails/social", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // Ir a pestaña Generar
    await page
      .getByRole("button", { name: /^🤖$|Generar/i })
      .first()
      .click();
    await page.waitForTimeout(1500);

    await expect(page.getByText("Generar Contenido con IA")).toBeVisible({
      timeout: 10000,
    });

    // Reducir frecuencia y rango para que GLM responda rápido
    await page.getByRole("spinbutton", { name: /Posts por semana/i }).fill("1");
    await page.getByRole("spinbutton", { name: /Reels por semana/i }).fill("0");
    await page
      .getByRole("spinbutton", { name: /Stories por semana/i })
      .fill("0");

    // Fecha fin a 7 días para generar solo 1 post
    const today = new Date();
    const weekLater = new Date(today.getTime() + 7 * 86400000);
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    await page.getByRole("textbox", { name: "Hasta" }).fill(fmt(weekLater));

    // Contexto del negocio
    await page
      .getByPlaceholder(/Describe tu negocio/i)
      .fill("Salón de uñas en Mérida. Manicura y pedicura.");

    // Click generar
    const generateBtn = page
      .getByRole("button", { name: /Generar \d+ publicaciones/i })
      .first();
    await generateBtn.click();

    // Esperar preview (GLM tarda 30-90s)
    await expect(page.getByText(/Vista previa/i)).toBeVisible({
      timeout: 180000,
    });

    // Verificar posts generados
    const postCards = await page.locator(".border.rounded-lg.p-4").count();
    expect(postCards).toBeGreaterThan(0);

    // Verificar contenido no vacío
    const firstContent = await page
      .locator(".border.rounded-lg.p-4")
      .first()
      .locator("p")
      .last()
      .innerText();
    expect(firstContent.length).toBeGreaterThan(10);

    console.log("Posts generados:", postCards);
    console.log("Primer post:", firstContent.substring(0, 120));
  });

  test("SC-04: Error amigable cuando n8n no responde", async ({ page }) => {
    // Mock: simular n8n caído
    await page.route("**/api/v1/social/generate", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            message: "Servicio de generación no disponible. Intenta más tarde.",
            type: "NetworkError",
          },
        }),
      }),
    );

    await page.goto("http://localhost:3003/t/wondernails/social", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page
      .getByRole("button", { name: /^🤖$|Generar/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    const btn = page
      .getByRole("button", { name: /Generar \d+ publicaciones/i })
      .first();
    await btn.click();
    await page.waitForTimeout(2000);

    await expect(
      page.getByText(/Servicio de generación no disponible/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("SC-03: Mix inválido bloquea botón generar", async ({ page }) => {
    await page.goto("http://localhost:3003/t/wondernails/social", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    await page
      .getByRole("button", { name: /^🤖$|Generar/i })
      .first()
      .click();
    await page.waitForTimeout(1000);

    // Mover slider de promociones a 0
    const slider = page.locator('input[type="range"]').first();
    await slider.focus();
    await slider.press("Home");
    await page.waitForTimeout(500);

    // Validar mensaje y botón deshabilitado
    await expect(page.getByText(/El total debe sumar 100%/i)).toBeVisible();

    const btn = page
      .getByRole("button", { name: /Generar \d+ publicaciones/i })
      .first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(btn).toBeDisabled();
    }
  });
});
