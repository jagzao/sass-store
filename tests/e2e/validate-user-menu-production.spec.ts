import { test, expect } from "@playwright/test";

const PROD_URL = "https://sass-store-web.vercel.app";
const CREDENTIALS = { email: "jagzao@gmail.com", password: "admin" };

const TENANTS = [
  { slug: "wondernails", expectedDark: false },
  { slug: "zo-system", expectedDark: true },
];

async function login(
  page: import("@playwright/test").Page,
  tenantSlug: string,
) {
  await page.goto(`${PROD_URL}/t/${tenantSlug}/login`, {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle").catch(() => {});

  const emailInput = page.getByTestId("email-input").first();
  await expect(emailInput).toBeVisible({ timeout: 60000 });

  await page.fill('[data-testid="email-input"]', CREDENTIALS.email);
  await page.fill('[data-testid="password-input"]', CREDENTIALS.password);
  await page.getByTestId("login-btn").first().click();

  await page.waitForURL(
    (url) =>
      url.href.includes(`${PROD_URL}/t/${tenantSlug}`) &&
      !url.href.includes("/login"),
    { timeout: 60000 },
  );
}

function luminance(rgb: string): number {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 1;
  const [r, g, b] = match.slice(1, 4).map((v) => Number(v) / 255);
  const a = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

for (const { slug, expectedDark } of TENANTS) {
  test(`validate user menu theme on production for ${slug}`, async ({
    page,
  }) => {
    await login(page, slug);
    await page.goto(`${PROD_URL}/t/${slug}/admin`);
    const trigger = page.locator("#user-menu-button").first();
    await expect(trigger).toBeVisible({ timeout: 15000 });
    await trigger.click();
    const menu = page.locator('[role="menu"]').first();
    await expect(menu).toBeVisible({ timeout: 5000 });
    const bg = await menu.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const isDark = luminance(bg) < 0.5;
    expect(
      isDark,
      `menu for ${slug} should be ${expectedDark ? "dark" : "light"} (got ${bg})`,
    ).toBe(expectedDark);
  });
}
