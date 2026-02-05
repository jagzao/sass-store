import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { assertTenantAccess } from "@/lib/auth/api-auth";
import { db, withTenantContext } from "@sass-store/database";
import {
  financialKpis,
  orders,
  payments,
  customerVisits,
  customerAdvances,
  financialMovements,
} from "@sass-store/database/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
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

    // Calcular rango de fechas según el período
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case "week":
        const dayOfWeek = now.getDay();
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - dayOfWeek,
        );
        previousStartDate = new Date(
          startDate.getTime() - 7 * 24 * 60 * 60 * 1000,
        );
        previousEndDate = startDate;
        break;
      case "month":
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const previousStartDateStr = previousStartDate.toISOString().split("T")[0];
    const previousEndDateStr = previousEndDate.toISOString().split("T")[0];

    // Calcular KPIs del período actual
    const currentKPIs = await calculateKPIs(tenantId, startDateStr, undefined);

    // Calcular KPIs del período anterior para tendencias
    const previousKPIs = await calculateKPIs(
      tenantId,
      previousStartDateStr,
      previousEndDateStr,
    );

    // Calcular tendencias
    const incomeTrend =
      previousKPIs.totalIncome > 0
        ? ((currentKPIs.totalIncome - previousKPIs.totalIncome) /
            previousKPIs.totalIncome) *
          100
        : 0;

    const expenseTrend =
      previousKPIs.totalExpenses > 0
        ? ((currentKPIs.totalExpenses - previousKPIs.totalExpenses) /
            previousKPIs.totalExpenses) *
          100
        : 0;

    // Guardar KPIs en la tabla financial_kpis
    await db
      .insert(financialKpis)
      .values({
        tenantId,
        date: startDate,
        totalIncome: currentKPIs.totalIncome.toString(),
        totalExpenses: currentKPIs.totalExpenses.toString(),
        netCashFlow: currentKPIs.netCashFlow.toString(),
        averageTicket: currentKPIs.averageTicket.toString(),
        approvalRate: currentKPIs.approvalRate.toString(),
        transactionCount: currentKPIs.transactionCount,
        availableBalance: currentKPIs.availableBalance.toString(),
      })
      .onConflictDoNothing();

    // Retornar KPIs agregados
    return NextResponse.json({
      data: {
        totalIncome: currentKPIs.totalIncome,
        totalExpenses: currentKPIs.totalExpenses,
        netCashFlow: currentKPIs.netCashFlow,
        averageTicket: currentKPIs.averageTicket,
        approvalRate: currentKPIs.approvalRate,
        transactionCount: currentKPIs.transactionCount,
        availableBalance: currentKPIs.availableBalance,
        incomeTrend: parseFloat(incomeTrend.toFixed(2)),
        expenseTrend: parseFloat(expenseTrend.toFixed(2)),
      },
      byDate: currentKPIs.byDate,
    });
  } catch (error) {
    console.error("Error fetching KPIs:", error);
    return NextResponse.json(
      { error: "Failed to fetch KPIs" },
      { status: 500 },
    );
  }
}

async function calculateKPIs(
  tenantId: string,
  startDate: string,
  endDate?: string,
) {
  // Ingresos Totales: Órdenes completadas + Visitas completadas
  const ordersResult = await db.execute(
    sql`
      SELECT 
        COALESCE(SUM(total), 0) as total,
        COUNT(*) as count
      FROM orders
      WHERE tenant_id = ${tenantId}
        AND status = 'completed'
        ${endDate ? sql`AND created_at >= ${startDate} AND created_at < ${endDate}` : sql`AND DATE(created_at) >= ${startDate}`}
    `,
  );

  const visitsResult = await db.execute(
    sql`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(*) as count
      FROM customer_visits
      WHERE tenant_id = ${tenantId}
        AND status = 'completed'
        ${endDate ? sql`AND visit_date >= ${startDate} AND visit_date < ${endDate}` : sql`AND DATE(visit_date) >= ${startDate}`}
    `,
  );

  const totalIncome =
    parseFloat(ordersResult.rows[0].total) +
    parseFloat(visitsResult.rows[0].total);
  const transactionCount =
    ordersResult.rows[0].count + visitsResult.rows[0].count;

  // Gastos Totales: Movimientos tipo 'expense'
  const expensesResult = await db.execute(
    sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_movements
      WHERE tenant_id = ${tenantId}
        AND type = 'expense'
        ${endDate ? sql`AND movement_date >= ${startDate} AND movement_date < ${endDate}` : sql`AND movement_date >= ${startDate}`}
    `,
  );

  const totalExpenses = parseFloat(expensesResult.rows[0].total);

  // Flujo de Caja Neto
  const netCashFlow = totalIncome - totalExpenses;

  // Ticket Promedio
  const averageTicket =
    transactionCount > 0 ? totalIncome / transactionCount : 0;

  // Tasa de Aprobación
  const paymentsResult = await db.execute(
    sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM payments
      WHERE tenant_id = ${tenantId}
        ${endDate ? sql`AND created_at >= ${startDate} AND created_at < ${endDate}` : sql`AND DATE(created_at) >= ${startDate}`}
    `,
  );

  const totalPayments = paymentsResult.rows[0].total;
  const completedPayments = paymentsResult.rows[0].completed;
  const approvalRate =
    totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

  // Saldo Disponible: Adelantos activos
  const advancesResult = await db.execute(
    sql`
      SELECT 
        COALESCE(SUM(amount) FILTER (WHERE status = 'active'), 0) as active,
        COALESCE(SUM(amount) FILTER (WHERE status = 'partially_used'), 0) as partially_used
      FROM customer_advances
      WHERE tenant_id = ${tenantId}
    `,
  );

  const availableBalance =
    parseFloat(advancesResult.rows[0].active) -
    parseFloat(advancesResult.rows[0].partially_used);

  // KPIs por fecha (para gráficos)
  const byDateResult = await db.execute(
    sql`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total), 0) as total_income
      FROM orders
      WHERE tenant_id = ${tenantId}
        AND status = 'completed'
        ${endDate ? sql`AND created_at >= ${startDate} AND created_at < ${endDate}` : sql`AND DATE(created_at) >= ${startDate}`}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `,
  );

  const byDate = byDateResult.rows.map((row: any) => ({
    date: row.date,
    totalIncome: parseFloat(row.total_income),
    totalExpenses: 0, // Se podría calcular de financial_movements
    netCashFlow: parseFloat(row.total_income),
    transactionCount: 0,
  }));

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    averageTicket,
    approvalRate,
    transactionCount,
    availableBalance,
    byDate,
  };
}
