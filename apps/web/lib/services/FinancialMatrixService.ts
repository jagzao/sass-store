import { db, withTenantContext } from "@sass-store/database";
import {
  financialMovements,
  financialPlanningCells,
  tenants,
  transactionCategories,
} from "@sass-store/database/schema";
import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
} from "drizzle-orm";
import { Result, Ok, Err, fromPromise, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  DateBucket,
  MatrixGranularity,
  dateBucketService,
  DateBucketService,
} from "./DateBucketService";

export interface MatrixLoadParams {
  tenantId: string;
  granularity: MatrixGranularity;
  startDate: Date;
  endDate: Date;
  entityId?: string;
}

export interface MatrixCategory {
  id: string;
  type: "income" | "expense";
  name: string;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isGroup: boolean;
}

export interface MatrixCell {
  categoryId: string;
  bucketId: string;
  projectedAmount: string;
  realAmount: string;
  isOverBudget: boolean;
  movementCount: number;
}

export interface MatrixData {
  tenantId: string;
  granularity: MatrixGranularity;
  dateRange: {
    start: string;
    end: string;
  };
  timeBuckets: DateBucket[];
  categories: MatrixCategory[];
  cells: MatrixCell[];
  totals: {
    income: { projected: string; real: string };
    expense: { projected: string; real: string };
    net: string;
  };
  metadata: {
    currency: string;
    timezone: string;
    generatedAt: string;
  };
}

export interface UpsertProjectedCellInput {
  tenantId: string;
  categoryId: string;
  granularity: MatrixGranularity;
  bucketId?: string;
  bucketStartDate: Date;
  bucketEndDate: Date;
  projectedAmount: string;
  entityId?: string;
  notes?: string;
}

export interface UpsertProjectedCellOutput {
  cellId: string;
  categoryId: string;
  bucketId: string;
  bucketType: MatrixGranularity;
  bucketStartDate: string;
  bucketEndDate: string;
  projectedAmount: string;
  realAmount: string;
  isOverBudget: boolean;
  updatedAt: string;
}

export interface MarkPaidInput {
  tenantId: string;
  categoryId: string;
  amount: string;
  fechaProgramada: Date;
  fechaPago?: Date;
  entityId?: string;
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
  counterparty?: string;
}

export interface MarkPaidOutput {
  movementId: string;
  categoryId: string;
  amount: string;
  fechaProgramada: string;
  fechaPago: string;
  status: string;
  createdAt: string;
}

export interface CloneMonthInput {
  tenantId: string;
  sourceBucketId: string;
  targetBucketId: string;
  categoryIds?: string[];
}

export interface CloneMonthOutput {
  clonedCells: number;
  sourceBucket: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
  };
  targetBucket: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
  };
  clonedAt: string;
}

interface TenantRow {
  id: string;
  timezone: string;
}

interface CategoryRow {
  id: string;
  tenantId: string;
  type: string;
  name: string;
  color: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number | null;
}

interface PlanningCellRow {
  id: string;
  tenantId: string;
  categoryId: string;
  bucketId: string;
  bucketType: string;
  bucketStartDate: string;
  bucketEndDate: string;
  projectedAmount: string;
  realAmount: string;
  entityId: string | null;
  notes: string | null;
  isOverBudget: boolean;
  updatedAt: Date | null;
}

interface MovementRow {
  id: string;
  tenantId: string;
  categoryId: string | null;
  type: string;
  amount: string;
  fechaProgramada: string;
  fechaPago: string | null;
  status: string;
  entityId: string | null;
  createdAt: Date | null;
}

