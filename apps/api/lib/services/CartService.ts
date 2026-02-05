/**
 * Cart Service
 *
 * Shopping cart management service using Result Pattern.
 * Handles cart operations, validation, and business rules.
 */

import {
  Result,
  Ok,
  Err,
  asyncFlatMap,
  map,
} from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";

// Types for cart operations
export interface CartItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  quantity: number;
  total: string;
  currency: string;
  addedAt: Date;
}

export interface Cart {
  id: string;
  tenantId: string;
  userId: string;
  items: CartItem[];
  subtotal: string;
  total: string;
  currency: string;
  status: "active" | "abandoned" | "checkout";
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  userId: string;
  tenantId: string;
}

export interface UpdateCartItemRequest {
  cartId: string;
  itemId: string;
  userId: string;
  tenantId: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  cartId: string;
  itemId: string;
  userId: string;
  tenantId: string;
}

export interface CreateCartRequest {
  userId: string;
  tenantId: string;
}

// Mock database interface (would be injected in real implementation)
export interface CartDatabase {
  findCartByUser(userId: string, tenantId: string): Promise<Cart | null>;
  findProductById(productId: string, tenantId: string): Promise<any>;
  insertCart(cart: Omit<Cart, "id" | "createdAt" | "updatedAt">): Promise<Cart>;
  updateCart(cartId: string, updates: Partial<Cart>): Promise<Cart>;
  deleteCart(cartId: string): Promise<boolean>;
  findCartItem(cartId: string, itemId: string): Promise<CartItem | null>;
  insertCartItem(
    cartId: string,
    item: Omit<CartItem, "id" | "addedAt">,
  ): Promise<CartItem>;
  updateCartItem(itemId: string, updates: Partial<CartItem>): Promise<CartItem>;
  deleteCartItem(itemId: string): Promise<boolean>;
}

export class CartService {
  constructor(private db: CartDatabase) {}

