import { db } from "../db";
import {
  productInventory,
  serviceProducts,
  inventoryTransactions,
  inventoryAlerts,
  productAlertConfig,
  products,
  services,
  tenants,
  suppliers,
  inventoryMovements,
  inventoryTransfers,
  inventoryLocations,
} from "../../../packages/database/schema";
import {
  eq,
  and,
  desc,
  asc,
  lt,
  gte,
  sql,
  ilike,
  or,
  inArray,
  isNull,
  not,
} from "drizzle-orm";
import { logger } from "../logger";

export interface InventoryService {
  tenantId: string;
  productId?: string;
  serviceId?: string;
  userId?: string;
}

export interface CreateInventoryData {
  tenantId: string;
  productId: string;
  quantity: string;
  reorderLevel?: string;
  reorderQuantity?: string;
  unitCost?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryData {
  quantity?: string;
  reorderLevel?: string;
  reorderQuantity?: string;
  unitCost?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface CreateServiceProductData {
  tenantId: string;
  serviceId: string;
  productId: string;
  quantity?: string;
  optional?: boolean;
  metadata?: Record<string, any>;
}

export interface InventoryTransactionData {
  tenantId: string;
  productId: string;
  type: "deduction" | "addition" | "adjustment" | "initial";
  quantity: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ProductAlertConfigData {
  tenantId: string;
  productId: string;
  lowStockThreshold?: string;
  lowStockEnabled?: boolean;
  outOfStockEnabled?: boolean;
  overstockThreshold?: string;
  overstockEnabled?: boolean;
  expiryWarningDays?: number;
  expiryWarningEnabled?: boolean;
  emailNotifications?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateSupplierData {
  tenantId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSupplierData {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, any>;
}

export interface CreateInventoryMovementData {
  tenantId: string;
  productId: string;
  movementType: "purchase" | "sale" | "transfer" | "adjustment" | "consumption";
  quantity: string;
  unitCost?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedBy?: string;
  location?: string;
  metadata?: Record<string, any>;
}

export interface CreateInventoryTransferData {
  tenantId: string;
  fromLocationId: string;
  toLocationId: string;
  productId: string;
  quantity: string;
  requestedBy?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryTransferData {
  status?: "pending" | "in_transit" | "completed" | "cancelled";
  approvedBy?: string;
  receivedBy?: string;
  shippedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateInventoryLocationData {
  tenantId: string;
  name: string;
  locationType: "storage" | "retail" | "warehouse" | "shelf";
  address?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateInventoryLocationData {
  name?: string;
  locationType?: "storage" | "retail" | "warehouse" | "shelf";
  address?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Servicio de gestión de inventario
 */
export class InventoryService {
  /**
   * Obtener inventario de productos con paginación y filtros
   */
  static async getInventory(params: {
    tenantId: string;
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    sortBy?: "name" | "quantity" | "reorderLevel" | "createdAt";
    sortOrder?: "asc" | "desc";
  }) {
    try {
      const {
        tenantId,
        page = 1,
        limit = 20,
        search,
        category,
        lowStockOnly = false,
        sortBy = "name",
        sortOrder = "asc",
      } = params;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
      const whereConditions = [eq(productInventory.tenantId, tenantId)];

      if (search) {
        whereConditions.push(
          or([
            ilike(products.name, `%${search}%`),
            ilike(products.sku, `%${search}%`),
            ilike(products.category, `%${search}%`),
          ]),
        );
      }

      if (category) {
        whereConditions.push(eq(products.category, category));
      }

      if (lowStockOnly) {
        whereConditions.push(
          or([
            lt(productInventory.quantity, productInventory.reorderLevel),
            eq(productInventory.quantity, "0"),
          ]),
        );
      }

      // Construir ORDER BY
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
        default: // name
          orderBy =
            sortOrder === "asc" ? asc(products.name) : desc(products.name);
      }

      // Ejecutar consulta
      const result = await db
        .select({
          id: productInventory.id,
          tenantId: productInventory.tenantId,
          productId: productInventory.productId,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
            description: products.description,
            price: products.price,
            category: products.category,
            imageUrl: products.imageUrl,
            active: products.active,
            metadata: products.metadata,
          },
          quantity: productInventory.quantity,
          reorderLevel: productInventory.reorderLevel,
          reorderQuantity: productInventory.reorderQuantity,
          unitCost: productInventory.unitCost,
          location: productInventory.location,
          metadata: productInventory.metadata,
          createdAt: productInventory.createdAt,
          updatedAt: productInventory.updatedAt,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Obtener total para paginación
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(and(...whereConditions));

      const totalCount = Number(totalCountResult[0].count);

      return {
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error al obtener inventario:", error);
      throw new Error("Error al obtener inventario");
    }
  }

  /**
   * Obtener inventario de un producto específico
   */
  static async getInventoryByProductId(tenantId: string, productId: string) {
    try {
      const result = await db
        .select()
        .from(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.productId, productId),
          ),
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error("Error al obtener inventario del producto:", error);
      throw new Error("Error al obtener inventario del producto");
    }
  }

  /**
   * Crear registro de inventario
   */
  static async createInventory(data: CreateInventoryData) {
    try {
      // Verificar si ya existe el registro
      const existing = await this.getInventoryByProductId(
        data.tenantId,
        data.productId,
      );
      if (existing) {
        throw new Error("El inventario para este producto ya existe");
      }

      // Crear registro de inventario
      const result = await db
        .insert(productInventory)
        .values({
          tenantId: data.tenantId,
          productId: data.productId,
          quantity: data.quantity,
          reorderLevel: data.reorderLevel || "0",
          reorderQuantity: data.reorderQuantity || "0",
          unitCost: data.unitCost,
          location: data.location,
          metadata: data.metadata || {},
        })
        .returning();

      // Crear transacción inicial
      await this.createInventoryTransaction({
        tenantId: data.tenantId,
        productId: data.productId,
        type: "initial",
        quantity: data.quantity,
        previousQuantity: "0",
        newQuantity: data.quantity,
        referenceType: "inventory_creation",
        metadata: {
          source: "inventory_creation",
          inventoryId: result[0].id,
        },
      });

      return result[0];
    } catch (error) {
      logger.error("Error al crear inventario:", error);
      throw error;
    }
  }

  /**
   * Actualizar inventario
   */
  static async updateInventory(
    tenantId: string,
    productId: string,
    data: UpdateInventoryData,
  ) {
    try {
      // Obtener inventario actual
      const currentInventory = await this.getInventoryByProductId(
        tenantId,
        productId,
      );
      if (!currentInventory) {
        throw new Error("Inventario no encontrado");
      }

      // Preparar datos de actualización
      const updateData: any = {};
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.reorderLevel !== undefined)
        updateData.reorderLevel = data.reorderLevel;
      if (data.reorderQuantity !== undefined)
        updateData.reorderQuantity = data.reorderQuantity;
      if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.metadata !== undefined) updateData.metadata = data.metadata;

      // Actualizar inventario
      const result = await db
        .update(productInventory)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.productId, productId),
          ),
        )
        .returning();

      // Si se actualizó la cantidad, crear transacción
      if (
        data.quantity !== undefined &&
        data.quantity !== currentInventory.quantity
      ) {
        await this.createInventoryTransaction({
          tenantId,
          productId,
          type: "adjustment",
          quantity: (
            parseFloat(data.quantity) - parseFloat(currentInventory.quantity)
          ).toString(),
          previousQuantity: currentInventory.quantity,
          newQuantity: data.quantity,
          referenceType: "manual_adjustment",
        });
      }

      return result[0];
    } catch (error) {
      logger.error("Error al actualizar inventario:", error);
      throw error;
    }
  }

  /**
   * Eliminar inventario
   */
  static async deleteInventory(tenantId: string, productId: string) {
    try {
      const result = await db
        .delete(productInventory)
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.productId, productId),
          ),
        )
        .returning();

      return result[0] || null;
    } catch (error) {
      logger.error("Error al eliminar inventario:", error);
      throw new Error("Error al eliminar inventario");
    }
  }

  /**
   * Obtener productos asociados a un servicio
   */
  static async getServiceProducts(serviceId: string, tenantId: string) {
    try {
      const result = await db
        .select({
          id: serviceProducts.id,
          serviceId: serviceProducts.serviceId,
          productId: serviceProducts.productId,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
            description: products.description,
            price: products.price,
            category: products.category,
            imageUrl: products.imageUrl,
            active: products.active,
          },
          quantity: serviceProducts.quantity,
          optional: serviceProducts.optional,
          metadata: serviceProducts.metadata,
          createdAt: serviceProducts.createdAt,
          updatedAt: serviceProducts.updatedAt,
        })
        .from(serviceProducts)
        .leftJoin(products, eq(serviceProducts.productId, products.id))
        .where(
          and(
            eq(serviceProducts.serviceId, serviceId),
            eq(serviceProducts.tenantId, tenantId),
          ),
        )
        .orderBy(asc(serviceProducts.createdAt));

      return result;
    } catch (error) {
      logger.error("Error al obtener productos del servicio:", error);
      throw new Error("Error al obtener productos del servicio");
    }
  }

