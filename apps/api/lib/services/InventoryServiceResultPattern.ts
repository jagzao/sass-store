import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Types
export interface ProductInventory {
  id: string;
  tenantId: string;
  productId: string;
  quantity: string;
  reorderLevel?: string;
  reorderQuantity?: string;
  unitCost?: string;
  location?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface ServiceProduct {
  id: string;
  tenantId: string;
  serviceId: string;
  productId: string;
  quantity?: string;
  optional?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceProductData {
  tenantId: string;
  serviceId: string;
  productId: string;
  quantity?: string;
  optional?: boolean;
  metadata?: Record<string, any>;
}

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  productId: string;
  type: "deduction" | "addition" | "adjustment" | "initial";
  quantity: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
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

export interface ProductAlertConfig {
  id: string;
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
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Mock Database for Inventory
class InventoryDatabase {
  private productInventory: Map<string, ProductInventory> = new Map();
  private serviceProducts: Map<string, ServiceProduct> = new Map();
  private transactions: Map<string, InventoryTransaction> = new Map();
  private alertConfigs: Map<string, ProductAlertConfig> = new Map();
  private suppliers: Map<string, Supplier> = new Map();

  // Product Inventory methods
  async createProductInventory(
    inventory: ProductInventory,
  ): Promise<ProductInventory> {
    this.productInventory.set(inventory.id, inventory);
    return inventory;
  }

  async getProductInventory(id: string): Promise<ProductInventory | null> {
    return this.productInventory.get(id) || null;
  }

  async getProductInventoryByTenant(
    tenantId: string,
  ): Promise<ProductInventory[]> {
    const inventories: ProductInventory[] = [];
    for (const inventory of this.productInventory.values()) {
      if (inventory.tenantId === tenantId) {
        inventories.push(inventory);
      }
    }
    return inventories;
  }

  async getProductInventoryByProduct(
    tenantId: string,
    productId: string,
  ): Promise<ProductInventory | null> {
    for (const inventory of this.productInventory.values()) {
      if (
        inventory.tenantId === tenantId &&
        inventory.productId === productId
      ) {
        return inventory;
      }
    }
    return null;
  }

  async updateProductInventory(
    id: string,
    updates: Partial<ProductInventory>,
  ): Promise<ProductInventory> {
    const existing = this.productInventory.get(id);
    if (!existing) {
      throw new Error(`Product inventory with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.productInventory.set(id, updated);
    return updated;
  }

  async deleteProductInventory(id: string): Promise<boolean> {
    return this.productInventory.delete(id);
  }

  // Service Product methods
  async createServiceProduct(
    serviceProduct: ServiceProduct,
  ): Promise<ServiceProduct> {
    this.serviceProducts.set(serviceProduct.id, serviceProduct);
    return serviceProduct;
  }

  async getServiceProduct(id: string): Promise<ServiceProduct | null> {
    return this.serviceProducts.get(id) || null;
  }

  async getServiceProductsByTenant(
    tenantId: string,
  ): Promise<ServiceProduct[]> {
    const products: ServiceProduct[] = [];
    for (const product of this.serviceProducts.values()) {
      if (product.tenantId === tenantId) {
        products.push(product);
      }
    }
    return products;
  }

  async getServiceProductsByService(
    tenantId: string,
    serviceId: string,
  ): Promise<ServiceProduct[]> {
    const products: ServiceProduct[] = [];
    for (const product of this.serviceProducts.values()) {
      if (product.tenantId === tenantId && product.serviceId === serviceId) {
        products.push(product);
      }
    }
    return products;
  }

  async updateServiceProduct(
    id: string,
    updates: Partial<ServiceProduct>,
  ): Promise<ServiceProduct> {
    const existing = this.serviceProducts.get(id);
    if (!existing) {
      throw new Error(`Service product with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.serviceProducts.set(id, updated);
    return updated;
  }

  async deleteServiceProduct(id: string): Promise<boolean> {
    return this.serviceProducts.delete(id);
  }

  // Transaction methods
  async createTransaction(
    transaction: InventoryTransaction,
  ): Promise<InventoryTransaction> {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<InventoryTransaction | null> {
    return this.transactions.get(id) || null;
  }

  async getTransactionsByTenant(
    tenantId: string,
  ): Promise<InventoryTransaction[]> {
    const transactions: InventoryTransaction[] = [];
    for (const transaction of this.transactions.values()) {
      if (transaction.tenantId === tenantId) {
        transactions.push(transaction);
      }
    }
    return transactions;
  }

  async getTransactionsByProduct(
    tenantId: string,
    productId: string,
  ): Promise<InventoryTransaction[]> {
    const transactions: InventoryTransaction[] = [];
    for (const transaction of this.transactions.values()) {
      if (
        transaction.tenantId === tenantId &&
        transaction.productId === productId
      ) {
        transactions.push(transaction);
      }
    }
    return transactions;
  }

  // Alert Config methods
  async createAlertConfig(
    config: ProductAlertConfig,
  ): Promise<ProductAlertConfig> {
    this.alertConfigs.set(config.id, config);
    return config;
  }

  async getAlertConfig(id: string): Promise<ProductAlertConfig | null> {
    return this.alertConfigs.get(id) || null;
  }

  async getAlertConfigByProduct(
    tenantId: string,
    productId: string,
  ): Promise<ProductAlertConfig | null> {
    for (const config of this.alertConfigs.values()) {
      if (config.tenantId === tenantId && config.productId === productId) {
        return config;
      }
    }
    return null;
  }

  async updateAlertConfig(
    id: string,
    updates: Partial<ProductAlertConfig>,
  ): Promise<ProductAlertConfig> {
    const existing = this.alertConfigs.get(id);
    if (!existing) {
      throw new Error(`Alert config with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.alertConfigs.set(id, updated);
    return updated;
  }

  // Supplier methods
  async createSupplier(supplier: Supplier): Promise<Supplier> {
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  async getSupplier(id: string): Promise<Supplier | null> {
    return this.suppliers.get(id) || null;
  }

  async getSuppliersByTenant(tenantId: string): Promise<Supplier[]> {
    const suppliers: Supplier[] = [];
    for (const supplier of this.suppliers.values()) {
      if (supplier.tenantId === tenantId) {
        suppliers.push(supplier);
      }
    }
    return suppliers;
  }

  async updateSupplier(
    id: string,
    updates: Partial<Supplier>,
  ): Promise<Supplier> {
    const existing = this.suppliers.get(id);
    if (!existing) {
      throw new Error(`Supplier with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Clear all data (for testing)
  clear(): void {
    this.productInventory.clear();
    this.serviceProducts.clear();
    this.transactions.clear();
    this.alertConfigs.clear();
    this.suppliers.clear();
  }
}

// Zod Schemas
const CreateInventoryDataSchema = z.object({
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format"),
  reorderLevel: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid reorder level format")
    .optional(),
  reorderQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid reorder quantity format")
    .optional(),
  unitCost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid unit cost format")
    .optional(),
  location: z.string().max(255).optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateInventoryDataSchema = z.object({
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format")
    .optional(),
  reorderLevel: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid reorder level format")
    .optional(),
  reorderQuantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid reorder quantity format")
    .optional(),
  unitCost: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid unit cost format")
    .optional(),
  location: z.string().max(255).optional(),
  metadata: z.record(z.any()).optional(),
});

const CreateServiceProductDataSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity format")
    .optional(),
  optional: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const InventoryTransactionDataSchema = z.object({
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.enum(["deduction", "addition", "adjustment", "initial"]),
  quantity: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Invalid quantity format"),
  referenceType: z.string().max(100).optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  userId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

const ProductAlertConfigDataSchema = z.object({
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  lowStockThreshold: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid low stock threshold format")
    .optional(),
  lowStockEnabled: z.boolean().optional(),
  outOfStockEnabled: z.boolean().optional(),
  overstockThreshold: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid overstock threshold format")
    .optional(),
  overstockEnabled: z.boolean().optional(),
  expiryWarningDays: z.number().int().min(1).max(365).optional(),
  expiryWarningEnabled: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

const CreateSupplierDataSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(255),
  contactPerson: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

export class InventoryServiceWithResultPattern {
  private db: InventoryDatabase;

  constructor(database?: InventoryDatabase) {
    this.db = database || new InventoryDatabase();
  }

  // Product Inventory Methods
  async createProductInventory(
    data: CreateInventoryData,
  ): Promise<Result<ProductInventory, DomainError>> {
    const validation = validateWithZod(CreateInventoryDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    // Check if inventory already exists for this product
    const existing = await this.db.getProductInventoryByProduct(
      data.tenantId,
      data.productId,
    );
    if (existing) {
      return Err(
        ErrorFactories.businessRule(
          "inventory_already_exists",
          `Inventory already exists for product ${data.productId}`,
          "DUPLICATE_INVENTORY",
        ),
      );
    }

    const now = new Date();
    const inventory: ProductInventory = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      productId: data.productId,
      quantity: data.quantity,
      reorderLevel: data.reorderLevel,
      reorderQuantity: data.reorderQuantity,
      unitCost: data.unitCost,
      location: data.location,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await this.db.createProductInventory(inventory);
      return Ok(created);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_product_inventory",
          `Failed to create product inventory for ${data.productId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async getProductInventory(
    id: string,
  ): Promise<Result<ProductInventory, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_inventory_id",
          "Invalid inventory ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const inventory = await this.db.getProductInventory(id);
      if (!inventory) {
        return Err(
          ErrorFactories.notFound(
            "ProductInventory",
            id,
            `Product inventory with ID ${id} not found`,
          ),
        );
      }
      return Ok(inventory);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_product_inventory",
          `Failed to get product inventory ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async getProductInventoryByTenant(
    tenantId: string,
  ): Promise<Result<ProductInventory[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    try {
      const inventories = await this.db.getProductInventoryByTenant(tenantId);
      return Ok(inventories);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_tenant_inventory",
          `Failed to get inventory for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async updateProductInventory(
    id: string,
    data: UpdateInventoryData,
  ): Promise<Result<ProductInventory, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_inventory_id",
          "Invalid inventory ID format",
          "id",
          id,
        ),
      );
    }

    const validation = validateWithZod(UpdateInventoryDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    try {
      const inventory = await this.db.getProductInventory(id);
      if (!inventory) {
        return Err(
          ErrorFactories.notFound(
            "ProductInventory",
            id,
            `Product inventory with ID ${id} not found`,
          ),
        );
      }

      const updated = await this.db.updateProductInventory(id, data);
      return Ok(updated);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "update_product_inventory",
          `Failed to update product inventory ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async deleteProductInventory(id: string): Promise<Result<void, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_inventory_id",
          "Invalid inventory ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const inventory = await this.db.getProductInventory(id);
      if (!inventory) {
        return Err(
          ErrorFactories.notFound(
            "ProductInventory",
            id,
            `Product inventory with ID ${id} not found`,
          ),
        );
      }

      await this.db.deleteProductInventory(id);
      return Ok(undefined);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "delete_product_inventory",
          `Failed to delete product inventory ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Service Product Methods
  async addProductToService(
    data: CreateServiceProductData,
  ): Promise<Result<ServiceProduct, DomainError>> {
    const validation = validateWithZod(CreateServiceProductDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    // Check if product already exists for this service
    const serviceProducts = await this.db.getServiceProductsByService(
      data.tenantId,
      data.serviceId,
    );
    const existing = serviceProducts.find(
      (sp) => sp.productId === data.productId,
    );
    if (existing) {
      return Err(
        ErrorFactories.businessRule(
          "product_already_in_service",
          `Product ${data.productId} is already associated with service ${data.serviceId}`,
          "DUPLICATE_SERVICE_PRODUCT",
        ),
      );
    }

    const now = new Date();
    const serviceProduct: ServiceProduct = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      serviceId: data.serviceId,
      productId: data.productId,
      quantity: data.quantity || "1",
      optional: data.optional || false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await this.db.createServiceProduct(serviceProduct);
      return Ok(created);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "add_product_to_service",
          `Failed to add product ${data.productId} to service ${data.serviceId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async removeProductFromService(
    tenantId: string,
    serviceId: string,
    productId: string,
  ): Promise<Result<void, DomainError>> {
    const tenantValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(tenantValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    const serviceValidation = CommonSchemas.uuid.parse(serviceId);
    if (isFailure(serviceValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_service_id",
          "Invalid service ID format",
          "serviceId",
          serviceId,
        ),
      );
    }

    const productValidation = CommonSchemas.uuid.parse(productId);
    if (isFailure(productValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_product_id",
          "Invalid product ID format",
          "productId",
          productId,
        ),
      );
    }

    try {
      const serviceProducts = await this.db.getServiceProductsByService(
        tenantId,
        serviceId,
      );
      const existing = serviceProducts.find((sp) => sp.productId === productId);
      if (!existing) {
        return Err(
          ErrorFactories.notFound(
            "ServiceProduct",
            `${serviceId}-${productId}`,
            `Product ${productId} is not associated with service ${serviceId}`,
          ),
        );
      }

      await this.db.deleteServiceProduct(existing.id);
      return Ok(undefined);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "remove_product_from_service",
          `Failed to remove product ${productId} from service ${serviceId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Transaction Methods
  async createTransaction(
    data: InventoryTransactionData,
  ): Promise<Result<InventoryTransaction, DomainError>> {
    const validation = validateWithZod(InventoryTransactionDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    const now = new Date();
    const transaction: InventoryTransaction = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes,
      userId: data.userId,
      metadata: data.metadata,
      createdAt: now,
    };

    try {
      const created = await this.db.createTransaction(transaction);
      return Ok(created);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_inventory_transaction",
          `Failed to create inventory transaction for product ${data.productId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async getTransactionsByTenant(
    tenantId: string,
  ): Promise<Result<InventoryTransaction[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    try {
      const transactions = await this.db.getTransactionsByTenant(tenantId);
      return Ok(transactions);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_tenant_transactions",
          `Failed to get transactions for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Alert Config Methods
  async createProductAlertConfig(
    data: ProductAlertConfigData,
  ): Promise<Result<ProductAlertConfig, DomainError>> {
    const validation = validateWithZod(ProductAlertConfigDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    // Check if config already exists for this product
    const existing = await this.db.getAlertConfigByProduct(
      data.tenantId,
      data.productId,
    );
    if (existing) {
      return Err(
        ErrorFactories.businessRule(
          "alert_config_already_exists",
          `Alert config already exists for product ${data.productId}`,
          "DUPLICATE_ALERT_CONFIG",
        ),
      );
    }

    const now = new Date();
    const config: ProductAlertConfig = {
      id: crypto.randomUUID(),
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
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await this.db.createAlertConfig(config);
      return Ok(created);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_product_alert_config",
          `Failed to create alert config for product ${data.productId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Supplier Methods
  async createSupplier(
    data: CreateSupplierData,
  ): Promise<Result<Supplier, DomainError>> {
    const validation = validateWithZod(CreateSupplierDataSchema, data);
    if (isFailure(validation)) {
      return validation;
    }

    const now = new Date();
    const supplier: Supplier = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await this.db.createSupplier(supplier);
      return Ok(created);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_supplier",
          `Failed to create supplier ${data.name}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  async getSuppliersByTenant(
    tenantId: string,
  ): Promise<Result<Supplier[], DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(tenantId);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_tenant_id",
          "Invalid tenant ID format",
          "tenantId",
          tenantId,
        ),
      );
    }

    try {
      const suppliers = await this.db.getSuppliersByTenant(tenantId);
      return Ok(suppliers);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_tenant_suppliers",
          `Failed to get suppliers for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get database instance (for testing)
  getDatabase(): InventoryDatabase {
    return this.db;
  }
}
