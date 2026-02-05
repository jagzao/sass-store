import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db } from "@sass-store/database";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get("tenant");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "revenue"; // revenue, quantity, profit
    const limit = parseInt(searchParams.get("limit") || "50");

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

    // Construir query de fechas
    const dateConditions = [];

    if (from) {
      dateConditions.push(sql`o.created_at >= ${from}`);
    }

    if (to) {
      dateConditions.push(sql`o.created_at <= ${to}`);
    }

    const dateWhereClause =
      dateConditions.length > 0
        ? sql`AND ${dateConditions.join(" AND ")}`
        : sql``;

    // Construir query de categoría
    const categoryWhereClause = category
      ? sql`AND p.category = ${category}`
      : sql``;

    // Construir ordenamiento
    let orderBy;
    switch (sortBy) {
      case "quantity":
        orderBy = sql`totalQuantity DESC`;
        break;
      case "profit":
        orderBy = sql`totalProfit DESC`;
        break;
      default: // revenue
        orderBy = sql`totalRevenue DESC`;
    }

    // Consultar datos de productos
    const productsResult = await db.execute(
      sql`
        SELECT 
          p.id,
          p.name,
          p.price,
          p.cost,
          p.category,
          p.is_active as "isActive",
          COUNT(oi.id) as orderCount,
          COALESCE(SUM(oi.quantity), 0) as totalQuantity,
          COALESCE(SUM(oi.total_price), 0) as totalRevenue,
          COALESCE(SUM((oi.total_price - (oi.quantity * p.cost))), 0) as totalProfit,
          COALESCE(AVG(oi.quantity), 0) as averageQuantityPerOrder
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.tenant_id = ${tenantId}
          AND (o.status = 'completed' OR o.status IS NULL)
          ${dateWhereClause}
          ${categoryWhereClause}
        GROUP BY p.id, p.name, p.price, p.cost, p.category, p.is_active
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `,
    );

    const products = productsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      cost: parseFloat(row.cost),
      category: row.category,
      isActive: row.isactive,
      orderCount: parseInt(row.ordercount),
      totalQuantity: parseInt(row.totalquantity),
      totalRevenue: parseFloat(row.totalrevenue),
      totalProfit: parseFloat(row.totalprofit),
      averageQuantityPerOrder: parseFloat(row.averagequantityperorder),
      profitMargin:
        row.totalrevenue > 0
          ? (parseFloat(row.totalprofit) / parseFloat(row.totalrevenue)) * 100
          : 0,
    }));

    // Consultar categorías
    const categoriesResult = await db.execute(
      sql`
        SELECT 
          p.category,
          COUNT(DISTINCT p.id) as productCount,
          COALESCE(SUM(oi.total_price), 0) as totalRevenue
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE p.tenant_id = ${tenantId}
          AND p.category IS NOT NULL
          AND (o.status = 'completed' OR o.status IS NULL)
          ${dateWhereClause}
        GROUP BY p.category
        ORDER BY totalRevenue DESC
      `,
    );

    const categories = categoriesResult.rows.map((row: any) => ({
      category: row.category,
      productCount: parseInt(row.productcount),
      totalRevenue: parseFloat(row.totalrevenue),
    }));

    // Retornar reporte de productos
    return NextResponse.json({
      data: {
        products,
        categories,
      },
    });
  } catch (error) {
    console.error("Error generating products report:", error);
    return NextResponse.json(
      { error: "Failed to generate products report" },
      { status: 500 },
    );
  }
}
