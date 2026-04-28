import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryCartService } from "@/lib/services/CartService";
import { expectSuccess, expectFailure } from "@sass-store/core/src/result";

describe("CartService - Result Pattern", () => {
  let service: InMemoryCartService;

  beforeEach(() => {
    service = new InMemoryCartService();
  });

  describe("createCart", () => {
    it("should create a cart for a user", async () => {
      const result = await service.createCart("user-1");
      const cart = expectSuccess(result);
      expect(cart.userId).toBe("user-1");
      expect(cart.items).toHaveLength(0);
      expect(cart.status).toBe("active");
    });
  });

  describe("addItem", () => {
    it("should add item to empty cart", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      const addResult = await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test Product",
        sku: "SKU-1",
        price: 99.99,
        quantity: 2,
      });
      const updated = expectSuccess(addResult);
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(2);
      expect(updated.total).toBeCloseTo(199.98, 2);
    });

    it("should increase quantity when adding same product", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test",
        sku: "SKU-1",
        price: 10,
        quantity: 2,
      });
      const addResult = await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test",
        sku: "SKU-1",
        price: 10,
        quantity: 3,
      });
      const updated = expectSuccess(addResult);
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(5);
      expect(updated.total).toBe(50);
    });

    it("should return validation error for negative quantity", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      const result = await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test",
        sku: "SKU-1",
        price: 10,
        quantity: -1,
      });
      const error = expectFailure(result);
      expect(error.type).toBe("ValidationError");
    });
  });

  describe("updateQuantity", () => {
    it("should update item quantity", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test",
        sku: "SKU-1",
        price: 10,
        quantity: 2,
      });

      const result = await service.updateQuantity(cart.id, "prod-1", 5);
      const updated = expectSuccess(result);
      expect(updated.items[0].quantity).toBe(5);
      expect(updated.total).toBe(50);
    });

    it("should return error for non-existent cart", async () => {
      const result = await service.updateQuantity("bad-id", "prod-1", 2);
      const error = expectFailure(result);
      expect(error.type).toBe("NotFoundError");
    });

    it("should return error for non-existent product", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      const result = await service.updateQuantity(cart.id, "prod-99", 2);
      const error = expectFailure(result);
      expect(error.type).toBe("NotFoundError");
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test",
        sku: "SKU-1",
        price: 10,
        quantity: 2,
      });

      const result = await service.removeItem(cart.id, "prod-1");
      const updated = expectSuccess(result);
      expect(updated.items).toHaveLength(0);
      expect(updated.total).toBe(0);
    });
  });

  describe("clearCart", () => {
    it("should empty the cart and keep record active", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      await service.addItem(cart.id, {
        productId: "prod-1",
        name: "Test",
        sku: "SKU-1",
        price: 10,
        quantity: 2,
      });

      const result = await service.clearCart(cart.id);
      const cleared = expectSuccess(result);
      expect(cleared.items).toHaveLength(0);
      expect(cleared.total).toBe(0);
      expect(cleared.status).toBe("active");
    });
  });

  describe("getCart", () => {
    it("should return cart for valid id", async () => {
      const cartResult = await service.createCart("user-1");
      const cart = expectSuccess(cartResult);

      const getResult = await service.getCart(cart.id);
      const found = expectSuccess(getResult);
      expect(found.id).toBe(cart.id);
    });

    it("should return NotFoundError for missing cart", async () => {
      const result = await service.getCart("non-existent");
      const error = expectFailure(result);
      expect(error.type).toBe("NotFoundError");
    });
  });
});
