import { test, expect } from "@playwright/test";

type TenantSlug = "zo-system" | "wondernails";

const TENANTS: TenantSlug[] = ["zo-system", "wondernails"];

const ensureSocialNavigation = async (tenant: TenantSlug, page: any) => {
  await page.goto(`/t/${tenant}/social`);

  await expect(page.getByRole("button", { name: /Calendario/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Cola/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Generar/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Biblioteca/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Analytics/i })).toBeVisible();
};

const expectCalendarControls = async (page: any) => {
  await expect(page.getByRole("button", { name: /Mes/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Semana/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Lista/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Hoy/i })).toBeVisible();
};

test.describe("Social module", () => {
  for (const tenant of TENANTS) {
    test(`${tenant} social navigation and editor`, async ({ page }) => {
      await ensureSocialNavigation(tenant, page);

      await page.getByRole("button", { name: /Calendario/i }).click();
      await expectCalendarControls(page);

      await page.getByRole("button", { name: /Cola/i }).click();
      await expect(
        page.getByRole("heading", { name: /Cola de Publicaciones/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /Generar/i }).click();
      await expect(
        page.getByRole("heading", { name: /Generar Contenido con IA/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /Biblioteca/i }).click();
      await expect(
        page.getByRole("heading", { name: /Biblioteca de Contenido/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /Analytics/i }).click();
      await expect(
        page.getByRole("heading", { name: /^Analytics$/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /Calendario/i }).click();
      await expectCalendarControls(page);

      await page.getByRole("button", { name: /^Crear$/i }).click();
      await expect(
        page.getByRole("heading", { name: /Nueva Publicación/i }),
      ).toBeVisible();
      await expect(page.getByLabel(/Título interno/i)).toBeVisible();
      await page.getByRole("button", { name: /Cancelar/i }).click();
      await expect(
        page.getByRole("heading", { name: /Nueva Publicación/i }),
      ).toBeHidden();
    });
  }
});
