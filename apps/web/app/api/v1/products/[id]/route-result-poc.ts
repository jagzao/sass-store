import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import { products } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

// Import Result pattern utilities
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Zod schema for product ID validation
const ProductIdSchema = z.string().uuid("Product ID must be a valid UUID");

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Service layer function using Result pattern
const getProductById = async (
  id: string,
  tenantId: string,
): Promise<Result<any, DomainError>> => {
  try {
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
      .where(eq(products.id, id))
      .limit(1);

    if (!productResult || productResult.length === 0) {
      return Err(ErrorFactories.notFound("Product", id));
    }

    return Ok(productResult[0]);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "find_product",
        `Failed to find product ${id}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

// Business logic validation
const validateProductAccess = (
  product: any,
  tenantId: string,
): Result<any, DomainError> => {
  if (product.tenantId !== tenantId) {
    return Err(
      ErrorFactories.authorization(
        "Access denied to product from different tenant",
        "tenant_access",
      ),
    );
  }

  if (!product.active) {
    return Err(
      ErrorFactories.businessRule(
        "product_inactive",
        "Cannot access inactive product",
        "PRODUCT_INACTIVE",
      ),
    );
  }

  return Ok(product);
};

// GET /api/v1/products/[id] - Obtener un producto específico using Result Pattern
export const GET = withResultHandler(
  async (request: NextRequest, context: RouteParams) => {
    const { id } = await context.params;

    // Validate product ID
    const idValidation = validateWithZod(ProductIdSchema, id, "id");
    if (!idValidation.success) {
      return idValidation;
    }

    // For simplicity in this POC, we'll assume tenant context is handled elsewhere
    const tenantId = "default-tenant"; // In real implementation, get from auth/context

    // Chain operations using Result pattern
    const productResult = await getProductById(idValidation.data, tenantId);
    if (!productResult.success) {
      return productResult;
    }

    return validateProductAccess(productResult.data, tenantId);
  },
);
