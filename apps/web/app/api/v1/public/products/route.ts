import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant = searchParams.get("tenant");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant parameter is required" },
        { status: 400 }
      );
    }

    // Get tenant ID from slug
    const tenantResult = await db.execute(
      `SELECT id FROM tenants WHERE slug = ?`,
      [tenant]
    );

    if (!tenantResult.rows || tenantResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    const tenantId = tenantResult.rows[0].id;

    // Build query to get products
    let query = `
      SELECT 
        p.id,
        p.tenant_id,
        p.sku,
        p.name,
        p.description,
        p.price,
        p.category,
        p.featured,
        p.metadata,
        t.slug as tenant_slug
      FROM products p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.tenant_id = ? AND t.slug = ?
    `;
    
    const queryParams = [tenantId, tenant];

    // Add limit if provided
    if (limit) {
      query += ` LIMIT ?`;
      queryParams.push(limit);
    }

    const result = await db.execute(query, queryParams);

    // Transform the results to match the expected format
    const products = result.rows.map((product: any) => ({
      id: product.id,
      tenantId: product.tenant_id,
      tenantSlug: product.tenant_slug,
      sku: product.sku,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      category: product.category,
      featured: product.featured,
      metadata: product.metadata || {},
    }));

    return NextResponse.json({
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}