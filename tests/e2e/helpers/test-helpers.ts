import { Page, expect } from "@playwright/test";

/**
 * Test credentials from environment variables
 */
export const TEST_CREDENTIALS = {
  tenantSlug: process.env.TEST_TENANT_SLUG || "wondernails",
  adminEmail:
    process.env.TEST_ADMIN_EMAIL ||
    `admin@${process.env.TEST_TENANT_SLUG || "wondernails"}.com`,
  adminPassword: process.env.TEST_ADMIN_PASSWORD || "Password123!",
};

/**
 * Login helper - logs in an admin user
 */
export async function loginAsAdmin(page: Page) {
  const { adminEmail, adminPassword, tenantSlug } = TEST_CREDENTIALS;

  await page.goto(`/t/${tenantSlug}/login`);

  // Wait for page to load (tenant data fetch)
  await page.waitForLoadState("networkidle", { timeout: 30000 });

  // Wait for login form to be visible (using data-testid)
  await expect(page.getByTestId("email-input")).toBeVisible({ timeout: 10000 });

  // Fill credentials using data-testid
  await page.getByTestId("email-input").fill(adminEmail);
  await page.getByTestId("password-input").fill(adminPassword);

  // Submit form
  await page.getByTestId("login-btn").click();

  // Wait for successful navigation
  await page.waitForURL(`**\/t/${tenantSlug}/**`, { timeout: 15000 });
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
  await page.locator("input[placeholder='60']").fill(serviceData.duration);

  if (serviceData.featured) {
    await page.getByRole("checkbox", { name: "Servicio destacado" }).check();
  }

  // Submit
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
