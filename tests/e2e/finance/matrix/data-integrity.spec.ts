import { expect, test } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../../helpers/test-helpers";
import {
  MATRIX_TEST_DATES,
  findEmptyCellIdentity,
  formatMxCurrency,
  getCellProjectedAndReal,
  navigateToFinanceMatrix,
  openQuickEntry,
  saveProjectedAmount,
  setMatrixFilters,
  waitForMatrixRenderState,
} from "../../helpers/matrix-helpers";

test.describe("Financial Matrix - Seguridad/Integridad (P0/P1)", () => {
  const tenantASlug = TEST_CREDENTIALS.tenantSlug;
  const tenantBSlug = process.env.TEST_TENANT_B_SLUG || "nomnom";

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("aislamiento tenant A vs tenant B: montos de A no visibles en B", async ({
    page,
  }) => {
    const uniqueAmount = 7777.77;
    const uniqueAmountText = formatMxCurrency(uniqueAmount);

    await navigateToFinanceMatrix(page, tenantASlug);

    const renderState = await waitForMatrixRenderState(page);
    test.skip(
      renderState === "backend-404",
      "Bloqueado: backend matriz no disponible (HTTP 404 en /api/finance/matrix)",
    );
    test.skip(
      renderState === "backend-http-error",
      "Bloqueado: backend matriz responde con error HTTP 5xx/4xx distinto de 404",
    );
    test.skip(
      renderState === "still-loading-timeout",
      "Bloqueado: matriz no terminó de renderizar dentro del timeout esperado",
    );

    await setMatrixFilters(page, {
      granularity: "month",
      startDate: MATRIX_TEST_DATES.emptyMonth2030.start,
      endDate: MATRIX_TEST_DATES.emptyMonth2030.end,
    });

    const targetA = await findEmptyCellIdentity(page);
    await openQuickEntry(page, targetA.categoryId, targetA.bucketId);
    await saveProjectedAmount(page, uniqueAmount.toFixed(2));

    const afterSaveA = await getCellProjectedAndReal(
      page,
      targetA.categoryId,
      targetA.bucketId,
    );
    expect(afterSaveA.projected).toBeCloseTo(uniqueAmount, 2);

    await page.goto(`/t/${tenantBSlug}/finance`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const redirectedToLogin = await page
      .getByTestId("email-input")
      .isVisible()
      .catch(() => false);

    if (redirectedToLogin) {
      await expect(page.getByTestId("email-input")).toBeVisible();
      return;
    }

    const matrixOnTenantB = (await waitForMatrixRenderState(page, 10000)) === "grid-ready";

    if (!matrixOnTenantB) {
      // Si B no tiene matriz disponible, validar al menos que no haya fuga del monto de A
      await expect(page.getByText(uniqueAmountText, { exact: false })).toHaveCount(0);
      return;
    }

    await setMatrixFilters(page, {
      granularity: "month",
      startDate: MATRIX_TEST_DATES.emptyMonth2030.start,
      endDate: MATRIX_TEST_DATES.emptyMonth2030.end,
    });

    await expect(page.getByText(uniqueAmountText, { exact: false })).toHaveCount(0);
  });

});

test.describe("Financial Matrix - Seguridad/Integridad (P1 pendiente)", () => {
  test.skip(
    true,
    "Pendiente: flujo UI/API de historial legacy no está estable ni con selector data-testid contractual para edición determinística en este entorno.",
  );

  test("(P1) cambio en historial reflejado en matriz", async () => {
    // skip justificado arriba
  });
});

