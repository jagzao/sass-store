import { NextRequest, NextResponse } from "next/server";

import { db } from "@sass-store/database";
import { products } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { withTenantContext } from "@/lib/db/tenant-context";
import { logger } from "@/lib/logger";

// GET /api/v1/products - Listar productos del tenant actual
export async function GET(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam) : 100;

        // Build query to get products
        // Nota: Ya no necesitamos filtrar por tenantId ya que el contexto de tenant está establecido
        const result = await db
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
          .where(eq(products.tenantId, tenantId))
          .orderBy(desc(products.createdAt))
          .limit(limit);

        // Transform the results to match the expected format
        const productsData = result.map((product) => ({
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
        }));

        return NextResponse.json({
          data: productsData,
          count: productsData.length,
        });
      } catch (error) {
        logger.error("Error fetching products", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { logLevel: "info" },
  );
}

// POST /api/v1/products - Crear un nuevo producto
export async function POST(request: NextRequest) {
  return withTenantContext(
    request,
    async (request, tenantId) => {
      try {
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

        // Verificar si ya existe un producto con el mismo SKU para este tenant
        const existingProduct = await db
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.sku, sku)))
          .limit(1);

        if (existingProduct && existingProduct.length > 0) {
          return NextResponse.json(
            { error: "Product with this SKU already exists" },
            { status: 400 },
          );
        }

        // Crear el producto
        const newProduct = await db
          .insert(products)
          .values({
            sku,
            name,
            description: description || null,
            price: price.toString(),
            category,
            featured: featured || false,
            active: active !== undefined ? active : true,
            metadata: metadata || {},
            imageUrl: null,
            tenantId,
          })
          .returning();

        return NextResponse.json({
          data: newProduct[0],
          message: "Product created successfully",
        });
      } catch (error) {
        logger.error("Error creating product", error);
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 },
        );
      }
    },
    { logLevel: "info" },
  );
}
