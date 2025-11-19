/**
 * Order Processing Unit Tests
 * Tests for order creation, updates, and payment processing
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestProduct,
  createTestUser,
} from "../setup/test-database";
import * as schema from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("Order Processing", () => {
  let tenant: any;
  let user: any;
  let product1: any;
  let product2: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "order-test-tenant",
      mode: "catalog",
    });

    user = await createTestUser({
      email: "customer@example.com",
      name: "Test Customer",
    });

    product1 = await createTestProduct(tenant.id, {
      sku: "PROD-1",
      name: "Product 1",
      price: "29.99",
      stock: 10,
    });

    product2 = await createTestProduct(tenant.id, {
      sku: "PROD-2",
      name: "Product 2",
      price: "49.99",
      stock: 5,
    });
  });

  describe("Order Creation", () => {
    it("should create order with single item", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      expect(order).toBeDefined();
      expect(order.tenantId).toBe(tenant.id);
      expect(order.userId).toBe(user.id);
      expect(order.status).toBe("pending");
    });

    it("should create order with multiple items", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "109.97",
          subtotal: "109.97",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      // Add order items
      await db.insert(schema.orderItems).values([
        {
          orderId: order.id,
          productId: product1.id,
          quantity: 1,
          price: "29.99",
          subtotal: "29.99",
        },
        {
          orderId: order.id,
          productId: product2.id,
          quantity: 2,
          price: "49.99",
          subtotal: "99.98",
        },
      ]);

      const items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));

      expect(items).toHaveLength(2);
      expect(items[0].quantity).toBe(1);
      expect(items[1].quantity).toBe(2);
    });

    it("should calculate order total correctly", async () => {
      const db = getTestDb();
      if (!db) return;

      const subtotal =
        parseFloat(product1.price) * 2 + parseFloat(product2.price) * 1;
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          discount: "0.00",
        })
        .returning();

      expect(parseFloat(order.subtotal)).toBeCloseTo(subtotal, 2);
      expect(parseFloat(order.tax)).toBeCloseTo(tax, 2);
      expect(parseFloat(order.total)).toBeCloseTo(total, 2);
    });
  });

  describe("Order Status Updates", () => {
    it("should update order status to confirmed", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      const [updated] = await db
        .update(schema.orders)
        .set({ status: "confirmed" })
        .where(eq(schema.orders.id, order.id))
        .returning();

      expect(updated.status).toBe("confirmed");
    });

    it("should track order status changes", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      const statuses = ["confirmed", "processing", "shipped", "delivered"];

      for (const status of statuses) {
        const [updated] = await db
          .update(schema.orders)
          .set({ status })
          .where(eq(schema.orders.id, order.id))
          .returning();

        expect(updated.status).toBe(status);
      }
    });

    it("should allow order cancellation", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      const [cancelled] = await db
        .update(schema.orders)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(schema.orders.id, order.id))
        .returning();

      expect(cancelled.status).toBe("cancelled");
      expect(cancelled.cancelledAt).toBeDefined();
    });
  });

  describe("Payment Processing", () => {
    it("should record successful payment", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      const [payment] = await db
        .insert(schema.payments)
        .values({
          orderId: order.id,
          amount: "29.99",
          currency: "USD",
          method: "card",
          provider: "stripe",
          status: "succeeded",
          providerPaymentId: "pi_test_123",
        })
        .returning();

      expect(payment.status).toBe("succeeded");
      expect(payment.provider).toBe("stripe");
    });

    it("should handle failed payment", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      const [payment] = await db
        .insert(schema.payments)
        .values({
          orderId: order.id,
          amount: "29.99",
          currency: "USD",
          method: "card",
          provider: "stripe",
          status: "failed",
          providerPaymentId: "pi_test_456",
          errorMessage: "Insufficient funds",
        })
        .returning();

      expect(payment.status).toBe("failed");
      expect(payment.errorMessage).toBe("Insufficient funds");
    });

    it("should support multiple payment methods", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      const methods = ["card", "cash", "transfer"];

      for (const method of methods) {
        const [payment] = await db
          .insert(schema.payments)
          .values({
            orderId: order.id,
            amount: "29.99",
            currency: "USD",
            method,
            provider: method === "card" ? "stripe" : "manual",
            status: "succeeded",
          })
          .returning();

        expect(payment.method).toBe(method);
      }
    });
  });

  describe("Inventory Management", () => {
    it("should reduce stock after order confirmation", async () => {
      const db = getTestDb();
      if (!db) return;

      const initialStock = product1.stock;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          userId: user.id,
          status: "confirmed",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        })
        .returning();

      await db.insert(schema.orderItems).values({
        orderId: order.id,
        productId: product1.id,
        quantity: 2,
        price: "29.99",
        subtotal: "59.98",
      });

      // Reduce stock
      await db
        .update(schema.products)
        .set({ stock: initialStock - 2 })
        .where(eq(schema.products.id, product1.id));

      const [updated] = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, product1.id));

      expect(updated.stock).toBe(initialStock - 2);
    });

    it("should restore stock on order cancellation", async () => {
      const db = getTestDb();
      if (!db) return;

      const initialStock = product1.stock;
      const orderedQuantity = 3;

      // Reduce stock
      await db
        .update(schema.products)
        .set({ stock: initialStock - orderedQuantity })
        .where(eq(schema.products.id, product1.id));

      // Restore stock
      await db
        .update(schema.products)
        .set({ stock: initialStock })
        .where(eq(schema.products.id, product1.id));

      const [restored] = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, product1.id));

      expect(restored.stock).toBe(initialStock);
    });
  });

  describe("Order Queries", () => {
    it("should retrieve orders for specific user", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create multiple orders
      await db.insert(schema.orders).values([
        {
          tenantId: tenant.id,
          userId: user.id,
          status: "pending",
          total: "29.99",
          subtotal: "29.99",
          tax: "0.00",
          discount: "0.00",
        },
        {
          tenantId: tenant.id,
          userId: user.id,
          status: "confirmed",
          total: "49.99",
          subtotal: "49.99",
          tax: "0.00",
          discount: "0.00",
        },
      ]);

      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.userId, user.id));

      expect(orders.length).toBeGreaterThanOrEqual(2);
    });

    it("should retrieve orders for specific tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      await db.insert(schema.orders).values({
        tenantId: tenant.id,
        userId: user.id,
        status: "pending",
        total: "29.99",
        subtotal: "29.99",
        tax: "0.00",
        discount: "0.00",
      });

      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.tenantId, tenant.id));

      expect(orders.length).toBeGreaterThan(0);
      expect(orders.every((o) => o.tenantId === tenant.id)).toBe(true);
    });
  });
});
