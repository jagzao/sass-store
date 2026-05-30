/**
 * Debug: Login directo paso a paso
 */
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3003";

test("debug: login completo con credenciales admin", async ({ page }) => {
  test.setTimeout(90000);

  const authResponses: string[] = [];
  const jsErrors: string[] = [];
  const consoleLogs: string[] = [];

  page.on("response", (r) => {
    if (r.url().includes("/auth")) {
      authResponses.push(
        `${r.request().method()} ${r.url().replace(BASE, "")} → ${r.status()}`,
      );
    }
  });
  page.on("pageerror", (err) => jsErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error")
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto(`${BASE}/t/wondernails/login`);
  await page.waitForLoadState("networkidle");

  // Esperar React hydration: React attaches __reactFiber keys after hydration
  await page
    .waitForFunction(
      () => {
        const form = document.querySelector("form");
        if (!form) return false;
        // React 18 usa __reactFiber$... con un suffix
        const reactKeys = Object.keys(form).filter(
          (k) =>
            k.startsWith("__reactFiber") || k.startsWith("__reactInternals"),
        );
        return reactKeys.length > 0;
      },
      { timeout: 30000 },
    )
    .catch(async () => {
      console.log("React fiber check failed - trying alternative");
    });

  // Extra wait para que React termine de hidratar completamente
  await page.waitForTimeout(2000);
  console.log("URL inicial:", page.url());

  // Verificar que el formulario tiene React adjunto
  const hasReactFiber = await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return false;
    const keys = Object.keys(form);
    const reactKey = keys.find(
      (k) => k.startsWith("__reactFiber") || k.startsWith("__reactInternals"),
    );
    return {
      hasReact: !!reactKey,
      key: reactKey || "none",
      allKeys: keys.slice(0, 5),
    };
  });
  console.log("React fiber on form:", JSON.stringify(hasReactFiber));

  const emailInput = page.getByTestId("email-input").first();
  const passInput = page.getByTestId("password-input").first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Usar page.fill con selector CSS — como lo hace el test que funcionó
  await page.fill('[data-testid="email-input"]', "jagzao@gmail.com");
  await page.fill('[data-testid="password-input"]', "admin");

  const emailValue = await emailInput.inputValue();
  const passValue = await passInput.inputValue();
  console.log("Email value:", emailValue);
  console.log("Pass filled:", passValue.length > 0 ? "✓" : "EMPTY!");

  // Click normal sin force
  await page.getByTestId("login-btn").first().click();
  console.log("Clicked login-btn (page.fill + click without force)");

  // Esperar hasta 20s
  await page.waitForTimeout(5000);
  console.log("URL after 5s:", page.url());
  console.log("Auth responses:", authResponses);
  console.log("JS errors:", jsErrors.length ? jsErrors : "none");
  console.log("Console errors:", consoleLogs.length ? consoleLogs : "none");

  const hasError = await page
    .locator('[data-testid="error-message"]')
    .isVisible()
    .catch(() => false);
  if (hasError) {
    console.log(
      "Error:",
      await page.locator('[data-testid="error-message"]').textContent(),
    );
  } else {
    console.log("No error message visible");
  }

  await page
    .waitForURL((url) => !url.href.includes("/login"), { timeout: 20000 })
    .catch(() => {
      console.log("No redirect happened. Final URL:", page.url());
    });

  console.log("FINAL URL:", page.url());
  const isLoggedIn = !page.url().includes("/login");
  console.log("Login success:", isLoggedIn);

  expect(isLoggedIn).toBe(true);
});
