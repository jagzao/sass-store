import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, withTenantContext } from "@sass-store/database";
import { products } from "@sass-store/database";
import { eq, and } from "drizzle-orm";
import { resolveTenant } from "@/lib/tenant-resolver";
import { validateApiKey } from "@sass-store/config";
import { createAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

// Validation schemas
const updateProductSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).max(50).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Resolve tenant
    const tenant = await resolveTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(tenant.id, "products:get");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get product using RLS context
    const productList = await withTenantContext(db, tenant.id, null,  async (db) => {
      return await db
        .select()
        .from(products)
        .where(
          and(eq(products.id, params.id), eq(products.tenantId, tenant.id))
        )
        .limit(1);
    });

    if (productList.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: productList[0] });
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const rateLimitResult = await checkRateLimit(tenant.id, "products:update");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const productData = updateProductSchema.parse(body);

    // Check if product exists and belongs to tenant using RLS context
    const existingProduct = await withTenantContext(
      db,
      tenant.id, null, 
      async (db) => {
        return await db
          .select()
          .from(products)
          .where(
            and(eq(products.id, params.id), eq(products.tenantId, tenant.id))
          )
          .limit(1);
      }
    );

    if (existingProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if SKU is being changed and if it conflicts
    if (productData.sku && productData.sku !== existingProduct[0].sku) {
      const skuConflict = await withTenantContext(db, tenant.id, null,  async (db) => {
        return await db
          .select()
          .from(products)
          .where(
            and(
              eq(products.sku, productData.sku!),
              eq(products.tenantId, tenant.id)
            )
          )
          .limit(1);
      });

      if (skuConflict.length > 0) {
        return NextResponse.json(
          { error: "Product with this SKU already exists" },
          { status: 409 }
        );
      }
    }

    // Update product
    const updateData: any = { ...productData };
    if (productData.price !== undefined) {
      updateData.price = productData.price.toString();
    }

    const updatedProduct = await db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, params.id), eq(products.tenantId, tenant.id)))
      .returning();

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: "system", // For API-based actions, use a system actor
      action: "product:update",
      targetTable: "products",
      targetId: params.id,
      data: { before: existingProduct[0], after: updatedProduct[0] },
    });

    return NextResponse.json({ data: updatedProduct[0] });
  } catch (error) {
    console.error("Product PUT error:", error);

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const rateLimitResult = await checkRateLimit(tenant.id, "products:delete");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Check if product exists and belongs to tenant using RLS context
    const existingProduct = await withTenantContext(
      db,
      tenant.id, null, 
      async (db) => {
        return await db
          .select()
          .from(products)
          .where(
            and(eq(products.id, params.id), eq(products.tenantId, tenant.id))
          )
          .limit(1);
      }
    );

    if (existingProduct.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product
    await db
      .delete(products)
      .where(and(eq(products.id, params.id), eq(products.tenantId, tenant.id)));

    // Create audit log
    await createAuditLog({
      tenantId: tenant.id,
      actorId: "system", // For API-based actions, use a system actor
      action: "product:delete",
      targetTable: "products",
      targetId: params.id,
      data: { deleted: existingProduct[0] },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
