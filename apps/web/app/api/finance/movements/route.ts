import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { ErrorFactories, DomainError } from "@sass-store/core/src/errors/types";
import { db } from "@sass-store/database";
import { financialMovements, tenants, transactionCategories } from "@sass-store/database/schema";
import { eq, and, sql, gte, lte, desc, asc, ilike, or } from "drizzle-orm";

// Validate query parameters
function validateMovementQuery(searchParams: URLSearchParams): Result<{ 
  type: string | null;
  paymentMethod: string | null;
  status: string | null;
  from: string | null;
  to: string | null;
  search: string | null;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: string;
  tenant: string;
}, DomainError> {
  try {
    const tenant = searchParams.get("tenant");
    if (!tenant) {
      return Err(ErrorFactories.validation(
        "MISSING_TENANT",
        "Tenant parameter is required"
      ));
    }

    const limit = parseInt(searchParams.get("limit") || "50");
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return Err(ErrorFactories.validation(
        "INVALID_LIMIT",
        "Limit must be between 1 and 100"
      ));
    }

    const offset = parseInt(searchParams.get("offset") || "0");
    if (isNaN(offset) || offset < 0) {
      return Err(ErrorFactories.validation(
        "INVALID_OFFSET",
        "Offset must be a positive number"
      ));
    }

    const sortBy = searchParams.get("sortBy") || "movementDate";
    const validSortFields = ["movementDate", "amount", "description"];
    if (!validSortFields.includes(sortBy)) {
      return Err(ErrorFactories.validation(
        "INVALID_SORT_FIELD",
        `Sort field must be one of: ${validSortFields.join(", ")}`
      ));
    }

    const sortOrder = searchParams.get("sortOrder") || "desc";
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return Err(ErrorFactories.validation(
        "INVALID_SORT_ORDER",
        "Sort order must be 'asc' or 'desc'"
      ));
    }

    return Ok({
      type: searchParams.get("type"),
      paymentMethod: searchParams.get("paymentMethod"),
      status: searchParams.get("status"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      search: searchParams.get("search"),
      limit,
      offset,
      sortBy,
      sortOrder,
      tenant,
    });
  } catch (error) {
    return Err(ErrorFactories.validation(
      "VALIDATION_ERROR",
      "Invalid query parameters",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    ));
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    
    // Validar query parameters
    const validationResult = validateMovementQuery(searchParams);
    if (isFailure(validationResult)) {
      const error = validationResult.error;
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          code: error.type
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, params.tenant);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Forbidden: Access denied to this tenant" 
        },
        { status: 403 }
      );
    }

    // Get Tenant ID
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, params.tenant))
      .limit(1);

    if (!tenantResult.length) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }
    const tenantId = tenantResult[0].id;

    // Build query conditions
    const conditions = [eq(financialMovements.tenantId, tenantId)];

    // Map legacy 'income'/'expense' types to supported DB enum values
    let dbType = params.type;
    if (params.type === 'income') {
      dbType = 'SETTLEMENT';
    } else if (params.type === 'expense') {
      dbType = 'WITHDRAWAL';
    }

    if (dbType) {
      conditions.push(eq(financialMovements.type, dbType));
    }

    if (params.paymentMethod) {
      conditions.push(eq(financialMovements.paymentMethod, params.paymentMethod));
    }

    if (params.status === "reconciled") {
      conditions.push(eq(financialMovements.reconciled, true));
    } else if (params.status === "unreconciled") {
      conditions.push(eq(financialMovements.reconciled, false));
    }

    if (params.from) {
      conditions.push(gte(financialMovements.movementDate, params.from));
    }

    if (params.to) {
      conditions.push(lte(financialMovements.movementDate, params.to));
    }

    if (params.search) {
      const searchTerm = `%${params.search}%`;
      const searchCondition = or(
        ilike(financialMovements.description, searchTerm),
        ilike(financialMovements.counterparty, searchTerm),
        ilike(financialMovements.referenceId, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause = and(...conditions);

    // Build Sort
    let orderByClause;
    const sortCol = params.sortBy === "amount" ? financialMovements.amount :
                    params.sortBy === "description" ? financialMovements.description :
                    financialMovements.movementDate;
    
    orderByClause = params.sortOrder === "asc" ? asc(sortCol) : desc(sortCol);

    // Query Data
    const data = await db
      .select({
        id: financialMovements.id,
        tenantId: financialMovements.tenantId,
        type: financialMovements.type,
        amount: financialMovements.amount,
        description: financialMovements.description,
        referenceId: financialMovements.referenceId,
        paymentMethod: financialMovements.paymentMethod,
        counterparty: financialMovements.counterparty,
        movementDate: financialMovements.movementDate,
        reconciled: financialMovements.reconciled,
        createdAt: financialMovements.createdAt,
        updatedAt: financialMovements.updatedAt
      })
      .from(financialMovements)
      .where(whereClause)
      .limit(params.limit)
      .offset(params.offset)
      .orderBy(orderByClause);

    // Get Total Count (for pagination)
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(financialMovements)
      .where(whereClause);
      
    const total = Number(countResult[0]?.count || 0);

    // Retornar movimientos
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + params.limit < total,
      },
    });

  } catch (error) {
    console.error("Movements API Error:", error);
    
    try {
      // Log error to file for debugging
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'movements-error.log');
      const logContent = `[${new Date().toISOString()}] Error: ${String(error)}\nStack: ${error instanceof Error ? error.stack : 'No stack'}\n\n`;
      fs.appendFileSync(logPath, logContent);
    } catch (e) {
      console.error("Failed to write error log:", e);
    }

    const domainError = ErrorFactories.database(
      "MOVEMENTS_ENDPOINT_ERROR",
      "Unexpected error in movements endpoint",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      { 
        success: false, 
        error: domainError.message,
        code: domainError.type,
        details: String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Validar datos del movimiento
    if (!body.type || !body.amount || !body.description || !body.tenantSlug) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: type, amount, description, tenantSlug" 
        },
        { status: 400 }
      );
    }

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, body.tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Forbidden: Access denied to this tenant" 
        },
        { status: 403 }
      );
    }

    // Get Tenant ID
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, body.tenantSlug))
      .limit(1);

    if (!tenantResult.length) {
      return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });
    }
    const tenantId = tenantResult[0].id;

    // Map legacy 'income'/'expense' types to supported DB enum values
    // DB Constraint: 'SETTLEMENT', 'REFUND', 'CHARGEBACK', 'WITHDRAWAL', 'FEE', 'CARD_PURCHASE'
    let dbType = body.type;
    if (body.type === 'income') {
      dbType = 'SETTLEMENT';
    } else if (body.type === 'expense') {
      dbType = 'WITHDRAWAL';
    }

    // Crear nuevo movimiento
    const newMovement = await db.insert(financialMovements).values({
      tenantId: tenantId,
      type: dbType,
      amount: body.amount,
      description: body.description,
      referenceId: body.referenceId,
      paymentMethod: body.paymentMethod,
      counterparty: body.counterparty,
      movementDate: body.movementDate ? body.movementDate : new Date().toISOString(),
      reconciled: body.reconciled || false
    }).returning({
      id: financialMovements.id,
      tenantId: financialMovements.tenantId,
      type: financialMovements.type,
      amount: financialMovements.amount,
      description: financialMovements.description,
      // Exclude categoryId from return too
    });

    return NextResponse.json({
      success: true,
      data: newMovement[0],
    });

  } catch (error) {
    const domainError = ErrorFactories.database(
      "CREATE_MOVEMENT_ERROR",
      "Failed to create movement",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      { 
        success: false, 
        error: domainError.message,
        code: domainError.type
      },
      { status: 500 }
    );
  }
}
