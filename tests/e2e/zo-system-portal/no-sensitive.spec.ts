import { test, expect } from "@playwright/test";

test.describe("Feature: privacidad de contenido público zo-system", () => {
  test("SC-13 — contenido sensible ausente en páginas públicas", async ({
    page,
  }) => {
    await page.goto("/t/zo-system", { waitUntil: "domcontentloaded" });
    const homeText = (await page.locator("body").textContent()) ?? "";

    await page.goto("/t/zo-system/services", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const servicesText = (await page.locator("body").textContent()) ?? "";

    const combined = homeText + " " + servicesText;
    const forbidden = ["RFC", "CURP", "salario", "contractor", "CONFIDENCIAL"];
    for (const term of forbidden) {
      expect(combined, `no debería contener "${term}"`).not.toContain(term);
    }
  });

  test("SC-14 — proyectos sin etiquetas NDA/confidencial", async ({ page }) => {
    await page.goto("/t/zo-system", { waitUntil: "domcontentloaded" });
    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).not.toContain("cliente confidencial");
    expect(text).not.toContain("bajo NDA");
  });
});
