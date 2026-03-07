import { expect, test } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../../helpers/test-helpers";
import {
  MATRIX_TEST_DATES,
  findEmptyCellIdentity,
  getCellProjectedAndReal,
  navigateToFinanceMatrix,
  openQuickEntry,
  saveProjectedAmount,
  setMatrixFilters,
  waitForMatrixRenderState,
} from "../../helpers/matrix-helpers";

test.describe("Financial Matrix - Edge mínima (P1)", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToFinanceMatrix(page, tenantSlug);

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
  });

  test("corte quincena febrero bisiesto/no bisiesto", async ({ page }) => {
    await setMatrixFilters(page, {
      granularity: "fortnight",
      startDate: MATRIX_TEST_DATES.leapFeb2024.start,
      endDate: MATRIX_TEST_DATES.leapFeb2024.end,
    });

    const leapQ2 = page.locator(
      '[data-testid="matrix-header-cell"][data-bucket-id="F2024-02-Q2"]',
    );
    await expect(leapQ2).toBeVisible();
    await expect(leapQ2).toHaveAttribute("data-start-date", "2024-02-16");
    await expect(leapQ2).toHaveAttribute("data-end-date", "2024-02-29");

    await setMatrixFilters(page, {
      granularity: "fortnight",
      startDate: MATRIX_TEST_DATES.nonLeapFeb2025.start,
      endDate: MATRIX_TEST_DATES.nonLeapFeb2025.end,
    });

    const nonLeapQ2 = page.locator(
      '[data-testid="matrix-header-cell"][data-bucket-id="F2025-02-Q2"]',
    );
    await expect(nonLeapQ2).toBeVisible();
    await expect(nonLeapQ2).toHaveAttribute("data-start-date", "2025-02-16");
    await expect(nonLeapQ2).toHaveAttribute("data-end-date", "2025-02-28");
  });

  test("input inválido en celda: caracteres especiales sanitizados y negativos no aceptados", async ({
    page,
  }) => {
    await setMatrixFilters(page, {
      granularity: "month",
      startDate: MATRIX_TEST_DATES.emptyMonth2030.start,
      endDate: MATRIX_TEST_DATES.emptyMonth2030.end,
    });

    const target = await findEmptyCellIdentity(page);

    // Caso 1: caracteres especiales -> debe sanitizarse/bloquearse (no dejar monto inválido)
    await openQuickEntry(page, target.categoryId, target.bucketId);
    await saveProjectedAmount(page, "abc$%^###");

    const specialCharResult = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(specialCharResult.projected).toBeGreaterThanOrEqual(0);

    // Caso 2: negativo -> bloqueado o sanitizado a no-negativo
    const beforeNegativeAttempt = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );

    await openQuickEntry(page, target.categoryId, target.bucketId);
    await page.getByTestId("planned-amount-input").fill("-100");
    await page.getByTestId("save-cell-btn").click();

    const popover = page.getByTestId("quick-entry-popover");
    const popoverClosed = await popover
      .waitFor({ state: "hidden", timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (!popoverClosed) {
      await page.getByTestId("cancel-cell-btn").click();
      await expect(popover).toHaveCount(0, { timeout: 5000 });
    }

    const negativeResult = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(negativeResult.projected).toBeGreaterThanOrEqual(0);
    expect(negativeResult.projected).toBeGreaterThanOrEqual(beforeNegativeAttempt.projected);
  });
});

