import { describe, it, expect, beforeEach } from 'vitest';
import { getTestDb, createTestTenant, createTestProduct, createTestUser } from '../setup/test-database';
import { userCarts, products } from '@sass-store/database/schema';
import { eq, and } from 'drizzle-orm';

describe('Cart Operations', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;
  let user: Awaited<ReturnType<typeof createTestUser>>;
  let product: Awaited<ReturnType<typeof createTestProduct>>;

  beforeEach(async () => {
    tenant = await createTestTenant();
    user = await createTestUser();
    product = await createTestProduct(tenant.id, {
      name: 'Test Product',
      price: '99.99',
      sku: 'CART-TEST-001',
    });
  });

  describe('Add to Cart', () => {
    it('should add a product to cart', async () => {
      const db = getTestDb();

      const [cartItem] = await db
        .insert(userCarts)
        .values({
          userId: user.id,
          productId: product.id,
          quantity: 1,
        })
        .returning();

      expect(cartItem).toBeDefined();
      expect(cartItem.userId).toBe(user.id);
      expect(cartItem.productId).toBe(product.id);
      expect(cartItem.quantity).toBe(1);
    });

    it('should handle quantity greater than 1', async () => {
      const db = getTestDb();

      const [cartItem] = await db
        .insert(userCarts)
        .values({
          userId: user.id,
          productId: product.id,
          quantity: 3,
        })
        .returning();

      expect(cartItem.quantity).toBe(3);
    });

    it('should reject negative quantities', async () => {
      const db = getTestDb();

      await expect(async () => {
        await db.insert(userCarts).values({
          userId: user.id,
          productId: product.id,
          quantity: -1,
        });
      }).rejects.toThrow();
    });

    it('should reject zero quantities', async () => {
      const db = getTestDb();

      await expect(async () => {
        await db.insert(userCarts).values({
          userId: user.id,
          productId: product.id,
          quantity: 0,
        });
      }).rejects.toThrow();
    });
  });

  describe('Update Cart Quantity', () => {
    it('should update quantity of existing cart item', async () => {
      const db = getTestDb();

      // Add item to cart
      const [cartItem] = await db
        .insert(userCarts)
        .values({
          userId: user.id,
          productId: product.id,
          quantity: 1,
        })
        .returning();

      // Update quantity
      const [updated] = await db
        .update(userCarts)
        .set({ quantity: 5 })
        .where(eq(userCarts.id, cartItem.id))
        .returning();

      expect(updated.quantity).toBe(5);
    });

    it('should handle incremental quantity updates', async () => {
      const db = getTestDb();

      const [cartItem] = await db
        .insert(userCarts)
        .values({
          userId: user.id,
          productId: product.id,
          quantity: 2,
        })
        .returning();

      // Increment by 3
      const [updated] = await db
        .update(userCarts)
        .set({ quantity: cartItem.quantity + 3 })
        .where(eq(userCarts.id, cartItem.id))
        .returning();

      expect(updated.quantity).toBe(5);
    });
  });

  describe('Remove from Cart', () => {
    it('should remove item from cart', async () => {
      const db = getTestDb();

      const [cartItem] = await db
        .insert(userCarts)
        .values({
          userId: user.id,
          productId: product.id,
          quantity: 1,
        })
        .returning();

      await db.delete(userCarts).where(eq(userCarts.id, cartItem.id));

      const [deleted] = await db.select().from(userCarts).where(eq(userCarts.id, cartItem.id));

      expect(deleted).toBeUndefined();
    });

    it('should clear entire cart for user', async () => {
      const db = getTestDb();

      // Add multiple items
      const product2 = await createTestProduct(tenant.id, {
        name: 'Product 2',
        sku: 'CART-TEST-002',
      });

      await db.insert(userCarts).values([
        { userId: user.id, productId: product.id, quantity: 1 },
        { userId: user.id, productId: product2.id, quantity: 2 },
      ]);

      // Clear cart
      await db.delete(userCarts).where(eq(userCarts.userId, user.id));

      const remainingItems = await db.select().from(userCarts).where(eq(userCarts.userId, user.id));

      expect(remainingItems).toHaveLength(0);
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate correct cart total', async () => {
      const db = getTestDb();

      const product2 = await createTestProduct(tenant.id, {
        name: 'Product 2',
        price: '49.99',
        sku: 'CART-TEST-002',
      });

      await db.insert(userCarts).values([
        { userId: user.id, productId: product.id, quantity: 2 }, // 99.99 * 2 = 199.98
        { userId: user.id, productId: product2.id, quantity: 3 }, // 49.99 * 3 = 149.97
      ]);

      // Fetch cart with products
      const cartItems = await db
        .select({
          quantity: userCarts.quantity,
          price: products.price,
        })
        .from(userCarts)
        .innerJoin(products, eq(userCarts.productId, products.id))
        .where(eq(userCarts.userId, user.id));

      const total = cartItems.reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0);

      expect(total).toBeCloseTo(349.95, 2);
    });

    it('should handle cart with single item', async () => {
      const db = getTestDb();

      await db.insert(userCarts).values({
        userId: user.id,
        productId: product.id,
        quantity: 1,
      });

      const cartItems = await db
        .select({
          quantity: userCarts.quantity,
          price: products.price,
        })
        .from(userCarts)
        .innerJoin(products, eq(userCarts.productId, products.id))
        .where(eq(userCarts.userId, user.id));

      const total = cartItems.reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
      }, 0);

      expect(total).toBeCloseTo(99.99, 2);
    });
  });

  describe('Cart Isolation', () => {
    it('should isolate carts between users', async () => {
      const db = getTestDb();

      const user2 = await createTestUser({ email: 'user2@test.com' });

      // Add items to both users' carts
      await db.insert(userCarts).values([
        { userId: user.id, productId: product.id, quantity: 1 },
        { userId: user2.id, productId: product.id, quantity: 2 },
      ]);

      const user1Cart = await db.select().from(userCarts).where(eq(userCarts.userId, user.id));

      const user2Cart = await db.select().from(userCarts).where(eq(userCarts.userId, user2.id));

      expect(user1Cart).toHaveLength(1);
      expect(user2Cart).toHaveLength(1);
      expect(user1Cart[0].quantity).toBe(1);
      expect(user2Cart[0].quantity).toBe(2);
    });
  });

  describe('Product Availability in Cart', () => {
    it('should handle inactive products in cart', async () => {
      const db = getTestDb();

      // Add product to cart
      await db.insert(userCarts).values({
        userId: user.id,
        productId: product.id,
        quantity: 1,
      });

      // Deactivate product
      await db.update(products).set({ active: false }).where(eq(products.id, product.id));

      // Fetch cart with product info
      const cartWithProducts = await db
        .select({
          cartId: userCarts.id,
          productId: products.id,
          productName: products.name,
          productActive: products.active,
          quantity: userCarts.quantity,
        })
        .from(userCarts)
        .innerJoin(products, eq(userCarts.productId, products.id))
        .where(eq(userCarts.userId, user.id));

      expect(cartWithProducts).toHaveLength(1);
      expect(cartWithProducts[0].productActive).toBe(false);
    });
  });

  describe('Cart Performance', () => {
    it('should efficiently load cart with multiple items', async () => {
      const db = getTestDb();

      // Create 20 products and add to cart
      const productPromises = [];
      for (let i = 0; i < 20; i++) {
        productPromises.push(
          createTestProduct(tenant.id, {
            name: `Product ${i}`,
            sku: `PERF-${i}`,
            price: '29.99',
          })
        );
      }
      const testProducts = await Promise.all(productPromises);

      // Add all to cart
      await db.insert(userCarts).values(
        testProducts.map((p) => ({
          userId: user.id,
          productId: p.id,
          quantity: 1,
        }))
      );

      const start = Date.now();
      const cartItems = await db
        .select()
        .from(userCarts)
        .innerJoin(products, eq(userCarts.productId, products.id))
        .where(eq(userCarts.userId, user.id));
      const duration = Date.now() - start;

      expect(cartItems).toHaveLength(20);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
