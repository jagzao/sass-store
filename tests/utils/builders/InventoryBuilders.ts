import {
  ProductInventory,
  ServiceProduct,
  InventoryTransaction,
  ProductAlertConfig,
  Supplier,
} from "../../../apps/api/lib/services/InventoryServiceResultPattern";

// Simple UUID generator for testing
const generateUUID = () => crypto.randomUUID();

export class ProductInventoryBuilder {
  private inventory: Partial<ProductInventory> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    const now = new Date();
    this.inventory = {
      id: generateUUID(),
      tenantId: generateUUID(),
      productId: generateUUID(),
      quantity: "100",
      reorderLevel: "20",
      reorderQuantity: "50",
      unitCost: "10.99",
      location: "Main Warehouse",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    return this;
  }

  withId(id: string): this {
    this.inventory.id = id;
    return this;
  }

  withTenantId(tenantId: string): this {
    this.inventory.tenantId = tenantId;
    return this;
  }

  withProductId(productId: string): this {
    this.inventory.productId = productId;
    return this;
  }

  withQuantity(quantity: string): this {
    this.inventory.quantity = quantity;
    return this;
  }

  withReorderLevel(reorderLevel: string): this {
    this.inventory.reorderLevel = reorderLevel;
    return this;
  }

  withLocation(location: string): this {
    this.inventory.location = location;
    return this;
  }

  withUnitCost(unitCost: string): this {
    this.inventory.unitCost = unitCost;
    return this;
  }

  withActive(isActive: boolean): this {
    this.inventory.isActive = isActive;
    return this;
  }

  // Preset configurations
  asLowStock(): this {
    return this.withQuantity("10").withReorderLevel("20");
  }

  asOutOfStock(): this {
    return this.withQuantity("0").withReorderLevel("10");
  }

  asOverstocked(): this {
    return this.withQuantity("1000").withReorderLevel("50");
  }

  build(): ProductInventory {
    if (!this.inventory.id) throw new Error("Product inventory ID is required");
    if (!this.inventory.tenantId) throw new Error("Tenant ID is required");
    if (!this.inventory.productId) throw new Error("Product ID is required");
    if (!this.inventory.quantity) throw new Error("Quantity is required");

    return this.inventory as ProductInventory;
  }

  // Static factory methods
  static lowStock(): ProductInventory {
    return new ProductInventoryBuilder().asLowStock().build();
  }

  static outOfStock(): ProductInventory {
    return new ProductInventoryBuilder().asOutOfStock().build();
  }

  static overstocked(): ProductInventory {
    return new ProductInventoryBuilder().asOverstocked().build();
  }
}

export class ServiceProductBuilder {
  private serviceProduct: Partial<ServiceProduct> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    const now = new Date();
    this.serviceProduct = {
      id: generateUUID(),
      tenantId: generateUUID(),
      serviceId: generateUUID(),
      productId: generateUUID(),
      quantity: "1",
      optional: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    return this;
  }

  withId(id: string): this {
    this.serviceProduct.id = id;
    return this;
  }

  withTenantId(tenantId: string): this {
    this.serviceProduct.tenantId = tenantId;
    return this;
  }

  withServiceId(serviceId: string): this {
    this.serviceProduct.serviceId = serviceId;
    return this;
  }

  withProductId(productId: string): this {
    this.serviceProduct.productId = productId;
    return this;
  }

  withQuantity(quantity: string): this {
    this.serviceProduct.quantity = quantity;
    return this;
  }

  withOptional(optional: boolean): this {
    this.serviceProduct.optional = optional;
    return this;
  }

  withActive(isActive: boolean): this {
    this.serviceProduct.isActive = isActive;
    return this;
  }

  build(): ServiceProduct {
    if (!this.serviceProduct.id)
      throw new Error("Service product ID is required");
    if (!this.serviceProduct.tenantId) throw new Error("Tenant ID is required");
    if (!this.serviceProduct.serviceId)
      throw new Error("Service ID is required");
    if (!this.serviceProduct.productId)
      throw new Error("Product ID is required");

    return this.serviceProduct as ServiceProduct;
  }

