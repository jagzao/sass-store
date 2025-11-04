import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { orders, orderItems, products } from "@sass-store/database";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { checkRateLimit } from "@/lib/rate-limit";
import { generatePDFReport, generateExcelReport } from "@/lib/report-generator";

// Validation schemas
const productsReportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: z.string().optional(),
  format: z.enum(["json", "pdf", "excel"]).default("json"),
});

/**
 * GET /api/finance/reports/products
 * Generate products report with filtering options
 */
export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "reports:products");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = productsReportSchema.parse(queryParams);

    // Build date filters
    const dateFilters: any[] = [];
    if (params.from) {
      dateFilters.push(gte(orders.createdAt, new Date(params.from)));
    }
    if (params.to) {
      dateFilters.push(lte(orders.createdAt, new Date(params.to)));
    }

    // Build category filter
    const categoryFilter = params.category 
      ? sql`${products.category} = ${params.category}` 
      : undefined;

    // Get products report data with RLS context
    const productsData = (await withTenantContext(
      db,
      tenant.id,
      null,
      async (db) => {
        return await db
          .select({
            productId: sql<string>`${orderItems.metadata}->>'productId'`, // Extract product ID from metadata
            name: orderItems.name,
            totalSold: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
            totalRevenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
            orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
          })
          .from(orderItems)
          .leftJoin(orders, eq(orders.id, orderItems.orderId))
          .where(
            and(
              eq(orderItems.type, 'product'), // Only product items, not services
              ...dateFilters,
              eq(orders.status, 'completed'), // Only completed orders
            )
          )
          .groupBy(sql`${orderItems.metadata}->>'productId'`, orderItems.name)
          .orderBy(desc(sql`COALESCE(SUM(${orderItems.totalPrice}), 0)`));
      }
    )) as any[];
    
    // Now get product details for each product ID to enrich the report
    const enrichedProductsData = await Promise.all(productsData.map(async (item: any) => {
      if (item.productId) {
        const [product] = await db
          .select({
            sku: products.sku,
            name: products.name,
            category: products.category,
            price: products.price,
          })
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.tenantId, tenant.id)))
          .limit(1);
          
        return {
          ...item,
          sku: product?.sku || 'N/A',
          productName: product?.name || item.name,
          category: product?.category || 'Uncategorized',
          price: product?.price || '0.00',
        };
      }
      
      return {
        ...item,
        sku: 'N/A',
        productName: item.name,
        category: 'Uncategorized',
        price: '0.00',
      };
    }));

    // Calculate summary statistics
    const summary = {
      totalProducts: enrichedProductsData.length,
      totalRevenue: enrichedProductsData.reduce((sum, product) => sum + (product.totalRevenue || 0), 0),
      totalUnitsSold: enrichedProductsData.reduce((sum, product) => sum + (product.totalSold || 0), 0),
      averagePrice: enrichedProductsData.length > 0 
        ? enrichedProductsData.reduce((sum, product) => sum + parseFloat(product.price || '0'), 0) / enrichedProductsData.length
        : 0,
      topCategories: enrichedProductsData.reduce(
        (acc, product) => {
          const category = product.category;
          acc[category] = (acc[category] || 0) + (product.totalRevenue || 0);
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Format response based on requested format
    if (params.format === "pdf") {
      try {
        const pdfBuffer = await generatePDFReport(productsData, summary, params);
        return new NextResponse(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="products-report-${new Date().toISOString().split('T')[0]}.pdf"`,
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
        const excelBuffer = await generateExcelReport(productsData, summary, params);
        return new NextResponse(excelBuffer, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="products-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
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
      data: enrichedProductsData,
      summary,
      filters: params,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Products report error:", error);

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
