import { expect, Locator, Page } from "@playwright/test";
import { loginAsAdmin } from "./test-helpers";

export const MATRIX_TEST_DATES = {
  march2026: {
    start: "2026-03-01",
    end: "2026-03-31",
  },
  fullYear2026: {
    start: "2026-01-01",
    end: "2026-12-31",
  },
  emptyMonth2030: {
    start: "2030-03-01",
    end: "2030-03-31",
  },
  leapFeb2024: {
    start: "2024-02-01",
    end: "2024-02-29",
  },
  nonLeapFeb2025: {
    start: "2025-02-01",
    end: "2025-02-28",
  },
} as const;

export const formatMxCurrency = (value: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);

export async function navigateToFinanceMatrix(page: Page, tenantSlug: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.goto(`/t/${tenantSlug}/finance`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const onLogin = await page
      .getByTestId("email-input")
      .isVisible({ timeout: 4000 })
      .catch(() => false);

    if (!onLogin) {
      return;
    }

    await loginAsAdmin(page);
  }

  throw new Error(`Unable to access /t/${tenantSlug}/finance after login retries`);
}

export async function waitForMatrixReady(page: Page) {
  await expect(page.getByTestId("matrix-container")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Cargando módulo financiero...")).toHaveCount(0, {
    timeout: 20000,
  });
  await expect(page.getByText("Cargando matriz financiera...")).toHaveCount(0, {
    timeout: 30000,
  });
}

export async function isMatrixGridAvailable(page: Page): Promise<boolean> {
  const hasScrollContainer = await page
    .getByTestId("matrix-scroll-container")
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  const hasAnyCell = await page
    .getByTestId("matrix-cell")
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false);

  return hasScrollContainer && hasAnyCell;
}

export async function isMatrixBackendUnavailable(page: Page): Promise<boolean> {
  const hasHttp404 = await page
    .getByText(/HTTP 404/i)
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  return hasHttp404;
}

export type MatrixRenderState =
  | "grid-ready"
  | "backend-404"
  | "backend-http-error"
  | "still-loading-timeout";

export async function waitForMatrixRenderState(
  page: Page,
  timeoutMs: number = 20000,
): Promise<MatrixRenderState> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const hasGrid = await isMatrixGridAvailable(page);
    if (hasGrid) {
      return "grid-ready";
    }

    const has404 = await page
      .getByText(/HTTP 404/i)
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (has404) {
      return "backend-404";
    }

    const hasAnyHttpError = await page
      .getByText(/HTTP [45]\d\d/i)
      .first()
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (hasAnyHttpError) {
      return "backend-http-error";
    }

    await page.waitForTimeout(400);
  }

  return "still-loading-timeout";
}

export async function setMatrixFilters(
  page: Page,
  filters: {
    granularity?: "week" | "fortnight" | "month" | "year";
    startDate?: string;
    endDate?: string;
  },
) {
  if (filters.granularity) {
    await page
      .getByTestId("granularity-selector")
      .selectOption(filters.granularity);
  }

  if (filters.endDate) {
    await page
      .getByTestId("date-range-picker-end")
      .fill(filters.endDate);
  }

  if (filters.startDate) {
    await page
      .getByTestId("date-range-picker-start")
      .fill(filters.startDate);
  }

  await waitForMatrixReady(page);

  if (filters.startDate && filters.granularity === "month") {
    const expectedStartDate = filters.startDate;
    await expect(
      page.locator(`[data-testid="matrix-header-cell"][data-start-date^="${expectedStartDate}"]`).first(),
    ).toBeVisible({ timeout: 15000 });
  }
}

export async function getFirstCellIdentity(page: Page): Promise<{
  categoryId: string;
  bucketId: string;
}> {
  const firstCell = page.getByTestId("matrix-cell").first();
  await expect(firstCell).toBeVisible();

  const categoryId = await firstCell.getAttribute("data-category-id");
  const bucketId = await firstCell.getAttribute("data-bucket-id");

  expect(categoryId).toBeTruthy();
  expect(bucketId).toBeTruthy();

  return {
    categoryId: categoryId || "",
    bucketId: bucketId || "",
  };
}

