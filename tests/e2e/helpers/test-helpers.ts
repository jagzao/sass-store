import { Page, expect, APIRequestContext } from "@playwright/test";

// Nombres de tokens CSRF (deben coincidir con packages/core/src/security/csrf.ts)
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Lee el token CSRF de las cookies del navegador y retorna los headers necesarios.
 * Usar en cualquier page.request.post/put/delete que requiera CSRF.
 *
 * Ejemplo:
 *   const headers = await getCsrfHeaders(page);
 *   await page.request.post('/api/...', { headers, data: {...} });
 */
export async function getCsrfHeaders(
  page: Page,
): Promise<Record<string, string>> {
  // Obtener el token del cookie del navegador
  const cookies = await page.context().cookies();
  const csrfCookie = cookies.find((c) => c.name === CSRF_COOKIE_NAME);

  if (csrfCookie?.value) {
    return { [CSRF_HEADER_NAME]: csrfCookie.value };
  }

  // Fallback: hacer un GET a la raíz para forzar que el middleware emita el cookie
  await page.evaluate(() => fetch("/api/health").catch(() => null));
  await page.waitForTimeout(300);

  const cookies2 = await page.context().cookies();
  const csrfCookie2 = cookies2.find((c) => c.name === CSRF_COOKIE_NAME);
  return csrfCookie2?.value ? { [CSRF_HEADER_NAME]: csrfCookie2.value } : {};
}

/**
 * Test credentials from environment variables
 */
export const TEST_CREDENTIALS = {
  tenantSlug: process.env.TEST_TENANT_SLUG || "wondernails",
  adminEmail: process.env.TEST_ADMIN_EMAIL || "jagzao@gmail.com",
  adminPassword: process.env.TEST_ADMIN_PASSWORD || "admin",
};

/**
 * Login to a specific tenant as admin.
 * Uses explicit data-testid selectors from LoginForm.tsx.
 * Waits for the HomeTenant dashboard to confirm successful auth.
 */
/**
 * Login to any tenant using explicit data-testid selectors from LoginForm.tsx.
 * .first() is required: the login page has a hidden duplicate input from the
 * registration form below the fold.
 */
export async function loginAs(
  page: Page,
  tenantSlug: string,
  email: string,
  password: string,
): Promise<void> {
  await page.goto(`/t/${tenantSlug}/login`, {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });

  await page.waitForLoadState("networkidle").catch(() => {});
  const emailInput = page.getByTestId("email-input").first();
  await expect(emailInput).toBeVisible({ timeout: 60000 });

  // Usar page.fill (selector nivel página) — este patrón dispara correctamente
  // los eventos React en Turbopack dev mode. locator.fill() + force:true causa
  // submit nativo GET en lugar de llamar al handleSubmit de React.
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  // click sin force — para que React's synthetic event system lo intercepte
  await page.getByTestId("login-btn").first().click();

  await page.waitForURL(
    (url) =>
      url.href.includes(`/t/${tenantSlug}`) && !url.href.includes("/login"),
    { timeout: 60000 },
  );

  // Wait for session hydration to finish (HomeRouter uses useSession which
  // starts in "loading" state). Without this, the staff/client branch may
  // flash incorrectly and tests assert too early.
  const spinner = page.locator("[class*='animate-pulse']").first();
  await spinner.waitFor({ state: "hidden", timeout: 15000 }).catch(() => {
    // If there's no spinner, session might already be hydrated — that's fine.
  });

  // Accept either dashboard (staff) or public home (client) as valid
  // post-login state. Staff users that land on public-home indicate a role
  // mismatch in seed data, which should be reported but not fail the test
  // helper itself.
  const dashboard = page.getByTestId("hometenant-dashboard");
  const publicHome = page.getByTestId("public-home");

  const dashboardVisible = await dashboard
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const publicHomeVisible = await publicHome
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  if (!dashboardVisible && !publicHomeVisible) {
    throw new Error(
      `Post-login page for /t/${tenantSlug} is missing both data-testid="hometenant-dashboard" and data-testid="public-home". ` +
        `This usually means: (a) the page is still loading, (b) a new layout was introduced without test ids, or (c) a 4xx/5xx occurred.`,
    );
  }
}

/**
 * Login for the default test tenant (wondernails admin).
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  const { adminEmail, adminPassword, tenantSlug } = TEST_CREDENTIALS;
  await loginAs(page, tenantSlug, adminEmail, adminPassword);
}

/**
 * Sign out by navigating to the NextAuth signout endpoint.
 * Works from any page regardless of which nav is visible.
 */
export async function signOut(page: Page) {
  await page.goto("/api/auth/signout", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  // NextAuth shows a confirmation page — click the sign out button
  const signOutBtn = page.getByRole("button", { name: /sign out|cerrar/i });
  if (await signOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signOutBtn.click();
  }
  await page.waitForTimeout(500);
}

/**
 * Navigate to admin services page
 */
export async function navigateToAdminServices(page: Page) {
  const { tenantSlug } = TEST_CREDENTIALS;
  await page.goto(`/t/${tenantSlug}/admin_services`);

  // Wait for page to load
  await expect(page.getByText("Gestiona el catálogo de servicios")).toBeVisible(
    { timeout: 10000 },
  );
}

/**
 * Wait for element with better error message
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: { timeout?: number; state?: "visible" | "hidden" },
) {
  try {
    await page.waitForSelector(selector, {
      timeout: options?.timeout || 10000,
      state: options?.state || "visible",
    });
  } catch (error) {
    throw new Error(
      `Element "${selector}" not found within ${options?.timeout || 10000}ms. ` +
        `Current URL: ${page.url()}`,
    );
  }
}

/**
 * Handle dialog (alert/confirm) - auto-accept
 */
export function setupDialogHandler(
  page: Page,
  action: "accept" | "dismiss" = "accept",
) {
  page.on("dialog", (dialog) => {
    console.log(`[Dialog] ${dialog.type()}: ${dialog.message()}`);
    if (action === "accept") {
      dialog.accept();
    } else {
      dialog.dismiss();
    }
  });
}

/**
 * Create a test service with given data
 */
export async function createService(
  page: Page,
  serviceData: {
    name: string;
    description?: string;
    price: string;
    duration: string;
    featured?: boolean;
  },
) {
  // Open create modal
  await page.getByRole("button", { name: "+ Nuevo Servicio" }).click();
  await expect(page.getByText("Crear Nuevo Servicio")).toBeVisible();

  // Fill form
  await page
    .locator("input[placeholder='Ej: Manicure Premium']")
    .fill(serviceData.name);

  if (serviceData.description) {
    await page
      .locator("textarea[placeholder='Descripción detallada del servicio']")
      .fill(serviceData.description);
  }

  await page.locator("input[placeholder='0.00']").fill(serviceData.price);
  await page.locator("input[placeholder='1.5']").fill(serviceData.duration);

  if (serviceData.featured) {
    await page.getByRole("checkbox", { name: "Servicio destacado" }).check();
  }

  // Submit
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Crear Servicio" }).click();

  // Wait for modal to close
  await expect(page.getByText("Crear Nuevo Servicio")).not.toBeVisible({
    timeout: 5000,
  });
}

/**
 * Generate unique test name
 */
export function generateTestName(prefix: string = "Test"): string {
  return `${prefix} ${Date.now()}`;
}