export interface FinancialMatrixRepository {
  getTenantById(tenantId: string): Promise<Result<TenantRow, DomainError>>;
  getCategoryById(categoryId: string): Promise<Result<CategoryRow, DomainError>>;
  listCategories(tenantId: string): Promise<Result<CategoryRow[], DomainError>>;
  listPlanningCells(params: {
    tenantId: string;
    granularity: MatrixGranularity;
    startDate: string;
    endDate: string;
    entityId?: string;
  }): Promise<Result<PlanningCellRow[], DomainError>>;
  findPlanningCell(params: {
    tenantId: string;
    categoryId: string;
    bucketId: string;
    bucketType: MatrixGranularity;
    entityId?: string;
  }): Promise<Result<PlanningCellRow | null, DomainError>>;
  insertPlanningCell(input: {
    tenantId: string;
    categoryId: string;
    bucketId: string;
    bucketType: MatrixGranularity;
    bucketStartDate: string;
    bucketEndDate: string;
    projectedAmount: string;
    entityId?: string;
    notes?: string;
  }): Promise<Result<PlanningCellRow, DomainError>>;
  updatePlanningCell(
    tenantId: string,
    id: string,
    updates: {
      bucketStartDate: string;
      bucketEndDate: string;
      projectedAmount: string;
      notes?: string;
      isOverBudget: boolean;
    },
  ): Promise<Result<PlanningCellRow, DomainError>>;
  listMovements(params: {
    tenantId: string;
    startDate: string;
    endDate: string;
    entityId?: string;
  }): Promise<Result<MovementRow[], DomainError>>;
  insertMovement(input: {
    tenantId: string;
    categoryId: string;
    entityId?: string;
    type: string;
    amount: string;
    description?: string;
    paymentMethod?: string;
    referenceId?: string;
    counterparty?: string;
    fechaProgramada: string;
    fechaPago: string;
    status: string;
    movementDate: string;
  }): Promise<Result<MovementRow, DomainError>>;
  listMonthPlanningCells(params: {
    tenantId: string;
    bucketId: string;
    categoryIds?: string[];
  }): Promise<Result<PlanningCellRow[], DomainError>>;
}

const asDateOnly = (value: Date | string): string =>
  new Date(value).toISOString().slice(0, 10);

const asMoney = (value: string | number): string => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return "0.00";
  }
  return parsed.toFixed(2);
};

const toNumber = (value: string | number | null | undefined): number =>
  Number(value ?? 0);

const mapCategoryTypeToMovementType = (categoryType: string): string =>
  categoryType === "income" ? "SETTLEMENT" : "WITHDRAWAL";