export async function getCellIdentityForCategory(
  page: Page,
  categoryName: string,
): Promise<{ categoryId: string; bucketId: string }> {
  const row = page
    .locator("tbody tr")
    .filter({ has: page.locator("td", { hasText: categoryName }) })
    .first();

  const cell = row.getByTestId("matrix-cell").first();
  await expect(cell).toBeVisible();

  const categoryId = await cell.getAttribute("data-category-id");
  const bucketId = await cell.getAttribute("data-bucket-id");

  expect(categoryId).toBeTruthy();
  expect(bucketId).toBeTruthy();

  return {
    categoryId: categoryId || "",
    bucketId: bucketId || "",
  };
}

export async function findEmptyCellIdentity(
  page: Page,
  maxCellsToScan: number = 200,
): Promise<{ categoryId: string; bucketId: string }> {
  const cells = page.getByTestId("matrix-cell");
  const count = await cells.count();
  const limit = Math.min(count, maxCellsToScan);

  for (let index = 0; index < limit; index += 1) {
    const cell = cells.nth(index);
    const text = (await cell.textContent()) || "";
    const projected = parseLabelAmount(text, "P");
    const real = parseLabelAmount(text, "R");

    if (projected === 0 && real === 0) {
      const categoryId = await cell.getAttribute("data-category-id");
      const bucketId = await cell.getAttribute("data-bucket-id");

      if (categoryId && bucketId) {
        return { categoryId, bucketId };
      }
    }
  }

  throw new Error("No empty matrix cell found in scanned range");
}

export async function findWritableCellIdentity(
  page: Page,
  maxCellsToScan: number = 300,
): Promise<{ categoryId: string; bucketId: string }> {
  const cells = page.getByTestId("matrix-cell");
  const count = await cells.count();
  const limit = Math.min(count, maxCellsToScan);

  let fallbackRealZero: { categoryId: string; bucketId: string } | null = null;
  let fallbackAny: { categoryId: string; bucketId: string } | null = null;

  for (let index = 0; index < limit; index += 1) {
    const cell = cells.nth(index);
    const text = (await cell.textContent()) || "";
    const projected = parseLabelAmount(text, "P");
    const real = parseLabelAmount(text, "R");

    const categoryId = await cell.getAttribute("data-category-id");
    const bucketId = await cell.getAttribute("data-bucket-id");
    if (!categoryId || !bucketId) {
      continue;
    }

    if (!fallbackAny) {
      fallbackAny = { categoryId, bucketId };
    }

    if (real === 0 && !fallbackRealZero) {
      fallbackRealZero = { categoryId, bucketId };
    }

    if (projected === 0 && real === 0) {
      return { categoryId, bucketId };
    }
  }

  if (fallbackRealZero) {
    return fallbackRealZero;
  }

  if (fallbackAny) {
    return fallbackAny;
  }

  throw new Error("No writable matrix cell found");
}

export async function waitForCellAmount(
  page: Page,
  categoryId: string,
  bucketId: string,
  label: "P" | "R",
  minValue: number,
  timeoutMs: number = 20000,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const values = await getCellProjectedAndReal(page, categoryId, bucketId);
    const current = label === "P" ? values.projected : values.real;
    if (current >= minValue) {
      return;
    }

    await page.waitForTimeout(400);
  }

  const finalValues = await getCellProjectedAndReal(page, categoryId, bucketId);
  const finalCurrent = label === "P" ? finalValues.projected : finalValues.real;
  throw new Error(
    `Timed out waiting for cell ${label} >= ${minValue}. Final value: ${finalCurrent}`,
  );
}

export function getMatrixCell(
  page: Page,
  categoryId: string,
  bucketId: string,
): Locator {
  return page.locator(
    `[data-testid="matrix-cell"][data-category-id="${categoryId}"][data-bucket-id="${bucketId}"]`,
  );
}

