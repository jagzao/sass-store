/**
 * Inventory Service Tests
 *
 * Tests critical inventory management functionality using Result Pattern
 * with proper mock database and test utilities.
 */

// Vitest functions are globally available (globals: true in vitest.config.ts)

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestContext, createTestProduct } from "../../setup/TestContext";

import {
  expectSuccess,
  expectFailure,
  expectValidationError,
  expectNotFoundError,
  withTimeout,
} from "../../setup/TestUtilities";

const { enqueueResult, sharedQueue } = vi.hoisted(() => {
  const sharedQueue: any[] = [];

  const createChainable = (): any => {
    const c: any = {};
    c.from = vi.fn().mockReturnValue(c);
    c.where = vi.fn().mockReturnValue(c);
    c.limit = vi.fn().mockReturnValue(c);
    c.leftJoin = vi.fn().mockReturnValue(c);
    c.orderBy = vi.fn().mockReturnValue(c);
    c.offset = vi.fn().mockReturnValue(c);
    c.values = vi.fn().mockReturnValue(c);
    c.returning = vi.fn().mockReturnValue(c);
    c.set = vi.fn().mockReturnValue(c);
    c.then = (resolve: any, reject: any) => {
      const next = sharedQueue.shift();
      return Promise.resolve(next).then(resolve, reject);
    };
    return c;
  };

  return {
    enqueueResult: (...items: any[]) => {
      sharedQueue.push(...items);
    },
    sharedQueue,
  };
});

vi.mock("drizzle-orm", () => ({
  and: (...args: any[]) => args,
  or: (...args: any[]) => args,
  eq: (a: any, b: any) => ({ a, b }),
  not: (v: any) => v,
  desc: (v: any) => v,
  asc: (v: any) => v,
  lt: (a: any, b: any) => ({ a, b }),
  gte: (a: any, b: any) => ({ a, b }),
  ilike: (a: any, b: any) => ({ a, b }),
  inArray: (a: any, b: any) => ({ a, b }),
  sql: (strings: any, ...values: any[]) => strings,
}));

vi.mock("@sass-store/database", () => {
  const createChainable = (): any => {
    const c: any = {};
    c.from = vi.fn().mockReturnValue(c);
    c.where = vi.fn().mockReturnValue(c);
    c.limit = vi.fn().mockReturnValue(c);
    c.leftJoin = vi.fn().mockReturnValue(c);
    c.orderBy = vi.fn().mockReturnValue(c);
    c.offset = vi.fn().mockReturnValue(c);
    c.values = vi.fn().mockReturnValue(c);
    c.returning = vi.fn().mockReturnValue(c);
    c.set = vi.fn().mockReturnValue(c);
    c.then = (resolve: any, reject: any) => {
      const next = sharedQueue.shift();
      return Promise.resolve(next).then(resolve, reject);
    };
    return c;
  };

  return {
    db: {
      select: vi.fn().mockImplementation(() => createChainable()),
      insert: vi.fn().mockImplementation(() => createChainable()),
      transaction: vi.fn((fn) => {
        const tx = {
          select: vi.fn().mockImplementation(() => createChainable()),
          insert: vi.fn().mockImplementation(() => createChainable()),
          update: vi.fn().mockImplementation(() => createChainable()),
        };
        return fn(tx);
      }),
    },
    inventoryAlerts: {
      tenantId: "tenantId",
      productId: "productId",
      alertType: "alertType",
      status: "status",
      notes: "notes",
      metadata: "metadata",
      createdAt: "createdAt",
      resolvedAt: "resolvedAt",
      id: "id",
      severity: "severity",
    },
    inventoryTransactions: {
      tenantId: "tenantId",
      productId: "productId",
      type: "type",
      quantity: "quantity",
      previousQuantity: "previousQuantity",
      newQuantity: "newQuantity",
      referenceType: "referenceType",
      referenceId: "referenceId",
      notes: "notes",
      metadata: "metadata",
      createdAt: "createdAt",
      id: "id",
    },
    productInventory: {
      tenantId: "tenantId",
      productId: "productId",
      quantity: "quantity",
      reorderLevel: "reorderLevel",
      id: "id",
    },
    products: {
      name: "name",
      id: "id",
      sku: "sku",
      category: "category",
      price: "price",
      imageUrl: "imageUrl",
      active: "active",
    },
    serviceProducts: {
      tenantId: "tenantId",
      serviceId: "serviceId",
      productId: "productId",
      id: "id",
    },
    services: {
      name: "name",
      id: "id",
    },
  };
});

import { InventoryService } from "../../../apps/web/lib/inventory/inventory-service";