  // Static factory methods
  static required(): ServiceProduct {
    return new ServiceProductBuilder().withOptional(false).build();
  }

  static optional(): ServiceProduct {
    return new ServiceProductBuilder().withOptional(true).build();
  }
}

export class InventoryTransactionBuilder {
  private transaction: Partial<InventoryTransaction> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    const now = new Date();
    this.transaction = {
      id: generateUUID(),
      tenantId: generateUUID(),
      productId: generateUUID(),
      type: "addition",
      quantity: "10",
      referenceType: "manual",
      referenceId: generateUUID(),
      notes: "Initial inventory",
      userId: generateUUID(),
      createdAt: now,
    };
    return this;
  }

  withId(id: string): this {
    this.transaction.id = id;
    return this;
  }

  withTenantId(tenantId: string): this {
    this.transaction.tenantId = tenantId;
    return this;
  }

  withProductId(productId: string): this {
    this.transaction.productId = productId;
    return this;
  }

  withType(type: "deduction" | "addition" | "adjustment" | "initial"): this {
    this.transaction.type = type;
    return this;
  }

  withQuantity(quantity: string): this {
    this.transaction.quantity = quantity;
    return this;
  }

  withReferenceType(referenceType: string): this {
    this.transaction.referenceType = referenceType;
    return this;
  }

  withReferenceId(referenceId: string): this {
    this.transaction.referenceId = referenceId;
    return this;
  }

  withNotes(notes: string): this {
    this.transaction.notes = notes;
    return this;
  }

  withUserId(userId: string): this {
    this.transaction.userId = userId;
    return this;
  }

  // Preset configurations
  asAddition(): this {
    return this.withType("addition")
      .withQuantity("10")
      .withNotes("Stock addition");
  }

  asDeduction(): this {
    return this.withType("deduction")
      .withQuantity("-5")
      .withNotes("Stock deduction");
  }

  asAdjustment(): this {
    return this.withType("adjustment")
      .withQuantity("2")
      .withNotes("Inventory adjustment");
  }

  asInitial(): this {
    return this.withType("initial")
      .withQuantity("100")
      .withNotes("Initial stock setup");
  }

  build(): InventoryTransaction {
    if (!this.transaction.id) throw new Error("Transaction ID is required");
    if (!this.transaction.tenantId) throw new Error("Tenant ID is required");
    if (!this.transaction.productId) throw new Error("Product ID is required");
    if (!this.transaction.type) throw new Error("Transaction type is required");
    if (!this.transaction.quantity) throw new Error("Quantity is required");

    return this.transaction as InventoryTransaction;
  }

  // Static factory methods
  static addition(): InventoryTransaction {
    return new InventoryTransactionBuilder().asAddition().build();
  }

  static deduction(): InventoryTransaction {
    return new InventoryTransactionBuilder().asDeduction().build();
  }

  static adjustment(): InventoryTransaction {
    return new InventoryTransactionBuilder().asAdjustment().build();
  }

  static initial(): InventoryTransaction {
    return new InventoryTransactionBuilder().asInitial().build();
  }
}

export class ProductAlertConfigBuilder {
  private config: Partial<ProductAlertConfig> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    const now = new Date();
    this.config = {
      id: generateUUID(),
      tenantId: generateUUID(),
      productId: generateUUID(),
      lowStockThreshold: "20",
      lowStockEnabled: true,
      outOfStockEnabled: true,
      overstockThreshold: "500",
      overstockEnabled: false,
      expiryWarningDays: 30,
      expiryWarningEnabled: true,
      emailNotifications: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    return this;
  }

  withId(id: string): this {
    this.config.id = id;
    return this;
  }

  withTenantId(tenantId: string): this {
    this.config.tenantId = tenantId;
    return this;
  }

  withProductId(productId: string): this {
    this.config.productId = productId;
    return this;
  }

  withLowStockThreshold(threshold: string): this {
    this.config.lowStockThreshold = threshold;
    return this;
  }

