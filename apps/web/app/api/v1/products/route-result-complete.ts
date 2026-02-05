import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import { products } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";

// Import Result pattern utilities
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  withResultHandler,
  withQueryValidation,
} from "@sass-store/core/src/middleware/result-handler";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Validation schemas
const ProductQuerySchema = z.object({
  limit: CommonSchemas.positiveInt.getSchema().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.boolean().optional(),
});

const ProductCreateSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

// Types
interface ProductQuery {
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
}

interface ProductCreate {
  sku: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  featured?: boolean;
  active?: boolean;
  metadata?: Record<string, any>;
}

interface ProductResponse {
  id: string;
  tenantId: string;
  sku: string;
  name: string;
  description: string | null;
  price: string;
  category: string;
  featured: boolean;
  active: boolean;
  metadata: Record<string, any> | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Service layer functions with Result pattern

/**
 * Check if SKU already exists in tenant
 */
const checkSkuExists = async (
  sku: string,
  tenantId: string,
  excludeProductId?: string,
): Promise<Result<boolean, DomainError>> => {
  try {
    const conditions = [eq(products.sku, sku), eq(products.tenantId, tenantId)];

    if (excludeProductId) {
      conditions.push(and(eq(products.id, excludeProductId)));
    }

    const [existingProduct] = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .limit(1);

    return Ok(!!existingProduct);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "check_sku_exists",
        `Failed to check SKU: ${sku}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Query products with filters and pagination
 */
const queryProducts = async (
  params: ProductQuery,
  tenantId: string,
): Promise<Result<ProductResponse[], DomainError>> => {
  try {
    const { limit = 100, search, category, featured } = params;

    // Build query conditions
    const conditions = [
      eq(products.tenantId, tenantId),
      eq(products.active, true),
    ];

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (featured !== undefined) {
      conditions.push(eq(products.featured, featured));
    }

    if (search) {
      conditions.push(
        and(
          eq(products.name, search),
          eq(products.sku, search),
          eq(products.description, search),
        ),
      );
    }

    const [productsResult] = await db
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
      .where(and(...conditions))
      .orderBy(desc(products.createdAt))
      .limit(limit);

    const productsData = productsResult.map(
      (product): ProductResponse => ({
        id: product.id,
        tenantId: product.tenantId,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        featured: product.featured,
        active: product.active,
        metadata: product.metadata,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      }),
    );

    return Ok(productsData);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "query_products",
        "Failed to query products",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * Create a new product
 */
const createProduct = async (
  productData: ProductCreate,
  tenantId: string,
): Promise<Result<ProductResponse, DomainError>> => {
  try {
    // Check if SKU already exists
    const skuCheckResult = await checkSkuExists(productData.sku, tenantId);
    if (!skuCheckResult.success) {
      return skuCheckResult;
    }

    if (skuCheckResult.data) {
      return Err(
        ErrorFactories.businessRule(
          "sku_exists",
          "Product with this SKU already exists",
          "SKU_EXISTS",
        ),
      );
    }

    // Insert product
    const [newProduct] = await db
      .insert(products)
      .values({
        sku: productData.sku,
        name: productData.name,
        description: productData.description || null,
        price: productData.price.toString(),
        category: productData.category,
        featured: productData.featured || false,
        active: productData.active !== undefined ? productData.active : true,
        metadata: productData.metadata || {},
        imageUrl: null, // TODO: Handle image upload
        tenantId: tenantId,
        emailVerified: null,
      })
      .returning();

    const productResponse: ProductResponse = {
      id: newProduct.id,
      tenantId: newProduct.tenantId,
      sku: newProduct.sku,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price.toString(),
      category: newProduct.category,
      featured: newProduct.featured,
      active: newProduct.active,
      metadata: newProduct.metadata,
      imageUrl: newProduct.imageUrl,
      createdAt: newProduct.createdAt.toISOString(),
      updatedAt: newProduct.updatedAt.toISOString(),
    };

    return Ok(productResponse);
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "create_product",
        `Failed to create product: ${productData.sku}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

/**
 * GET /api/v1/products - List products using Result Pattern
 */
export const GET = withQueryValidation(
  ProductQuerySchema,
  async (request: NextRequest, queryParams: ProductQuery) => {
    // TODO: Get tenantId from auth context
    const tenantId = "default-tenant"; // In real implementation, extract from auth

    return await queryProducts(queryParams, tenantId);
  },
);

/**
 * POST /api/v1/products - Create product using Result Pattern
 */
export const POST = withResultHandler(async (request: NextRequest) => {
  // TODO: Get tenantId from auth context
  const tenantId = "default-tenant"; // In real implementation, extract from auth

  // Parse and validate request body
  let productData: ProductCreate;
  try {
    productData = await request.json();
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Invalid JSON in request body",
        undefined,
        undefined,
        error,
      ),
    );
  }

  const validation = validateWithZod(ProductCreateSchema, productData);
  if (!validation.success) {
    return validation;
  }

  return await createProduct(validation.data, tenantId);
});