  /**
   * Asociar producto a servicio
   */
  static async addProductToService(data: CreateServiceProductData) {
    try {
      // Verificar si la relación ya existe
      const existing = await db
        .select()
        .from(serviceProducts)
        .where(
          and(
            eq(serviceProducts.tenantId, data.tenantId),
            eq(serviceProducts.serviceId, data.serviceId),
            eq(serviceProducts.productId, data.productId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("El producto ya está asociado a este servicio");
      }

      const result = await db
        .insert(serviceProducts)
        .values({
          tenantId: data.tenantId,
          serviceId: data.serviceId,
          productId: data.productId,
          quantity: data.quantity || "1",
          optional: data.optional || false,
          metadata: data.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al asociar producto a servicio:", error);
      throw error;
    }
  }

  /**
   * Eliminar producto de servicio
   */
  static async removeProductFromService(
    tenantId: string,
    serviceId: string,
    productId: string,
  ) {
    try {
      const result = await db
        .delete(serviceProducts)
        .where(
          and(
            eq(serviceProducts.tenantId, tenantId),
            eq(serviceProducts.serviceId, serviceId),
            eq(serviceProducts.productId, productId),
          ),
        )
        .returning();

      return result[0] || null;
    } catch (error) {
      logger.error("Error al eliminar producto del servicio:", error);
      throw new Error("Error al eliminar producto del servicio");
    }
  }

  /**
   * Crear transacción de inventario
   */
  static async createInventoryTransaction(
    data: InventoryTransactionData & {
      previousQuantity?: string;
      newQuantity?: string;
    },
  ) {
    try {
      const result = await db
        .insert(inventoryTransactions)
        .values({
          tenantId: data.tenantId,
          productId: data.productId,
          type: data.type,
          quantity: data.quantity,
          previousQuantity: data.previousQuantity || "0",
          newQuantity: data.newQuantity || data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          userId: data.userId,
          metadata: data.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al crear transacción de inventario:", error);
      throw new Error("Error al crear transacción de inventario");
    }
  }

  /**
   * Obtener historial de transacciones de inventario
   */
  static async getInventoryTransactions(params: {
    tenantId: string;
    productId?: string;
    type?: string;
    referenceType?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const {
        tenantId,
        productId,
        type,
        referenceType,
        page = 1,
        limit = 20,
        startDate,
        endDate,
      } = params;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
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

      // Ejecutar consulta
      const result = await db
        .select({
          id: inventoryTransactions.id,
          tenantId: inventoryTransactions.tenantId,
          productId: inventoryTransactions.productId,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
          },
          type: inventoryTransactions.type,
          quantity: inventoryTransactions.quantity,
          previousQuantity: inventoryTransactions.previousQuantity,
          newQuantity: inventoryTransactions.newQuantity,
          referenceType: inventoryTransactions.referenceType,
          referenceId: inventoryTransactions.referenceId,
          notes: inventoryTransactions.notes,
          userId: inventoryTransactions.userId,
          metadata: inventoryTransactions.metadata,
          createdAt: inventoryTransactions.createdAt,
        })
        .from(inventoryTransactions)
        .leftJoin(products, eq(inventoryTransactions.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(desc(inventoryTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      // Obtener total para paginación
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(inventoryTransactions)
        .where(and(...whereConditions));

      const totalCount = Number(totalCountResult[0].count);

      return {
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error al obtener transacciones de inventario:", error);
      throw new Error("Error al obtener transacciones de inventario");
    }
  }

  /**
   * Obtener alertas de inventario
   */
  static async getInventoryAlerts(params: {
    tenantId: string;
    status?: string;
    severity?: string;
    alertType?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const {
        tenantId,
        status,
        severity,
        alertType,
        page = 1,
        limit = 20,
      } = params;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
      const whereConditions = [eq(inventoryAlerts.tenantId, tenantId)];

      if (status) {
        whereConditions.push(eq(inventoryAlerts.status, status));
      }

      if (severity) {
        whereConditions.push(eq(inventoryAlerts.severity, severity));
      }

      if (alertType) {
        whereConditions.push(eq(inventoryAlerts.alertType, alertType));
      }

      // Ejecutar consulta
      const result = await db
        .select({
          id: inventoryAlerts.id,
          tenantId: inventoryAlerts.tenantId,
          productId: inventoryAlerts.productId,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
          },
          alertType: inventoryAlerts.alertType,
          severity: inventoryAlerts.severity,
          threshold: inventoryAlerts.threshold,
          currentValue: inventoryAlerts.currentValue,
          status: inventoryAlerts.status,
          acknowledgedBy: inventoryAlerts.acknowledgedBy,
          acknowledgedAt: inventoryAlerts.acknowledgedAt,
          resolvedAt: inventoryAlerts.resolvedAt,
          notes: inventoryAlerts.notes,
          metadata: inventoryAlerts.metadata,
          createdAt: inventoryAlerts.createdAt,
          updatedAt: inventoryAlerts.updatedAt,
        })
        .from(inventoryAlerts)
        .leftJoin(products, eq(inventoryAlerts.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(desc(inventoryAlerts.createdAt))
        .limit(limit)
        .offset(offset);

      // Obtener total para paginación
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(inventoryAlerts)
        .where(and(...whereConditions));

      const totalCount = Number(totalCountResult[0].count);

      return {
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error al obtener alertas de inventario:", error);
      throw new Error("Error al obtener alertas de inventario");
    }
  }

  /**
   * Crear o actualizar configuración de alertas para producto
   */
  static async upsertProductAlertConfig(data: ProductAlertConfigData) {
    try {
      // Verificar si ya existe configuración
      const existing = await db
        .select()
        .from(productAlertConfig)
        .where(
          and(
            eq(productAlertConfig.tenantId, data.tenantId),
            eq(productAlertConfig.productId, data.productId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        // Actualizar configuración existente
        const result = await db
          .update(productAlertConfig)
          .set({
            lowStockThreshold: data.lowStockThreshold,
            lowStockEnabled: data.lowStockEnabled,
            outOfStockEnabled: data.outOfStockEnabled,
            overstockThreshold: data.overstockThreshold,
            overstockEnabled: data.overstockEnabled,
            expiryWarningDays: data.expiryWarningDays,
            expiryWarningEnabled: data.expiryWarningEnabled,
            emailNotifications: data.emailNotifications,
            metadata: data.metadata,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productAlertConfig.tenantId, data.tenantId),
              eq(productAlertConfig.productId, data.productId),
            ),
          )
          .returning();

        return result[0];
      } else {
        // Crear nueva configuración
        const result = await db
          .insert(productAlertConfig)
          .values({
            tenantId: data.tenantId,
            productId: data.productId,
            lowStockThreshold: data.lowStockThreshold,
            lowStockEnabled: data.lowStockEnabled ?? true,
            outOfStockEnabled: data.outOfStockEnabled ?? true,
            overstockThreshold: data.overstockThreshold,
            overstockEnabled: data.overstockEnabled ?? false,
            expiryWarningDays: data.expiryWarningDays,
            expiryWarningEnabled: data.expiryWarningEnabled ?? false,
            emailNotifications: data.emailNotifications ?? true,
            metadata: data.metadata || {},
          })
          .returning();

        return result[0];
      }
    } catch (error) {
      logger.error(
        "Error al crear/actualizar configuración de alertas:",
        error,
      );
      throw new Error("Error al crear/actualizar configuración de alertas");
    }
  }

  /**
   * Deducir inventario al completar un servicio
   */
  static async deductInventoryForService(
    tenantId: string,
    serviceId: string,
    visitId: string,
  ) {
    try {
      // Obtener productos del servicio
      const serviceProducts = await this.getServiceProducts(
        serviceId,
        tenantId,
      );

      if (serviceProducts.length === 0) {
        logger.info(`No hay productos asociados al servicio ${serviceId}`);
        return { success: true, message: "No hay productos que deducir" };
      }

      const results = [];
      const errors = [];

      for (const serviceProduct of serviceProducts) {
        try {
          // Obtener inventario actual del producto
          const inventory = await this.getInventoryByProductId(
            tenantId,
            serviceProduct.productId,
          );

          if (!inventory) {
            errors.push({
              productId: serviceProduct.productId,
              productName: serviceProduct.product.name,
              error: "Inventario no encontrado",
            });
            continue;
          }

          const currentQuantity = parseFloat(inventory.quantity);
          const quantityToDeduct = parseFloat(serviceProduct.quantity);

          // Verificar si hay suficiente stock
          if (currentQuantity < quantityToDeduct) {
            errors.push({
              productId: serviceProduct.productId,
              productName: serviceProduct.product.name,
              error: `Stock insuficiente. Actual: ${currentQuantity}, Requerido: ${quantityToDeduct}`,
            });
            continue;
          }

          // Calcular nueva cantidad
          const newQuantity = (currentQuantity - quantityToDeduct).toString();

          // Actualizar inventario
          const updatedInventory = await this.updateInventory(
            tenantId,
            serviceProduct.productId,
            {
              quantity: newQuantity,
            },
          );

          // Crear transacción de deducción
          await this.createInventoryTransaction({
            tenantId,
            productId: serviceProduct.productId,
            type: "deduction",
            quantity: `-${quantityToDeduct}`,
            previousQuantity: inventory.quantity,
            newQuantity,
            referenceType: "service_completion",
            referenceId: visitId,
            notes: `Deducción por servicio: ${serviceId}`,
            metadata: {
              serviceId,
              visitId,
              serviceName: serviceProduct.serviceId,
              quantityUsed: serviceProduct.quantity,
            },
          });

          results.push({
            productId: serviceProduct.productId,
            productName: serviceProduct.product.name,
            previousQuantity: inventory.quantity,
            newQuantity,
            quantityDeducted: serviceProduct.quantity,
          });

          // Verificar si se debe generar alerta de stock bajo
          await this.checkAndCreateLowStockAlert(
            tenantId,
            serviceProduct.productId,
          );
        } catch (error) {
          logger.error(
            `Error al deducir inventario para producto ${serviceProduct.productId}:`,
            error,
          );
          errors.push({
            productId: serviceProduct.productId,
            productName: serviceProduct.product.name,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors,
        message:
          errors.length === 0
            ? "Inventario deducido exitosamente"
            : "Se completó con errores. Algunos productos no pudieron ser deducidos.",
      };
    } catch (error) {
      logger.error("Error al deducir inventario para servicio:", error);
      throw new Error("Error al deducir inventario para servicio");
    }
  }

  /**
   * Verificar y crear alerta de stock bajo
   */
  static async checkAndCreateLowStockAlert(
    tenantId: string,
    productId: string,
  ) {
    try {
      // Obtener inventario y configuración de alertas
      const [inventory, alertConfig] = await Promise.all([
        this.getInventoryByProductId(tenantId, productId),
        db
          .select()
          .from(productAlertConfig)
          .where(
            and(
              eq(productAlertConfig.tenantId, tenantId),
              eq(productAlertConfig.productId, productId),
            ),
          )
          .limit(1),
      ]);

      if (!inventory) {
        return null;
      }

      const config = alertConfig[0] || {};
      const currentQuantity = parseFloat(inventory.quantity);
      const reorderLevel = parseFloat(inventory.reorderLevel);

      // Usar configuración personalizada o valores predeterminados
      const lowStockThreshold = config.lowStockThreshold
        ? parseFloat(config.lowStockThreshold)
        : reorderLevel;

      const lowStockEnabled = config.lowStockEnabled ?? true;
      const outOfStockEnabled = config.outOfStockEnabled ?? true;

      // Verificar si hay que crear alerta
      let shouldCreateAlert = false;
      let alertType = "";
      let severity = "medium";

      if (outOfStockEnabled && currentQuantity === 0) {
        shouldCreateAlert = true;
        alertType = "out_of_stock";
        severity = "critical";
      } else if (lowStockEnabled && currentQuantity <= lowStockThreshold) {
        shouldCreateAlert = true;
        alertType = "low_stock";
        severity = currentQuantity === 0 ? "high" : "medium";
      }

      if (!shouldCreateAlert) {
        return null;
      }

      // Verificar si ya existe una alerta activa del mismo tipo
      const existingAlert = await db
        .select()
        .from(inventoryAlerts)
        .where(
          and(
            eq(inventoryAlerts.tenantId, tenantId),
            eq(inventoryAlerts.productId, productId),
            eq(inventoryAlerts.alertType, alertType),
            eq(inventoryAlerts.status, "active"),
          ),
        )
        .limit(1);

      if (existingAlert.length > 0) {
        return existingAlert[0]; // Ya existe una alerta activa
      }

      // Crear nueva alerta
      const alert = await db
        .insert(inventoryAlerts)
        .values({
          tenantId,
          productId,
          alertType,
          severity,
          threshold: lowStockThreshold.toString(),
          currentValue: currentQuantity.toString(),
          status: "active",
          metadata: {
            source: "automatic_check",
            previousQuantity: inventory.quantity,
          },
        })
        .returning();

      return alert[0];
    } catch (error) {
      logger.error("Error al verificar/crear alerta de stock bajo:", error);
      // No lanzar error para no interrumpir el flujo principal
      return null;
    }
  }

  /**
   * Obtener reporte de inventario
   */
  static async getInventoryReport(tenantId: string) {
    try {
      // Obtener estadísticas básicas
      const [totalProducts, lowStockProducts, outOfStockProducts, totalValue] =
        await Promise.all([
          db
            .select({ count: sql`count(*)` })
            .from(productInventory)
            .where(eq(productInventory.tenantId, tenantId)),

          db
            .select({ count: sql`count(*)` })
            .from(productInventory)
            .where(
              and(
                eq(productInventory.tenantId, tenantId),
                lt(productInventory.quantity, productInventory.reorderLevel),
              ),
            ),

          db
            .select({ count: sql`count(*)` })
            .from(productInventory)
            .where(
              and(
                eq(productInventory.tenantId, tenantId),
                eq(productInventory.quantity, "0"),
              ),
            ),

          db
            .select({
              total: sql`SUM(CAST(quantity AS DECIMAL) * COALESCE(unit_cost, 0))`,
            })
            .from(productInventory)
            .where(eq(productInventory.tenantId, tenantId)),
        ]);

      // Obtener productos con stock bajo
      const lowStockDetails = await db
        .select({
          productId: productInventory.productId,
          productName: products.name,
          productSku: products.sku,
          currentQuantity: productInventory.quantity,
          reorderLevel: productInventory.reorderLevel,
          unitCost: productInventory.unitCost,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            lt(productInventory.quantity, productInventory.reorderLevel),
          ),
        )
        .orderBy(asc(productInventory.quantity))
        .limit(10);

      // Obtener productos sin stock
      const outOfStockDetails = await db
        .select({
          productId: productInventory.productId,
          productName: products.name,
          productSku: products.sku,
          lastUpdated: productInventory.updatedAt,
        })
        .from(productInventory)
        .leftJoin(products, eq(productInventory.productId, products.id))
        .where(
          and(
            eq(productInventory.tenantId, tenantId),
            eq(productInventory.quantity, "0"),
          ),
        )
        .orderBy(desc(productInventory.updatedAt))
        .limit(10);

      return {
        summary: {
          totalProducts: Number(totalProducts[0].count),
          lowStockProducts: Number(lowStockProducts[0].count),
          outOfStockProducts: Number(outOfStockProducts[0].count),
          totalInventoryValue: totalValue[0].total || "0",
        },
        lowStockDetails,
        outOfStockDetails,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error al generar reporte de inventario:", error);
      throw new Error("Error al generar reporte de inventario");
    }
  }

  // =====================
  // MÉTODOS DE PROVEEDORES
  // =====================

  /**
   * Obtener todos los proveedores de un tenant
   */
  static async getSuppliers(tenantId: string) {
    try {
      const result = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.tenantId, tenantId))
        .orderBy(asc(suppliers.name));

      return result;
    } catch (error) {
      logger.error("Error al obtener proveedores:", error);
      throw new Error("Error al obtener proveedores");
    }
  }

  /**
   * Obtener un proveedor por ID
   */
  static async getSupplierById(tenantId: string, supplierId: string) {
    try {
      const result = await db
        .select()
        .from(suppliers)
        .where(
          and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)),
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error("Error al obtener proveedor:", error);
      throw new Error("Error al obtener proveedor");
    }
  }

  /**
   * Crear un nuevo proveedor
   */
  static async createSupplier(data: CreateSupplierData) {
    try {
      // Verificar si ya existe un proveedor con el mismo nombre
      const existing = await db
        .select()
        .from(suppliers)
        .where(
          and(
            eq(suppliers.tenantId, data.tenantId),
            eq(suppliers.name, data.name),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Ya existe un proveedor con ese nombre");
      }

      const result = await db
        .insert(suppliers)
        .values({
          tenantId: data.tenantId,
          name: data.name,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          address: data.address,
          metadata: data.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al crear proveedor:", error);
      throw error;
    }
  }

  /**
   * Actualizar un proveedor
   */
  static async updateSupplier(
    tenantId: string,
    supplierId: string,
    data: UpdateSupplierData,
  ) {
    try {
      // Verificar si el proveedor existe
      const existing = await this.getSupplierById(tenantId, supplierId);
      if (!existing) {
        throw new Error("Proveedor no encontrado");
      }

      // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
      if (data.name && data.name !== existing.name) {
        const nameExists = await db
          .select()
          .from(suppliers)
          .where(
            and(
              eq(suppliers.tenantId, tenantId),
              eq(suppliers.name, data.name),
              not(eq(suppliers.id, supplierId)),
            ),
          )
          .limit(1);

        if (nameExists.length > 0) {
          throw new Error("Ya existe un proveedor con ese nombre");
        }
      }

      const result = await db
        .update(suppliers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)),
        )
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al actualizar proveedor:", error);
      throw error;
    }
  }

  /**
   * Eliminar un proveedor
   */
  static async deleteSupplier(tenantId: string, supplierId: string) {
    try {
      const result = await db
        .delete(suppliers)
        .where(
          and(eq(suppliers.tenantId, tenantId), eq(suppliers.id, supplierId)),
        )
        .returning();

      return result[0] || null;
    } catch (error) {
      logger.error("Error al eliminar proveedor:", error);
      throw new Error("Error al eliminar proveedor");
    }
  }

  // ==============================
  // MÉTODOS DE MOVIMIENTOS DE INVENTARIO
  // ==============================

  /**
   * Obtener movimientos de inventario
   */
  static async getInventoryMovements(params: {
    tenantId: string;
    productId?: string;
    movementType?: string;
    page?: number;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      const {
        tenantId,
        productId,
        movementType,
        page = 1,
        limit = 20,
        startDate,
        endDate,
      } = params;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
      const whereConditions = [eq(inventoryMovements.tenantId, tenantId)];

      if (productId) {
        whereConditions.push(eq(inventoryMovements.productId, productId));
      }

      if (movementType) {
        whereConditions.push(eq(inventoryMovements.movementType, movementType));
      }

      if (startDate) {
        whereConditions.push(gte(inventoryMovements.createdAt, startDate));
      }

      if (endDate) {
        whereConditions.push(lt(inventoryMovements.createdAt, endDate));
      }

      // Ejecutar consulta
      const result = await db
        .select({
          id: inventoryMovements.id,
          tenantId: inventoryMovements.tenantId,
          productId: inventoryMovements.productId,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
          },
          movementType: inventoryMovements.movementType,
          quantity: inventoryMovements.quantity,
          unitCost: inventoryMovements.unitCost,
          totalCost: inventoryMovements.totalCost,
          referenceType: inventoryMovements.referenceType,
          referenceId: inventoryMovements.referenceId,
          notes: inventoryMovements.notes,
          performedBy: inventoryMovements.performedBy,
          location: inventoryMovements.location,
          createdAt: inventoryMovements.createdAt,
        })
        .from(inventoryMovements)
        .leftJoin(products, eq(inventoryMovements.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset);

      // Obtener total para paginación
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(inventoryMovements)
        .where(and(...whereConditions));

      const totalCount = Number(totalCountResult[0].count);

      return {
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error al obtener movimientos de inventario:", error);
      throw new Error("Error al obtener movimientos de inventario");
    }
  }

  /**
   * Crear un movimiento de inventario
   */
  static async createInventoryMovement(data: CreateInventoryMovementData) {
    try {
      // Calcular el costo total si se proporciona el costo unitario
      const quantity = parseFloat(data.quantity);
      const unitCost = data.unitCost ? parseFloat(data.unitCost) : 0;
      const totalCost = (quantity * unitCost).toString();

      const result = await db
        .insert(inventoryMovements)
        .values({
          tenantId: data.tenantId,
          productId: data.productId,
          movementType: data.movementType,
          quantity: data.quantity,
          unitCost: data.unitCost,
          totalCost,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
          performedBy: data.performedBy,
          location: data.location,
          metadata: data.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al crear movimiento de inventario:", error);
      throw new Error("Error al crear movimiento de inventario");
    }
  }

  // =============================
  // MÉTODOS DE TRANSFERENCIAS DE INVENTARIO
  // =============================

  /**
   * Obtener transferencias de inventario
   */
  static async getInventoryTransfers(params: {
    tenantId: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const { tenantId, status, page = 1, limit = 20 } = params;

      const offset = (page - 1) * limit;

      // Construir condiciones WHERE
      const whereConditions = [eq(inventoryTransfers.tenantId, tenantId)];

      if (status) {
        whereConditions.push(eq(inventoryTransfers.status, status));
      }

      // Ejecutar consulta
      const result = await db
        .select({
          id: inventoryTransfers.id,
          tenantId: inventoryTransfers.tenantId,
          transferNumber: inventoryTransfers.transferNumber,
          fromLocationId: inventoryTransfers.fromLocationId,
          toLocationId: inventoryTransfers.toLocationId,
          productId: inventoryTransfers.productId,
          product: {
            id: products.id,
            name: products.name,
            sku: products.sku,
          },
          quantity: inventoryTransfers.quantity,
          status: inventoryTransfers.status,
          requestedBy: inventoryTransfers.requestedBy,
          approvedBy: inventoryTransfers.approvedBy,
          receivedBy: inventoryTransfers.receivedBy,
          requestedAt: inventoryTransfers.requestedAt,
          approvedAt: inventoryTransfers.approvedAt,
          shippedAt: inventoryTransfers.shippedAt,
          receivedAt: inventoryTransfers.receivedAt,
          notes: inventoryTransfers.notes,
          createdAt: inventoryTransfers.createdAt,
        })
        .from(inventoryTransfers)
        .leftJoin(products, eq(inventoryTransfers.productId, products.id))
        .where(and(...whereConditions))
        .orderBy(desc(inventoryTransfers.createdAt))
        .limit(limit)
        .offset(offset);

      // Obtener total para paginación
      const totalCountResult = await db
        .select({ count: sql`count(*)` })
        .from(inventoryTransfers)
        .where(and(...whereConditions));

      const totalCount = Number(totalCountResult[0].count);

      return {
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      logger.error("Error al obtener transferencias de inventario:", error);
      throw new Error("Error al obtener transferencias de inventario");
    }
  }

  /**
   * Crear una transferencia de inventario
   */
  static async createInventoryTransfer(data: CreateInventoryTransferData) {
    try {
      // Generar número de transferencia
      const transferNumber = `TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const result = await db
        .insert(inventoryTransfers)
        .values({
          tenantId: data.tenantId,
          transferNumber,
          fromLocationId: data.fromLocationId,
          toLocationId: data.toLocationId,
          productId: data.productId,
          quantity: data.quantity,
          status: "pending",
          requestedBy: data.requestedBy,
          requestedAt: new Date(),
          notes: data.notes,
          metadata: data.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al crear transferencia de inventario:", error);
      throw new Error("Error al crear transferencia de inventario");
    }
  }

  /**
   * Actualizar una transferencia de inventario
   */
  static async updateInventoryTransfer(
    tenantId: string,
    transferId: string,
    data: UpdateInventoryTransferData,
  ) {
    try {
      // Verificar si la transferencia existe
      const existing = await db
        .select()
        .from(inventoryTransfers)
        .where(
          and(
            eq(inventoryTransfers.tenantId, tenantId),
            eq(inventoryTransfers.id, transferId),
          ),
        )
        .limit(1);

      if (!existing[0]) {
        throw new Error("Transferencia no encontrada");
      }

      const result = await db
        .update(inventoryTransfers)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryTransfers.tenantId, tenantId),
            eq(inventoryTransfers.id, transferId),
          ),
        )
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al actualizar transferencia de inventario:", error);
      throw error;
    }
  }

  // ================================
  // MÉTODOS DE UBICACIONES DE INVENTARIO
  // ================================

  /**
   * Obtener ubicaciones de inventario
   */
  static async getInventoryLocations(tenantId: string) {
    try {
      const result = await db
        .select()
        .from(inventoryLocations)
        .where(eq(inventoryLocations.tenantId, tenantId))
        .orderBy(asc(inventoryLocations.name));

      return result;
    } catch (error) {
      logger.error("Error al obtener ubicaciones de inventario:", error);
      throw new Error("Error al obtener ubicaciones de inventario");
    }
  }

  /**
   * Obtener una ubicación de inventario por ID
   */
  static async getInventoryLocationById(tenantId: string, locationId: string) {
    try {
      const result = await db
        .select()
        .from(inventoryLocations)
        .where(
          and(
            eq(inventoryLocations.tenantId, tenantId),
            eq(inventoryLocations.id, locationId),
          ),
        )
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error("Error al obtener ubicación de inventario:", error);
      throw new Error("Error al obtener ubicación de inventario");
    }
  }

  /**
   * Crear una ubicación de inventario
   */
  static async createInventoryLocation(data: CreateInventoryLocationData) {
    try {
      // Verificar si ya existe una ubicación con el mismo nombre
      const existing = await db
        .select()
        .from(inventoryLocations)
        .where(
          and(
            eq(inventoryLocations.tenantId, data.tenantId),
            eq(inventoryLocations.name, data.name),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Ya existe una ubicación con ese nombre");
      }

      const result = await db
        .insert(inventoryLocations)
        .values({
          tenantId: data.tenantId,
          name: data.name,
          locationType: data.locationType,
          address: data.address,
          isActive: data.isActive ?? true,
          metadata: data.metadata || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al crear ubicación de inventario:", error);
      throw error;
    }
  }

  /**
   * Actualizar una ubicación de inventario
   */
  static async updateInventoryLocation(
    tenantId: string,
    locationId: string,
    data: UpdateInventoryLocationData,
  ) {
    try {
      // Verificar si la ubicación existe
      const existing = await this.getInventoryLocationById(
        tenantId,
        locationId,
      );
      if (!existing) {
        throw new Error("Ubicación no encontrada");
      }

      // Si se está actualizando el nombre, verificar que no exista otra con el mismo nombre
      if (data.name && data.name !== existing.name) {
        const nameExists = await db
          .select()
          .from(inventoryLocations)
          .where(
            and(
              eq(inventoryLocations.tenantId, tenantId),
              eq(inventoryLocations.name, data.name),
              not(eq(inventoryLocations.id, locationId)),
            ),
          )
          .limit(1);

        if (nameExists.length > 0) {
          throw new Error("Ya existe una ubicación con ese nombre");
        }
      }

      const result = await db
        .update(inventoryLocations)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inventoryLocations.tenantId, tenantId),
            eq(inventoryLocations.id, locationId),
          ),
        )
        .returning();

      return result[0];
    } catch (error) {
      logger.error("Error al actualizar ubicación de inventario:", error);
      throw error;
    }
  }

  /**
   * Eliminar una ubicación de inventario
   */
  static async deleteInventoryLocation(tenantId: string, locationId: string) {
    try {
      const result = await db
        .delete(inventoryLocations)
        .where(
          and(
            eq(inventoryLocations.tenantId, tenantId),
            eq(inventoryLocations.id, locationId),
          ),
        )
        .returning();

      return result[0] || null;
    } catch (error) {
      logger.error("Error al eliminar ubicación de inventario:", error);
      throw new Error("Error al eliminar ubicación de inventario");
    }
  }
}
