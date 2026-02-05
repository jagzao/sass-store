import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import {
  products,
  inventoryTransactions,
  inventoryAlerts,
} from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { withTenantContext } from "@/lib/db/tenant-context";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/products/[id] - Obtener un producto específico
export async function GET(request: NextRequest, context: RouteParams) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { id } = await context.params;

        // Get the product
        // Nota: Ya no necesitamos filtrar por tenantId ya que el contexto de tenant está establecido
        const productResult = await db
          .select({
            id: products.id,
            tenantId: products.tenantId,
            sku: products.sku,
            name: products.name,
            description: products.description,
            price: products.price,
            category: products.category,
            featured: products.featured,
            active: products.active,
            metadata: products.metadata,
            imageUrl: products.imageUrl,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
          })
          .from(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .limit(1);

        if (!productResult || productResult.length === 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        const product = productResult[0];

        return NextResponse.json({
          data: {
            id: product.id,
            tenantId: product.tenantId,
            sku: product.sku,
            name: product.name,
            description: product.description || "",
            price: product.price,
            category: product.category || "",
            featured: product.featured,
            active: product.active,
            metadata: product.metadata || {},
            imageUrl: product.imageUrl,
            createdAt: product.createdAt?.toISOString() || "",
          },
        });
      } catch (error) {
        logger.error("Error fetching product", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { logLevel: "info" },
  );
}

// PUT /api/v1/products/[id] - Actualizar un producto
export async function PUT(request: NextRequest, context: RouteParams) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { id } = await context.params;

        // Check if product exists and belongs to this tenant
        const existingProduct = await db
          .select({ id: products.id, sku: products.sku })
          .from(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .limit(1);

        if (!existingProduct || existingProduct.length === 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        const body = await request.json();
        const {
          sku,
          name,
          description,
          price,
          category,
          featured,
          active,
          metadata,
        } = body;

        // Validar campos requeridos
        if (!sku || !name || !price || !category) {
          return NextResponse.json(
            { error: "Missing required fields: sku, name, price, category" },
            { status: 400 },
          );
        }

        // Verificar si ya existe otro producto con el mismo SKU
        // Nota: Ya no necesitamos filtrar por tenantId ya que el contexto de tenant está establecido
        const duplicateProduct = await db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.sku, sku))
          .limit(1);

        if (
          duplicateProduct &&
          duplicateProduct.length > 0 &&
          duplicateProduct[0].id !== id
        ) {
          return NextResponse.json(
            { error: "Another product with this SKU already exists" },
            { status: 400 },
          );
        }

        // Update the product
        const updatedProduct = await db
          .update(products)
          .set({
            sku,
            name,
            description: description || null,
            price: price.toString(),
            category,
            featured: featured || false,
            active: active !== undefined ? active : true,
            metadata: metadata || {},
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .returning();

        return NextResponse.json({
          data: updatedProduct[0],
          message: "Product updated successfully",
        });
      } catch (error) {
        logger.error("Error updating product", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { logLevel: "info" },
  );
}

// DELETE /api/v1/products/[id] - Eliminar un producto
export async function DELETE(request: NextRequest, context: RouteParams) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { id } = await context.params;

        // Check if product exists and belongs to this tenant
        const existingProduct = await db
          .select({ id: products.id, tenantId: products.tenantId })
          .from(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
          .limit(1);

        if (!existingProduct || existingProduct.length === 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 },
          );
        }

        // Delete related inventory records first (no cascade in schema for these)
        await db
          .delete(inventoryAlerts)
          .where(
            and(
              eq(inventoryAlerts.productId, id),
              eq(inventoryAlerts.tenantId, tenantId),
            ),
          );

        await db
          .delete(inventoryTransactions)
          .where(
            and(
              eq(inventoryTransactions.productId, id),
              eq(inventoryTransactions.tenantId, tenantId),
            ),
          );

        // Delete product - ensure tenantId matches
        await db
          .delete(products)
          .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

        return NextResponse.json({
          message: "Product deleted successfully",
        });
      } catch (error) {
        logger.error("Error deleting product", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { logLevel: "info" },
  );
}
