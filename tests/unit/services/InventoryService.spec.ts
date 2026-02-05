/**
 * Inventory Service Tests
 *
 * Tests critical inventory management functionality using Result Pattern
 * with proper mock database and test utilities.
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "../../setup/TestUtilities";

import { createTestContext, createTestProduct } from "../../setup/TestContext";

import {
  expectSuccess,
  expectFailure,
  expectValidationError,
  expectNotFoundError,
  withTimeout,
} from "../../setup/TestUtilities";

// Mock Inventory Service for testing
class MockInventoryService {
  constructor(private db: any) {}

  async getProduct(productId: string, tenantId: string) {
    const product = await this.db.products.findById(productId);

    if (!product) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "Product",
          resourceId: productId,
        },
      };
    }

    if (product.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          type: "AuthorizationError",
          message: "Product not accessible from this tenant",
        },
      };
    }

    return {
      success: true,
      data: product,
    };
  }

  async validateStock(items: any[], tenantId: string) {
    if (!items || items.length === 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Items cannot be empty",
        },
      };
    }

    const validationResults = [];
    const stockByProductId = new Map();

    for (const item of items) {
      const product = await this.db.products.findById(item.productId);

      if (!product) {
        validationResults.push({
          productId: item.productId,
          error: "Product not found",
        });
        continue;
      }

      if (product.tenantId !== tenantId) {
        validationResults.push({
          productId: item.productId,
          error: "Product not accessible from this tenant",
        });
        continue;
      }

      stockByProductId.set(item.productId, product.stock);

      if (product.stock < item.quantity) {
        validationResults.push({
          productId: item.productId,
          requested: item.quantity,
          available: product.stock,
          sufficient: false,
        });
      }
    }

    if (validationResults.length > 0) {
      return {
        success: false,
        error: {
          type: "ValidationError",
          message: "Stock validation failed",
          details: validationResults,
        },
      };
    }

    return {
      success: true,
      data: {
        available: true,
        items: items.map((item) => ({
          productId: item.productId,
          requested: item.quantity,
          available: stockByProductId.get(item.productId) ?? 0,
          sufficient: true,
        })),
      },
    };
  }

  async updateStock(
    productId: string,
    tenantId: string,
    quantityChange: number,
  ) {
    const product = await this.db.products.findById(productId);

    if (!product) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "Product",
          resourceId: productId,
        },
      };
    }

    if (product.tenantId !== tenantId) {
      return {
        success: false,
        error: {
          type: "AuthorizationError",
          message: "Product not accessible from this tenant",
        },
      };
    }

    const newStock = product.stock + quantityChange;

    if (newStock < 0) {
      return {
        success: false,
        error: {
          type: "BusinessRuleError",
          message: "Insufficient stock",
          currentStock: product.stock,
          requestedChange: quantityChange,
        },
      };
    }

    const updatedProduct = {
      ...product,
      stock: newStock,
      updatedAt: new Date(),
    };

    await this.db.products.update(productId, updatedProduct);

    return {
      success: true,
      data: updatedProduct,
    };
  }

  async getProductBySku(sku: string, tenantId: string) {
    const products = await this.db.products.findMany(
      (p) => p.sku === sku && p.tenantId === tenantId,
    );

    if (products.length === 0) {
      return {
        success: false,
        error: {
          type: "NotFoundError",
          resource: "Product",
          resourceId: sku,
        },
      };
    }

    return {
      success: true,
      data: products[0],
    };
  }
}

describe("Inventory Service - Result Pattern Implementation", () => {
  let context: any;
  let inventoryService: MockInventoryService;

  beforeEach(() => {
    context = createTestContext();
    inventoryService = new MockInventoryService(context.db);
  });

  afterEach(() => {
    context.db.clear();
  });

  describe("Product Lookup", () => {
    it("should return success result when product found", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      await context.db.products.insert(product);

      // Act
      const result = await inventoryService.getProduct(
        product.id,
        context.tenant.id,
      );

      // Assert
      expectSuccess(result);
      expect(result.data.id).toBe(product.id);
      expect(result.data.name).toBe(product.name);
    });

    it("should return NotFoundError when product missing", async () => {
      // Act
      const result = await inventoryService.getProduct(
        "non-existent",
        context.tenant.id,
      );

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("NotFoundError");
      expect(result.error.resource).toBe("Product");
      expect(result.error.resourceId).toBe("non-existent");
    });

    it("should return AuthorizationError when product from different tenant", async () => {
      // Arrange
      const otherContext = createTestContext();
      const product = createTestProduct(otherContext.tenant.id);
      await otherContext.db.products.insert(product);

      // Act
      const result = await inventoryService.getProduct(
        product.id,
        context.tenant.id,
      );

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("AuthorizationError");
      expect(result.error.message).toContain("not accessible from this tenant");
    });
  });

  describe("Stock Validation", () => {
    it("should validate sufficient stock correctly", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 100;
      await context.db.products.insert(product);

      const items = [
        { productId: product.id, quantity: 50 },
        { productId: product.id, quantity: 25 },
      ];

      // Act
      const result = await inventoryService.validateStock(
        items,
        context.tenant.id,
      );

      // Assert
      expectSuccess(result);
      expect(result.data.available).toBe(true);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].sufficient).toBe(true);
    });

    it("should return ValidationError for empty items", async () => {
      // Act
      const result = await inventoryService.validateStock(
        [],
        context.tenant.id,
      );

      // Assert
      expectValidationError(result);
      expect(result.error.message).toContain("cannot be empty");
    });

    it("should return ValidationError for insufficient stock", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 10;
      await context.db.products.insert(product);

      const items = [{ productId: product.id, quantity: 50 }];

      // Act
      const result = await inventoryService.validateStock(
        items,
        context.tenant.id,
      );

      // Assert
      expectValidationError(result);
      expect(result.error.details).toHaveLength(1);
      expect(result.error.details[0].requested).toBe(50);
      expect(result.error.details[0].available).toBe(10);
      expect(result.error.details[0].sufficient).toBe(false);
    });
  });

  describe("Stock Updates", () => {
    it("should successfully increase stock", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 50;
      await context.db.products.insert(product);

      // Act
      const result = await inventoryService.updateStock(
        product.id,
        context.tenant.id,
        25,
      );

      // Assert
      expectSuccess(result);
      expect(result.data.stock).toBe(75);
      expect(result.data.updatedAt).toBeInstanceOf(Date);
    });

    it("should successfully decrease stock", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 100;
      await context.db.products.insert(product);

      // Act
      const result = await inventoryService.updateStock(
        product.id,
        context.tenant.id,
        -25,
      );

      // Assert
      expectSuccess(result);
      expect(result.data.stock).toBe(75);
    });

    it("should return BusinessRuleError when stock becomes negative", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 10;
      await context.db.products.insert(product);

      // Act
      const result = await inventoryService.updateStock(
        product.id,
        context.tenant.id,
        -25,
      );

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain("Insufficient stock");
      expect(result.error.currentStock).toBe(10);
      expect(result.error.requestedChange).toBe(-25);
    });
  });

  describe("SKU Lookup", () => {
    it("should find product by SKU", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      await context.db.products.insert(product);

      // Act
      const result = await inventoryService.getProductBySku(
        product.sku,
        context.tenant.id,
      );

      // Assert
      expectSuccess(result);
      expect(result.data.sku).toBe(product.sku);
    });

    it("should return NotFoundError for non-existent SKU", async () => {
      // Act
      const result = await inventoryService.getProductBySku(
        "NON-EXISTENT-SKU",
        context.tenant.id,
      );

      // Assert
      expectNotFoundError(result, "Product");
      expect(result.error.resourceId).toBe("NON-EXISTENT-SKU");
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle large stock validation efficiently", async () => {
      // Arrange
      const products = Array.from({ length: 100 }, (_, i) =>
        createTestProduct(context.tenant.id),
      );

      products.forEach((p) => (p.stock = 1000));
      for (const product of products) {
        await context.db.products.insert(product);
      }

      const items = products.map((p) => ({ productId: p.id, quantity: 10 }));

      // Act & Assert
      const result = await withTimeout(
        inventoryService.validateStock(items, context.tenant.id),
        1000, // 1 second max
      );

      expectSuccess(result);
      expect(result.data.items).toHaveLength(100);
    });

    it("should handle concurrent operations correctly", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 100;
      await context.db.products.insert(product);

      // Act - Simulate concurrent stock updates
      const promises = Array.from({ length: 10 }, () =>
        inventoryService.updateStock(product.id, context.tenant.id, -1),
      );

      const results = await Promise.all(promises);

      // Assert - All operations should succeed
      results.forEach((result) => {
        expectSuccess(result);
      });

      // Final stock should be 90 (100 - 10)
      const finalProduct = await context.db.products.findById(product.id);
      expect(finalProduct.stock).toBe(90);
    });
  });

  describe("Tenant Isolation", () => {
    it("should enforce tenant isolation in all operations", async () => {
      // Arrange
      const otherContext = createTestContext();
      const product = createTestProduct(otherContext.tenant.id);
      await otherContext.db.products.insert(product);

      // Act & Assert - All operations should fail
      const lookupResult = await inventoryService.getProduct(
        product.id,
        context.tenant.id,
      );
      expectFailure(lookupResult);
      expect(lookupResult.error.type).toBe("AuthorizationError");

      const stockResult = await inventoryService.validateStock(
        [{ productId: product.id, quantity: 1 }],
        context.tenant.id,
      );
      expectValidationError(stockResult);

      const updateResult = await inventoryService.updateStock(
        product.id,
        context.tenant.id,
        -1,
      );
      expectFailure(updateResult);
      expect(updateResult.error.type).toBe("AuthorizationError");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complete order processing workflow", async () => {
      // Arrange - Create products
      const products = [
        createTestProduct(context.tenant.id),
        createTestProduct(context.tenant.id),
        createTestProduct(context.tenant.id),
      ];

      products[0].stock = 10;
      products[1].stock = 5;
      products[2].stock = 2;

      for (const product of products) {
        await context.db.products.insert(product);
      }

      const orderItems = products.map((p) => ({
        productId: p.id,
        quantity: 1,
      }));

      // Act - Validate stock
      const validationResult = await inventoryService.validateStock(
        orderItems,
        context.tenant.id,
      );

      // Assert validation succeeds
      expectSuccess(validationResult);

      // Act - Process stock deduction
      for (const item of orderItems) {
        const updateResult = await inventoryService.updateStock(
          item.productId,
          context.tenant.id,
          -item.quantity,
        );
        expectSuccess(updateResult);
      }

      // Verify final stock levels
      const finalProducts = await Promise.all(
        orderItems.map((item) => context.db.products.findById(item.productId)),
      );

      expect(finalProducts[0].stock).toBe(9);
      expect(finalProducts[1].stock).toBe(4);
      expect(finalProducts[2].stock).toBe(1);
    });
  });
});
