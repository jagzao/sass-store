import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database";
import { eq, and, sql } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { productsCache } from "@/lib/cache";

// Validation schemas for public access (no auth required)
const getProductsSchema = z.object({
  category: z.string().optional(),
  featured: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("20"),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("0"),
});

export async function GET(request: NextRequest) {
  try {
    // Resolve tenant from request (public access - no auth required)
    const tenant = await resolveTenant(request);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = getProductsSchema.parse(queryParams);
    console.log('🔍 QUERY PARAMS:', params);

    // Crear clave de cache basada en filtros
    const cacheKey = {
      tenantId: tenant.id,
      category: params.category,
      featured: params.featured,
      limit: params.limit,
      offset: params.offset
    };

    // Check cache first with tenant-specific invalidation
    const cachedResult = productsCache.get(tenant.id, cacheKey);
    if (cachedResult) {
      console.log('🔍 CACHE HIT for tenant:', tenant.slug);
      return NextResponse.json(cachedResult, {
        headers: {
          'X-Cache-Status': 'HIT',
          'Cache-Control': 'public, max-age=120' // 2 minutos
        }
      });
    }

    // Build query conditions
    const conditions = [eq(products.tenantId, tenant.id)];

    if (params.category) {
      conditions.push(eq(products.category, params.category));
    }

    if (params.featured !== undefined) {
      conditions.push(eq(products.featured, params.featured));
    }

    const whereConditions = and(...conditions);

    // Execute query with optimized pagination
    const [productList, totalCount] = await Promise.all([
      db
        .select()
        .from(products)
        .where(whereConditions)
        .limit(params.limit)
        .offset(params.offset)
        .orderBy(products.createdAt),
      // Consulta separada para el total (más eficiente)
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereConditions)
        .then(result => result[0].count)
    ]);

    console.log('🔍 RAW PRODUCT LIST:', productList);
    console.log('🔍 TOTAL COUNT:', totalCount);

    const result = {
      data: productList,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: totalCount,
      },
    };

    // Cache the result with tenant-specific key
    productsCache.set(tenant.id, cacheKey, result);

    return NextResponse.json(result, {
      headers: {
        'X-Cache-Status': 'MISS',
        'Cache-Control': 'public, max-age=120' // 2 minutos
      }
    });
  } catch (error) {
    console.error("Public products GET error:", error);

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
