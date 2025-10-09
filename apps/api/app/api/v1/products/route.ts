import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@sass-store/database";
import { products } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { validateApiKey } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

// Validation schemas
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

const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.string().min(1).max(50),
  featured: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "products:list");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const params = getProductsSchema.parse(queryParams);

    // Build query conditions
    const conditions = [eq(products.tenantId, tenant.id)];

    if (params.category) {
      conditions.push(eq(products.category, params.category));
    }

    if (params.featured !== undefined) {
      conditions.push(eq(products.featured, params.featured));
    }

    const whereConditions = and(...conditions);

    // Execute query with pagination
    const productList = await db
      .select()
      .from(products)
      .where(whereConditions)
      .limit(params.limit)
      .offset(params.offset)
      .orderBy(products.createdAt);

    return NextResponse.json({
      data: productList,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: productList.length, // In production, would need a separate count query
      },
    });
  } catch (error) {
    console.error("Products GET error:", error);

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

export async function POST(request: NextRequest) {
  try {
    // Validate API key for write operations
    const authResult = await validateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits for write operations
    const rateLimitResult = await checkRateLimit(tenant.id, "products:create");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const productData = createProductSchema.parse(body);

    // Check if SKU already exists for this tenant
    const existingProduct = await db
      .select()
      .from(products)
      .where(
        and(eq(products.tenantId, tenant.id), eq(products.sku, productData.sku))
      )
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 409 }
      );
    }

    // Create product
    const newProduct = await db
      .insert(products)
      .values({
        tenantId: tenant.id,
        ...productData,
        price: productData.price.toString(), // Convert to string for decimal storage
      })
      .returning();

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: authResult.userId,
      action: "product:create",
      targetTable: "products",
      targetId: newProduct[0].id,
      data: { created: productData },
    });

    return NextResponse.json({ data: newProduct[0] }, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
