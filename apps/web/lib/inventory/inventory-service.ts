import { db } from "@sass-store/database";
import {
  inventoryAlerts,
  inventoryTransactions,
  productInventory,
  products,
  serviceProducts,
  services,
} from "@sass-store/database";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  not,
  or,
  sql,
} from "drizzle-orm";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

const UuidSchema = CommonSchemas.uuid.getSchema();
const PositiveDecimalSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid positive decimal format");

const InventoryQuerySchema = z.object({
  tenantId: UuidSchema,
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  lowStockOnly: z.boolean().optional().default(false),
  sortBy: z
    .enum(["name", "quantity", "reorderLevel", "createdAt"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

const CreateInventorySchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema,
  quantity: PositiveDecimalSchema,
  reorderLevel: PositiveDecimalSchema.optional(),
  reorderQuantity: PositiveDecimalSchema.optional(),
  unitCost: PositiveDecimalSchema.optional(),
  location: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateInventorySchema = z.object({
  quantity: PositiveDecimalSchema.optional(),
  reorderLevel: PositiveDecimalSchema.optional(),
  reorderQuantity: PositiveDecimalSchema.optional(),
  unitCost: PositiveDecimalSchema.optional(),
  location: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

const ServiceProductSchema = z.object({
  tenantId: UuidSchema,
  serviceId: UuidSchema,
  productId: UuidSchema,
  quantity: PositiveDecimalSchema.optional(),
  optional: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const InventoryAlertCreateSchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema,
  type: z.enum(["low_stock", "out_of_stock", "reorder_point"]),
  message: z.string().min(1).max(500),
  resolved: z.boolean().optional(),
});

const InventoryAlertUpdateSchema = z.object({
  resolved: z.boolean().optional().default(true),
  resolutionNote: z.string().max(500).optional(),
});

const InventoryTransactionsQuerySchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema.optional(),
  type: z.enum(["deduction", "addition", "adjustment", "initial"]).optional(),
  referenceType: z.string().max(100).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const DeductInventorySchema = z.object({
  tenantId: UuidSchema,
  serviceId: UuidSchema,
  products: z.array(
    z.object({
      productId: UuidSchema,
      quantity: z.number().positive(),
    }),
  ),
  notes: z.string().max(500).optional(),
});

const InventoryMovementCreateSchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema,
  quantity: z.number().positive(),
  type: z.enum(["in", "out"]),
  reason: z.string().min(1).max(255),
  notes: z.string().max(500).optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

const InventoryMovementQuerySchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema.optional(),
  type: z.enum(["in", "out"]).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

const InventoryTransferCreateSchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema,
  fromLocationId: z.string().min(1).max(100),
  toLocationId: z.string().min(1).max(100),
  quantity: z.number().positive(),
  requestedBy: z.string().max(100).optional(),
  reason: z.string().min(1).max(255),
  notes: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

const InventoryTransferUpdateSchema = z.object({
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  notes: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

const InventoryTransferQuerySchema = z.object({
  tenantId: UuidSchema,
  productId: UuidSchema.optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

const StockValueReportSchema = z.object({
  tenantId: UuidSchema,
  category: z.string().optional(),
});

const DateRangeReportSchema = z.object({
  tenantId: UuidSchema,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const toNumber = (value?: string | number | null): number =>
  value === null || value === undefined ? 0 : Number(value);

const mapInventoryRow = (row: {
  id: string;
  tenantId: string;
  productId: string;
  quantity: string;
  reorderLevel: string;
  reorderQuantity: string;
  unitCost: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  productName: string | null;
  productSku: string | null;
  productPrice: string | null;
  productActive: boolean | null;
}) => {
  const quantity = toNumber(row.quantity);
  const unitPrice = toNumber(row.unitCost ?? row.productPrice);

  return {
    id: row.id,
    tenantId: row.tenantId,
    productId: row.productId,
    productName: row.productName ?? "",
    productSku: row.productSku ?? "",
    quantity,
    reservedQuantity: 0,
    availableQuantity: quantity,
    reorderPoint: toNumber(row.reorderLevel),
    unitPrice,
    totalValue: quantity * unitPrice,
    lastUpdated: row.updatedAt ?? row.createdAt ?? new Date(),
    isActive: row.productActive ?? true,
  };
};

const mapAlertRow = (row: {
  id: string;
  tenantId: string;
  productId: string;
  productName: string | null;
  alertType: string;
  status: string;
  notes: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date | null;
  resolvedAt: Date | null;
}) => {
  const metadata = row.metadata ?? {};

  return {
    id: row.id,
    tenantId: row.tenantId,
    productId: row.productId,
    productName: row.productName ?? "",
    type: row.alertType,
    message: metadata.message ?? row.notes ?? "",
    resolved: row.status === "resolved",
    resolutionNote: metadata.resolutionNote ?? undefined,
    createdAt: row.createdAt ?? new Date(),
    resolvedAt: row.resolvedAt ?? undefined,
  };
};

const mapTransactionRow = (row: {
  id: string;
  tenantId: string;
  productId: string;
  productName: string | null;
  type: string;
  quantity: string;
  previousQuantity: string;
  newQuantity: string;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdAt: Date | null;
}) => ({
  id: row.id,
  tenantId: row.tenantId,
  productId: row.productId,
  productName: row.productName ?? "",
  type: row.type,
  quantity: toNumber(row.quantity),
  previousQuantity: toNumber(row.previousQuantity),
  newQuantity: toNumber(row.newQuantity),
  referenceType: row.referenceType ?? undefined,
  referenceId: row.referenceId ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: row.createdAt ?? new Date(),
});

export class InventoryService {
  static async getInventory(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    sortBy?: "name" | "quantity" | "reorderLevel" | "createdAt";
    sortOrder?: "asc" | "desc";
  }): Promise<Result<{ data: any[]; pagination: any }, DomainError>> {
    const validation = validateWithZod(InventoryQuerySchema, params);
    if (!validation.success) {
      return Err(validation.error);
    }

    const {
      tenantId,
      page = 1,
      limit = 20,
      search,
      category,
      lowStockOnly = false,
      sortBy = "name",
      sortOrder = "asc",
    } = validation.data;

    const offset = (page - 1) * limit;
    const whereConditions = [eq(productInventory.tenantId, tenantId)];

    if (search) {
      whereConditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.category, `%${search}%`),
        ),
      );
    }

    if (category) {
      whereConditions.push(eq(products.category, category));
    }

    if (lowStockOnly) {
      whereConditions.push(
        or(
          lt(productInventory.quantity, productInventory.reorderLevel),
          eq(productInventory.quantity, "0"),
        ),
      );
    }

    let orderBy;
    switch (sortBy) {
      case "quantity":
        orderBy =
          sortOrder === "asc"
            ? asc(productInventory.quantity)
            : desc(productInventory.quantity);
        break;
      case "reorderLevel":
        orderBy =
          sortOrder === "asc"
            ? asc(productInventory.reorderLevel)
            : desc(productInventory.reorderLevel);
        break;
      case "createdAt":
        orderBy =
          sortOrder === "asc"
            ? asc(productInventory.createdAt)
            : desc(productInventory.createdAt);
        break;
      default:
        orderBy =
          sortOrder === "asc" ? asc(products.name) : desc(products.name);
    }

    const inventoryResult = await fromPromise(
      db
        .select({
          id: productInventory.id,
          tenantId: productInventory.tenantId,
          productId: productInventory.productId,
          quantity: productInventory.quantity,
          reorderLevel: productInventory.reorderLevel,
          reorderQuantity: productInventory.reorderQuantity,
          unitCost: productInventory.unitCost,
          createdAt: productInventory.createdAt,
          updatedAt: productInventory.updatedAt,
          productName: products.name,
          productSku: products.sku,
          productPrice: products.price,
          productActive: products.active,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      (error) =>
        ErrorFactories.database(
          "get_inventory",
          "Failed to load inventory",
          undefined,
          error as Error,
        ),
    );

    if (!inventoryResult.success) {
      return Err(inventoryResult.error);
    }

    const totalResult = await fromPromise(
      db
        .select({ count: sql<number>`count(*)` })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(and(...whereConditions)),
      (error) =>
        ErrorFactories.database(
          "count_inventory",
          "Failed to count inventory",
          undefined,
          error as Error,
        ),
    );

    if (!totalResult.success) {
      return Err(totalResult.error);
    }

    const total = Number(totalResult.data[0]?.count ?? 0);
    const items = inventoryResult.data.map(mapInventoryRow);

    return Ok({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static async getInventoryByProductId(
    tenantId: string,
    productId: string,
  ): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(
      z.object({ tenantId: UuidSchema, productId: UuidSchema }),
      { tenantId, productId },
    );
    if (!validation.success) {
      return Err(validation.error);
    }

    const inventoryResult = await fromPromise(
      db
        .select({
          id: productInventory.id,
          tenantId: productInventory.tenantId,
          productId: productInventory.productId,
          quantity: productInventory.quantity,
          reorderLevel: productInventory.reorderLevel,
          reorderQuantity: productInventory.reorderQuantity,
          unitCost: productInventory.unitCost,
          createdAt: productInventory.createdAt,
          updatedAt: productInventory.updatedAt,
          productName: products.name,
          productSku: products.sku,
          productPrice: products.price,
          productActive: products.active,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.productId, productId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "get_inventory_product",
          "Failed to load inventory product",
          undefined,
          error as Error,
        ),
    );

    if (!inventoryResult.success) {
      return Err(inventoryResult.error);
    }

    if (!inventoryResult.data[0]) {
      return Err(ErrorFactories.notFound("Inventory", productId));
    }

    return Ok(mapInventoryRow(inventoryResult.data[0]));
  }

  static async createInventory(data: {
    tenantId: string;
    productId: string;
    quantity: string;
    reorderLevel?: string;
    reorderQuantity?: string;
    unitCost?: string;
    location?: string;
    metadata?: Record<string, any>;
  }): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(CreateInventorySchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const existsResult = await fromPromise(
      db
        .select({ id: productInventory.id })
        .from(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, data.tenantId),
            eq(productInventory.productId, data.productId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "check_inventory",
          "Failed to check inventory",
          undefined,
          error as Error,
        ),
    );

    if (!existsResult.success) {
      return Err(existsResult.error);
    }

    if (existsResult.data.length > 0) {
      return Err(
        ErrorFactories.businessRule(
          "inventory_exists",
          "Inventory already exists for this product",
          "DUPLICATE_INVENTORY",
        ),
      );
    }

    const createResult = await fromPromise(
      db.transaction(async (tx) => {
        const [created] = await tx
          .insert(productInventory)
          .values({
            tenantId: data.tenantId,
            productId: data.productId,
            quantity: data.quantity,
            reorderLevel: data.reorderLevel ?? "0",
            reorderQuantity: data.reorderQuantity ?? "0",
            unitCost: data.unitCost,
            location: data.location,
            metadata: data.metadata ?? {},
          })
          .returning();

        await tx.insert(inventoryTransactions).values({
          tenantId: data.tenantId,
          productId: data.productId,
          type: "initial",
          quantity: data.quantity,
          previousQuantity: "0",
          newQuantity: data.quantity,
          referenceType: "inventory_creation",
          metadata: {
            source: "inventory_creation",
            inventoryId: created.id,
          },
        });

        return created;
      }),
      (error) =>
        ErrorFactories.database(
          "create_inventory",
          "Failed to create inventory",
          undefined,
          error as Error,
        ),
    );

    if (!createResult.success) {
      return Err(createResult.error);
    }

    return Ok(createResult.data);
  }

  static async updateInventory(
    tenantId: string,
    productId: string,
    data: {
      quantity?: string;
      reorderLevel?: string;
      reorderQuantity?: string;
      unitCost?: string;
      location?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(UpdateInventorySchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const currentResult = await fromPromise(
      db
        .select({
          id: productInventory.id,
          quantity: productInventory.quantity,
        })
        .from(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.productId, productId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "load_inventory",
          "Failed to load inventory",
          undefined,
          error as Error,
        ),
    );

    if (!currentResult.success) {
      return Err(currentResult.error);
    }

    const current = currentResult.data[0];
    if (!current) {
      return Err(ErrorFactories.notFound("Inventory", productId));
    }

    const quantityChanged =
      data.quantity !== undefined && data.quantity !== current.quantity;
    const previousQuantity = current.quantity;
    const newQuantity = data.quantity ?? current.quantity;

    const updateResult = await fromPromise(
      db.transaction(async (tx) => {
        const [updated] = await tx
          .update(productInventory)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productInventory.tenantId, tenantId),
              eq(productInventory.productId, productId),
            ),
          )
          .returning();

        if (quantityChanged) {
          const difference = (
            toNumber(newQuantity) - toNumber(previousQuantity)
          ).toString();

          await tx.insert(inventoryTransactions).values({
            tenantId,
            productId,
            type: "adjustment",
            quantity: difference,
            previousQuantity,
            newQuantity,
            referenceType: "manual_adjustment",
          });
        }

        return updated;
      }),
      (error) =>
        ErrorFactories.database(
          "update_inventory",
          "Failed to update inventory",
          undefined,
          error as Error,
        ),
    );

    if (!updateResult.success) {
      return Err(updateResult.error);
    }

    return Ok(updateResult.data);
  }

  static async deleteInventory(
    tenantId: string,
    productId: string,
  ): Promise<Result<any, DomainError>> {
    const deleteResult = await fromPromise(
      db
        .delete(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.productId, productId),
          ),
        )
        .returning(),
      (error) =>
        ErrorFactories.database(
          "delete_inventory",
          "Failed to delete inventory",
          undefined,
          error as Error,
        ),
    );

    if (!deleteResult.success) {
      return Err(deleteResult.error);
    }

    if (!deleteResult.data[0]) {
      return Err(ErrorFactories.notFound("Inventory", productId));
    }

    return Ok(deleteResult.data[0]);
  }

  static async getServiceProducts(
    serviceId: string,
    tenantId: string,
  ): Promise<Result<any[], DomainError>> {
    const validation = validateWithZod(
      z.object({ tenantId: UuidSchema, serviceId: UuidSchema }),
      { tenantId, serviceId },
    );
    if (!validation.success) {
      return Err(validation.error);
    }

    const serviceProductsResult = await fromPromise(
      db
        .select({
          id: serviceProducts.id,
          tenantId: serviceProducts.tenantId,
          serviceId: serviceProducts.serviceId,
          productId: serviceProducts.productId,
          quantity: serviceProducts.quantity,
          optional: serviceProducts.optional,
          metadata: serviceProducts.metadata,
          createdAt: serviceProducts.createdAt,
          updatedAt: serviceProducts.updatedAt,
          serviceName: services.name,
          productName: products.name,
        })
        .from(serviceProducts)
        .leftJoin(services, eq(serviceProducts.serviceId, services.id))
        .leftJoin(products, eq(serviceProducts.productId, products.id))
        .where(
          and(
            eq(serviceProducts.serviceId, serviceId),
            eq(serviceProducts.tenantId, tenantId),
          ),
        )
        .orderBy(asc(serviceProducts.createdAt)),
      (error) =>
        ErrorFactories.database(
          "get_service_products",
          "Failed to load service products",
          undefined,
          error as Error,
        ),
    );

    if (!serviceProductsResult.success) {
      return Err(serviceProductsResult.error);
    }

    const mapped = serviceProductsResult.data.map((row) => ({
      id: row.id,
      tenantId: row.tenantId,
      serviceId: row.serviceId,
      serviceName: row.serviceName ?? "",
      productId: row.productId,
      productName: row.productName ?? "",
      quantity: toNumber(row.quantity),
      optional: row.optional ?? false,
      metadata: row.metadata ?? {},
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return Ok(mapped);
  }

  static async addProductToService(data: {
    tenantId: string;
    serviceId: string;
    productId: string;
    quantity?: string;
    optional?: boolean;
    metadata?: Record<string, any>;
  }): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(ServiceProductSchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const existingResult = await fromPromise(
      db
        .select({ id: serviceProducts.id })
        .from(serviceProducts)
        .where(
          and(
            eq(serviceProducts.tenantId, data.tenantId),
            eq(serviceProducts.serviceId, data.serviceId),
            eq(serviceProducts.productId, data.productId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "check_service_product",
          "Failed to check service product",
          undefined,
          error as Error,
        ),
    );

    if (!existingResult.success) {
      return Err(existingResult.error);
    }

    if (existingResult.data.length > 0) {
      return Err(
        ErrorFactories.businessRule(
          "service_product_exists",
          "Product already associated to service",
          "DUPLICATE_SERVICE_PRODUCT",
        ),
      );
    }

    const insertResult = await fromPromise(
      db
        .insert(serviceProducts)
        .values({
          tenantId: data.tenantId,
          serviceId: data.serviceId,
          productId: data.productId,
          quantity: data.quantity ?? "1",
          optional: data.optional ?? false,
          metadata: data.metadata ?? {},
        })
        .returning(),
      (error) =>
        ErrorFactories.database(
          "add_service_product",
          "Failed to add product to service",
          undefined,
          error as Error,
        ),
    );

    if (!insertResult.success) {
      return Err(insertResult.error);
    }

    return Ok(insertResult.data[0]);
  }

  static async removeProductFromService(
    tenantId: string,
    serviceId: string,
    productId: string,
  ): Promise<Result<any, DomainError>> {
    const deleteResult = await fromPromise(
      db
        .delete(serviceProducts)
        .where(
          and(
            eq(serviceProducts.tenantId, tenantId),
            eq(serviceProducts.serviceId, serviceId),
            eq(serviceProducts.productId, productId),
          ),
        )
        .returning(),
      (error) =>
        ErrorFactories.database(
          "remove_service_product",
          "Failed to remove product from service",
          undefined,
          error as Error,
        ),
    );

    if (!deleteResult.success) {
      return Err(deleteResult.error);
    }

    if (!deleteResult.data[0]) {
      return Err(
        ErrorFactories.notFound("ServiceProduct", `${serviceId}-${productId}`),
      );
    }

    return Ok(deleteResult.data[0]);
  }

  static async getInventoryTransactions(params: {
    tenantId: string;
    productId?: string;
    type?: string;
    referenceType?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Result<{ data: any[]; pagination: any }, DomainError>> {
    const validation = validateWithZod(
      InventoryTransactionsQuerySchema,
      params,
    );
    if (!validation.success) {
      return Err(validation.error);
    }

    const {
      tenantId,
      productId,
      type,
      referenceType,
      page = 1,
      limit = 20,
      startDate,
      endDate,
    } = validation.data;

    const offset = (page - 1) * limit;
    const whereConditions = [eq(inventoryTransactions.tenantId, tenantId)];

    if (productId) {
      whereConditions.push(eq(inventoryTransactions.productId, productId));
    }

    if (type) {
      whereConditions.push(eq(inventoryTransactions.type, type));
    }

    if (referenceType) {
      whereConditions.push(
        eq(inventoryTransactions.referenceType, referenceType),
      );
    }

    if (startDate) {
      whereConditions.push(gte(inventoryTransactions.createdAt, startDate));
    }

    if (endDate) {
      whereConditions.push(lt(inventoryTransactions.createdAt, endDate));
    }

    const transactionsResult = await fromPromise(
      db
        .select({
          id: inventoryTransactions.id,
          tenantId: inventoryTransactions.tenantId,
          productId: inventoryTransactions.productId,
          type: inventoryTransactions.type,
          quantity: inventoryTransactions.quantity,
          previousQuantity: inventoryTransactions.previousQuantity,
          newQuantity: inventoryTransactions.newQuantity,
          referenceType: inventoryTransactions.referenceType,
          referenceId: inventoryTransactions.referenceId,
          notes: inventoryTransactions.notes,
          createdAt: inventoryTransactions.createdAt,
          productName: products.name,
        })
        .from(inventoryTransactions)
        .leftJoin(products, eq(inventoryTransactions.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(desc(inventoryTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      (error) =>
        ErrorFactories.database(
          "get_inventory_transactions",
          "Failed to load inventory transactions",
          undefined,
          error as Error,
        ),
    );

    if (!transactionsResult.success) {
      return Err(transactionsResult.error);
    }

    const totalResult = await fromPromise(
      db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryTransactions)
        .where(and(...whereConditions)),
      (error) =>
        ErrorFactories.database(
          "count_inventory_transactions",
          "Failed to count inventory transactions",
          undefined,
          error as Error,
        ),
    );

    if (!totalResult.success) {
      return Err(totalResult.error);
    }

    const total = Number(totalResult.data[0]?.count ?? 0);

    return Ok({
      data: transactionsResult.data.map(mapTransactionRow),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static async getInventoryAlerts(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    productId?: string;
    type?: string;
    resolved?: boolean;
  }): Promise<Result<{ data: any[]; pagination: any }, DomainError>> {
    const validation = validateWithZod(
      z.object({
        tenantId: UuidSchema,
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(100).optional().default(20),
        productId: UuidSchema.optional(),
        type: z.enum(["low_stock", "out_of_stock", "reorder_point"]).optional(),
        resolved: z.boolean().optional(),
      }),
      params,
    );

    if (!validation.success) {
      return Err(validation.error);
    }

    const {
      tenantId,
      page = 1,
      limit = 20,
      productId,
      type,
      resolved,
    } = validation.data;
    const offset = (page - 1) * limit;
    const whereConditions = [eq(inventoryAlerts.tenantId, tenantId)];

    if (productId) {
      whereConditions.push(eq(inventoryAlerts.productId, productId));
    }

    if (type) {
      whereConditions.push(eq(inventoryAlerts.alertType, type));
    }

    if (resolved === true) {
      whereConditions.push(eq(inventoryAlerts.status, "resolved"));
    }

    if (resolved === false) {
      whereConditions.push(not(eq(inventoryAlerts.status, "resolved")));
    }

    const alertsResult = await fromPromise(
      db
        .select({
          id: inventoryAlerts.id,
          tenantId: inventoryAlerts.tenantId,
          productId: inventoryAlerts.productId,
          alertType: inventoryAlerts.alertType,
          status: inventoryAlerts.status,
          notes: inventoryAlerts.notes,
          metadata: inventoryAlerts.metadata,
          createdAt: inventoryAlerts.createdAt,
          resolvedAt: inventoryAlerts.resolvedAt,
          productName: products.name,
        })
        .from(inventoryAlerts)
        .leftJoin(products, eq(inventoryAlerts.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(desc(inventoryAlerts.createdAt))
        .limit(limit)
        .offset(offset),
      (error) =>
        ErrorFactories.database(
          "get_inventory_alerts",
          "Failed to load inventory alerts",
          undefined,
          error as Error,
        ),
    );

    if (!alertsResult.success) {
      return Err(alertsResult.error);
    }

    const totalResult = await fromPromise(
      db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryAlerts)
        .where(and(...whereConditions)),
      (error) =>
        ErrorFactories.database(
          "count_inventory_alerts",
          "Failed to count inventory alerts",
          undefined,
          error as Error,
        ),
    );

    if (!totalResult.success) {
      return Err(totalResult.error);
    }

    const total = Number(totalResult.data[0]?.count ?? 0);

    return Ok({
      data: alertsResult.data.map(mapAlertRow),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static async createInventoryAlert(data: {
    tenantId: string;
    productId: string;
    type: "low_stock" | "out_of_stock" | "reorder_point";
    message: string;
    resolved?: boolean;
  }): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(InventoryAlertCreateSchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const insertResult = await fromPromise(
      db
        .insert(inventoryAlerts)
        .values({
          tenantId: data.tenantId,
          productId: data.productId,
          alertType: data.type,
          severity: data.type === "out_of_stock" ? "critical" : "medium",
          status: data.resolved ? "resolved" : "active",
          notes: null,
          resolvedAt: data.resolved ? new Date() : null,
          metadata: {
            message: data.message,
            source: "manual",
          },
        })
        .returning({ id: inventoryAlerts.id }),
      (error) =>
        ErrorFactories.database(
          "create_inventory_alert",
          "Failed to create inventory alert",
          undefined,
          error as Error,
        ),
    );

    if (!insertResult.success) {
      return Err(insertResult.error);
    }

    return this.getInventoryAlertById(data.tenantId, insertResult.data[0].id);
  }

  static async getInventoryAlertById(
    tenantId: string,
    alertId: string,
  ): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(
      z.object({ tenantId: UuidSchema, alertId: UuidSchema }),
      { tenantId, alertId },
    );
    if (!validation.success) {
      return Err(validation.error);
    }

    const alertResult = await fromPromise(
      db
        .select({
          id: inventoryAlerts.id,
          tenantId: inventoryAlerts.tenantId,
          productId: inventoryAlerts.productId,
          alertType: inventoryAlerts.alertType,
          status: inventoryAlerts.status,
          notes: inventoryAlerts.notes,
          metadata: inventoryAlerts.metadata,
          createdAt: inventoryAlerts.createdAt,
          resolvedAt: inventoryAlerts.resolvedAt,
          productName: products.name,
        })
        .from(inventoryAlerts)
        .leftJoin(products, eq(inventoryAlerts.productId, products.id))
        .where(
          and(
            eq(inventoryAlerts.tenantId, tenantId),
            eq(inventoryAlerts.id, alertId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "get_inventory_alert",
          "Failed to load inventory alert",
          undefined,
          error as Error,
        ),
    );

    if (!alertResult.success) {
      return Err(alertResult.error);
    }

    if (!alertResult.data[0]) {
      return Err(ErrorFactories.notFound("InventoryAlert", alertId));
    }

    return Ok(mapAlertRow(alertResult.data[0]));
  }

  static async updateInventoryAlert(
    tenantId: string,
    alertId: string,
    data: { resolved?: boolean; resolutionNote?: string },
  ): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(InventoryAlertUpdateSchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const existingResult = await fromPromise(
      db
        .select({
          id: inventoryAlerts.id,
          metadata: inventoryAlerts.metadata,
        })
        .from(inventoryAlerts)
        .where(
          and(
            eq(inventoryAlerts.tenantId, tenantId),
            eq(inventoryAlerts.id, alertId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "get_inventory_alert",
          "Failed to load inventory alert",
          undefined,
          error as Error,
        ),
    );

    if (!existingResult.success) {
      return Err(existingResult.error);
    }

    if (!existingResult.data[0]) {
      return Err(ErrorFactories.notFound("InventoryAlert", alertId));
    }

    const existingMetadata = existingResult.data[0].metadata ?? {};
    const updateResult = await fromPromise(
      db
        .update(inventoryAlerts)
        .set({
          status: validation.data.resolved ? "resolved" : "active",
          resolvedAt: validation.data.resolved ? new Date() : null,
          notes: validation.data.resolutionNote ?? null,
          metadata: {
            ...existingMetadata,
            resolutionNote: validation.data.resolutionNote ?? null,
          },
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryAlerts.tenantId, tenantId),
            eq(inventoryAlerts.id, alertId),
          ),
        )
        .returning({ id: inventoryAlerts.id }),
      (error) =>
        ErrorFactories.database(
          "update_inventory_alert",
          "Failed to update inventory alert",
          undefined,
          error as Error,
        ),
    );

    if (!updateResult.success) {
      return Err(updateResult.error);
    }

    return this.getInventoryAlertById(tenantId, updateResult.data[0].id);
  }

  static async deleteInventoryAlert(
    tenantId: string,
    alertId: string,
  ): Promise<Result<any, DomainError>> {
    const deleteResult = await fromPromise(
      db
        .delete(inventoryAlerts)
        .where(
          and(
            eq(inventoryAlerts.tenantId, tenantId),
            eq(inventoryAlerts.id, alertId),
          ),
        )
        .returning(),
      (error) =>
        ErrorFactories.database(
          "delete_inventory_alert",
          "Failed to delete inventory alert",
          undefined,
          error as Error,
        ),
    );

    if (!deleteResult.success) {
      return Err(deleteResult.error);
    }

    if (!deleteResult.data[0]) {
      return Err(ErrorFactories.notFound("InventoryAlert", alertId));
    }

    return Ok(deleteResult.data[0]);
  }

  static async deductInventoryForService(
    tenantId: string,
    serviceId: string,
    productsToDeduct: { productId: string; quantity: number }[],
    notes?: string,
  ): Promise<Result<{ transactions: any[]; alerts: any[] }, DomainError>> {
    const validation = validateWithZod(DeductInventorySchema, {
      tenantId,
      serviceId,
      products: productsToDeduct,
      notes,
    });

    if (!validation.success) {
      return Err(validation.error);
    }

    const productIds = validation.data.products.map((item) => item.productId);

    const inventoriesResult = await fromPromise(
      db
        .select({
          id: productInventory.id,
          productId: productInventory.productId,
          quantity: productInventory.quantity,
          reorderLevel: productInventory.reorderLevel,
        })
        .from(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            inArray(productInventory.productId, productIds),
          ),
        ),
      (error) =>
        ErrorFactories.database(
          "load_inventory",
          "Failed to load inventory for deduction",
          undefined,
          error as Error,
        ),
    );

    if (!inventoriesResult.success) {
      return Err(inventoriesResult.error);
    }

    const inventoryMap = new Map(
      inventoriesResult.data.map((inventory) => [
        inventory.productId,
        inventory,
      ]),
    );

    const insufficientStock = validation.data.products
      .map((item) => {
        const inventory = inventoryMap.get(item.productId);
        if (!inventory) {
          return {
            productId: item.productId,
            available: 0,
            requested: item.quantity,
            reason: "Inventario no encontrado",
          };
        }

        const available = toNumber(inventory.quantity);
        if (available < item.quantity) {
          return {
            productId: item.productId,
            available,
            requested: item.quantity,
            reason: "Stock insuficiente",
          };
        }

        return null;
      })
      .filter((item) => item !== null);

    if (insufficientStock.length > 0) {
      return Err({
        ...ErrorFactories.businessRule(
          "insufficient_stock",
          "Insufficient stock for deduction",
          "INSUFFICIENT_STOCK",
        ),
        details: { insufficientStock },
      });
    }

    const deductionResult = await fromPromise(
      db.transaction(async (tx) => {
        const transactions: any[] = [];
        const alerts: any[] = [];

        for (const item of validation.data.products) {
          const inventory = inventoryMap.get(item.productId)!;
          const previousQuantity = inventory.quantity;
          const newQuantity = (
            toNumber(inventory.quantity) - item.quantity
          ).toString();

          await tx
            .update(productInventory)
            .set({
              quantity: newQuantity,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(productInventory.tenantId, tenantId),
                eq(productInventory.productId, item.productId),
              ),
            );

          const [transaction] = await tx
            .insert(inventoryTransactions)
            .values({
              tenantId,
              productId: item.productId,
              type: "deduction",
              quantity: (-item.quantity).toString(),
              previousQuantity,
              newQuantity,
              referenceType: "service_completion",
              referenceId: serviceId,
              notes,
              metadata: {
                serviceId,
                quantityUsed: item.quantity,
              },
            })
            .returning();

          transactions.push(transaction);

          const shouldAlert =
            toNumber(newQuantity) <= toNumber(inventory.reorderLevel);
          if (shouldAlert) {
            const alertType =
              toNumber(newQuantity) === 0 ? "out_of_stock" : "low_stock";
            const existingAlert = await tx
              .select({ id: inventoryAlerts.id })
              .from(inventoryAlerts)
              .where(
                and(
                  eq(inventoryAlerts.tenantId, tenantId),
                  eq(inventoryAlerts.productId, item.productId),
                  eq(inventoryAlerts.alertType, alertType),
                  eq(inventoryAlerts.status, "active"),
                ),
              )
              .limit(1);

            if (existingAlert.length === 0) {
              const [alert] = await tx
                .insert(inventoryAlerts)
                .values({
                  tenantId,
                  productId: item.productId,
                  alertType,
                  severity:
                    alertType === "out_of_stock" ? "critical" : "medium",
                  status: "active",
                  metadata: {
                    message:
                      alertType === "out_of_stock"
                        ? "Producto sin stock"
                        : "Stock por debajo del mínimo",
                    source: "deduction",
                  },
                })
                .returning();

              alerts.push(alert);
            }
          }
        }

        return { transactions, alerts };
      }),
      (error) =>
        ErrorFactories.database(
          "deduct_inventory",
          "Failed to deduct inventory",
          undefined,
          error as Error,
        ),
    );

    if (!deductionResult.success) {
      return Err(deductionResult.error);
    }

    return Ok(deductionResult.data);
  }

  static async getLowStockReport(
    tenantId: string,
  ): Promise<Result<any[], DomainError>> {
    const validation = validateWithZod(z.object({ tenantId: UuidSchema }), {
      tenantId,
    });
    if (!validation.success) {
      return Err(validation.error);
    }

    const reportResult = await fromPromise(
      db
        .select({
          productId: productInventory.productId,
          productName: products.name,
          productSku: products.sku,
          currentQuantity: productInventory.quantity,
          reorderLevel: productInventory.reorderLevel,
          unitCost: productInventory.unitCost,
          unitPrice: products.price,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            lt(productInventory.quantity, productInventory.reorderLevel),
          ),
        )
        .orderBy(asc(productInventory.quantity)),
      (error) =>
        ErrorFactories.database(
          "low_stock_report",
          "Failed to build low stock report",
          undefined,
          error as Error,
        ),
    );

    if (!reportResult.success) {
      return Err(reportResult.error);
    }

    const mapped = reportResult.data.map((row) => {
      const quantity = toNumber(row.currentQuantity);
      const unitPrice = toNumber(row.unitCost ?? row.unitPrice);
      return {
        productId: row.productId,
        productName: row.productName ?? "",
        productSku: row.productSku ?? "",
        currentQuantity: quantity,
        reorderLevel: toNumber(row.reorderLevel),
        unitPrice,
        totalValue: quantity * unitPrice,
      };
    });

    return Ok(mapped);
  }

  static async getStockValueReport(
    tenantId: string,
    category?: string,
  ): Promise<Result<any[], DomainError>> {
    const validation = validateWithZod(StockValueReportSchema, {
      tenantId,
      category,
    });
    if (!validation.success) {
      return Err(validation.error);
    }

    const whereConditions = [eq(productInventory.tenantId, tenantId)];
    if (category) {
      whereConditions.push(eq(products.category, category));
    }

    const reportResult = await fromPromise(
      db
        .select({
          productId: productInventory.productId,
          productName: products.name,
          productSku: products.sku,
          category: products.category,
          quantity: productInventory.quantity,
          unitCost: productInventory.unitCost,
          unitPrice: products.price,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(and(...whereConditions)),
      (error) =>
        ErrorFactories.database(
          "stock_value_report",
          "Failed to build stock value report",
          undefined,
          error as Error,
        ),
    );

    if (!reportResult.success) {
      return Err(reportResult.error);
    }

    const mapped = reportResult.data.map((row) => {
      const quantity = toNumber(row.quantity);
      const unitPrice = toNumber(row.unitCost ?? row.unitPrice);
      return {
        productId: row.productId,
        productName: row.productName ?? "",
        productSku: row.productSku ?? "",
        category: row.category ?? "",
        quantity,
        unitPrice,
        totalValue: quantity * unitPrice,
      };
    });

    return Ok(mapped);
  }

  static async getMovementSummaryReport(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Result<any[], DomainError>> {
    const validation = validateWithZod(DateRangeReportSchema, {
      tenantId,
      startDate,
      endDate,
    });
    if (!validation.success) {
      return Err(validation.error);
    }

    const whereConditions = [eq(inventoryTransactions.tenantId, tenantId)];
    if (startDate) {
      whereConditions.push(gte(inventoryTransactions.createdAt, startDate));
    }
    if (endDate) {
      whereConditions.push(lt(inventoryTransactions.createdAt, endDate));
    }

    const reportResult = await fromPromise(
      db
        .select({
          type: inventoryTransactions.type,
          totalQuantity: sql<string>`SUM(CAST(${inventoryTransactions.quantity} AS DECIMAL))`,
          transactionCount: sql<string>`COUNT(*)`,
        })
        .from(inventoryTransactions)
        .where(and(...whereConditions))
        .groupBy(inventoryTransactions.type)
        .orderBy(asc(inventoryTransactions.type)),
      (error) =>
        ErrorFactories.database(
          "movement_summary_report",
          "Failed to build movement summary report",
          undefined,
          error as Error,
        ),
    );

    if (!reportResult.success) {
      return Err(reportResult.error);
    }

    const mapped = reportResult.data.map((row) => ({
      type: row.type,
      totalQuantity: Number(row.totalQuantity ?? 0),
      transactionCount: Number(row.transactionCount ?? 0),
    }));

    return Ok(mapped);
  }

  static async getProductPerformanceReport(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Result<any[], DomainError>> {
    const validation = validateWithZod(DateRangeReportSchema, {
      tenantId,
      startDate,
      endDate,
    });
    if (!validation.success) {
      return Err(validation.error);
    }

    const whereConditions = [eq(inventoryTransactions.tenantId, tenantId)];
    if (startDate) {
      whereConditions.push(gte(inventoryTransactions.createdAt, startDate));
    }
    if (endDate) {
      whereConditions.push(lt(inventoryTransactions.createdAt, endDate));
    }

    const reportResult = await fromPromise(
      db
        .select({
          productId: inventoryTransactions.productId,
          productName: products.name,
          totalDeducted: sql<string>`SUM(CASE WHEN ${inventoryTransactions.type} = 'deduction' THEN CAST(${inventoryTransactions.quantity} AS DECIMAL) ELSE 0 END)`,
          totalAdded: sql<string>`SUM(CASE WHEN ${inventoryTransactions.type} = 'addition' THEN CAST(${inventoryTransactions.quantity} AS DECIMAL) ELSE 0 END)`,
          totalAdjusted: sql<string>`SUM(CASE WHEN ${inventoryTransactions.type} = 'adjustment' THEN CAST(${inventoryTransactions.quantity} AS DECIMAL) ELSE 0 END)`,
          netChange: sql<string>`SUM(CAST(${inventoryTransactions.quantity} AS DECIMAL))`,
        })
        .from(inventoryTransactions)
        .leftJoin(products, eq(inventoryTransactions.productId, products.id))
        .where(and(...whereConditions))
        .groupBy(inventoryTransactions.productId, products.name)
        .orderBy(
          desc(sql`SUM(CAST(${inventoryTransactions.quantity} AS DECIMAL))`),
        ),
      (error) =>
        ErrorFactories.database(
          "product_performance_report",
          "Failed to build product performance report",
          undefined,
          error as Error,
        ),
    );

    if (!reportResult.success) {
      return Err(reportResult.error);
    }

    const mapped = reportResult.data.map((row) => ({
      productId: row.productId,
      productName: row.productName ?? "",
      totalDeducted: Number(row.totalDeducted ?? 0),
      totalAdded: Number(row.totalAdded ?? 0),
      totalAdjusted: Number(row.totalAdjusted ?? 0),
      netChange: Number(row.netChange ?? 0),
    }));

    return Ok(mapped);
  }

  static async getInventoryMovements(params: {
    tenantId: string;
    productId?: string;
    type?: "in" | "out";
    page?: number;
    limit?: number;
  }): Promise<Result<{ data: any[]; pagination: any }, DomainError>> {
    const validation = validateWithZod(InventoryMovementQuerySchema, params);
    if (!validation.success) {
      return Err(validation.error);
    }

    const { tenantId, productId, type, page = 1, limit = 20 } = validation.data;
    const offset = (page - 1) * limit;
    const whereConditions = [
      eq(inventoryTransactions.tenantId, tenantId),
      eq(inventoryTransactions.referenceType, "movement"),
    ];

    if (productId) {
      whereConditions.push(eq(inventoryTransactions.productId, productId));
    }

    if (type) {
      whereConditions.push(
        eq(
          inventoryTransactions.type,
          type === "in" ? "addition" : "deduction",
        ),
      );
    }

    const movementsResult = await fromPromise(
      db
        .select({
          id: inventoryTransactions.id,
          tenantId: inventoryTransactions.tenantId,
          productId: inventoryTransactions.productId,
          type: inventoryTransactions.type,
          quantity: inventoryTransactions.quantity,
          notes: inventoryTransactions.notes,
          referenceId: inventoryTransactions.referenceId,
          referenceType: inventoryTransactions.referenceType,
          metadata: inventoryTransactions.metadata,
          createdAt: inventoryTransactions.createdAt,
        })
        .from(inventoryTransactions)
        .where(and(...whereConditions))
        .orderBy(desc(inventoryTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      (error) =>
        ErrorFactories.database(
          "get_inventory_movements",
          "Failed to load inventory movements",
          undefined,
          error as Error,
        ),
    );

    if (!movementsResult.success) {
      return Err(movementsResult.error);
    }

    const totalResult = await fromPromise(
      db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryTransactions)
        .where(and(...whereConditions)),
      (error) =>
        ErrorFactories.database(
          "count_inventory_movements",
          "Failed to count inventory movements",
          undefined,
          error as Error,
        ),
    );

    if (!totalResult.success) {
      return Err(totalResult.error);
    }

    const total = Number(totalResult.data[0]?.count ?? 0);

    const mapped = movementsResult.data.map((movement) => ({
      id: movement.id,
      tenantId: movement.tenantId,
      productId: movement.productId,
      quantity: toNumber(movement.quantity),
      type: movement.type === "addition" ? "in" : "out",
      reason: movement.metadata?.reason ?? movement.notes ?? "",
      notes: movement.notes ?? undefined,
      referenceId: movement.referenceId ?? undefined,
      referenceType: movement.referenceType ?? undefined,
      createdAt: movement.createdAt ?? new Date(),
      metadata: movement.metadata ?? {},
    }));

    return Ok({
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static async createInventoryMovement(data: {
    tenantId: string;
    productId: string;
    quantity: number;
    type: "in" | "out";
    reason: string;
    notes?: string;
    referenceId?: string;
    referenceType?: string;
    metadata?: Record<string, any>;
  }): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(InventoryMovementCreateSchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const inventoryResult = await fromPromise(
      db
        .select({
          quantity: productInventory.quantity,
        })
        .from(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, data.tenantId),
            eq(productInventory.productId, data.productId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "load_inventory",
          "Failed to load inventory",
          undefined,
          error as Error,
        ),
    );

    if (!inventoryResult.success) {
      return Err(inventoryResult.error);
    }

    const inventory = inventoryResult.data[0];
    if (!inventory) {
      return Err(ErrorFactories.notFound("Inventory", data.productId));
    }

    const currentQuantity = toNumber(inventory.quantity);
    const adjustedQuantity =
      data.type === "in"
        ? currentQuantity + data.quantity
        : currentQuantity - data.quantity;

    if (adjustedQuantity < 0) {
      return Err(
        ErrorFactories.businessRule(
          "insufficient_stock",
          "Insufficient stock for movement",
          "INSUFFICIENT_STOCK",
        ),
      );
    }

    const movementResult = await fromPromise(
      db.transaction(async (tx) => {
        await tx
          .update(productInventory)
          .set({
            quantity: adjustedQuantity.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productInventory.tenantId, data.tenantId),
              eq(productInventory.productId, data.productId),
            ),
          );

        const [transaction] = await tx
          .insert(inventoryTransactions)
          .values({
            tenantId: data.tenantId,
            productId: data.productId,
            type: data.type === "in" ? "addition" : "deduction",
            quantity:
              data.type === "in"
                ? data.quantity.toString()
                : (-data.quantity).toString(),
            previousQuantity: currentQuantity.toString(),
            newQuantity: adjustedQuantity.toString(),
            referenceType: data.referenceType ?? "movement",
            referenceId: data.referenceId,
            notes: data.notes ?? data.reason,
            metadata: {
              ...(data.metadata ?? {}),
              reason: data.reason,
            },
          })
          .returning();

        return transaction;
      }),
      (error) =>
        ErrorFactories.database(
          "create_inventory_movement",
          "Failed to create inventory movement",
          undefined,
          error as Error,
        ),
    );

    if (!movementResult.success) {
      return Err(movementResult.error);
    }

    return Ok(movementResult.data);
  }

  static async getInventoryTransfers(params: {
    tenantId: string;
    productId?: string;
    status?: "pending" | "in_progress" | "completed" | "cancelled";
    page?: number;
    limit?: number;
  }): Promise<Result<{ data: any[]; pagination: any }, DomainError>> {
    const validation = validateWithZod(InventoryTransferQuerySchema, params);
    if (!validation.success) {
      return Err(validation.error);
    }

    const {
      tenantId,
      productId,
      status,
      page = 1,
      limit = 20,
    } = validation.data;
    const offset = (page - 1) * limit;

    const whereConditions = [
      eq(inventoryTransactions.tenantId, tenantId),
      eq(inventoryTransactions.referenceType, "transfer"),
    ];

    if (productId) {
      whereConditions.push(eq(inventoryTransactions.productId, productId));
    }

    const transfersResult = await fromPromise(
      db
        .select({
          id: inventoryTransactions.referenceId,
          tenantId: inventoryTransactions.tenantId,
          productId: inventoryTransactions.productId,
          quantity: inventoryTransactions.quantity,
          notes: inventoryTransactions.notes,
          metadata: inventoryTransactions.metadata,
          createdAt: inventoryTransactions.createdAt,
        })
        .from(inventoryTransactions)
        .where(and(...whereConditions))
        .orderBy(desc(inventoryTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      (error) =>
        ErrorFactories.database(
          "get_inventory_transfers",
          "Failed to load inventory transfers",
          undefined,
          error as Error,
        ),
    );

    if (!transfersResult.success) {
      return Err(transfersResult.error);
    }

    const filteredTransfers = transfersResult.data.filter((row) => {
      if (!status) return true;
      return (row.metadata?.status ?? "pending") === status;
    });

    const totalResult = await fromPromise(
      db
        .select({ count: sql<number>`count(*)` })
        .from(inventoryTransactions)
        .where(and(...whereConditions)),
      (error) =>
        ErrorFactories.database(
          "count_inventory_transfers",
          "Failed to count inventory transfers",
          undefined,
          error as Error,
        ),
    );

    if (!totalResult.success) {
      return Err(totalResult.error);
    }

    const total = Number(totalResult.data[0]?.count ?? 0);
    const mapped = filteredTransfers.map((transfer) => {
      const metadata = transfer.metadata ?? {};
      const quantityValue = Number(metadata.transferQuantity ?? 0);
      return {
        id: transfer.id,
        tenantId: transfer.tenantId,
        productId: transfer.productId,
        fromLocationId: metadata.fromLocationId ?? "",
        toLocationId: metadata.toLocationId ?? "",
        quantity: Math.abs(quantityValue),
        status: metadata.status ?? "pending",
        reason: metadata.reason ?? "",
        notes: transfer.notes ?? undefined,
        createdAt: transfer.createdAt ?? new Date(),
        updatedAt: metadata.updatedAt ?? transfer.createdAt ?? new Date(),
        metadata,
      };
    });

    return Ok({
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static async createInventoryTransfer(data: {
    tenantId: string;
    productId: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    requestedBy?: string;
    reason: string;
    notes?: string;
    metadata?: Record<string, any>;
  }): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(InventoryTransferCreateSchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const transferId = crypto.randomUUID();
    const now = new Date();

    const createResult = await fromPromise(
      db
        .insert(inventoryTransactions)
        .values({
          tenantId: data.tenantId,
          productId: data.productId,
          type: "adjustment",
          quantity: "0",
          previousQuantity: "0",
          newQuantity: "0",
          referenceType: "transfer",
          referenceId: transferId,
          notes: data.notes,
          metadata: {
            ...(data.metadata ?? {}),
            fromLocationId: data.fromLocationId,
            toLocationId: data.toLocationId,
            transferQuantity: data.quantity,
            status: "pending",
            reason: data.reason,
            requestedBy: data.requestedBy,
            updatedAt: now,
          },
        })
        .returning({ referenceId: inventoryTransactions.referenceId }),
      (error) =>
        ErrorFactories.database(
          "create_inventory_transfer",
          "Failed to create inventory transfer",
          undefined,
          error as Error,
        ),
    );

    if (!createResult.success) {
      return Err(createResult.error);
    }

    return Ok({
      id: transferId,
      tenantId: data.tenantId,
      productId: data.productId,
      fromLocationId: data.fromLocationId,
      toLocationId: data.toLocationId,
      quantity: data.quantity,
      status: "pending",
      reason: data.reason,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
      metadata: data.metadata ?? {},
    });
  }

  static async getInventoryTransferById(
    tenantId: string,
    transferId: string,
  ): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(
      z.object({ tenantId: UuidSchema, transferId: UuidSchema }),
      { tenantId, transferId },
    );

    if (!validation.success) {
      return Err(validation.error);
    }

    const transferResult = await fromPromise(
      db
        .select({
          id: inventoryTransactions.referenceId,
          tenantId: inventoryTransactions.tenantId,
          productId: inventoryTransactions.productId,
          quantity: inventoryTransactions.quantity,
          notes: inventoryTransactions.notes,
          metadata: inventoryTransactions.metadata,
          createdAt: inventoryTransactions.createdAt,
        })
        .from(inventoryTransactions)
        .where(
          and(
            eq(inventoryTransactions.tenantId, tenantId),
            eq(inventoryTransactions.referenceType, "transfer"),
            eq(inventoryTransactions.referenceId, transferId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "get_inventory_transfer",
          "Failed to load inventory transfer",
          undefined,
          error as Error,
        ),
    );

    if (!transferResult.success) {
      return Err(transferResult.error);
    }

    if (!transferResult.data[0]) {
      return Err(ErrorFactories.notFound("InventoryTransfer", transferId));
    }

    const transfer = transferResult.data[0];
    const metadata = transfer.metadata ?? {};
    const quantityValue = Number(metadata.transferQuantity ?? 0);

    return Ok({
      id: transfer.id,
      tenantId: transfer.tenantId,
      productId: transfer.productId,
      fromLocationId: metadata.fromLocationId ?? "",
      toLocationId: metadata.toLocationId ?? "",
      quantity: Math.abs(quantityValue),
      status: metadata.status ?? "pending",
      reason: metadata.reason ?? "",
      notes: transfer.notes ?? undefined,
      createdAt: transfer.createdAt ?? new Date(),
      updatedAt: metadata.updatedAt ?? transfer.createdAt ?? new Date(),
      metadata,
    });
  }

  static async updateInventoryTransfer(
    tenantId: string,
    transferId: string,
    data: {
      status?: "pending" | "in_progress" | "completed" | "cancelled";
      notes?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<Result<any, DomainError>> {
    const validation = validateWithZod(InventoryTransferUpdateSchema, data);
    if (!validation.success) {
      return Err(validation.error);
    }

    const existingResult = await fromPromise(
      db
        .select({
          id: inventoryTransactions.id,
          metadata: inventoryTransactions.metadata,
        })
        .from(inventoryTransactions)
        .where(
          and(
            eq(inventoryTransactions.tenantId, tenantId),
            eq(inventoryTransactions.referenceType, "transfer"),
            eq(inventoryTransactions.referenceId, transferId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "get_inventory_transfer",
          "Failed to load inventory transfer",
          undefined,
          error as Error,
        ),
    );

    if (!existingResult.success) {
      return Err(existingResult.error);
    }

    if (!existingResult.data[0]) {
      return Err(ErrorFactories.notFound("InventoryTransfer", transferId));
    }

    const existingMetadata = existingResult.data[0].metadata ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      ...(data.metadata ?? {}),
      status: data.status ?? existingMetadata.status ?? "pending",
      updatedAt: new Date(),
    };

    const updateResult = await fromPromise(
      db
        .update(inventoryTransactions)
        .set({
          notes: data.notes ?? null,
          metadata: updatedMetadata,
        })
        .where(
          and(
            eq(inventoryTransactions.tenantId, tenantId),
            eq(inventoryTransactions.referenceType, "transfer"),
            eq(inventoryTransactions.referenceId, transferId),
          ),
        )
        .returning({ referenceId: inventoryTransactions.referenceId }),
      (error) =>
        ErrorFactories.database(
          "update_inventory_transfer",
          "Failed to update inventory transfer",
          undefined,
          error as Error,
        ),
    );

    if (!updateResult.success) {
      return Err(updateResult.error);
    }

    return Ok({
      id: transferId,
      tenantId,
      productId: existingMetadata.productId ?? null,
      fromLocationId: updatedMetadata.fromLocationId ?? "",
      toLocationId: updatedMetadata.toLocationId ?? "",
      quantity: Number(updatedMetadata.transferQuantity ?? 0),
      status: updatedMetadata.status ?? "pending",
      reason: updatedMetadata.reason ?? "",
      notes: data.notes,
      createdAt: updatedMetadata.createdAt ?? new Date(),
      updatedAt: updatedMetadata.updatedAt ?? new Date(),
      metadata: updatedMetadata,
    });
  }

  static async deleteInventoryTransfer(
    tenantId: string,
    transferId: string,
  ): Promise<Result<any, DomainError>> {
    const deleteResult = await fromPromise(
      db
        .delete(inventoryTransactions)
        .where(
          and(
            eq(inventoryTransactions.tenantId, tenantId),
            eq(inventoryTransactions.referenceType, "transfer"),
            eq(inventoryTransactions.referenceId, transferId),
          ),
        )
        .returning(),
      (error) =>
        ErrorFactories.database(
          "delete_inventory_transfer",
          "Failed to delete inventory transfer",
          undefined,
          error as Error,
        ),
    );

    if (!deleteResult.success) {
      return Err(deleteResult.error);
    }

    if (!deleteResult.data[0]) {
      return Err(ErrorFactories.notFound("InventoryTransfer", transferId));
    }

    return Ok(deleteResult.data[0]);
  }
}
