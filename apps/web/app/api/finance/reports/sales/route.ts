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
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month
    const limit = parseInt(searchParams.get("limit") || "100");

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

    // Construir agrupación según el parámetro
    let dateFormat;
    switch (groupBy) {
      case "week":
        dateFormat = sql`TO_CHAR(o.created_at, 'YYYY-"W"WW')`;
        break;
      case "month":
        dateFormat = sql`TO_CHAR(o.created_at, 'YYYY-MM')`;
        break;
      default: // day
        dateFormat = sql`DATE(o.created_at)`;
    }

    // Consultar datos de ventas agrupados
    const salesResult = await db.execute(
      sql`
        SELECT 
          ${dateFormat} as period,
          COUNT(o.id) as orderCount,
          COALESCE(SUM(o.total_amount), 0) as totalSales,
          COALESCE(AVG(o.total_amount), 0) as averageOrderValue,
          COUNT(DISTINCT o.customer_id) as uniqueCustomers
        FROM orders o
        WHERE o.tenant_id = ${tenantId}
          AND o.status = 'completed'
          ${dateWhereClause}
        GROUP BY period
        ORDER BY period DESC
        LIMIT ${limit}
      `,
    );

    const salesData = salesResult.rows.map((row: any) => ({
      period: row.period,
      orderCount: parseInt(row.ordercount),
      totalSales: parseFloat(row.totalsales),
      averageOrderValue: parseFloat(row.averageordervalue),
      uniqueCustomers: parseInt(row.uniquecustomers),
    }));

    // Consultar datos por método de pago
    const paymentMethodsResult = await db.execute(
      sql`
        SELECT 
          p.payment_method,
          COUNT(p.id) as paymentCount,
          COALESCE(SUM(p.amount), 0) as totalAmount
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        WHERE o.tenant_id = ${tenantId}
          AND o.status = 'completed'
          AND p.status = 'completed'
          ${dateWhereClause}
        GROUP BY p.payment_method
        ORDER BY totalAmount DESC
      `,
    );

    const paymentMethods = paymentMethodsResult.rows.map((row: any) => ({
      paymentMethod: row.payment_method,
      paymentCount: parseInt(row.paymentcount),
      totalAmount: parseFloat(row.totalamount),
    }));

    // Consultar productos más vendidos
    const topProductsResult = await db.execute(
      sql`
        SELECT 
          p.id,
          p.name,
          p.price,
          SUM(oi.quantity) as totalQuantity,
          SUM(oi.total_price) as totalRevenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.tenant_id = ${tenantId}
          AND o.status = 'completed'
          ${dateWhereClause}
        GROUP BY p.id, p.name, p.price
        ORDER BY totalRevenue DESC
        LIMIT 10
      `,
    );

    const topProducts = topProductsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      totalQuantity: parseInt(row.totalquantity),
      totalRevenue: parseFloat(row.totalrevenue),
    }));

    // Retornar reporte de ventas
    return NextResponse.json({
      data: {
        salesByPeriod: salesData,
        paymentMethods,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    return NextResponse.json(
      { error: "Failed to generate sales report" },
      { status: 500 },
    );
  }
}
