import { test, expect } from "@playwright/test";

test.describe("Feature: catálogo de servicios zo-system", () => {
  test("SC-06 — los 6 servicios reales están presentes en /services", async ({
    page,
  }) => {
    await page.goto("/t/zo-system/services", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const text = (await page.locator("body").textContent()) ?? "";
    const wanted = [
      "SaaS",
      "Modernización",
      "API y backend",
      "Bug fix",
      "Automatización",
      "Auditoría",
    ];
    for (const w of wanted) {
      expect(text, `esperaba encontrar "${w}"`).toContain(w);
    }
  });
});
