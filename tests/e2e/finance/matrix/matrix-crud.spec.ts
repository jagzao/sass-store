import { expect, test } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../../helpers/test-helpers";
import {
  MATRIX_TEST_DATES,
  findEmptyCellIdentity,
  findWritableCellIdentity,
  getCellProjectedAndReal,
  getCellStyleClass,
  markPaidFromQuickEntry,
  navigateToFinanceMatrix,
  openQuickEntry,
  saveProjectedAmount,
  setMatrixFilters,
  waitForCellAmount,
  waitForMatrixRenderState,
  waitForMatrixReady,
} from "../../helpers/matrix-helpers";

test.describe("Financial Matrix - Interacción Matriz (P0)", () => {
  const { tenantSlug } = TEST_CREDENTIALS;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToFinanceMatrix(page, tenantSlug);

    const renderState = await waitForMatrixRenderState(page);
    test.skip(
      renderState === "backend-404",
      "Bloqueado: backend matriz no disponible (HTTP 404 en /api/finance/matrix)",
    );
    expect(
      renderState,
      "Matriz no lista para ejecución real (se esperaba grid-ready)",
    ).toBe("grid-ready");

    await setMatrixFilters(page, {
      granularity: "month",
      startDate: MATRIX_TEST_DATES.emptyMonth2030.start,
      endDate: MATRIX_TEST_DATES.emptyMonth2030.end,
    });
  });

  test("crear valor planeado en celda vacía y persistir tras recargar", async ({ page }) => {
    await setMatrixFilters(page, {
      granularity: "month",
      startDate: "2032-03-01",
      endDate: "2032-03-31",
    });

    const target = await findEmptyCellIdentity(page);
    const plannedAmount = "1234.56";

    await openQuickEntry(page, target.categoryId, target.bucketId);
    await saveProjectedAmount(page, plannedAmount);

    await expect(page.getByText("Planeación guardada correctamente")).toBeVisible({
      timeout: 15000,
    });

    await waitForCellAmount(page, target.categoryId, target.bucketId, "P", 1234.56);

    const afterSave = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(afterSave.projected).toBeCloseTo(1234.56, 2);

    const classAfterSave = await getCellStyleClass(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(classAfterSave).toContain("cell-planned");

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForMatrixReady(page);

    const afterReload = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(afterReload.projected).toBeCloseTo(1234.56, 2);

    const classAfterReload = await getCellStyleClass(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(classAfterReload).toContain("cell-planned");
  });

  test("marcar pagado y reflejar estilo ejecutado + impacto visible en matriz", async ({
    page,
  }) => {
    await setMatrixFilters(page, {
      granularity: "month",
      startDate: "2031-03-01",
      endDate: "2031-03-31",
    });

    const target = await findWritableCellIdentity(page);
    const plannedAmount = "1000.00";
    const paymentAmount = "555.55";
    const paymentAmountNumber = Number(paymentAmount);

    const initialValues = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );
    const expectedRealAfterPayment = Number((initialValues.real + paymentAmountNumber).toFixed(2));

    await openQuickEntry(page, target.categoryId, target.bucketId);
    await saveProjectedAmount(page, plannedAmount);
    await expect(page.getByText("Planeación guardada correctamente")).toBeVisible({
      timeout: 15000,
    });

    await openQuickEntry(page, target.categoryId, target.bucketId);
    await markPaidFromQuickEntry(page, paymentAmount);

    await expect(page.getByText("Pago confirmado correctamente")).toBeVisible({
      timeout: 15000,
    });

    await waitForCellAmount(
      page,
      target.categoryId,
      target.bucketId,
      "R",
      expectedRealAfterPayment,
    );

    const cellValues = await getCellProjectedAndReal(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(cellValues.real).toBeCloseTo(expectedRealAfterPayment, 2);

    const executedClass = await getCellStyleClass(
      page,
      target.categoryId,
      target.bucketId,
    );
    expect(executedClass).toContain("cell-executed");

    // Nota alcance: verificación estricta dashboard/historial se deja para P1
    // por dependencia de módulos externos y estabilidad de datos entre entornos.
  });
});

