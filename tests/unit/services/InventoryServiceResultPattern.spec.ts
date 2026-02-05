/**
 * Inventory Service Tests (Result Pattern)
 *
 * Comprehensive tests for inventory management using Result Pattern.
 * Tests all major inventory operations with proper error handling.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "../../setup/TestUtilities";

import { InventoryServiceWithResultPattern } from "../../../apps/api/lib/services/InventoryServiceResultPattern";
import {
  createTestProductInventory,
  createTestServiceProduct,
  createTestInventoryTransaction,
  createTestProductAlertConfig,
  createTestSupplier,
  ProductInventoryBuilder,
  ServiceProductBuilder,
  InventoryTransactionBuilder,
  ProductAlertConfigBuilder,
  SupplierBuilder,
} from "../../utils/builders/InventoryBuilders";
import { expectSuccess, expectFailure } from "../../setup/TestUtilities";

describe("InventoryServiceWithResultPattern", () => {
  let inventoryService: InventoryServiceWithResultPattern;

  beforeEach(() => {
    inventoryService = new InventoryServiceWithResultPattern();
  });

  afterEach(() => {
    inventoryService.getDatabase().clear();
  });

  describe("Product Inventory", () => {
    const tenantId = "12345678-1234-1234-1234-123456789012";
    const productId = "87654321-4321-4321-4321-210987654321";

    it("should create product inventory with valid data", async () => {
      const data = {
        tenantId,
        productId,
        quantity: "100",
        reorderLevel: "20",
        unitCost: "15.99",
        location: "Main Warehouse",
      };

      const result = await inventoryService.createProductInventory(data);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        tenantId: data.tenantId,
        productId: data.productId,
        quantity: data.quantity,
        reorderLevel: data.reorderLevel,
        unitCost: data.unitCost,
        location: data.location,
        isActive: true,
      });
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeInstanceOf(Date);
    });

    it("should return error for duplicate product inventory", async () => {
      const data = {
        tenantId,
        productId,
        quantity: "100",
      };

      // Create first inventory
      await inventoryService.createProductInventory(data);

      // Try to create duplicate
      const result = await inventoryService.createProductInventory(data);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("inventory_already_exists");
    });

    it("should return validation error for invalid quantity format", async () => {
      const data = {
        tenantId,
        productId,
        quantity: "invalid",
      };

      const result = await inventoryService.createProductInventory(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for invalid UUID", async () => {
      const data = {
        tenantId: "invalid-uuid",
        productId,
        quantity: "100",
      };

      const result = await inventoryService.createProductInventory(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should get product inventory by ID", async () => {
      const testData = createTestProductInventory({
        tenantId,
        productId,
      });

      // Create inventory
      const createResult = await inventoryService.createProductInventory({
        tenantId: testData.tenantId,
        productId: testData.productId,
        quantity: testData.quantity,
      });

      expectSuccess(createResult);

      // Get inventory
      const getResult = await inventoryService.getProductInventory(
        createResult.data.id,
      );

      expectSuccess(getResult);
      expect(getResult.data.id).toBe(createResult.data.id);
      expect(getResult.data.tenantId).toBe(testData.tenantId);
    });

    it("should return not found for non-existent inventory", async () => {
      const result = await inventoryService.getProductInventory(
        "12345678-1234-1234-1234-123456789012",
      );

      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
    });

    it("should get all inventory for tenant", async () => {
      const tenantId2 = "22222222-2222-2222-2222-222222222222";

      // Create inventory for different tenants
      await inventoryService.createProductInventory({
        tenantId,
        productId,
        quantity: "100",
      });

      await inventoryService.createProductInventory({
        tenantId,
        productId: "33333333-3333-3333-3333-333333333333",
        quantity: "50",
      });

      await inventoryService.createProductInventory({
        tenantId: tenantId2,
        productId: "44444444-4444-4444-4444-444444444444",
        quantity: "25",
      });

      // Get inventory for first tenant
      const result =
        await inventoryService.getProductInventoryByTenant(tenantId);

      expectSuccess(result);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((inv) => inv.tenantId === tenantId)).toBe(true);
    });

    it("should update product inventory", async () => {
      const createData = {
        tenantId,
        productId,
        quantity: "100",
      };

      const createResult =
        await inventoryService.createProductInventory(createData);
      expectSuccess(createResult);

      const updateData = {
        quantity: "150",
        reorderLevel: "30",
        location: "Updated Location",
      };

      // Small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updateResult = await inventoryService.updateProductInventory(
        createResult.data.id,
        updateData,
      );

      expectSuccess(updateResult);
      expect(updateResult.data.quantity).toBe(updateData.quantity);
      expect(updateResult.data.reorderLevel).toBe(updateData.reorderLevel);
      expect(updateResult.data.location).toBe(updateData.location);
      expect(updateResult.data.updatedAt.getTime()).toBeGreaterThan(
        createResult.data.updatedAt.getTime(),
      );
    });

    it("should delete product inventory", async () => {
      const createData = {
        tenantId,
        productId,
        quantity: "100",
      };

      const createResult =
        await inventoryService.createProductInventory(createData);
      expectSuccess(createResult);

      const deleteResult = await inventoryService.deleteProductInventory(
        createResult.data.id,
      );

      expectSuccess(deleteResult);

      // Verify deletion
      const getResult = await inventoryService.getProductInventory(
        createResult.data.id,
      );
      expectFailure(getResult);
      expect(getResult.error.type).toBe("NotFoundError");
    });
  });

  describe("Service Products", () => {
    const tenantId = "12345678-1234-1234-1234-123456789012";
    const serviceId = "87654321-4321-4321-4321-210987654321";
    const productId = "11111111-1111-1111-1111-111111111111";

    it("should add product to service", async () => {
      const data = {
        tenantId,
        serviceId,
        productId,
        quantity: "2",
        optional: true,
      };

      const result = await inventoryService.addProductToService(data);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        tenantId: data.tenantId,
        serviceId: data.serviceId,
        productId: data.productId,
        quantity: data.quantity,
        optional: data.optional,
        isActive: true,
      });
      expect(result.data.id).toBeDefined();
    });

    it("should return error for duplicate service product", async () => {
      const data = {
        tenantId,
        serviceId,
        productId,
        quantity: "1",
      };

      // Add first product
      await inventoryService.addProductToService(data);

      // Try to add duplicate
      const result = await inventoryService.addProductToService(data);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("product_already_in_service");
    });

    it("should remove product from service", async () => {
      const data = {
        tenantId,
        serviceId,
        productId,
        quantity: "1",
      };

      // Add product first
      const addResult = await inventoryService.addProductToService(data);
      expectSuccess(addResult);

      // Remove product
      const removeResult = await inventoryService.removeProductFromService(
        tenantId,
        serviceId,
        productId,
      );

      expectSuccess(removeResult);
    });

    it("should return error when removing non-existent service product", async () => {
      const result = await inventoryService.removeProductFromService(
        tenantId,
        serviceId,
        productId,
      );

      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
    });

    it("should return validation error for invalid service ID", async () => {
      const result = await inventoryService.removeProductFromService(
        tenantId,
        "invalid-uuid",
        productId,
      );

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("Inventory Transactions", () => {
    const tenantId = "12345678-1234-1234-1234-123456789012";
    const productId = "87654321-4321-4321-4321-210987654321";

    it("should create addition transaction", async () => {
      const data = {
        tenantId,
        productId,
        type: "addition" as const,
        quantity: "50",
        referenceType: "purchase",
        referenceId: "11111111-1111-1111-1111-111111111111",
        notes: "Stock addition",
        userId: "22222222-2222-2222-2222-222222222222",
      };

      const result = await inventoryService.createTransaction(data);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        tenantId: data.tenantId,
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        userId: data.userId,
      });
      expect(result.data.id).toBeDefined();
      expect(result.data.createdAt).toBeInstanceOf(Date);
    });

    it("should create deduction transaction", async () => {
      const data = {
        tenantId,
        productId,
        type: "deduction" as const,
        quantity: "-25",
        referenceType: "sale",
        notes: "Stock deduction for sale",
      };

      const result = await inventoryService.createTransaction(data);

      expectSuccess(result);
      expect(result.data.type).toBe("deduction");
      expect(result.data.quantity).toBe("-25");
    });

    it("should create adjustment transaction", async () => {
      const data = {
        tenantId,
        productId,
        type: "adjustment" as const,
        quantity: "5",
        referenceType: "adjustment",
        notes: "Inventory adjustment after count",
      };

      const result = await inventoryService.createTransaction(data);

      expectSuccess(result);
      expect(result.data.type).toBe("adjustment");
    });

    it("should create initial transaction", async () => {
      const data = {
        tenantId,
        productId,
        type: "initial" as const,
        quantity: "1000",
        referenceType: "initial",
        notes: "Initial stock setup",
      };

      const result = await inventoryService.createTransaction(data);

      expectSuccess(result);
      expect(result.data.type).toBe("initial");
    });

    it("should return validation error for invalid transaction type", async () => {
      const data = {
        tenantId,
        productId,
        type: "invalid" as any,
        quantity: "100",
      };

      const result = await inventoryService.createTransaction(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for invalid quantity format", async () => {
      const data = {
        tenantId,
        productId,
        type: "addition" as const,
        quantity: "invalid",
      };

      const result = await inventoryService.createTransaction(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should get transactions by tenant", async () => {
      const tenantId2 = "22222222-2222-2222-2222-222222222222";

      // Create transactions for different tenants
      await inventoryService.createTransaction({
        tenantId,
        productId,
        type: "addition",
        quantity: "100",
      });

      await inventoryService.createTransaction({
        tenantId,
        productId: "33333333-3333-3333-3333-333333333333",
        type: "deduction",
        quantity: "-50",
      });

      await inventoryService.createTransaction({
        tenantId: tenantId2,
        productId: "44444444-4444-4444-4444-444444444444",
        type: "addition",
        quantity: "75",
      });

      // Get transactions for first tenant
      const result = await inventoryService.getTransactionsByTenant(tenantId);

      expectSuccess(result);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((tx) => tx.tenantId === tenantId)).toBe(true);
    });
  });

  describe("Product Alert Config", () => {
    const tenantId = "12345678-1234-1234-1234-123456789012";
    const productId = "87654321-4321-4321-4321-210987654321";

    it("should create alert config with default values", async () => {
      const data = {
        tenantId,
        productId,
        lowStockThreshold: "20",
      };

      const result = await inventoryService.createProductAlertConfig(data);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        tenantId: data.tenantId,
        productId: data.productId,
        lowStockThreshold: data.lowStockThreshold,
        lowStockEnabled: true,
        outOfStockEnabled: true,
        overstockEnabled: false,
        expiryWarningEnabled: false,
        emailNotifications: true,
        isActive: true,
      });
      expect(result.data.id).toBeDefined();
    });

    it("should create alert config with custom settings", async () => {
      const data = {
        tenantId,
        productId,
        lowStockThreshold: "15",
        lowStockEnabled: true,
        outOfStockEnabled: true,
        overstockThreshold: "500",
        overstockEnabled: true,
        expiryWarningDays: 30,
        expiryWarningEnabled: true,
        emailNotifications: false,
      };

      const result = await inventoryService.createProductAlertConfig(data);

      expectSuccess(result);
      expect(result.data.overstockThreshold).toBe(data.overstockThreshold);
      expect(result.data.overstockEnabled).toBe(data.overstockEnabled);
      expect(result.data.expiryWarningDays).toBe(data.expiryWarningDays);
      expect(result.data.expiryWarningEnabled).toBe(data.expiryWarningEnabled);
      expect(result.data.emailNotifications).toBe(data.emailNotifications);
    });

    it("should return error for duplicate alert config", async () => {
      const data = {
        tenantId,
        productId,
        lowStockThreshold: "20",
      };

      // Create first config
      await inventoryService.createProductAlertConfig(data);

      // Try to create duplicate
      const result = await inventoryService.createProductAlertConfig(data);

      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.rule).toBe("alert_config_already_exists");
    });

    it("should return validation error for invalid expiry days", async () => {
      const data = {
        tenantId,
        productId,
        expiryWarningDays: 400, // Over maximum
      };

      const result = await inventoryService.createProductAlertConfig(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });
  });

  describe("Suppliers", () => {
    const tenantId = "12345678-1234-1234-1234-123456789012";

    it("should create supplier with valid data", async () => {
      const data = {
        tenantId,
        name: "Test Supplier Co.",
        contactPerson: "John Doe",
        email: "contact@supplier.com",
        phone: "+1234567890",
        address: "123 Supplier St, City, State 12345",
      };

      const result = await inventoryService.createSupplier(data);

      expectSuccess(result);
      expect(result.data).toMatchObject({
        tenantId: data.tenantId,
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isActive: true,
      });
      expect(result.data.id).toBeDefined();
    });

    it("should create supplier with minimal data", async () => {
      const data = {
        tenantId,
        name: "Minimal Supplier",
      };

      const result = await inventoryService.createSupplier(data);

      expectSuccess(result);
      expect(result.data.name).toBe(data.name);
      expect(result.data.isActive).toBe(true);
    });

    it("should return validation error for invalid email", async () => {
      const data = {
        tenantId,
        name: "Test Supplier",
        email: "invalid-email",
      };

      const result = await inventoryService.createSupplier(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should return validation error for empty name", async () => {
      const data = {
        tenantId,
        name: "",
      };

      const result = await inventoryService.createSupplier(data);

      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should get suppliers by tenant", async () => {
      const tenantId2 = "22222222-2222-2222-2222-222222222222";

      // Create suppliers for different tenants
      await inventoryService.createSupplier({
        tenantId,
        name: "Supplier 1",
      });

      await inventoryService.createSupplier({
        tenantId,
        name: "Supplier 2",
      });

      await inventoryService.createSupplier({
        tenantId: tenantId2,
        name: "Supplier 3",
      });

      // Get suppliers for first tenant
      const result = await inventoryService.getSuppliersByTenant(tenantId);

      expectSuccess(result);
      expect(result.data).toHaveLength(2);
      expect(result.data.every((s) => s.tenantId === tenantId)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle concurrent inventory operations", async () => {
      const tenantId = "12345678-1234-1234-1234-123456789012";

      // Create multiple inventories concurrently
      const inventoryPromises = Array.from({ length: 5 }, (_, i) =>
        inventoryService.createProductInventory({
          tenantId,
          productId: crypto.randomUUID(),
          quantity: `${(i + 1) * 10}`,
        }),
      );

      const results = await Promise.all(inventoryPromises);
      expect(results.every((r) => r.success)).toBe(true);

      // Create multiple transactions concurrently
      const transactionPromises = results.map((result, i) =>
        inventoryService.createTransaction({
          tenantId,
          productId: result.data.productId,
          type: "addition",
          quantity: "5",
          notes: `Concurrent transaction ${i}`,
        }),
      );

      const transactionResults = await Promise.all(transactionPromises);
      expect(transactionResults.every((r) => r.success)).toBe(true);
    });

    it("should handle mixed tenant data isolation", async () => {
      const tenant1 = "11111111-1111-1111-1111-111111111111";
      const tenant2 = "22222222-2222-2222-2222-222222222222";

      // Create data for both tenants
      await inventoryService.createProductInventory({
        tenantId: tenant1,
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: "100",
      });

      await inventoryService.createProductInventory({
        tenantId: tenant2,
        productId: "11111111-1111-1111-1111-111111111111", // Same product ID, different tenant
        quantity: "200",
      });

      // Verify isolation
      const tenant1Result =
        await inventoryService.getProductInventoryByTenant(tenant1);
      const tenant2Result =
        await inventoryService.getProductInventoryByTenant(tenant2);

      expectSuccess(tenant1Result);
      expectSuccess(tenant2Result);

      expect(tenant1Result.data).toHaveLength(1);
      expect(tenant2Result.data).toHaveLength(1);

      expect(tenant1Result.data[0].quantity).toBe("100");
      expect(tenant2Result.data[0].quantity).toBe("200");
    });
  });
});