describe("InventoryService - New Static Methods", () => {
  const validTenantId = "12345678-1234-1234-1234-123456789012";
  const validProductId = "87654321-4321-4321-4321-210987654321";

  beforeEach(() => {
    vi.clearAllMocks();
    sharedQueue.length = 0;
  });

  describe("getInventoryAlertConfigs", () => {
    it("should return alerts with pagination on success", async () => {
      enqueueResult(
        [
          {
            id: "alert-1",
            tenantId: validTenantId,
            productId: validProductId,
            alertType: "low_stock",
            status: "active",
            notes: null,
            metadata: { message: "Low stock" },
            createdAt: new Date(),
            resolvedAt: null,
            productName: "Test Product",
          },
        ],
        [{ count: "1" }],
      );

      const result = await InventoryService.getInventoryAlertConfigs({
        tenantId: validTenantId,
      });

      expect(result.success).toBe(true);
      expect(result.data.data).toHaveLength(1);
      expect(result.data.data[0].type).toBe("low_stock");
    });

    it("should return error for invalid tenantId", async () => {
      const result = await InventoryService.getInventoryAlertConfigs({
        tenantId: "invalid",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createInventoryAlertConfig", () => {
    it("should create an alert and return the created alert", async () => {
      const alertUuid = "a1111111-1111-1111-1111-111111111111";
      enqueueResult(
        [{ id: alertUuid }],
        [
          {
            id: alertUuid,
            tenantId: validTenantId,
            productId: validProductId,
            alertType: "out_of_stock",
            status: "active",
            notes: null,
            metadata: { message: "Out of stock alert" },
            createdAt: new Date(),
            resolvedAt: null,
            productName: "Test Product",
          },
        ],
      );

      const result = await InventoryService.createInventoryAlertConfig({
        tenantId: validTenantId,
        productId: validProductId,
        type: "out_of_stock",
        message: "Out of stock alert",
      });

      expect(result.success).toBe(true);
      expect(result.data.type).toBe("out_of_stock");
    });

    it("should return error for invalid data", async () => {
      const result = await InventoryService.createInventoryAlertConfig({
        tenantId: "invalid",
        productId: "invalid",
        type: "low_stock",
        message: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("getInventoryMovementById", () => {
    it("should return movement when found", async () => {
      enqueueResult([
        {
          id: "movement-1",
          tenantId: validTenantId,
          productId: validProductId,
          productName: "Test Product",
          type: "addition",
          quantity: "10",
          previousQuantity: "5",
          newQuantity: "15",
          referenceType: "movement",
          referenceId: null,
          notes: "Stock in",
          metadata: { reason: "Restock" },
          createdAt: new Date(),
        },
      ]);

      const result = await InventoryService.getInventoryMovementById(
        validTenantId,
        "movement-1",
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe("movement-1");
      expect(result.data.type).toBe("in");
      expect(result.data.quantity).toBe(10);
    });

    it("should return not found when movement does not exist", async () => {
      enqueueResult([]);

      const result = await InventoryService.getInventoryMovementById(
        validTenantId,
        "non-existent",
      );

      expect(result.success).toBe(false);
      expect(result.error.type).toBe("NotFoundError");
    });

    it("should return error for invalid tenantId", async () => {
      enqueueResult([]);

      const result = await InventoryService.getInventoryMovementById(
        "invalid",
        "movement-1",
      );

      expect(result.success).toBe(false);
    });
  });

  describe("getInventoryTransactionById", () => {
    it("should return transaction when found", async () => {
      enqueueResult([
        {
          id: "tx-1",
          tenantId: validTenantId,
          productId: validProductId,
          productName: "Test Product",
          type: "deduction",
          quantity: "5",
          previousQuantity: "10",
          newQuantity: "5",
          referenceType: "service_completion",
          referenceId: "service-1",
          notes: "Used in service",
          createdAt: new Date(),
        },
      ]);

      const result = await InventoryService.getInventoryTransactionById(
        validTenantId,
        "tx-1",
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe("tx-1");
      expect(result.data.type).toBe("deduction");
      expect(result.data.quantity).toBe(5);
      expect(result.data.previousQuantity).toBe(10);
      expect(result.data.newQuantity).toBe(5);
    });

    it("should return not found when transaction does not exist", async () => {
      enqueueResult([]);

      const result = await InventoryService.getInventoryTransactionById(
        validTenantId,
        "non-existent",
      );

      expect(result.success).toBe(false);
      expect(result.error.type).toBe("NotFoundError");
    });

    it("should return error for invalid transactionId", async () => {
      enqueueResult([]);

      const result = await InventoryService.getInventoryTransactionById(
        validTenantId,
        "invalid",
      );

      expect(result.success).toBe(false);
    });
  });
});
