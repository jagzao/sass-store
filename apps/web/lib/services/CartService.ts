import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  status: "active" | "abandoned" | "checked_out";
}

export interface AddItemInput {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface ICartService {
  createCart(userId: string): Promise<Result<Cart, DomainError>>;
  addItem(cartId: string, item: AddItemInput): Promise<Result<Cart, DomainError>>;
  updateQuantity(cartId: string, productId: string, quantity: number): Promise<Result<Cart, DomainError>>;
  removeItem(cartId: string, productId: string): Promise<Result<Cart, DomainError>>;
  getCart(cartId: string): Promise<Result<Cart, DomainError>>;
  clearCart(cartId: string): Promise<Result<Cart, DomainError>>;
  calculateTotal(items: CartItem[]): number;
}

export class InMemoryCartService implements ICartService {
  private carts: Map<string, Cart> = new Map();

  async createCart(userId: string): Promise<Result<Cart, DomainError>> {
    const cart: Cart = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      items: [],
      subtotal: 0,
      total: 0,
      status: "active",
    };
    this.carts.set(cart.id, cart);
    return Ok(cart);
  }

  async addItem(
    cartId: string,
    item: AddItemInput,
  ): Promise<Result<Cart, DomainError>> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", cartId));
    }

    if (item.quantity <= 0 || item.quantity % 1 !== 0) {
      return Err(
        ErrorFactories.validation("Quantity must be a positive integer", "quantity"),
      );
    }

    if (item.price < 0) {
      return Err(ErrorFactories.validation("Price cannot be negative", "price"));
    }

    const existingIndex = cart.items.findIndex(
      (i) => i.productId === item.productId,
    );

    if (existingIndex >= 0) {
      const existing = cart.items[existingIndex];
      cart.items[existingIndex] = {
        ...existing,
        quantity: existing.quantity + item.quantity,
        totalPrice: (existing.quantity + item.quantity) * item.price,
      };
    } else {
      cart.items.push({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.quantity * item.price,
      });
    }

    cart.total = this.calculateTotal(cart.items);
    cart.subtotal = cart.total;
    return Ok(cart);
  }

  async updateQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Result<Cart, DomainError>> {
    if (quantity <= 0 || quantity % 1 !== 0) {
      return Err(
        ErrorFactories.validation("Quantity must be a positive integer", "quantity"),
      );
    }

    const cart = this.carts.get(cartId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", cartId));
    }

    const item = cart.items.find((i) => i.productId === productId);
    if (!item) {
      return Err(ErrorFactories.notFound("Product in cart", productId));
    }

    item.quantity = quantity;
    item.totalPrice = quantity * item.price;
    cart.total = this.calculateTotal(cart.items);
    cart.subtotal = cart.total;
    return Ok(cart);
  }

  async removeItem(
    cartId: string,
    productId: string,
  ): Promise<Result<Cart, DomainError>> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", cartId));
    }

    cart.items = cart.items.filter((i) => i.productId !== productId);
    cart.total = this.calculateTotal(cart.items);
    cart.subtotal = cart.total;
    return Ok(cart);
  }

  async getCart(cartId: string): Promise<Result<Cart, DomainError>> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", cartId));
    }
    return Ok(cart);
  }

  async clearCart(cartId: string): Promise<Result<Cart, DomainError>> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      return Err(ErrorFactories.notFound("Cart", cartId));
    }

    cart.items = [];
    cart.total = 0;
    cart.subtotal = 0;
    cart.status = "active";
    return Ok(cart);
  }

  calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  clear(): void {
    this.carts.clear();
  }
}
