import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const loginShell = (page: Page) =>
  page.locator(
    'input[type="email"], [data-testid="login-btn"], [data-testid="auth-error"]',
  );

async function sleepMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `networkidle` no es fiable con `next dev` (HMR / websockets). Anclamos al formulario de login.
 * Reintentos: Supabase pooler a veces devuelve ECONNRESET bajo carga (p. ej. batería E2E).
 */
export async function gotoTenantLogin(
  page: Page,
  tenant: string,
  query = "",
): Promise<void> {
  const qs = query.startsWith("?") ? query : query ? `?${query}` : "";
  const shell = loginShell(page);
  const lastError: Error[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleepMs(1500 * attempt);
    }
    try {
      await page.goto(`/t/${tenant}/login${qs}`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await expect(shell.first()).toBeVisible({ timeout: 45_000 });
      return;
    } catch (e) {
      lastError[0] = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(
    `gotoTenantLogin failed after 3 attempts (tenant=${tenant}${qs}). ${lastError[0]?.message ?? ""}`,
  );
}

export async function gotoTenantRegister(
  page: Page,
  tenant: string,
): Promise<void> {
  const name = page.locator("#name").first();
  const lastError: Error[] = [];

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleepMs(1500 * attempt);
    }
    try {
      await page.goto(`/t/${tenant}/register`, {
        waitUntil: "domcontentloaded",
        timeout: 90_000,
      });
      await expect(name).toBeVisible({ timeout: 45_000 });
      return;
    } catch (e) {
      lastError[0] = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw new Error(
    `gotoTenantRegister failed after 3 attempts (tenant=${tenant}). ${lastError[0]?.message ?? ""}`,
  );
}