export async function getCellProjectedAndReal(
  page: Page,
  categoryId: string,
  bucketId: string,
): Promise<{ projected: number; real: number }> {
  const cell = getMatrixCell(page, categoryId, bucketId);
  const content = (await cell.textContent()) || "";

  return {
    projected: parseLabelAmount(content, "P"),
    real: parseLabelAmount(content, "R"),
  };
}

export async function openQuickEntry(
  page: Page,
  categoryId: string,
  bucketId: string,
) {
  const popover = page.getByTestId("quick-entry-popover");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const cell = getMatrixCell(page, categoryId, bucketId);

    await cell.scrollIntoViewIfNeeded().catch(() => undefined);

    await cell
      .click({ timeout: 10000 })
      .then(() => undefined)
      .catch(async () => {
        await cell.click({ timeout: 5000, force: true }).catch(() => undefined);
        await waitForMatrixReady(page);
      });

    const visible = await popover.isVisible({ timeout: 2000 }).catch(() => false);
    if (visible) {
      return;
    }

    await page.waitForTimeout(300);
  }

  await expect(popover).toBeVisible({ timeout: 10000 });
}

export async function saveProjectedAmount(page: Page, amount: string) {
  await page.getByTestId("planned-amount-input").fill(amount);
  await page.getByTestId("save-cell-btn").click();

  const popover = page.getByTestId("quick-entry-popover");
  const closed = await popover
    .waitFor({ state: "hidden", timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  if (!closed) {
    const saved = await page
      .getByText("Planeación guardada correctamente")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (saved) {
      await page.getByTestId("cancel-cell-btn").click();
      await expect(popover).toHaveCount(0, { timeout: 5000 });
    }
  }

  await waitForMatrixReady(page);
}

export async function markPaidFromQuickEntry(page: Page, amount: string) {
  await page.getByTestId("payment-amount-input").fill(amount);
  await page.getByTestId("confirm-payment-btn").click();

  const popover = page.getByTestId("quick-entry-popover");
  const closed = await popover
    .waitFor({ state: "hidden", timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  if (!closed) {
    const paid = await page
      .getByText("Pago confirmado correctamente")
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (paid) {
      await page.getByTestId("cancel-cell-btn").click();
      await expect(popover).toHaveCount(0, { timeout: 5000 });
    }
  }

  await waitForMatrixReady(page);
}

export async function getCellStyleClass(
  page: Page,
  categoryId: string,
  bucketId: string,
): Promise<string> {
  const cell = getMatrixCell(page, categoryId, bucketId);
  const styleNode = cell.getByTestId("cell-style");
  return (await styleNode.getAttribute("class")) || "";
}

export async function getHeaderByBucketId(page: Page, bucketId: string): Promise<Locator> {
  return page.locator(
    `[data-testid="matrix-header-cell"][data-bucket-id="${bucketId}"]`,
  );
}

export async function getBucketIdsWithStartDatePrefix(
  page: Page,
  startPrefix: string,
): Promise<string[]> {
  const headers = page.getByTestId("matrix-header-cell");
  const count = await headers.count();
  const ids: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const header = headers.nth(index);
    const startDate = await header.getAttribute("data-start-date");
    const bucketId = await header.getAttribute("data-bucket-id");

    if (startDate?.startsWith(startPrefix) && bucketId) {
      ids.push(bucketId);
    }
  }

  return ids;
}

const parseLabelAmount = (content: string, label: "P" | "R"): number => {
  const compact = content.replace(/\s+/g, " ").trim();
  const matcher = new RegExp(`${label}\\s*:\\s*(.*?)(?=\\s*[PR]\\s*:|$)`);
  const segment = compact.match(matcher)?.[1] || "";
  const numeric = Number(segment.replace(/[^0-9.-]/g, ""));

  return Number.isFinite(numeric) ? numeric : 0;
};
