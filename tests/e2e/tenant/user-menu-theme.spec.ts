import { test, expect } from "@playwright/test";
import { loginAs, TEST_CREDENTIALS } from "../helpers/test-helpers";

/**
 * SC-01 a SC-05: Menú de usuario adaptado a la paleta del tenant
 * Verifica colores derivados del tenant, legibilidad, hover/active y responsive.
 */

const TENANTS = [
  { slug: "wondernails", label: "paleta clara", mode: "light" as const },
  { slug: "centro-tenistico", label: "paleta oscura", mode: "dark" as const },
  { slug: "zo-system", label: "paleta oscura", mode: "dark" as const },
] as const;

async function openUserMenu(page: import("@playwright/test").Page) {
  const trigger = page.locator("#user-menu-button").first();
  await expect(trigger).toBeVisible({ timeout: 10000 });
  await trigger.click();
  const menu = page.locator('[role="menu"]').first();
  await expect(menu).toBeVisible({ timeout: 5000 });
  await expect(menu.locator("role=menuitem").first()).toBeVisible({
    timeout: 5000,
  });
  return menu;
}

function parseColor(rgb: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 255, g: 255, b: 255, a: 1 };
  const [r, g, b] = match.slice(1, 4).map(Number);
  const a = match[4] ? parseFloat(match[4]) : 1;
  return { r, g, b, a };
}

function luminance(rgb: string): number {
  const { r, g, b } = parseColor(rgb);
  const a = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function compositeColor(overlay: string, base: string): string {
  const o = parseColor(overlay);
  const b = parseColor(base);
  const alpha = o.a;
  const r = Math.round(o.r * alpha + b.r * (1 - alpha));
  const g = Math.round(o.g * alpha + b.g * (1 - alpha));
  const bl = Math.round(o.b * alpha + b.b * (1 - alpha));
  return `rgb(${r}, ${g}, ${bl})`;
}

function contrastRatio(bg: string, fg: string): number {
  const l1 = luminance(bg) + 0.05;
  const l2 = luminance(fg) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

for (const { slug, label } of TENANTS) {
  test.describe(`Feature: Menú de usuario adaptado a paleta del tenant (${label})`, () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(
        page,
        slug === "zo-system" ? "wondernails" : slug,
        TEST_CREDENTIALS.adminEmail,
        TEST_CREDENTIALS.adminPassword,
      );
      if (slug === "zo-system") {
        await page.goto("/t/zo-system");
        await page.waitForLoadState("networkidle").catch(() => {});
      }
    });

    test(`SC-01/02/03 — usuario abre menú en tenant ${slug} con colores del tema`, async ({
      page,
    }) => {
      const menu = await openUserMenu(page);

      const bg = await menu.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      const expectedDark = mode === "dark";
      const isDarkBg = luminance(bg) < 0.5;
      expect(
        isDarkBg,
        `menu background for ${slug} should be ${mode} (got ${bg})`,
      ).toBe(expectedDark);

      // Text color must be readable
      const item = menu.locator("role=menuitem").first();
      const fg = await item.evaluate((el) => getComputedStyle(el).color);
      const ratio = contrastRatio(bg, fg);
      expect(
        ratio,
        `contrast ratio for ${slug} must be >= 3`,
      ).toBeGreaterThanOrEqual(3);

      // Structure preserved
      await expect(menu.getByText(/cuenta/i)).toBeVisible();
      await expect(menu.getByText(/gestión/i)).toBeVisible();
      await expect(
        menu.getByRole("menuitem", { name: /Cerrar sesión/ }),
      ).toBeVisible();
    });

    test(`SC-04 — hover y active mantienen contraste en ${slug}`, async ({
      page,
    }) => {
      const menu = await openUserMenu(page);
      const item = menu.locator("role=menuitem").first();
      const menuBg = await menu.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await item.hover();
      await page.waitForTimeout(300);
      const hoverBgRaw = await item.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      const hoverFg = await item.evaluate((el) => getComputedStyle(el).color);
      const hoverBg = compositeColor(hoverBgRaw, menuBg);
      expect(contrastRatio(hoverBg, hoverFg)).toBeGreaterThanOrEqual(3);
    });

    test(`SC-05 — menú responsive conserva paleta del tenant en ${slug}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const menu = await openUserMenu(page);
      const bg = await menu.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      const expectedDark = mode === "dark";
      const isDarkBg = luminance(bg) < 0.5;
      expect(
        isDarkBg,
        `responsive menu background for ${slug} should be ${mode}`,
      ).toBe(expectedDark);
      const item = menu.locator("role=menuitem").first();
      const fg = await item.evaluate((el) => getComputedStyle(el).color);
      expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(3);
    });
  });
}
