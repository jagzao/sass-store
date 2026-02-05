import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db } from "@sass-store/database";
import { financialMovements } from "@sass-store/database/schema";
import { and, gte, lte, sql, desc, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const paymentMethod = searchParams.get("paymentMethod");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "movementDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const tenantSlug = searchParams.get("tenant");

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 },
      );
    }

    // Obtener tenant ID desde el slug
    const tenantResult = await db.execute(
      sql`SELECT id FROM tenants WHERE slug = ${tenantSlug}`,
    );

    if (!tenantResult.rows || tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult.rows[0].id;

    // Validar acceso al tenant
    try {
      assertTenantAccess(session, tenantSlug);
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to this tenant" },
        { status: 403 },
      );
    }

    // Construir query de movimientos
    const conditions = [];

    // Always filter by tenant
    conditions.push(sql`tenant_id = ${tenantId}`);

    if (type) {
      conditions.push(sql`type = ${type}`);
    }

    if (paymentMethod) {
      conditions.push(sql`payment_method = ${paymentMethod}`);
    }

    if (status === "reconciled") {
      conditions.push(sql`reconciled = true`);
    } else if (status === "unreconciled") {
      conditions.push(sql`reconciled = false`);
    }

    if (from) {
      conditions.push(sql`movement_date >= ${from}`);
    }

    if (to) {
      conditions.push(sql`movement_date <= ${to}`);
    }

    if (search) {
      conditions.push(sql`description ILIKE ${"%" + search + "%"}`);
    }

    const whereClause = and(...conditions);

    // Ordenamiento
    const orderClause = sortOrder === "desc" ? desc : (sql`` as any);

    // Consultar movimientos financieros
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
        ORDER BY ${sortBy === "amount" ? sql`amount ${orderClause}` : sql`movement_date ${orderClause}`}
        LIMIT ${limit}
        OFFSET ${offset}
      `,
    );

    const movements = movementsResult.rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      currency: "MXN",
      description: row.description,
      referenceId: row.referenceId,
      paymentMethod: row.payment_method,
      counterparty: row.counterparty,
      movementDate: row.movement_date,
      reconciled: row.reconciled,
      reconciliationId: row.reconciliation_id,
    }));

    // Obtener total count para paginación
    const countResult = await db.execute(
      sql`
        SELECT COUNT(*) as total
        FROM financial_movements
        WHERE ${whereClause}
      `,
    );

    const total = parseInt(countResult.rows[0].total);

    // Retornar movimientos
    return NextResponse.json({
      data: movements,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch movements" },
      { status: 500 },
    );
  }
}
