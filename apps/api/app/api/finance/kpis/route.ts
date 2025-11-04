import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { financialKpis } from "@sass-store/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq, gte, lte, and, desc } from "drizzle-orm";

// Validation schemas
const getKpisSchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).default("month"),
  from: z.string().optional(),
  to: z.string().optional(),
});

/**
 * GET /api/finance/kpis
 * Get financial KPIs for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "finance:kpis");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = getKpisSchema.parse(queryParams);

    // Calculate date range based on period
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = now;

    switch (params.period) {
      case "day":
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Override with custom dates if provided
    if (params.from) fromDate = new Date(params.from);
    if (params.to) toDate = new Date(params.to);

    // Fetch KPIs using tenant context
    const kpis = (await withTenantContext(db, tenant.id, null, async (db) => {
      return await db
        .select()
        .from(financialKpis)
        .where(
          and(
            gte(financialKpis.date, fromDate.toISOString().split("T")[0]),
            lte(financialKpis.date, toDate.toISOString().split("T")[0])
          )
        )
        .orderBy(desc(financialKpis.date))
        .limit(30); // Last 30 days
    })) as any[];

    // Calculate aggregated metrics
    const aggregated = {
      totalIncome: kpis.reduce((sum, kpi) => sum + Number(kpi.totalIncome), 0),
      totalExpenses: kpis.reduce(
        (sum, kpi) => sum + Number(kpi.totalExpenses),
        0
      ),
      netCashFlow: kpis.reduce((sum, kpi) => sum + Number(kpi.netCashFlow), 0),
      averageTicket:
        kpis.length > 0
          ? kpis.reduce((sum, kpi) => sum + Number(kpi.averageTicket), 0) /
            kpis.length
          : 0,
      approvalRate:
        kpis.length > 0
          ? kpis.reduce((sum, kpi) => sum + Number(kpi.approvalRate), 0) /
            kpis.length
          : 0,
      transactionCount: kpis.reduce(
        (sum, kpi) => sum + kpi.transactionCount,
        0
      ),
      availableBalance: kpis[kpis.length - 1]?.availableBalance || 0,
      // Calculate trends (comparing first half vs second half)
      incomeTrend: calculateTrend(kpis.map((k) => Number(k.totalIncome))),
      expenseTrend: calculateTrend(kpis.map((k) => Number(k.totalExpenses))),
    };

    return NextResponse.json({
      data: kpis,
      aggregated,
      period: params.period,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Finance KPIs error:", error);

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

/**
 * Calculate trend percentage between two periods
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);

  const firstAvg =
    firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  if (firstAvg === 0) return secondAvg > 0 ? 100 : 0;

  return ((secondAvg - firstAvg) / firstAvg) * 100;
}
