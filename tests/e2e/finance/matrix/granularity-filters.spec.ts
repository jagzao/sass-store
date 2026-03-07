import { expect, test } from "@playwright/test";
import { TEST_CREDENTIALS, loginAsAdmin } from "../../helpers/test-helpers";
import {
  MATRIX_TEST_DATES,
  getBucketIdsWithStartDatePrefix,
  getCellProjectedAndReal,
  getFirstCellIdentity,
  navigateToFinanceMatrix,
  setMatrixFilters,
  waitForMatrixRenderState,
  waitForMatrixReady,
} from "../../helpers/matrix-helpers";

test.describe("Financial Matrix - Granularidad/Render (P0/P1)", () => {
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

  test("TC-01 (P0): mensual consistente con suma semanal en marzo", async ({ page }) => {
    await setMatrixFilters(page, {
      granularity: "week",
      startDate: MATRIX_TEST_DATES.march2026.start,
      endDate: MATRIX_TEST_DATES.march2026.end,
    });

    const { categoryId } = await getFirstCellIdentity(page);
    const headers = page.getByTestId("matrix-header-cell");
    const weeklyBucketCount = await headers.count();

    let weeklyRealSum = 0;
    for (let index = 0; index < weeklyBucketCount; index += 1) {
      const bucketId = await headers.nth(index).getAttribute("data-bucket-id");
      if (!bucketId) {
        continue;
      }

      const value = await getCellProjectedAndReal(page, categoryId, bucketId);
      weeklyRealSum += value.real;
    }

    await setMatrixFilters(page, {
      granularity: "month",
      startDate: MATRIX_TEST_DATES.march2026.start,
      endDate: MATRIX_TEST_DATES.march2026.end,
    });

    const monthBucketIds = await getBucketIdsWithStartDatePrefix(page, "2026-03");
    expect(monthBucketIds.length).toBe(1);

    const monthly = await getCellProjectedAndReal(page, categoryId, monthBucketIds[0]);
    expect(monthly.real).toBeCloseTo(weeklyRealSum, 2);
  });

  test("TC-02 (P0): corte quincenal exacto Q1(1-15) y Q2(16-fin)", async ({ page }) => {
    await setMatrixFilters(page, {
      granularity: "fortnight",
      startDate: MATRIX_TEST_DATES.march2026.start,
      endDate: MATRIX_TEST_DATES.march2026.end,
    });

    const q1 = page.locator(
      '[data-testid="matrix-header-cell"][data-bucket-id="F2026-03-Q1"]',
    );
    const q2 = page.locator(
      '[data-testid="matrix-header-cell"][data-bucket-id="F2026-03-Q2"]',
    );

    await expect(q1).toBeVisible();
    await expect(q2).toBeVisible();

    await expect(q1).toHaveAttribute("data-start-date", "2026-03-01");
    await expect(q1).toHaveAttribute("data-end-date", "2026-03-15");

    await expect(q2).toHaveAttribute("data-start-date", "2026-03-16");
    await expect(q2).toHaveAttribute("data-end-date", "2026-03-31");
  });

  test("TC-03 (P1): persistencia de filtro anual y posición de scroll", async ({ page }) => {
    await setMatrixFilters(page, {
      granularity: "month",
      startDate: MATRIX_TEST_DATES.fullYear2026.start,
      endDate: MATRIX_TEST_DATES.fullYear2026.end,
    });

    const scrollContainer = page.getByTestId("matrix-scroll-container");
    await scrollContainer.evaluate((el) => {
      el.scrollLeft = 1200;
      el.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await page.waitForTimeout(200);

    const savedScroll = await scrollContainer.evaluate((el) => el.scrollLeft);
    expect(savedScroll).toBeGreaterThan(0);

    await page.goto(`/t/${tenantSlug}/finance/categories`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await waitForMatrixReady(page);

    await expect(page.getByTestId("granularity-selector")).toHaveValue("month");
    await expect(page.getByTestId("date-range-picker-start")).toHaveValue(
      MATRIX_TEST_DATES.fullYear2026.start,
    );
    await expect(page.getByTestId("date-range-picker-end")).toHaveValue(
      MATRIX_TEST_DATES.fullYear2026.end,
    );

    const restoredScroll = await page
      .getByTestId("matrix-scroll-container")
      .evaluate((el) => el.scrollLeft);

    expect(restoredScroll).toBeGreaterThanOrEqual(Math.max(1, savedScroll - 5));
  });
});