  withLowStockEnabled(enabled: boolean): this {
    this.config.lowStockEnabled = enabled;
    return this;
  }

  withOutOfStockEnabled(enabled: boolean): this {
    this.config.outOfStockEnabled = enabled;
    return this;
  }

  withOverstockThreshold(threshold: string): this {
    this.config.overstockThreshold = threshold;
    return this;
  }

  withOverstockEnabled(enabled: boolean): this {
    this.config.overstockEnabled = enabled;
    return this;
  }

  withExpiryWarningDays(days: number): this {
    this.config.expiryWarningDays = days;
    return this;
  }

  withExpiryWarningEnabled(enabled: boolean): this {
    this.config.expiryWarningEnabled = enabled;
    return this;
  }

  withEmailNotifications(enabled: boolean): this {
    this.config.emailNotifications = enabled;
    return this;
  }

  build(): ProductAlertConfig {
    if (!this.config.id) throw new Error("Alert config ID is required");
    if (!this.config.tenantId) throw new Error("Tenant ID is required");
    if (!this.config.productId) throw new Error("Product ID is required");

    return this.config as ProductAlertConfig;
  }

  // Static factory methods
  static lowStockAlerts(): ProductAlertConfig {
    return new ProductAlertConfigBuilder()
      .withLowStockEnabled(true)
      .withLowStockThreshold("20")
      .withOutOfStockEnabled(true)
      .build();
  }

  static overstockAlerts(): ProductAlertConfig {
    return new ProductAlertConfigBuilder()
      .withOverstockEnabled(true)
      .withOverstockThreshold("500")
      .withLowStockEnabled(false)
      .build();
  }

  static expiryAlerts(): ProductAlertConfig {
    return new ProductAlertConfigBuilder()
      .withExpiryWarningEnabled(true)
      .withExpiryWarningDays(30)
      .withEmailNotifications(true)
      .build();
  }
}

export class SupplierBuilder {
  private supplier: Partial<Supplier> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    const now = new Date();
    this.supplier = {
      id: generateUUID(),
      tenantId: generateUUID(),
      name: "Test Supplier",
      contactPerson: "John Doe",
      email: "supplier@example.com",
      phone: "+1234567890",
      address: "123 Supplier St, City, State",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    return this;
  }

  withId(id: string): this {
    this.supplier.id = id;
    return this;
  }

  withTenantId(tenantId: string): this {
    this.supplier.tenantId = tenantId;
    return this;
  }

  withName(name: string): this {
    this.supplier.name = name;
    return this;
  }

  withContactPerson(contactPerson: string): this {
    this.supplier.contactPerson = contactPerson;
    return this;
  }

  withEmail(email: string): this {
    this.supplier.email = email;
    return this;
  }

  withPhone(phone: string): this {
    this.supplier.phone = phone;
    return this;
  }

  withAddress(address: string): this {
    this.supplier.address = address;
    return this;
  }

  withActive(isActive: boolean): this {
    this.supplier.isActive = isActive;
    return this;
  }

  build(): Supplier {
    if (!this.supplier.id) throw new Error("Supplier ID is required");
    if (!this.supplier.tenantId) throw new Error("Tenant ID is required");
    if (!this.supplier.name) throw new Error("Supplier name is required");

    return this.supplier as Supplier;
  }

  // Static factory methods
  static active(): Supplier {
    return new SupplierBuilder().withActive(true).build();
  }

  static inactive(): Supplier {
    return new SupplierBuilder().withActive(false).build();
  }
}

// Utility functions for creating test data
export const createTestProductInventory = (
  overrides?: Partial<ProductInventory>,
): ProductInventory => {
  const builder = new ProductInventoryBuilder();

  if (overrides?.id) builder.withId(overrides.id);
  if (overrides?.tenantId) builder.withTenantId(overrides.tenantId);
  if (overrides?.productId) builder.withProductId(overrides.productId);
  if (overrides?.quantity) builder.withQuantity(overrides.quantity);
  if (overrides?.reorderLevel) builder.withReorderLevel(overrides.reorderLevel);
  if (overrides?.location) builder.withLocation(overrides.location);
  if (overrides?.unitCost) builder.withUnitCost(overrides.unitCost);
  if (overrides?.isActive !== undefined) builder.withActive(overrides.isActive);

  return builder.build();
};

