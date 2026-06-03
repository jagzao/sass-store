import { test, expect, Page } from "@playwright/test";

const TENANT = "wondernails";
const EMAIL = "jagzao@gmail.com";
const PASSWORD = "admin";

async function login(page: Page) {
  await page.goto(`/t/${TENANT}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await expect(page.locator('input[name="email"]').first()).toBeVisible({
    timeout: 30000,
  });
  await page.locator('input[name="email"]').first().fill(EMAIL);
  await page.locator('input[name="password"]').first().fill(PASSWORD);
  await page
    .locator("form")
    .first()
    .evaluate((form: HTMLFormElement) => form.requestSubmit());
  await expect(page.locator("header")).toContainText(
    /Hola|Bienvenido|Dashboard|Productos|Servicios/i,
    { timeout: 30000 },
  );
}

test.describe("Quality Dashboard (/admin/quality)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders quality page and title", async ({ page }) => {
    await page.goto(`/admin/quality`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(
      page.getByRole("heading", { name: /Panel de Calidad/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("displays score metrics cards", async ({ page }) => {
    await page.goto(`/admin/quality`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await expect(page.locator("text=Quality Score")).toBeVisible();
    await expect(page.locator("text=Documentación")).toBeVisible();
    await expect(page.locator("text=Agent Contract")).toBeVisible();
    await expect(page.locator("text=Archivos de Tests")).toBeVisible();
  });

  test("shows findings table", async ({ page }) => {
    await page.goto(`/admin/quality`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const table = page.locator("table");
    await expect(table).toBeVisible();
    const headers = ["Severidad", "Categoría", "Mensaje"];
    for (const h of headers) {
      await expect(table.locator("th", { hasText: h })).toBeVisible();
    }
  });

  test("no unexpected console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    await page.goto(`/admin/quality`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    // Filter out noise we cannot control (e.g. third-party fonts, hydration mismatch)
    const relevant = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("chunk") &&
        !e.includes("_next") &&
        !e.includes("resource") &&
        !e.includes("404"),
    );
    expect(relevant).toHaveLength(0);
  });
});
