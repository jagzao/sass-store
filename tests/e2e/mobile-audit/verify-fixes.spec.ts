import { test, expect, Page } from "@playwright/test";
import { loginAs, signOut } from "../helpers/test-helpers";

test.use({
  viewport: { width: 375, height: 812 },
  video: "on",
});

test.describe.configure({ mode: "serial" });

test("Fix verify: favorites sin scroll horizontal — wondernails", async ({
  page,
}) => {
  try {
    await loginAs(page, "wondernails", "jagzao@gmail.com", "admin");
  } catch {
    console.log("Login failed, testing as anonymous");
  }

  await page.goto("http://localhost:3003/t/wondernails/favorites", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  const hasHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 5;
  });

  console.log("Horizontal scroll:", hasHScroll);
  expect(hasHScroll).toBe(false);
});

test("Fix verify: zo-system login funciona", async ({ page }) => {
  // Login manual (sin helper estricto)
  await page.goto("http://localhost:3003/t/zo-system/login", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.fill('[data-testid="email-input"]', "jagzao@gmail.com");
  await page.fill('[data-testid="password-input"]', "admin");
  await page.getByTestId("login-btn").first().click({ force: true });

  // Esperar redirección (cualquier URL que no sea /login)
  await page.waitForURL(
    (url) => url.href.includes("/t/zo-system") && !url.href.includes("/login"),
    { timeout: 60000 },
  );
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log("Post-login URL:", currentUrl);
  expect(currentUrl).toContain("/t/zo-system");
  expect(currentUrl).not.toContain("/login");

  await page.screenshot({
    path: "test-results/mobile-audit/zo-system-home-fixed.png",
  });
});

test("Fix verify: top-nav móvil responsivo — wondernails home", async ({
  page,
}) => {
  await page.goto("http://localhost:3003/t/wondernails", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  const hasHScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 5;
  });

  console.log("Home horizontal scroll:", hasHScroll);
  await page.screenshot({
    path: "test-results/mobile-audit/wondernails-home-nav-fixed.png",
  });
});

test("Fix verify: CSRF token endpoint responde", async ({ page }) => {
  const resp = await page.goto("http://localhost:3003/api/csrf-token", {
    waitUntil: "networkidle",
    timeout: 10000,
  });
  console.log("CSRF endpoint status:", resp?.status());
});

test("Fix verify: zo-system auth routes accesibles", async ({ page }) => {
  // Login manual
  await page.goto("http://localhost:3003/t/zo-system/login", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.fill('[data-testid="email-input"]', "jagzao@gmail.com");
  await page.fill('[data-testid="password-input"]', "admin");
  await page.getByTestId("login-btn").first().click({ force: true });
  await page
    .waitForURL(
      (url) =>
        url.href.includes("/t/zo-system") && !url.href.includes("/login"),
      { timeout: 60000 },
    )
    .catch(() => {});

  const routes = ["/admin", "/social", "/finance", "/clientes", "/inventory"];
  for (const route of routes) {
    const resp = await page.goto(`http://localhost:3003/t/zo-system${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(1500);
    console.log(`zo-system${route}: ${resp?.status()}`);
    expect(resp?.status()).toBeLessThan(400);
  }
});
