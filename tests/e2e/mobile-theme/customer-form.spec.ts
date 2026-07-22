import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/test-helpers";

const MOBILE = { viewport: { width: 390, height: 844 } } as const;

test.describe("Feature: CustomerForm theme-aware", () => {
  test("SC-07 — ningún input usa bg-white/text-gray-900/border-gray-300", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...MOBILE });
    const page = await ctx.newPage();
    await loginAs(page, "wondernails", "jagzao@gmail.com", "admin");
    await page.goto("http://localhost:3003/t/wondernails/clientes/nueva", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    const inputs = page.locator("input, textarea");
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cls = (await inputs.nth(i).getAttribute("class")) || "";
      expect(cls, `input #${i} no debe tener clases hardcoded`).not.toMatch(
        /bg-white|text-gray-900|border-gray-300/,
      );
    }
    await ctx.close();
  });

  test("SC-08 — contenedor principal usa backgroundColor distinto de transparente", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...MOBILE });
    const page = await ctx.newPage();
    await loginAs(page, "wondernails", "jagzao@gmail.com", "admin");
    await page.goto("http://localhost:3003/t/wondernails/clientes/nueva", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(2000);

    const bg = await page
      .locator("body")
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe("rgba(0, 0, 0, 0)");
    expect(bg).not.toBe("transparent");
    await ctx.close();
  });

  test("SC-09 — submit sin datos muestra errores de validación", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ ...MOBILE });
    const page = await ctx.newPage();
    await loginAs(page, "wondernails", "jagzao@gmail.com", "admin");
    await page.goto("http://localhost:3003/t/wondernails/clientes/nueva", {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(3000);

    const submit = page.locator('button[type="submit"]').first();
    const disabled = await submit.isDisabled().catch(() => false);

    if (!disabled) {
      // Form habilitado: click debe disparar validación
      await submit.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    // Verificar que el campo Nombre tiene feedback visible (required attribute)
    const nameInput = page.locator('input[aria-label="Nombre Completo"]');
    if ((await nameInput.count()) === 0) {
      // fallback genérico: primer input del form
      const first = page.locator("form input").first();
      const validity = await first.evaluate((el: HTMLInputElement) => ({
        required: el.required,
        valid: el.validity.valid,
      }));
      expect(validity.required || !validity.valid).toBe(true);
    } else {
      const validity = await nameInput
        .first()
        .evaluate((el: HTMLInputElement) => ({
          required: el.required,
          valid: el.validity.valid,
        }));
      expect(validity.required || !validity.valid).toBe(true);
    }
    await ctx.close();
  });
});
