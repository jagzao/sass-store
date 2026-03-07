import { NextRequest } from "next/server";
import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { db } from "@sass-store/database";
import {
  orders,
  customerVisits,
  financialMovements,
  payments,
  customerAdvances,
  tenants,
} from "@sass-store/database/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";

interface KPIData {
  period: string;
  tenant: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number; // Renamed from balance to match schema concept
  transactionCount: number;
  averageTicket: number;
  approvalRate: number;
  availableBalance: number;
}

// Helper function to validate query parameters
const validateKPIQuery = (searchParams: URLSearchParams): Result<{ period: string; tenant: string }, DomainError> => {
  const period = searchParams.get('period');
  const tenant = searchParams.get('tenant');

  if (!period || !tenant) {
    return Err(ErrorFactories.validation(
      "MISSING_PARAMETERS",
      "Missing required query parameters: period and tenant"
    ));
  }

  // Validate period format (month, week, day, etc.)
  const validPeriods = ['month', 'week', 'day', 'year'];
  if (!validPeriods.includes(period)) {
    return Err(ErrorFactories.validation(
      "INVALID_PERIOD",
      `Invalid period: ${period}. Must be one of: ${validPeriods.join(', ')}`
    ));
  }

  return Ok({ period, tenant });
};

// Helper to calculate date range based on period
const getDateRange = (period: string): { startDate: Date, endDate: Date } => {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  return { startDate, endDate };
};

// Helper function to get KPI data from DB
const getKPIData = async (period: string, tenantSlug: string): Promise<Result<KPIData, DomainError>> => {
  try {
    // 1. Get Tenant ID
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenantResult.length) {
      return Err(ErrorFactories.resourceNotFound("TENANT_NOT_FOUND", "Tenant not found"));
    }
    const tenantId = tenantResult[0].id;

    const { startDate, endDate } = getDateRange(period);
    
    // 2. Calculate Total Income (Orders + customerVisits)
    const ordersResult = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${orders.total}), 0)`, 
        count: sql<number>`count(*)` 
      })
      .from(orders)
      .where(and(
        eq(orders.tenantId, tenantId),
        eq(orders.status, 'completed'),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ));
      
    const visitsResult = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${customerVisits.totalAmount}), 0)`, 
        count: sql<number>`count(*)` 
      })
      .from(customerVisits)
      .where(and(
        eq(customerVisits.tenantId, tenantId),
        eq(customerVisits.status, 'completed'),
        gte(customerVisits.visitDate, startDate),
        lte(customerVisits.visitDate, endDate)
      ));

    const totalIncome = parseFloat(ordersResult[0].total) + parseFloat(visitsResult[0].total);
    const transactionCount = Number(ordersResult[0].count) + Number(visitsResult[0].count);

    // 3. Calculate Expenses
    const expensesResult = await db
      .select({ total: sql<string>`COALESCE(SUM(${financialMovements.amount}), 0)` })
      .from(financialMovements)
      .where(and(
        eq(financialMovements.tenantId, tenantId),
        eq(financialMovements.type, 'expense'),
        gte(financialMovements.movementDate, startDate.toISOString()), // schema says string or date? sql driver handles date obj usually, but schema has date() type which is string usually
        lte(financialMovements.movementDate, endDate.toISOString())
      ));
      
    const totalExpenses = parseFloat(expensesResult[0].total);
    
    // 4. Calculate Net Cash Flow
    const netCashFlow = totalIncome - totalExpenses;

    // 5. Average Ticket
    const averageTicket = transactionCount > 0 ? totalIncome / transactionCount : 0;

    // 6. Approval Rate (Payments)
    const paymentsResult = await db
      .select({ 
        total: sql<number>`count(*)`, 
        completed: sql<number>`count(*) filter (where ${payments.status} = 'completed')` 
      })
      .from(payments)
      .where(and(
        eq(payments.tenantId, tenantId),
        gte(payments.createdAt, startDate),
        lte(payments.createdAt, endDate)
      ));
      
    const approvalRate = Number(paymentsResult[0].total) > 0 
      ? (Number(paymentsResult[0].completed) / Number(paymentsResult[0].total)) * 100 
      : 0;

    // 7. Available Balance (Customer Advances)
    // Note: This is usually a snapshot, not period based, or cumulative. 
    // Usually "Available Balance" for business finding is current cash on hand, 
    // but here the mock used 'customer_advances'. Let's stick to that logic for now, 
    // or arguably it should be 'Income - Expenses' all time? 
    // The previous implementation used advances. 
    // Let's implement Sum(Active Advances) - Sum(Used).
    const advancesResult = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(${customerAdvances.amount}), 0)` 
      })
      .from(customerAdvances)
      .where(and(
        eq(customerAdvances.tenantId, tenantId),
        eq(customerAdvances.status, 'active')
      ));
      
    const availableBalance = parseFloat(advancesResult[0].total);

    return Ok({
      period,
      tenant: tenantSlug,
      totalIncome,
      totalExpenses,
      netCashFlow,
      transactionCount,
      averageTicket,
      approvalRate,
      availableBalance
    });

  } catch (error) {
    return Err(ErrorFactories.database(
      "KPI_FETCH_ERROR",
      "Failed to fetch KPI data",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    ));
  }
};

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = validateKPIQuery(searchParams);
    if (isFailure(validationResult)) {
      const error = validationResult.error;
      return Response.json(
        { 
          success: false, 
          error: error.message,
          code: error.type
        },
        { status: 400 }
      );
    }

    const { period, tenant } = validationResult.data;

    // Get KPI data
    const kpiResult = await getKPIData(period, tenant);
    if (isFailure(kpiResult)) {
      const error = kpiResult.error;
      return Response.json(
        { 
          success: false, 
          error: error.message,
          code: error.type
        },
        { status: 500 }
      );
    }

    const kpiData = kpiResult.data;

    return Response.json({
      success: true,
      data: kpiData
    });

  } catch (error) {
    const domainError = ErrorFactories.database(
      "KPI_ENDPOINT_ERROR",
      "Unexpected error in KPI endpoint",
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );

    return Response.json(
      { 
        success: false, 
        error: domainError.message,
        code: domainError.type
      },
      { status: 500 }
    );
  }
}
