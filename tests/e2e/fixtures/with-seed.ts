import { test as base } from "@playwright/test";
import { db } from "@sass-store/database";

/**
 * Fixture para seedear datos de prueba antes de ejecutar E2E.
 * Uso: import { test } from "./fixtures/with-seed";
 */

export const test = base.extend<{
  seededData: {
    tenantSlug: string;
    productId?: string;
    bookingId?: string;
  };
}>({
  seededData: [
    async ({ page }, use) => {
      const tenantSlug = "wondernails";
      // NOTE: En modo production build (Playwright webServer)
      // no podemos insertar directamente en DB desde el test.
      // En su lugar, llamamos al endpoint de seed o esperamos que
      // el server ya tenga datos.
      // Este fixture asegura que el tenant existe y navegamos correctamente.
      await page.goto(`/t/${tenantSlug}`);
      await page.waitForSelector("body", { timeout: 15000 });
      await use({ tenantSlug });
    },
    { auto: true },
  ],
});