export const createTestServiceProduct = (
  overrides?: Partial<ServiceProduct>,
): ServiceProduct => {
  const builder = new ServiceProductBuilder();

  if (overrides?.id) builder.withId(overrides.id);
  if (overrides?.tenantId) builder.withTenantId(overrides.tenantId);
  if (overrides?.serviceId) builder.withServiceId(overrides.serviceId);
  if (overrides?.productId) builder.withProductId(overrides.productId);
  if (overrides?.quantity) builder.withQuantity(overrides.quantity);
  if (overrides?.optional !== undefined)
    builder.withOptional(overrides.optional);
  if (overrides?.isActive !== undefined) builder.withActive(overrides.isActive);

  return builder.build();
};

export const createTestInventoryTransaction = (
  overrides?: Partial<InventoryTransaction>,
): InventoryTransaction => {
  const builder = new InventoryTransactionBuilder();

  if (overrides?.id) builder.withId(overrides.id);
  if (overrides?.tenantId) builder.withTenantId(overrides.tenantId);
  if (overrides?.productId) builder.withProductId(overrides.productId);
  if (overrides?.type) builder.withType(overrides.type);
  if (overrides?.quantity) builder.withQuantity(overrides.quantity);
  if (overrides?.referenceType)
    builder.withReferenceType(overrides.referenceType);
  if (overrides?.referenceId) builder.withReferenceId(overrides.referenceId);
  if (overrides?.notes) builder.withNotes(overrides.notes);
  if (overrides?.userId) builder.withUserId(overrides.userId);

  return builder.build();
};

export const createTestProductAlertConfig = (
  overrides?: Partial<ProductAlertConfig>,
): ProductAlertConfig => {
  const builder = new ProductAlertConfigBuilder();

  if (overrides?.id) builder.withId(overrides.id);
  if (overrides?.tenantId) builder.withTenantId(overrides.tenantId);
  if (overrides?.productId) builder.withProductId(overrides.productId);
  if (overrides?.lowStockThreshold)
    builder.withLowStockThreshold(overrides.lowStockThreshold);
  if (overrides?.lowStockEnabled !== undefined)
    builder.withLowStockEnabled(overrides.lowStockEnabled);
  if (overrides?.outOfStockEnabled !== undefined)
    builder.withOutOfStockEnabled(overrides.outOfStockEnabled);
  if (overrides?.overstockThreshold)
    builder.withOverstockThreshold(overrides.overstockThreshold);
  if (overrides?.overstockEnabled !== undefined)
    builder.withOverstockEnabled(overrides.overstockEnabled);
  if (overrides?.expiryWarningDays)
    builder.withExpiryWarningDays(overrides.expiryWarningDays);
  if (overrides?.expiryWarningEnabled !== undefined)
    builder.withExpiryWarningEnabled(overrides.expiryWarningEnabled);
  if (overrides?.emailNotifications !== undefined)
    builder.withEmailNotifications(overrides.emailNotifications);

  return builder.build();
};

export const createTestSupplier = (overrides?: Partial<Supplier>): Supplier => {
  const builder = new SupplierBuilder();

  if (overrides?.id) builder.withId(overrides.id);
  if (overrides?.tenantId) builder.withTenantId(overrides.tenantId);
  if (overrides?.name) builder.withName(overrides.name);
  if (overrides?.contactPerson)
    builder.withContactPerson(overrides.contactPerson);
  if (overrides?.email) builder.withEmail(overrides.email);
  if (overrides?.phone) builder.withPhone(overrides.phone);
  if (overrides?.address) builder.withAddress(overrides.address);
  if (overrides?.isActive !== undefined) builder.withActive(overrides.isActive);

  return builder.build();
};
