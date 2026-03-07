// Using globals instead of imports since globals: true in Vitest config
import {
  FinancialMatrixService,
  FinancialMatrixRepository,
} from "../../../apps/web/lib/services/FinancialMatrixService";
import { DateBucketService } from "../../../apps/web/lib/services/DateBucketService";
import { Ok, Result, ResultFailure } from "@sass-store/core/src/result";
import { DomainError } from "@sass-store/core/src/errors/types";

const createRepositoryMock = (
  overrides: Partial<FinancialMatrixRepository> = {},
): FinancialMatrixRepository => {
  const base: FinancialMatrixRepository = {
    getTenantById: async (tenantId) =>
      Ok({ id: tenantId, timezone: "America/Mexico_City" }),
    getCategoryById: async (categoryId) =>
      Ok({
        id: categoryId,
        tenantId: "tenant-a",
        type: "expense",
        name: "Supplies",
        color: null,
        icon: null,
        parentId: null,
        sortOrder: 1,
      }),
    listCategories: async () =>
      Ok([
        {
          id: "cat-expense",
          tenantId: "tenant-a",
          type: "expense",
          name: "Supplies",
          color: null,
          icon: null,
          parentId: null,
          sortOrder: 1,
        },
      ]),
    listPlanningCells: async () =>
      Ok([
        {
          id: "cell-1",
          tenantId: "tenant-a",
          categoryId: "cat-expense",
          bucketId: "M2026-03",
          bucketType: "month",
          bucketStartDate: "2026-03-01",
          bucketEndDate: "2026-03-31",
          projectedAmount: "100.00",
          realAmount: "0.00",
          entityId: null,
          notes: null,
          isOverBudget: false,
          updatedAt: new Date(),
        },
      ]),
    findPlanningCell: async () => Ok(null),
    insertPlanningCell: async () =>
      Ok({
        id: "cell-new",
        tenantId: "tenant-a",
        categoryId: "cat-expense",
        bucketId: "M2026-03",
        bucketType: "month",
        bucketStartDate: "2026-03-01",
        bucketEndDate: "2026-03-31",
        projectedAmount: "100.00",
        realAmount: "0.00",
        entityId: null,
        notes: null,
        isOverBudget: false,
        updatedAt: new Date(),
      }),
    updatePlanningCell: async () =>
      Ok({
        id: "cell-updated",
        tenantId: "tenant-a",
        categoryId: "cat-expense",
        bucketId: "M2026-03",
        bucketType: "month",
        bucketStartDate: "2026-03-01",
        bucketEndDate: "2026-03-31",
        projectedAmount: "100.00",
        realAmount: "0.00",
        entityId: null,
        notes: null,
        isOverBudget: false,
        updatedAt: new Date(),
      }),
    listMovements: async () =>
      Ok([
        {
          id: "mv-1",
          tenantId: "tenant-a",
          categoryId: "cat-expense",
          type: "WITHDRAWAL",
          amount: "120.00",
          fechaProgramada: "2026-03-10",
          fechaPago: "2026-03-11",
          status: "paid",
          entityId: null,
          createdAt: new Date(),
        },
      ]),
    insertMovement: async () =>
      Ok({
        id: "mv-created",
        tenantId: "tenant-a",
        categoryId: "cat-expense",
        type: "WITHDRAWAL",
        amount: "50.00",
        fechaProgramada: "2026-03-15",
        fechaPago: "2026-03-15",
        status: "paid",
        entityId: null,
        createdAt: new Date(),
      }),
    listMonthPlanningCells: async () =>
      Ok([
        {
          id: "source-1",
          tenantId: "tenant-a",
          categoryId: "cat-expense",
          bucketId: "M2026-03",
          bucketType: "month",
          bucketStartDate: "2026-03-01",
          bucketEndDate: "2026-03-31",
          projectedAmount: "100.00",
          realAmount: "0.00",
          entityId: null,
          notes: "copy",
          isOverBudget: false,
          updatedAt: new Date(),
        },
      ]),
  };

  return {
    ...base,
    ...overrides,
  };
};

describe("FinancialMatrixService", () => {
  it("aggregates matrix data and sets over-budget for expense category", async () => {
    const service = new FinancialMatrixService(createRepositoryMock(), new DateBucketService());

    const result = await service.getMatrixData({
      tenantId: "tenant-a",
      granularity: "month",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-31"),
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.timeBuckets).toHaveLength(1);
    expect(result.data.cells).toHaveLength(1);
    expect(result.data.cells[0].projectedAmount).toBe("100.00");
    expect(result.data.cells[0].realAmount).toBe("120.00");
    expect(result.data.cells[0].isOverBudget).toBe(true);
  });

  it("returns empty cells when there are no real planning or movement records", async () => {
    const repo = createRepositoryMock({
      listPlanningCells: async () => Ok([]),
      listMovements: async () => Ok([]),
    });

    const service = new FinancialMatrixService(repo, new DateBucketService());

    const result = await service.getMatrixData({
      tenantId: "tenant-a",
      granularity: "month",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-03-31"),
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.timeBuckets).toHaveLength(1);
    expect(result.data.categories).toHaveLength(1);
    expect(result.data.cells).toHaveLength(0);
    expect(result.data.totals.expense.projected).toBe("0.00");
    expect(result.data.totals.expense.real).toBe("0.00");
    expect(result.data.totals.income.projected).toBe("0.00");
    expect(result.data.totals.income.real).toBe("0.00");
  });

  it("blocks cross-tenant category access in projected cell upsert", async () => {
    const repo = createRepositoryMock({
      getCategoryById: async () =>
        Ok({
          id: "cat-cross",
          tenantId: "tenant-b",
          type: "expense",
          name: "Other Tenant",
          color: null,
          icon: null,
          parentId: null,
          sortOrder: 1,
        }),
    });

    const service = new FinancialMatrixService(repo, new DateBucketService());

    const result = await service.upsertProjectedCell({
      tenantId: "tenant-a",
      categoryId: "cat-cross",
      granularity: "month",
      bucketId: "M2026-03",
      bucketStartDate: new Date("2026-03-01"),
      bucketEndDate: new Date("2026-03-31"),
      projectedAmount: "200.00",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const errorResult = result as ResultFailure<DomainError>;
    expect(errorResult.error.type).toBe("TenantError");
  });
});

