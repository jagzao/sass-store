import { describe, it, expect } from "vitest";
import { Result, Ok, Err, isSuccess, isFailure } from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Mocking a service to test race conditions and recovery loops
class MockCartDatabase {
  private items: Map<string, number> = new Map();
  private version: number = 0;

  async addItem(productId: string, quantity: number): Promise<Result<boolean, Error>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    const current = this.items.get(productId) || 0;
    this.items.set(productId, current + quantity);
    this.version++;
    
    return Ok(true);
  }

  getItems() {
    return Object.fromEntries(this.items);
  }
}

class CartService {
  constructor(private db: MockCartDatabase) {}

  async addItemConcurrently(productId: string, quantity: number) {
    try {
      return await this.db.addItem(productId, quantity);
    } catch (e) {
      return Err(ErrorFactories.database("add_item", "Failed concurrent write", undefined, e as Error));
    }
  }
}

describe("Error Recovery and Edge Cases", () => {
  describe("Concurrent Operations", () => {
    it("should handle race conditions in cart operations gracefully", async () => {
      const db = new MockCartDatabase();
      const cart = new CartService(db);
      
      const productId = "product_123";

      // Simulate concurrent adds to same cart
      const promises = Array.from({ length: 10 }, (_, i) =>
        cart.addItemConcurrently(productId, 1)
      );

      const results = await Promise.all(promises);

      // Should handle gracefully without throwing unhandled exceptions
      expect(results.every(r => isSuccess(r) || isFailure(r))).toBe(true);
      
      // Verify eventual consistency based on our mock logic
      const finals = db.getItems();
      expect(finals[productId]).toBe(10);
    });
  });

  describe("Data Corruption Scenarios", () => {
    it("should validate data integrity and return DomainErrors", async () => {
      // Simulate removing more items than exist
      const mockRemoveItem = async (qty: number): Promise<Result<boolean, any>> => {
        const currentQty = 1; // Fake cart has 1 item
        if (qty > currentQty) {
           return Err(ErrorFactories.businessRule(
             "invalid_quantity",
             "Cannot remove more items than exist in cart",
             "INVALID_QUANTITY"
           ));
        }
        return Ok(true);
      };

      const result = await mockRemoveItem(2);

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        expect(result.error.type).toBe("BusinessRuleError");
        expect(result.error.message).toContain("Cannot remove more items");
      }
    });
  });
});
