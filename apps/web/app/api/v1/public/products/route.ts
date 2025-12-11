import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { products, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 },
      );
    }

    // Get tenant by slug using Drizzle query builder
    const tenantResult = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenant))
      .limit(1);

    if (!tenantResult || tenantResult.length === 0) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const tenantId = tenantResult[0].id;

    // Build query to get products using Drizzle query builder
    let query = db
      .select({
        id: products.id,
        tenantId: products.tenantId,
        sku: products.sku,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        featured: products.featured,
        metadata: products.metadata,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(eq(products.tenantId, tenantId));

    // Add limit if provided
    if (limit) {
      query = query.limit(limit) as typeof query;
    }

    const result = await query;

    // Transform the results to match the expected format
    const productsData = result.map((product) => ({
      id: product.id,
      tenantId: product.tenantId,
      tenantSlug: tenant,
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price: parseFloat(product.price),
      category: product.category || "",
      featured: product.featured,
      imageUrl: product.imageUrl,
      metadata: product.metadata || {},
    }));

    return NextResponse.json({
      data: productsData,
      count: productsData.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