  async createCart(
    request: CreateCartRequest,
  ): Promise<Result<Cart, DomainError>> {
    // Validate request
    if (!request.userId) {
      return Err(ErrorFactories.validation("User ID is required", "userId"));
    }

    if (!request.tenantId) {
      return Err(
        ErrorFactories.validation("Tenant ID is required", "tenantId"),
      );
    }

    // Check if user already has an active cart
    const existingCart = await this.db.findCartByUser(
      request.userId,
      request.tenantId,
    );
    if (existingCart && existingCart.status === "active") {
      return Ok(existingCart);
    }

    // Create new cart
    const now = new Date();
    const cartData = {
      tenantId: request.tenantId,
      userId: request.userId,
      items: [],
      subtotal: "0.00",
      total: "0.00",
      currency: "USD",
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const cart = await this.db.insertCart(cartData);
      return Ok(cart);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_cart",
          "Failed to create shopping cart",
          { userId: request.userId, tenantId: request.tenantId },
          error as Error,
        ),
      );
    }
  }

  async addToCart(
    request: AddToCartRequest,
  ): Promise<Result<Cart, DomainError>> {
    // Validate request
    if (!request.productId) {
      return Err(
        ErrorFactories.validation("Product ID is required", "productId"),
      );
    }

    if (!request.quantity || request.quantity <= 0) {
      return Err(
        ErrorFactories.validation(
          "Quantity must be greater than 0",
          "quantity",
        ),
      );
    }

    if (request.quantity > 100) {
      return Err(
        ErrorFactories.businessRule(
          "Maximum quantity per item is 100",
          "quantity",
        ),
      );
    }

    // Get or create cart for user
    const existingCart = await this.db.findCartByUser(
      request.userId,
      request.tenantId,
    );
    let cart: Cart;

    if (existingCart && existingCart.status === "active") {
      cart = existingCart;
    } else {
      const createResult = await this.createCart({
        userId: request.userId,
        tenantId: request.tenantId,
      });

      if (!createResult.success) {
        return createResult;
      }
      cart = createResult.data;
    }

    // Get product details
    const product = await this.db.findProductById(
      request.productId,
      request.tenantId,
    );
    if (!product) {
      return Err(ErrorFactories.notFound("Product", request.productId));
    }

    if (!product.status || product.status !== "active") {
      return Err(
        ErrorFactories.businessRule(
          "Product is not available for purchase",
          "productId",
        ),
      );
    }

    if (product.stock < request.quantity) {
      return Err(
        ErrorFactories.businessRule(
          `Only ${product.stock} items available. Requested: ${request.quantity}`,
          "productId",
        ),
      );
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === request.productId,
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + request.quantity;

      if (newQuantity > product.stock) {
        return Err(
          ErrorFactories.businessRule(
            `Cannot add ${request.quantity} more items. Only ${product.stock} available.`,
            "productId",
          ),
        );
      }

      const updatedItem = {
        ...existingItem,
        quantity: newQuantity,
        total: (parseFloat(existingItem.price) * newQuantity).toFixed(2),
      };

      await this.db.updateCartItem(existingItem.id, updatedItem);
      cart.items[existingItemIndex] = updatedItem;
    } else {
      // Add new item
      const itemData = {
        cartId: cart.id,
        productId: request.productId,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: request.quantity,
        total: (parseFloat(product.price) * request.quantity).toFixed(2),
        currency: product.currency || "USD",
      };

      const newItem = await this.db.insertCartItem(cart.id, itemData);
      cart.items.push(newItem);
    }

    // Recalculate totals
    const newSubtotal = cart.items
      .reduce((sum, item) => sum + parseFloat(item.total), 0)
      .toFixed(2);

    const updatedCart = {
      ...cart,
      items: cart.items,
      subtotal: newSubtotal,
      total: newSubtotal,
      updatedAt: new Date(),
    };

    await this.db.updateCart(cart.id, updatedCart);
    return Ok(updatedCart);
  }

  async updateCartItem(
    request: UpdateCartItemRequest,
  ): Promise<Result<Cart, DomainError>> {
    // Validate request
    if (!request.quantity || request.quantity <= 0) {
      return Err(
        ErrorFactories.validation(
          "Quantity must be greater than 0",
          "quantity",
        ),
      );
    }

    if (request.quantity > 100) {
      return Err(
        ErrorFactories.businessRule(
          "Maximum quantity per item is 100",
          "quantity",
        ),
      );
    }

    // Get cart and item
    const cart = await this.db.findCartByUser(request.userId, request.tenantId);
    if (!cart || cart.status !== "active") {
      return Err(ErrorFactories.notFound("Cart", request.cartId));
    }

    const item = await this.db.findCartItem(request.cartId, request.itemId);
    if (!item) {
      return Err(ErrorFactories.notFound("Cart item", request.itemId));
    }

    // Get product to check stock
    const product = await this.db.findProductById(
      item.productId,
      request.tenantId,
    );
    if (!product) {
      return Err(ErrorFactories.notFound("Product", item.productId));
    }

    if (product.stock < request.quantity) {
      return Err(
        ErrorFactories.businessRule(
          `Only ${product.stock} items available. Requested: ${request.quantity}`,
          "productId",
        ),
      );
    }

    // Update item
    const updatedItem = {
      ...item,
      quantity: request.quantity,
      total: (parseFloat(item.price) * request.quantity).toFixed(2),
    };

    await this.db.updateCartItem(item.id, updatedItem);

    // Update cart totals
    const updatedItems = cart.items.map((cartItem) =>
      cartItem.id === item.id ? updatedItem : cartItem,
    );

    const newSubtotal = updatedItems
      .reduce((sum, cartItem) => sum + parseFloat(cartItem.total), 0)
      .toFixed(2);

    const updatedCart = {
      ...cart,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal,
      updatedAt: new Date(),
    };

    await this.db.updateCart(cart.id, updatedCart);
    return Ok(updatedCart);
  }

  async removeFromCart(
    request: RemoveFromCartRequest,
  ): Promise<Result<Cart, DomainError>> {
    // Validate request
    if (!request.cartId) {
      return Err(ErrorFactories.validation("Cart ID is required", "cartId"));
    }

    if (!request.itemId) {
      return Err(ErrorFactories.validation("Item ID is required", "itemId"));
    }

    // Get cart
    const cart = await this.db.findCartByUser(request.userId, request.tenantId);
    if (!cart || cart.status !== "active") {
      return Err(ErrorFactories.notFound("Cart", request.cartId));
    }

    const item = await this.db.findCartItem(request.cartId, request.itemId);
    if (!item) {
      return Err(ErrorFactories.notFound("Cart item", request.itemId));
    }

    // Remove item
    await this.db.deleteCartItem(item.id);

    // Update cart items and totals
    const updatedItems = cart.items.filter(
      (cartItem) => cartItem.id !== item.id,
    );
    const newSubtotal = updatedItems
      .reduce((sum, cartItem) => sum + parseFloat(cartItem.total), 0)
      .toFixed(2);

    const updatedCart = {
      ...cart,
      items: updatedItems,
      subtotal: newSubtotal,
      total: newSubtotal,
      updatedAt: new Date(),
    };

    await this.db.updateCart(cart.id, updatedCart);

    // If cart is empty, mark as abandoned
    if (updatedItems.length === 0) {
      await this.db.updateCart(cart.id, { status: "abandoned" });
    }

    return Ok(updatedCart);
  }

  async clearCart(
    userId: string,
    tenantId: string,
  ): Promise<Result<Cart, DomainError>> {
    const cart = await this.db.findCartByUser(userId, tenantId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", "user-cart"));
    }

    const updatedCart = {
      ...cart,
      items: [],
      subtotal: "0.00",
      total: "0.00",
      status: "abandoned",
      updatedAt: new Date(),
    };

    await this.db.updateCart(cart.id, updatedCart);
    return Ok(updatedCart);
  }

  async getCart(
    userId: string,
    tenantId: string,
  ): Promise<Result<Cart, DomainError>> {
    const cart = await this.db.findCartByUser(userId, tenantId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", "user-cart"));
    }

    return Ok(cart);
  }

  async validateCartForCheckout(
    cartId: string,
    userId: string,
    tenantId: string,
  ): Promise<Result<boolean, DomainError>> {
    const cart = await this.db.findCartByUser(userId, tenantId);
    if (!cart || cart.id !== cartId) {
      return Err(ErrorFactories.notFound("Cart", cartId));
    }

    if (cart.status !== "active") {
      return Err(
        ErrorFactories.businessRule(
          "Cart is not active for checkout",
          "cartId",
        ),
      );
    }

    if (cart.items.length === 0) {
      return Err(
        ErrorFactories.validation("Cart cannot be empty for checkout", "items"),
      );
    }

    // Validate each item still has stock
    for (const item of cart.items) {
      const product = await this.db.findProductById(item.productId, tenantId);
      if (!product || product.status !== "active") {
        return Err(
          ErrorFactories.businessRule(
            `Product ${item.productId} is no longer available`,
            "productId",
          ),
        );
      }

      if (product.stock < item.quantity) {
        return Err(
          ErrorFactories.businessRule(
            `Insufficient stock for product ${item.productId}. Available: ${product.stock}, Requested: ${item.quantity}`,
            "productId",
          ),
        );
      }
    }

    return Ok(true);
  }
}
