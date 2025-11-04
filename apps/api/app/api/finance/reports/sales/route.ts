import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { orders, orderItems, payments, products } from "@sass-store/database";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { generatePDFReport, generateExcelReport } from "@/lib/report-generator";

// Validation schemas
const salesReportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  terminalId: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "mercadopago"]).optional(),
  format: z.enum(["json", "pdf", "excel"]).default("json"),
});

/**
 * GET /api/finance/reports/sales
 * Generate sales report with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "reports:sales");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = salesReportSchema.parse(queryParams);

    // Build date filters
    const dateFilters: any[] = [];
    if (params.from) {
      dateFilters.push(gte(orders.createdAt, new Date(params.from)));
    }
    if (params.to) {
      dateFilters.push(lte(orders.createdAt, new Date(params.to)));
    }

    // Get sales data with RLS context
    const salesData = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select({
            orderId: orders.id,
            orderNumber: orders.orderNumber,
            customerName: orders.customerName,
            customerEmail: orders.customerEmail,
            total: orders.total,
            currency: orders.currency,
            status: orders.status,
            paymentMethod: payments.metadata,
            terminalId: sql<string>`${orders.metadata}::jsonb->>'terminalId'`,
            createdAt: orders.createdAt,
            itemCount: sql<number>`COUNT(${orderItems.id})`,
            products: sql<string[]>`
            ARRAY_AGG(
              JSON_BUILD_OBJECT(
                'name', ${products.name},
                'sku', ${products.sku},
                'quantity', ${orderItems.quantity},
                'unitPrice', ${orderItems.unitPrice},
                'totalPrice', ${orderItems.totalPrice}
              )
            )
          `,
          })
          .from(orders)
          .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
          .leftJoin(products, eq(orderItems.type, "product"))
          .leftJoin(payments, eq(orders.id, payments.orderId))
          .where(
            and(
              eq(orders.type, "purchase"),
              eq(orders.status, "completed"),
              ...dateFilters,
              params.terminalId
                ? sql`${orders.metadata}::jsonb->>'terminalId' = ${params.terminalId}`
                : undefined,
              params.paymentMethod
                ? sql`${payments.metadata}::jsonb->>'paymentMethod' = ${params.paymentMethod}`
                : undefined
            )
          )
          .groupBy(orders.id, payments.id)
          .orderBy(desc(orders.createdAt));
      }
    )) as any[];

    // Calculate summary statistics
    const summary = {
      totalSales: salesData.length,
      totalRevenue: salesData.reduce(
        (sum, sale) => sum + parseFloat(sale.total),
        0
      ),
      averageOrderValue:
        salesData.length > 0
          ? salesData.reduce((sum, sale) => sum + parseFloat(sale.total), 0) /
            salesData.length
          : 0,
      totalItems: salesData.reduce((sum, sale) => sum + sale.itemCount, 0),
      paymentMethodBreakdown: salesData.reduce(
        (acc, sale) => {
          const method = sale.paymentMethod?.paymentMethod || "unknown";
          acc[method] = (acc[method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Format response based on requested format
    if (params.format === "pdf") {
      try {
        const pdfBuffer = await generatePDFReport(salesData, summary, params);
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.pdf"`,
          },
        });
      } catch (error) {
        console.error("PDF generation error:", error);
        return NextResponse.json(
          { error: "PDF generation failed" },
          { status: 500 }
        );
      }
    }

    if (params.format === "excel") {
      try {
        const excelBuffer = await generateExcelReport(salesData, summary, params);
        return new NextResponse(excelBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
          },
        });
      } catch (error) {
        console.error("Excel generation error:", error);
        return NextResponse.json(
          { error: "Excel generation failed" },
          { status: 500 }
        );
      }
    }

    // Default JSON response
    return NextResponse.json({
      data: salesData,
      summary,
      filters: params,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sales report error:", error);

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
