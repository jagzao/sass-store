import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import { financialMovements, tenants } from "@sass-store/database/schema";
import { and, gte, lte, sql, desc, eq } from "drizzle-orm";

// Import Result pattern utilities
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  withResultHandler,
  withQueryValidation,
} from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Validation schemas
const QuerySchema = z.object({
  type: z.string().optional(),
  paymentMethod: z.string().optional(),
  status: z.enum(["reconciled", "unreconciled"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().optional(),
  tenant: z.string().min(1, "Tenant parameter is required"),
  limit: CommonSchemas.positiveInt.getSchema().optional(),
  offset: CommonSchemas.nonNegativeInt.getSchema().optional(),
  sortBy: z.enum(["movementDate", "amount"]).default("movementDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Types
interface FinancialMovement {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  paymentMethod: string;
  counterparty?: string;
  movementDate: string;
  reconciled: boolean;
  reconciliationId?: string;
}

interface MovementResponse {
  data: FinancialMovement[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Service layer functions with Result pattern

/**
 * Get tenant by slug
 */
const getTenantBySlug = async (
  tenantSlug: string,
): Promise<Result<any, DomainError>> => {
  try {
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return Err(ErrorFactories.notFound("Tenant", tenantSlug));
    }

    return Ok(tenant);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "get_tenant",
        `Failed to get tenant: ${tenantSlug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Validate tenant access
 */
const validateTenantAccess = async (
  request: NextRequest,
  tenantId: string,
): Promise<Result<void, DomainError>> => {
  // TODO: Implement proper tenant access validation
  // For now, we'll assume it's handled by auth middleware
  return Ok(undefined);
};

/**
 * Build query conditions
 */
const buildQueryConditions = (params: any, tenantId: string) => {
  const conditions = [];

  // Always filter by tenant
  conditions.push(sql`tenant_id = ${tenantId}`);

  if (params.type) {
    conditions.push(sql`type = ${params.type}`);
  }

  if (params.paymentMethod) {
    conditions.push(sql`payment_method = ${params.paymentMethod}`);
  }

  if (params.status === "reconciled") {
    conditions.push(sql`reconciled = true`);
  } else if (params.status === "unreconciled") {
    conditions.push(sql`reconciled = false`);
  }

  if (params.from) {
    conditions.push(sql`movement_date >= ${params.from}`);
  }

  if (params.to) {
    conditions.push(sql`movement_date <= ${params.to}`);
  }

  if (params.search) {
    conditions.push(sql`description ILIKE ${"%" + params.search + "%"}`);
  }

  return and(...conditions);
};

/**
 * Query financial movements with Result pattern
 */
const queryFinancialMovements = async (
  params: any,
  tenantId: string,
): Promise<Result<FinancialMovement[], DomainError>> => {
  try {
    const whereClause = buildQueryConditions(params, tenantId);
    const orderClause = params.sortOrder === "desc" ? desc : (sql`` as any);

    const movementsResult = await db.execute(
      sql`
        SELECT 
          id,
          type,
          payment_method as "paymentMethod",
          reconciled,
          movement_date as "movementDate",
          description,
          reference_id as "referenceId",
          counterparty,
          amount,
          reconciliation_id as "reconciliationId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM financial_movements
        WHERE ${whereClause}
        ORDER BY ${params.sortBy === "amount" ? sql`amount ${orderClause}` : sql`movement_date ${orderClause}`}
        LIMIT ${params.limit}
        OFFSET ${params.offset}
      `,
    );

    const movements = movementsResult.rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      currency: "MXN",
      description: row.description,
      referenceId: row.reference_id,
      paymentMethod: row.payment_method,
      counterparty: row.counterparty,
      movementDate: row.movement_date,
      reconciled: row.reconciled,
      reconciliationId: row.reconciliation_id,
    }));

    return Ok(movements);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "query_movements",
        "Failed to query financial movements",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Get total count for pagination
 */
const getMovementsCount = async (
  params: any,
  tenantId: string,
): Promise<Result<number, DomainError>> => {
  try {
    const whereClause = buildQueryConditions(params, tenantId);

    const countResult = await db.execute(
      sql`
        SELECT COUNT(*) as total
        FROM financial_movements
        WHERE ${whereClause}
      `,
    );

    return Ok(parseInt(countResult.rows[0].total));
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "count_movements",
        "Failed to count movements",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Complete financial movements query
 */
const getFinancialMovements = async (
  request: NextRequest,
  queryParams: any,
): Promise<Result<MovementResponse, DomainError>> => {
  // Get tenant and validate access
  const tenantResult = await getTenantBySlug(queryParams.tenant);
  if (!tenantResult.success) {
    return tenantResult;
  }

  const tenantId = tenantResult.data.id;

  const accessResult = await validateTenantAccess(request, tenantId);
  if (!accessResult.success) {
    return accessResult as Result<MovementResponse, DomainError>;
  }

  // Query movements and count in parallel
  const [movementsResult, countResult] = await Promise.all([
    queryFinancialMovements(queryParams, tenantId),
    getMovementsCount(queryParams, tenantId),
  ]);

  if (!movementsResult.success) {
    return movementsResult;
  }

  if (!countResult.success) {
    return countResult;
  }

  const { limit, offset } = queryParams;
  const total = countResult.data;
  const hasMore = offset + limit < total;

  return Ok({
    data: movementsResult.data,
    pagination: {
      total,
      limit,
      offset,
      hasMore,
    },
  });
};

/**
 * GET /api/finance/movements - Get financial movements using Result Pattern
 */
export const GET = withQueryValidation(
  QuerySchema,
  async (request: NextRequest, queryParams: any) => {
    return await getFinancialMovements(request, queryParams);
  },
);
