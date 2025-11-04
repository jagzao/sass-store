import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { financialMovements } from "@sass-store/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq, gte, lte, and, desc, asc, like, inArray } from "drizzle-orm";

// Validation schemas
const getMovementsSchema = z.object({
  type: z
    .enum([
      "SETTLEMENT",
      "REFUND",
      "CHARGEBACK",
      "WITHDRAWAL",
      "FEE",
      "CARD_PURCHASE",
    ])
    .optional(),
  paymentMethod: z.string().optional(),
  status: z.enum(["reconciled", "unreconciled"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("50"),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("0"),
  sortBy: z.enum(["movementDate", "amount", "type"]).default("movementDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/finance/movements
 * Get financial movements with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(
      tenant.id,
      "finance:movements"
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = getMovementsSchema.parse(queryParams);

    // Build filters
    const conditions = [];

    if (params.type) {
      conditions.push(eq(financialMovements.type, params.type));
    }

    if (params.paymentMethod) {
      conditions.push(
        like(financialMovements.paymentMethod, `%${params.paymentMethod}%`)
      );
    }

    if (params.status) {
      const reconciled = params.status === "reconciled";
      conditions.push(eq(financialMovements.reconciled, reconciled));
    }

    if (params.from) {
      conditions.push(
        gte(financialMovements.movementDate, new Date(params.from).toISOString().split('T')[0])
      );
    }

    if (params.to) {
      conditions.push(
        lte(financialMovements.movementDate, new Date(params.to).toISOString().split('T')[0])
      );
    }

    if (params.search) {
      // Search in description, reference, or counterparty
      conditions.push(
        and(
          like(financialMovements.description, `%${params.search}%`),
          like(financialMovements.referenceId, `%${params.search}%`),
          like(financialMovements.counterparty, `%${params.search}%`)
        )
      );
    }

    const whereConditions =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Build sort order
    const sortColumn =
      params.sortBy === "movementDate"
        ? financialMovements.movementDate
        : params.sortBy === "amount"
          ? financialMovements.amount
          : financialMovements.type;

    const orderBy =
      params.sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

    // Fetch movements using tenant context
    const movements = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select()
          .from(financialMovements)
          .where(whereConditions)
          .orderBy(orderBy)
          .limit(params.limit)
          .offset(params.offset);
      }
    )) as any[];

    // Get total count for pagination
    const totalCount = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        const result = await db
          .select({ count: financialMovements.id })
          .from(financialMovements)
          .where(whereConditions);

        return result.length;
      }
    )) as number;

    // Calculate summary
    const summary = {
      totalMovements: totalCount,
      totalIncome: movements
        .filter((m) => ["SETTLEMENT"].includes(m.type))
        .reduce((sum, m) => sum + Number(m.amount), 0),
      totalExpenses: movements
        .filter((m) =>
          [
            "REFUND",
            "CHARGEBACK",
            "WITHDRAWAL",
            "FEE",
            "CARD_PURCHASE",
          ].includes(m.type)
        )
        .reduce((sum, m) => sum + Number(m.amount), 0),
      reconciledCount: movements.filter((m) => m.reconciled).length,
      unreconciledCount: movements.filter((m) => !m.reconciled).length,
    };

    return NextResponse.json({
      data: movements,
      summary,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: totalCount,
        hasMore: params.offset + params.limit < totalCount,
      },
      filters: params,
    });
  } catch (error) {
    console.error("Finance movements error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