const parseMonthBucketId = (
  bucketId: string,
): Result<{ year: number; month: number }, DomainError> => {
  const match = /^M(\d{4})-(\d{2})$/.exec(bucketId);
  if (!match) {
    return Err(
      ErrorFactories.cloneOperation(
        bucketId,
        bucketId,
        `Invalid month bucket id format: ${bucketId}`,
      ),
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    return Err(
      ErrorFactories.cloneOperation(
        bucketId,
        bucketId,
        `Invalid month in bucket id: ${bucketId}`,
      ),
    );
  }

  return Ok({ year, month });
};

const buildMonthRange = (bucketId: string): Result<{ start: string; end: string }, DomainError> => {
  const parsed = parseMonthBucketId(bucketId);
  if (isFailure(parsed)) {
    return parsed;
  }

  const { year, month } = parsed.data;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return Ok({ start: asDateOnly(start), end: asDateOnly(end) });
};

class DbFinancialMatrixRepository implements FinancialMatrixRepository {
  async getTenantById(tenantId: string): Promise<Result<TenantRow, DomainError>> {
    const tenantResult = await fromPromise(
      db.select({ id: tenants.id, timezone: tenants.timezone }).from(tenants).where(eq(tenants.id, tenantId)).limit(1),
      (error) =>
        ErrorFactories.database(
          "get_tenant_by_id",
          `Failed to load tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
    );

    if (isFailure(tenantResult)) {
      return tenantResult;
    }

    if (tenantResult.data.length === 0) {
      return Err(ErrorFactories.notFound("Tenant", tenantId));
    }

    return Ok(tenantResult.data[0]);
  }

  async getCategoryById(categoryId: string): Promise<Result<CategoryRow, DomainError>> {
    const categoryResult = await fromPromise(
      db
        .select({
          id: transactionCategories.id,
          tenantId: transactionCategories.tenantId,
          type: transactionCategories.type,
          name: transactionCategories.name,
          color: transactionCategories.color,
          icon: transactionCategories.icon,
          parentId: transactionCategories.parentId,
          sortOrder: transactionCategories.sortOrder,
        })
        .from(transactionCategories)
        .where(eq(transactionCategories.id, categoryId))
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "get_category_by_id",
          `Failed to load category ${categoryId}`,
          undefined,
          error as Error,
        ),
    );

    if (isFailure(categoryResult)) {
      return categoryResult;
    }

    if (categoryResult.data.length === 0) {
      return Err(ErrorFactories.notFound("TransactionCategory", categoryId));
    }

    return Ok(categoryResult.data[0]);
  }

  async listCategories(tenantId: string): Promise<Result<CategoryRow[], DomainError>> {
    return fromPromise(
      withTenantContext(db, tenantId, null, async (tx) =>
        tx
          .select({
            id: transactionCategories.id,
            tenantId: transactionCategories.tenantId,
            type: transactionCategories.type,
            name: transactionCategories.name,
            color: transactionCategories.color,
            icon: transactionCategories.icon,
            parentId: transactionCategories.parentId,
            sortOrder: transactionCategories.sortOrder,
          })
          .from(transactionCategories)
          .where(eq(transactionCategories.tenantId, tenantId))
          .orderBy(asc(transactionCategories.sortOrder), asc(transactionCategories.name)),
      ),
      (error) =>
        ErrorFactories.database(
          "list_categories",
          `Failed to list categories for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
    );
  }

  async listPlanningCells(params: {
    tenantId: string;
    granularity: MatrixGranularity;
    startDate: string;
    endDate: string;
    entityId?: string;
  }): Promise<Result<PlanningCellRow[], DomainError>> {
    const filters = [
      eq(financialPlanningCells.tenantId, params.tenantId),
      eq(financialPlanningCells.bucketType, params.granularity),
      lte(financialPlanningCells.bucketStartDate, params.endDate),
      gte(financialPlanningCells.bucketEndDate, params.startDate),
    ];

    if (params.entityId) {
      filters.push(eq(financialPlanningCells.entityId, params.entityId));
    }

    return fromPromise(
      withTenantContext(db, params.tenantId, null, async (tx) =>
        tx
          .select({
            id: financialPlanningCells.id,
            tenantId: financialPlanningCells.tenantId,
            categoryId: financialPlanningCells.categoryId,
            bucketId: financialPlanningCells.bucketId,
            bucketType: financialPlanningCells.bucketType,
            bucketStartDate: financialPlanningCells.bucketStartDate,
            bucketEndDate: financialPlanningCells.bucketEndDate,
            projectedAmount: financialPlanningCells.projectedAmount,
            realAmount: financialPlanningCells.realAmount,
            entityId: financialPlanningCells.entityId,
            notes: financialPlanningCells.notes,
            isOverBudget: financialPlanningCells.isOverBudget,
            updatedAt: financialPlanningCells.updatedAt,
          })
          .from(financialPlanningCells)
          .where(and(...filters)),
      ),
      (error) =>
        ErrorFactories.database(
          "list_planning_cells",
          `Failed to list planning cells for tenant ${params.tenantId}`,
          undefined,
          error as Error,
        ),
    );
  }

  async findPlanningCell(params: {
    tenantId: string;
    categoryId: string;
    bucketId: string;
    bucketType: MatrixGranularity;
    entityId?: string;
  }): Promise<Result<PlanningCellRow | null, DomainError>> {
    const entityFilter = params.entityId
      ? eq(financialPlanningCells.entityId, params.entityId)
      : isNull(financialPlanningCells.entityId);

    const lookupResult = await fromPromise(
      withTenantContext(db, params.tenantId, null, async (tx) =>
        tx
          .select({
            id: financialPlanningCells.id,
            tenantId: financialPlanningCells.tenantId,
            categoryId: financialPlanningCells.categoryId,
            bucketId: financialPlanningCells.bucketId,
            bucketType: financialPlanningCells.bucketType,
            bucketStartDate: financialPlanningCells.bucketStartDate,
            bucketEndDate: financialPlanningCells.bucketEndDate,
            projectedAmount: financialPlanningCells.projectedAmount,
            realAmount: financialPlanningCells.realAmount,
            entityId: financialPlanningCells.entityId,
            notes: financialPlanningCells.notes,
            isOverBudget: financialPlanningCells.isOverBudget,
            updatedAt: financialPlanningCells.updatedAt,
          })
          .from(financialPlanningCells)
          .where(
            and(
              eq(financialPlanningCells.tenantId, params.tenantId),
              eq(financialPlanningCells.categoryId, params.categoryId),
              eq(financialPlanningCells.bucketId, params.bucketId),
              eq(financialPlanningCells.bucketType, params.bucketType),
              entityFilter,
            ),
          )
          .limit(1),
      ),
      (error) =>
        ErrorFactories.database(
          "find_planning_cell",
          "Failed to find planning cell",
          undefined,
          error as Error,
        ),
    );

    if (isFailure(lookupResult)) {
      return lookupResult;
    }

    return Ok(lookupResult.data[0] ?? null);
  }

  async insertPlanningCell(input: {
    tenantId: string;
    categoryId: string;
    bucketId: string;
    bucketType: MatrixGranularity;
    bucketStartDate: string;
    bucketEndDate: string;
    projectedAmount: string;
    entityId?: string;
    notes?: string;
  }): Promise<Result<PlanningCellRow, DomainError>> {
    const insertResult = await fromPromise(
      withTenantContext(db, input.tenantId, null, async (tx) =>
        tx
          .insert(financialPlanningCells)
          .values({
            tenantId: input.tenantId,
            categoryId: input.categoryId,
            bucketId: input.bucketId,
            bucketType: input.bucketType,
            bucketStartDate: input.bucketStartDate,
            bucketEndDate: input.bucketEndDate,
            projectedAmount: input.projectedAmount,
            entityId: input.entityId,
            notes: input.notes,
            isOverBudget: false,
          })
          .returning({
            id: financialPlanningCells.id,
            tenantId: financialPlanningCells.tenantId,
            categoryId: financialPlanningCells.categoryId,
            bucketId: financialPlanningCells.bucketId,
            bucketType: financialPlanningCells.bucketType,
            bucketStartDate: financialPlanningCells.bucketStartDate,
            bucketEndDate: financialPlanningCells.bucketEndDate,
            projectedAmount: financialPlanningCells.projectedAmount,
            realAmount: financialPlanningCells.realAmount,
            entityId: financialPlanningCells.entityId,
            notes: financialPlanningCells.notes,
            isOverBudget: financialPlanningCells.isOverBudget,
            updatedAt: financialPlanningCells.updatedAt,
          }),
      ),
      (error) =>
        ErrorFactories.database(
          "insert_planning_cell",
          "Failed to insert planning cell",
          undefined,
          error as Error,
        ),
    );

    if (isFailure(insertResult)) {
      return insertResult;
    }

    return Ok(insertResult.data[0]);
  }

  async updatePlanningCell(
    tenantId: string,
    id: string,
    updates: {
      bucketStartDate: string;
      bucketEndDate: string;
      projectedAmount: string;
      notes?: string;
      isOverBudget: boolean;
    },
  ): Promise<Result<PlanningCellRow, DomainError>> {
    const updateResult = await fromPromise(
      withTenantContext(db, tenantId, null, async (tx) =>
        tx
          .update(financialPlanningCells)
          .set({
            bucketStartDate: updates.bucketStartDate,
            bucketEndDate: updates.bucketEndDate,
            projectedAmount: updates.projectedAmount,
            notes: updates.notes,
            isOverBudget: updates.isOverBudget,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(financialPlanningCells.id, id),
              eq(financialPlanningCells.tenantId, tenantId),
            ),
          )
          .returning({
            id: financialPlanningCells.id,
            tenantId: financialPlanningCells.tenantId,
            categoryId: financialPlanningCells.categoryId,
            bucketId: financialPlanningCells.bucketId,
            bucketType: financialPlanningCells.bucketType,
            bucketStartDate: financialPlanningCells.bucketStartDate,
            bucketEndDate: financialPlanningCells.bucketEndDate,
            projectedAmount: financialPlanningCells.projectedAmount,
            realAmount: financialPlanningCells.realAmount,
            entityId: financialPlanningCells.entityId,
            notes: financialPlanningCells.notes,
            isOverBudget: financialPlanningCells.isOverBudget,
            updatedAt: financialPlanningCells.updatedAt,
          }),
      ),
      (error) =>
        ErrorFactories.database(
          "update_planning_cell",
          `Failed to update planning cell ${id}`,
          undefined,
          error as Error,
        ),
    );

    if (isFailure(updateResult)) {
      return updateResult;
    }

    if (updateResult.data.length === 0) {
      return Err(ErrorFactories.notFound("FinancialPlanningCell", id));
    }

    return Ok(updateResult.data[0]);
  }

  async listMovements(params: {
    tenantId: string;
    startDate: string;
    endDate: string;
    entityId?: string;
  }): Promise<Result<MovementRow[], DomainError>> {
    const baseFilters = [eq(financialMovements.tenantId, params.tenantId)];

    if (params.entityId) {
      baseFilters.push(eq(financialMovements.entityId, params.entityId));
    }

    return fromPromise(
      withTenantContext(db, params.tenantId, null, async (tx) =>
        tx
          .select({
            id: financialMovements.id,
            tenantId: financialMovements.tenantId,
            categoryId: financialMovements.categoryId,
            type: financialMovements.type,
            amount: financialMovements.amount,
            fechaProgramada: financialMovements.fechaProgramada,
            fechaPago: financialMovements.fechaPago,
            status: financialMovements.status,
            entityId: financialMovements.entityId,
            createdAt: financialMovements.createdAt,
          })
          .from(financialMovements)
          .where(
            and(
              ...baseFilters,
              or(
                and(
                  gte(financialMovements.fechaProgramada, params.startDate),
                  lte(financialMovements.fechaProgramada, params.endDate),
                ),
                and(
                  gte(financialMovements.fechaPago, params.startDate),
                  lte(financialMovements.fechaPago, params.endDate),
                ),
              ),
            ),
          ),
      ),
      (error) =>
        ErrorFactories.database(
          "list_movements",
          "Failed to list financial movements",
          undefined,
          error as Error,
        ),
    );
  }

  async insertMovement(input: {
    tenantId: string;
    categoryId: string;
    entityId?: string;
    type: string;
    amount: string;
    description?: string;
    paymentMethod?: string;
    referenceId?: string;
    counterparty?: string;
    fechaProgramada: string;
    fechaPago: string;
    status: string;
    movementDate: string;
  }): Promise<Result<MovementRow, DomainError>> {
    const insertResult = await fromPromise(
      withTenantContext(db, input.tenantId, null, async (tx) =>
        tx
          .insert(financialMovements)
          .values({
            tenantId: input.tenantId,
            categoryId: input.categoryId,
            entityId: input.entityId,
            type: input.type,
            amount: input.amount,
            description: input.description,
            paymentMethod: input.paymentMethod,
            referenceId: input.referenceId,
            counterparty: input.counterparty,
            fechaProgramada: input.fechaProgramada,
            fechaPago: input.fechaPago,
            status: input.status,
            movementDate: input.movementDate,
          })
          .returning({
            id: financialMovements.id,
            tenantId: financialMovements.tenantId,
            categoryId: financialMovements.categoryId,
            type: financialMovements.type,
            amount: financialMovements.amount,
            fechaProgramada: financialMovements.fechaProgramada,
            fechaPago: financialMovements.fechaPago,
            status: financialMovements.status,
            entityId: financialMovements.entityId,
            createdAt: financialMovements.createdAt,
          }),
      ),
      (error) =>
        ErrorFactories.database(
          "insert_movement",
          "Failed to insert financial movement",
          undefined,
          error as Error,
        ),
    );

    if (isFailure(insertResult)) {
      return insertResult;
    }

    return Ok(insertResult.data[0]);
  }

  async listMonthPlanningCells(params: {
    tenantId: string;
    bucketId: string;
    categoryIds?: string[];
  }): Promise<Result<PlanningCellRow[], DomainError>> {
    const filters = [
      eq(financialPlanningCells.tenantId, params.tenantId),
      eq(financialPlanningCells.bucketType, "month"),
      eq(financialPlanningCells.bucketId, params.bucketId),
    ];

    if (params.categoryIds && params.categoryIds.length > 0) {
      filters.push(inArray(financialPlanningCells.categoryId, params.categoryIds));
    }

    return fromPromise(
      withTenantContext(db, params.tenantId, null, async (tx) =>
        tx
          .select({
            id: financialPlanningCells.id,
            tenantId: financialPlanningCells.tenantId,
            categoryId: financialPlanningCells.categoryId,
            bucketId: financialPlanningCells.bucketId,
            bucketType: financialPlanningCells.bucketType,
            bucketStartDate: financialPlanningCells.bucketStartDate,
            bucketEndDate: financialPlanningCells.bucketEndDate,
            projectedAmount: financialPlanningCells.projectedAmount,
            realAmount: financialPlanningCells.realAmount,
            entityId: financialPlanningCells.entityId,
            notes: financialPlanningCells.notes,
            isOverBudget: financialPlanningCells.isOverBudget,
            updatedAt: financialPlanningCells.updatedAt,
          })
          .from(financialPlanningCells)
          .where(and(...filters)),
      ),
      (error) =>
        ErrorFactories.database(
          "list_month_planning_cells",
          "Failed to list source month planning cells",
          undefined,
          error as Error,
        ),
    );
  }
}

export class FinancialMatrixService {
  constructor(
    private readonly repository: FinancialMatrixRepository = new DbFinancialMatrixRepository(),
    private readonly bucketService: DateBucketService = dateBucketService,
  ) {}

  async getMatrixData(params: MatrixLoadParams): Promise<Result<MatrixData, DomainError>> {
    const start = asDateOnly(params.startDate);
    const end = asDateOnly(params.endDate);

    if (start > end) {
      return Err(ErrorFactories.invalidDateRange(start, end));
    }

    const tenantResult = await this.repository.getTenantById(params.tenantId);
    if (isFailure(tenantResult)) {
      return tenantResult;
    }

    const bucketsResult = this.bucketService.generateBuckets(
      params.granularity,
      params.startDate,
      params.endDate,
    );
    if (isFailure(bucketsResult)) {
      return bucketsResult;
    }

    const categoriesResult = await this.repository.listCategories(params.tenantId);
    if (isFailure(categoriesResult)) {
      return categoriesResult;
    }

    const planningResult = await this.repository.listPlanningCells({
      tenantId: params.tenantId,
      granularity: params.granularity,
      startDate: start,
      endDate: end,
      entityId: params.entityId,
    });
    if (isFailure(planningResult)) {
      return planningResult;
    }

    const movementsResult = await this.repository.listMovements({
      tenantId: params.tenantId,
      startDate: start,
      endDate: end,
      entityId: params.entityId,
    });
    if (isFailure(movementsResult)) {
      return movementsResult;
    }

    const bucketIds = new Set(bucketsResult.data.map((bucket) => bucket.id));
    const categories = categoriesResult.data.map<MatrixCategory>((category) => ({
      id: category.id,
      type: category.type === "income" ? "income" : "expense",
      name: category.name,
      color: category.color,
      icon: category.icon,
      parentId: category.parentId,
      sortOrder: category.sortOrder ?? 0,
      isGroup: false,
    }));

    const categoryTypeMap = new Map(categories.map((category) => [category.id, category.type]));

    const cellMap = new Map<string, MatrixCell>();

    for (const planning of planningResult.data) {
      if (!bucketIds.has(planning.bucketId)) {
        continue;
      }

      if (!categoryTypeMap.has(planning.categoryId)) {
        continue;
      }

      const key = `${planning.categoryId}::${planning.bucketId}`;
      const existing = cellMap.get(key);

      cellMap.set(key, {
        categoryId: planning.categoryId,
        bucketId: planning.bucketId,
        projectedAmount: asMoney(planning.projectedAmount),
        realAmount: existing?.realAmount ?? "0.00",
        isOverBudget: existing?.isOverBudget ?? false,
        movementCount: existing?.movementCount ?? 0,
      });
    }

    for (const movement of movementsResult.data) {
      if (!movement.categoryId) {
        continue;
      }

      if (!categoryTypeMap.has(movement.categoryId)) {
        continue;
      }

      const referenceDate = movement.fechaPago ?? movement.fechaProgramada;
      const bucketResult = this.bucketService.getBucketForDate(
        params.granularity,
        referenceDate,
      );

      if (isFailure(bucketResult)) {
        return bucketResult;
      }

      const bucketId = bucketResult.data.id;
      if (!bucketIds.has(bucketId)) {
        continue;
      }

      const key = `${movement.categoryId}::${bucketId}`;
      const existing = cellMap.get(key);
      if (existing) {
        const nextReal = toNumber(existing.realAmount) + toNumber(movement.amount);
        cellMap.set(key, {
          ...existing,
          realAmount: asMoney(nextReal),
          movementCount: existing.movementCount + 1,
        });
        continue;
      }

      cellMap.set(key, {
        categoryId: movement.categoryId,
        bucketId,
        projectedAmount: "0.00",
        realAmount: asMoney(movement.amount),
        isOverBudget: false,
        movementCount: 1,
      });
    }

    for (const [key, cell] of cellMap.entries()) {
      const categoryId = key.split("::")[0] ?? "";
      const categoryType = categoryTypeMap.get(categoryId);
      if (!categoryType) {
        continue;
      }

      const projected = toNumber(cell.projectedAmount);
      const real = toNumber(cell.realAmount);
      const isOverBudget = categoryType === "expense" ? real > projected && projected > 0 : false;
      cellMap.set(key, { ...cell, isOverBudget });
    }

    let incomeProjected = 0;
    let incomeReal = 0;
    let expenseProjected = 0;
    let expenseReal = 0;

    for (const cell of cellMap.values()) {
      const categoryType = categoryTypeMap.get(cell.categoryId);
      if (!categoryType) {
        continue;
      }

      if (categoryType === "income") {
        incomeProjected += toNumber(cell.projectedAmount);
        incomeReal += toNumber(cell.realAmount);
      } else {
        expenseProjected += toNumber(cell.projectedAmount);
        expenseReal += toNumber(cell.realAmount);
      }
    }

    return Ok({
      tenantId: params.tenantId,
      granularity: params.granularity,
      dateRange: {
        start,
        end,
      },
      timeBuckets: bucketsResult.data,
      categories,
      cells: Array.from(cellMap.values()),
      totals: {
        income: {
          projected: asMoney(incomeProjected),
          real: asMoney(incomeReal),
        },
        expense: {
          projected: asMoney(expenseProjected),
          real: asMoney(expenseReal),
        },
        net: asMoney(incomeReal - expenseReal),
      },
      metadata: {
        currency: "MXN",
        timezone: tenantResult.data.timezone,
        generatedAt: new Date().toISOString(),
      },
    });
  }

  async upsertProjectedCell(
    input: UpsertProjectedCellInput,
  ): Promise<Result<UpsertProjectedCellOutput, DomainError>> {
    const rangeStart = asDateOnly(input.bucketStartDate);
    const rangeEnd = asDateOnly(input.bucketEndDate);
    if (rangeStart > rangeEnd) {
      return Err(ErrorFactories.invalidDateRange(rangeStart, rangeEnd));
    }

    const categoryResult = await this.repository.getCategoryById(input.categoryId);
    if (isFailure(categoryResult)) {
      return categoryResult;
    }

    if (categoryResult.data.tenantId !== input.tenantId) {
      return Err(
        ErrorFactories.tenant(
          "upsert_matrix_cell",
          "Forbidden tenant access for category",
          input.tenantId,
        ),
      );
    }

    const bucketId =
      input.bucketId ??
      (() => {
        const bucket = this.bucketService.getBucketForDate(
          input.granularity,
          input.bucketStartDate,
        );
        if (isFailure(bucket)) {
          return null;
        }
        return bucket.data.id;
      })();

    if (!bucketId) {
      return Err(
        ErrorFactories.matrix(
          "upsert_matrix_cell",
          "Unable to derive bucket id from provided dates",
          input.tenantId,
        ),
      );
    }

    const existingResult = await this.repository.findPlanningCell({
      tenantId: input.tenantId,
      categoryId: input.categoryId,
      bucketId,
      bucketType: input.granularity,
      entityId: input.entityId,
    });
    if (isFailure(existingResult)) {
      return existingResult;
    }

    const projectedAmount = asMoney(input.projectedAmount);
    const isOverBudget =
      categoryResult.data.type !== "income" &&
      toNumber(existingResult.data?.realAmount) > toNumber(projectedAmount);

    if (!existingResult.data) {
      const createdResult = await this.repository.insertPlanningCell({
        tenantId: input.tenantId,
        categoryId: input.categoryId,
        bucketId,
        bucketType: input.granularity,
        bucketStartDate: rangeStart,
        bucketEndDate: rangeEnd,
        projectedAmount,
        entityId: input.entityId,
        notes: input.notes,
      });

      if (isFailure(createdResult)) {
        return createdResult;
      }

      const created = createdResult.data;
      return Ok({
        cellId: created.id,
        categoryId: created.categoryId,
        bucketId: created.bucketId,
        bucketType: input.granularity,
        bucketStartDate: created.bucketStartDate,
        bucketEndDate: created.bucketEndDate,
        projectedAmount: asMoney(created.projectedAmount),
        realAmount: asMoney(created.realAmount),
        isOverBudget,
        updatedAt: (created.updatedAt ?? new Date()).toISOString(),
      });
    }

    const updatedResult = await this.repository.updatePlanningCell(
      input.tenantId,
      existingResult.data.id,
      {
        bucketStartDate: rangeStart,
        bucketEndDate: rangeEnd,
        projectedAmount,
        notes: input.notes,
        isOverBudget,
      },
    );

    if (isFailure(updatedResult)) {
      return updatedResult;
    }

    const updated = updatedResult.data;
    return Ok({
      cellId: updated.id,
      categoryId: updated.categoryId,
      bucketId: updated.bucketId,
      bucketType: input.granularity,
      bucketStartDate: updated.bucketStartDate,
      bucketEndDate: updated.bucketEndDate,
      projectedAmount: asMoney(updated.projectedAmount),
      realAmount: asMoney(updated.realAmount),
      isOverBudget: updated.isOverBudget,
      updatedAt: (updated.updatedAt ?? new Date()).toISOString(),
    });
  }

  async markAsPaid(input: MarkPaidInput): Promise<Result<MarkPaidOutput, DomainError>> {
    const categoryResult = await this.repository.getCategoryById(input.categoryId);
    if (isFailure(categoryResult)) {
      return categoryResult;
    }

    if (categoryResult.data.tenantId !== input.tenantId) {
      return Err(
        ErrorFactories.tenant(
          "mark_as_paid",
          "Forbidden tenant access for category",
          input.tenantId,
        ),
      );
    }

    const fechaProgramada = asDateOnly(input.fechaProgramada);
    const fechaPago = asDateOnly(input.fechaPago ?? input.fechaProgramada);

    const movementResult = await this.repository.insertMovement({
      tenantId: input.tenantId,
      categoryId: input.categoryId,
      entityId: input.entityId,
      type: mapCategoryTypeToMovementType(categoryResult.data.type),
      amount: asMoney(input.amount),
      description: input.description,
      paymentMethod: input.paymentMethod,
      referenceId: input.referenceId,
      counterparty: input.counterparty,
      fechaProgramada,
      fechaPago,
      status: "paid",
      movementDate: fechaPago,
    });

    if (isFailure(movementResult)) {
      return movementResult;
    }

    const movement = movementResult.data;
    return Ok({
      movementId: movement.id,
      categoryId: movement.categoryId ?? input.categoryId,
      amount: asMoney(movement.amount),
      fechaProgramada: movement.fechaProgramada,
      fechaPago: movement.fechaPago ?? fechaPago,
      status: movement.status,
      createdAt: (movement.createdAt ?? new Date()).toISOString(),
    });
  }

  async cloneMonthPlanning(
    input: CloneMonthInput,
  ): Promise<Result<CloneMonthOutput, DomainError>> {
    if (input.sourceBucketId === input.targetBucketId) {
      return Err(
        ErrorFactories.cloneOperation(
          input.sourceBucketId,
          input.targetBucketId,
          "Source and target month cannot be the same",
        ),
      );
    }

    const sourceRangeResult = buildMonthRange(input.sourceBucketId);
    if (isFailure(sourceRangeResult)) {
      return sourceRangeResult;
    }

    const targetRangeResult = buildMonthRange(input.targetBucketId);
    if (isFailure(targetRangeResult)) {
      return targetRangeResult;
    }

    const sourceCellsResult = await this.repository.listMonthPlanningCells({
      tenantId: input.tenantId,
      bucketId: input.sourceBucketId,
      categoryIds: input.categoryIds,
    });
    if (isFailure(sourceCellsResult)) {
      return sourceCellsResult;
    }

    if (sourceCellsResult.data.length === 0) {
      return Err(
        ErrorFactories.cloneOperation(
          input.sourceBucketId,
          input.targetBucketId,
          "Source month has no planning cells to clone",
        ),
      );
    }

    let clonedCells = 0;
    for (const sourceCell of sourceCellsResult.data) {
      const upsertResult = await this.upsertProjectedCell({
        tenantId: input.tenantId,
        categoryId: sourceCell.categoryId,
        granularity: "month",
        bucketId: input.targetBucketId,
        bucketStartDate: new Date(targetRangeResult.data.start),
        bucketEndDate: new Date(targetRangeResult.data.end),
        projectedAmount: sourceCell.projectedAmount,
        entityId: sourceCell.entityId ?? undefined,
        notes: sourceCell.notes ?? undefined,
      });

      if (isFailure(upsertResult)) {
        return upsertResult;
      }

      clonedCells += 1;
    }

    return Ok({
      clonedCells,
      sourceBucket: {
        id: input.sourceBucketId,
        label: input.sourceBucketId,
        startDate: sourceRangeResult.data.start,
        endDate: sourceRangeResult.data.end,
      },
      targetBucket: {
        id: input.targetBucketId,
        label: input.targetBucketId,
        startDate: targetRangeResult.data.start,
        endDate: targetRangeResult.data.end,
      },
      clonedAt: new Date().toISOString(),
    });
  }
}

export const financialMatrixService = new FinancialMatrixService();
