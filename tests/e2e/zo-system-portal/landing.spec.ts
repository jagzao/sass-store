import { test, expect } from "@playwright/test";

test.describe("Feature: zo-system landing portal", () => {
  test("SC-02 — ruta /t/zo-system/development resuelve sin 500", async ({
    page,
  }) => {
    const response = await page.goto("/t/zo-system/development", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(500);
  });

  test("SC-03 — home muestra stack tecnológico (.NET 8, Next.js, Python, n8n)", async ({
    page,
  }) => {
    await page.goto("/t/zo-system", { waitUntil: "domcontentloaded" });
    const text = (await page.locator("body").textContent()) ?? "";
    expect(text).toContain(".NET");
    expect(text).toContain("Next.js");
    expect(text).toContain("Python");
    expect(text).toContain("n8n");
  });

  test("SC-04 — home incluye CTAs a /services y /development", async ({
    page,
  }) => {
    await page.goto("/t/zo-system", { waitUntil: "domcontentloaded" });
    const servicesLink = page
      .locator('a[href="/t/zo-system/services"]')
      .first();
    const devLink = page.locator('a[href="/t/zo-system/development"]').first();
    await expect(servicesLink).toBeVisible();
    await expect(devLink).toBeVisible();
  });

  test("SC-05 — placeholders ausentes y proyectos reales presentes", async ({
    page,
  }) => {
    await page.goto("/t/zo-system", { waitUntil: "domcontentloaded" });
    const html = await page.content();
    expect(html).not.toContain("EcoSmart Dashboard");
    expect(html).not.toContain("FinTech Vault");
    const hasRealProject = ["sass-store", "Saloneo", "Whisper"].some((p) =>
      new RegExp(p, "i").test(html),
    );
    expect(hasRealProject).toBe(true);
  });
});
