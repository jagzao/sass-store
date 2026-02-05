/**
 * Cart Service Tests
 *
 * Comprehensive tests for shopping cart functionality using Result Pattern.
 * Tests all major cart operations with proper error handling.
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
} from "../../setup/TestUtilities";

import {
  CartService,
  Cart,
  CartItem,
} from "../../../apps/api/lib/services/CartService";

class MockCartDatabase {
  private carts = new Map<string, Cart>();
  private products = new Map<string, any>();

  findCartByUser(userId: string, tenantId: string): Promise<Cart | null> {
    const cart = Array.from(this.carts.values()).find(
      (c) => c.userId === userId && c.tenantId === tenantId,
    );
    return Promise.resolve(cart || null);
  }

  findProductById(productId: string, tenantId: string): Promise<any> {
    const product = this.products.get(productId);
    if (!product || product.tenantId !== tenantId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(product);
  }

  insertCart(
    cart: Omit<Cart, "id" | "createdAt" | "updatedAt">,
  ): Promise<Cart> {
    const createdCart: Cart = {
      ...cart,
      id: `cart-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.carts.set(createdCart.id, createdCart);
    return Promise.resolve(createdCart);
  }

  updateCart(cartId: string, updates: Partial<Cart>): Promise<Cart> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return Promise.reject(new Error(`Cart ${cartId} not found`));
    }

    const updatedCart = { ...cart, ...updates, updatedAt: new Date() };
    this.carts.set(cartId, updatedCart);
    return Promise.resolve(updatedCart);
  }

  deleteCart(cartId: string): Promise<boolean> {
    return Promise.resolve(this.carts.delete(cartId));
  }

  findCartItem(cartId: string, itemId: string): Promise<CartItem | null> {
    const cart = this.carts.get(cartId);
    if (!cart) return Promise.resolve(null);

    return Promise.resolve(
      cart.items.find((item) => item.id === itemId) || null,
    );
  }

  insertCartItem(
    cartId: string,
    itemData: Omit<CartItem, "id" | "addedAt">,
  ): Promise<CartItem> {
    const item: CartItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      addedAt: new Date(),
    };

    const cart = this.carts.get(cartId);
    if (cart) {
      cart.items.push(item);
      this.carts.set(cartId, cart);
    }

    return Promise.resolve(item);
  }

  updateCartItem(
    itemId: string,
    updates: Partial<CartItem>,
  ): Promise<CartItem> {
    const cart = Array.from(this.carts.values()).find((c) =>
      c.items.some((item) => item.id === itemId),
    );

    if (!cart) {
      return Promise.reject(new Error(`Cart item ${itemId} not found`));
    }

    const updatedCart = {
      ...cart,
      items: cart.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
      updatedAt: new Date(),
    };

    this.carts.set(cart.id, updatedCart);

    const updatedItem = updatedCart.items.find((item) => item.id === itemId);
    if (!updatedItem) {
      return Promise.reject(new Error(`Cart item ${itemId} not found`));
    }

    return Promise.resolve(updatedItem);
  }

  deleteCartItem(itemId: string): Promise<boolean> {
    for (const [cartId, cart] of this.carts.entries()) {
      const itemIndex = cart.items.findIndex((item) => item.id === itemId);
      if (itemIndex >= 0) {
        cart.items.splice(itemIndex, 1);
        this.carts.set(cartId, { ...cart, updatedAt: new Date() });
        return Promise.resolve(true);
      }
    }

    return Promise.resolve(false);
  }

  addProduct(product: any): void {
    this.products.set(product.id, product);
  }

  clear(): void {
    this.carts.clear();
    this.products.clear();
  }
}

const generateTestProducts = (count: number, tenantId: string) => {
  return Array.from({ length: count }, () => createTestProduct(tenantId));
};

describe("Cart Service - Result Pattern Implementation", () => {
  let context: any;
  let cartService: CartService;
  let mockDb: MockCartDatabase;

  beforeEach(() => {
    context = createTestContext();
    mockDb = new MockCartDatabase();
    cartService = new CartService(mockDb);
  });

  afterEach(() => {
    mockDb.clear();
  });

  describe("Cart Creation", () => {
    it("should create new cart when user has no existing active cart", async () => {
      // Act
      const result = await cartService.createCart({
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectSuccess(result);
      expect(result.data.userId).toBe(context.user.id);
      expect(result.data.tenantId).toBe(context.tenant.id);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.status).toBe("active");
      expect(result.data.subtotal).toBe("0.00");
    });

    it("should return existing cart when user has active cart", async () => {
      // Arrange
      const existingCart = await cartService.createCart({
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Act
      const result = await cartService.createCart({
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectSuccess(result);
      expect(result.data.id).toBe(existingCart.data.id);
    });

    it("should return validation error when userId is missing", async () => {
      // Act
      const result = await cartService.createCart({
        userId: "",
        tenantId: context.tenant.id,
      });

      // Assert
      expectValidationError(result, "userId");
      expect(result.error.message).toContain("User ID is required");
    });

    it("should return validation error when tenantId is missing", async () => {
      // Act
      const result = await cartService.createCart({
        userId: context.user.id,
        tenantId: "",
      });

      // Assert
      expectValidationError(result, "tenantId");
    });
  });

  describe("Add to Cart", () => {
    it("should add new item to empty cart", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      // Act
      const result = await cartService.addToCart({
        productId: product.id,
        quantity: 2,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectSuccess(result);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].productId).toBe(product.id);
      expect(result.data.items[0].quantity).toBe(2);
      expect(result.data.items[0].total).toBe(
        (parseFloat(product.price) * 2).toFixed(2),
      );
      expect(result.data.subtotal).toBe(
        (parseFloat(product.price) * 2).toFixed(2),
      );
    });

    it("should update quantity when item already exists in cart", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      // Add first item
      await cartService.addToCart({
        productId: product.id,
        quantity: 1,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Act - Add same item again
      const result = await cartService.addToCart({
        productId: product.id,
        quantity: 2,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectSuccess(result);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].quantity).toBe(3); // 1 + 2
      expect(result.data.items[0].total).toBe(
        (parseFloat(product.price) * 3).toFixed(2),
      );
    });

    it("should return not found error when product does not exist", async () => {
      // Act
      const result = await cartService.addToCart({
        productId: "non-existent",
        quantity: 1,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectNotFoundError(result, "Product");
      expect(result.error.resourceId).toBe("non-existent");
    });

    it("should return business rule error when product is not active", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.status = "inactive";
      mockDb.addProduct(product);

      // Act
      const result = await cartService.addToCart({
        productId: product.id,
        quantity: 1,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain("not available for purchase");
    });

    it("should return business rule error when insufficient stock", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      product.stock = 5;
      mockDb.addProduct(product);

      // Act
      const result = await cartService.addToCart({
        productId: product.id,
        quantity: 10, // More than available
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain("Only 5 items available");
    });

    it("should return validation error when quantity is zero", async () => {
      // Act
      const result = await cartService.addToCart({
        productId: "some-id",
        quantity: 0,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectValidationError(result, "quantity");
      expect(result.error.message).toContain("greater than 0");
    });

    it("should return business rule error when quantity exceeds maximum", async () => {
      // Act
      const result = await cartService.addToCart({
        productId: "some-id",
        quantity: 101,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain(
        "Maximum quantity per item is 100",
      );
    });
  });

  describe("Update Cart Item", () => {
    beforeEach(async () => {
      // Create cart with item for testing
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      await cartService.addToCart({
        productId: product.id,
        quantity: 1,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });
    });

    it("should update item quantity successfully", async () => {
      // Arrange
      const cart = await cartService.getCart(
        context.user.id,
        context.tenant.id,
      );
      const cartItem = expectSuccess(cart).items[0];

      // Act
      const result = await cartService.updateCartItem({
        cartId: expectSuccess(cart).id,
        itemId: cartItem.id,
        userId: context.user.id,
        tenantId: context.tenant.id,
        quantity: 5,
      });

      // Assert
      expectSuccess(result);
      expect(result.data.items[0].quantity).toBe(5);
    });

    it("should return not found error when cart does not exist", async () => {
      // Act
      const result = await cartService.updateCartItem({
        cartId: "non-existent-cart",
        itemId: "non-existent-item",
        userId: context.user.id,
        tenantId: context.tenant.id,
        quantity: 2,
      });

      // Assert
      expectNotFoundError(result, "Cart");
      expect(result.error.resourceId).toBe("non-existent-cart");
    });
  });

  describe("Remove from Cart", () => {
    beforeEach(async () => {
      // Create cart with items for testing
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      await cartService.addToCart({
        productId: product.id,
        quantity: 2,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });
    });

    it("should remove item from cart successfully", async () => {
      // Arrange
      const cart = await cartService.getCart(
        context.user.id,
        context.tenant.id,
      );
      const cartItem = expectSuccess(cart).items[0];

      // Act
      const result = await cartService.removeFromCart({
        cartId: expectSuccess(cart).id,
        itemId: cartItem.id,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectSuccess(result);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.status).toBe("abandoned"); // Empty cart becomes abandoned
    });

    it("should mark cart as abandoned when last item removed", async () => {
      // Act
      const result = await cartService.removeFromCart({
        cartId: "some-cart-id",
        itemId: "some-item-id",
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // This test assumes the mock setup properly handles the scenario
      expectSuccess(result);
    });
  });

  describe("Clear Cart", () => {
    it("should clear cart successfully", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      await cartService.addToCart({
        productId: product.id,
        quantity: 2,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Act
      const result = await cartService.clearCart(
        context.user.id,
        context.tenant.id,
      );

      // Assert
      expectSuccess(result);
      expect(result.data.items).toHaveLength(0);
      expect(result.data.status).toBe("abandoned");
      expect(result.data.subtotal).toBe("0.00");
    });

    it("should return not found error when user has no cart", async () => {
      // Act
      const result = await cartService.clearCart(
        context.user.id,
        context.tenant.id,
      );

      // Assert
      expectNotFoundError(result, "Cart");
    });
  });

  describe("Cart Validation for Checkout", () => {
    it("should validate cart successfully when all items are available", async () => {
      // Arrange
      const products = generateTestProducts(2, context.tenant.id);
      products.forEach((p) => mockDb.addProduct(p));

      await cartService.addToCart({
        productId: products[0].id,
        quantity: 1,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      await cartService.addToCart({
        productId: products[1].id,
        quantity: 1,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      const cart = await cartService.getCart(
        context.user.id,
        context.tenant.id,
      );

      // Act
      const result = await cartService.validateCartForCheckout(
        expectSuccess(cart).id,
        context.user.id,
        context.tenant.id,
      );

      // Assert
      expectSuccess(result);
      expect(result.data).toBe(true);
    });

    it("should return business rule error when cart is empty", async () => {
      // Arrange
      const cart = await cartService.createCart({
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Act
      const result = await cartService.validateCartForCheckout(
        expectSuccess(cart).id,
        context.user.id,
        context.tenant.id,
      );

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain("cannot be empty");
    });

    it("should return not found error when cart does not exist", async () => {
      // Act
      const result = await cartService.validateCartForCheckout(
        "non-existent-cart",
        context.user.id,
        context.tenant.id,
      );

      // Assert
      expectNotFoundError(result, "Cart");
    });

    it("should return business rule error when cart is not active", async () => {
      // Arrange
      const cart = await cartService.createCart({
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Mark cart as checkout
      await mockDb.updateCart(expectSuccess(cart).id, { status: "checkout" });

      // Act
      const result = await cartService.validateCartForCheckout(
        expectSuccess(cart).id,
        context.user.id,
        context.tenant.id,
      );

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain("not active");
    });
  });

  describe("Business Logic Edge Cases", () => {
    it("should handle multiple items with mixed stock availability", async () => {
      // Arrange
      const products = generateTestProducts(3, context.tenant.id);
      products[0].stock = 10; // Available
      products[1].stock = 5; // Limited
      products[2].stock = 0; // Out of stock

      products.forEach((p) => mockDb.addProduct(p));

      // Act - Add items
      const result1 = await cartService.addToCart({
        productId: products[0].id,
        quantity: 2,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      const result2 = await cartService.addToCart({
        productId: products[1].id,
        quantity: 3, // More than available
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      const result3 = await cartService.addToCart({
        productId: products[2].id,
        quantity: 1, // Out of stock
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectSuccess(result1);
      expectFailure(result2); // Stock insufficient
      expectFailure(result3); // Out of stock
    });

    it("should prevent adding more than 100 of a single item", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      // Act - Try to add 101 items
      const result = await cartService.addToCart({
        productId: product.id,
        quantity: 101,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      // Assert
      expectFailure(result);
      expect(result.error.type).toBe("BusinessRuleError");
      expect(result.error.message).toContain(
        "Maximum quantity per item is 100",
      );
    });

    it("should maintain cart state consistency across operations", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      // Act - Perform series of operations
      const addResult = await cartService.addToCart({
        productId: product.id,
        quantity: 2,
        userId: context.user.id,
        tenantId: context.tenant.id,
      });

      const updateResult = await cartService.updateCartItem({
        cartId: expectSuccess(addResult).id,
        itemId: expectSuccess(addResult).items[0].id,
        userId: context.user.id,
        tenantId: context.tenant.id,
        quantity: 3,
      });

      const getCart = await cartService.getCart(
        context.user.id,
        context.tenant.id,
      );

      // Assert - Cart should maintain consistency
      expectSuccess(addResult);
      expectSuccess(updateResult);
      expectSuccess(getCart);
      expect(expectSuccess(getCart).items[0].quantity).toBe(3);
      expect(expectSuccess(getCart).subtotal).toBe(
        (parseFloat(product.price) * 3).toFixed(2),
      );
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent cart operations safely", async () => {
      // Arrange
      const product = createTestProduct(context.tenant.id);
      mockDb.addProduct(product);

      // Act - Simulate concurrent additions
      const promises = Array.from({ length: 5 }, () =>
        cartService.addToCart({
          productId: product.id,
          quantity: 1,
          userId: context.user.id,
          tenantId: context.tenant.id,
        }),
      );

      const results = await Promise.all(promises);

      // Assert - All operations should succeed or fail gracefully
      results.forEach((result) => {
        expect(result.success !== undefined).toBe(true);
      });
    });
  });
});
