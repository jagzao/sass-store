/**
 * Order Processing Unit Tests
 * Tests for order creation, updates, and payment processing
 */

// Using globals instead of imports since globals: true in Vitest config
import {
  getTestDb,
  createTestTenant,
  createTestProduct,
} from "../setup/test-database";
import * as schema from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("Order Processing", () => {
  let tenant: any;
  let product1: any;
  let product2: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "order-test-tenant",
      mode: "catalog",
    });

    product1 = await createTestProduct(tenant.id, {
      sku: "PROD-1",
      name: "Product 1",
      price: "29.99",
      category: "test",
    });

    product2 = await createTestProduct(tenant.id, {
      sku: "PROD-2",
      name: "Product 2",
      price: "49.99",
      category: "test",
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
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "29.99",
        })
        .returning();

      expect(order).toBeDefined();
      expect(order.tenantId).toBe(tenant.id);
      expect(order.orderNumber).toBeDefined();
      expect(order.status).toBe("pending");
    });

    it("should create order with multiple items", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "109.97",
        })
        .returning();

      // Add order items
      await db.insert(schema.orderItems).values([
        {
          orderId: order.id,
          type: "product",
          name: product1.name,
          quantity: 1,
          unitPrice: "29.99",
          totalPrice: "29.99",
        },
        {
          orderId: order.id,
          type: "product",
          name: product2.name,
          quantity: 2,
          unitPrice: "49.99",
          totalPrice: "99.98",
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
      const total = subtotal;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: total.toFixed(2),
        })
        .returning();

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
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "29.99",
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
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "29.99",
        })
        .returning();

      const statuses = ["confirmed", "completed"];

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
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "29.99",
        })
        .returning();

      const [cancelled] = await db
        .update(schema.orders)
        .set({ status: "cancelled" })
        .where(eq(schema.orders.id, order.id))
        .returning();

      expect(cancelled.status).toBe("cancelled");
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
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "29.99",
        })
        .returning();

      const [payment] = await db
        .insert(schema.payments)
        .values({
          orderId: order.id,
          tenantId: tenant.id,
          amount: "29.99",
          currency: "MXN",
          status: "succeeded",
        })
        .returning();

      expect(payment.status).toBe("succeeded");
      expect(payment.orderId).toBe(order.id);
    });

    it("should handle failed payment", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "29.99",
        })
        .returning();

      const [payment] = await db
        .insert(schema.payments)
        .values({
          orderId: order.id,
          tenantId: tenant.id,
          amount: "29.99",
          currency: "MXN",
          status: "failed",
        })
        .returning();

      expect(payment.status).toBe("failed");
    });

    it("should support multiple payment methods", async () => {
      const db = getTestDb();
      if (!db) return;

      const [order] = await db
        .insert(schema.orders)
        .values({
          tenantId: tenant.id,
          orderNumber: `ORD-${Date.now()}`,
          customerName: "Test Customer",
          customerEmail: "customer@example.com",
          status: "pending",
          total: "89.97",
        })
        .returning();

      // Create multiple payments for the same order
      const payments = await db
        .insert(schema.payments)
        .values([
          {
            orderId: order.id,
            tenantId: tenant.id,
            amount: "29.99",
            currency: "MXN",
            status: "succeeded",
          },
          {
            orderId: order.id,
            tenantId: tenant.id,
            amount: "59.98",
            currency: "MXN",
            status: "succeeded",
          },
        ])
        .returning();

      expect(payments).toHaveLength(2);
      expect(payments[0].amount).toBe("29.99");
      expect(payments[1].amount).toBe("59.98");
    });
  });

  describe("Order Queries", () => {
    it("should retrieve orders for specific tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create multiple orders
      await db.insert(schema.orders).values([
        {
          tenantId: tenant.id,
          orderNumber: `ORD-${Date.now()}-1`,
          customerName: "Customer 1",
          customerEmail: "customer1@example.com",
          status: "pending",
          total: "29.99",
        },
        {
          tenantId: tenant.id,
          orderNumber: `ORD-${Date.now()}-2`,
          customerName: "Customer 2",
          customerEmail: "customer2@example.com",
          status: "confirmed",
          total: "49.99",
        },
      ]);

      const orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.tenantId, tenant.id));

      expect(orders.length).toBeGreaterThanOrEqual(2);
    });

    it("should retrieve orders with correct tenant isolation", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create another tenant
      const tenant2 = await createTestTenant({
        slug: "order-test-tenant-2",
        mode: "catalog",
      });

      // Create order for tenant 1
      await db.insert(schema.orders).values({
        tenantId: tenant.id,
        orderNumber: `ORD-${Date.now()}-t1`,
        customerName: "Tenant 1 Customer",
        customerEmail: "t1@example.com",
        status: "pending",
        total: "29.99",
      });

      // Create order for tenant 2
      await db.insert(schema.orders).values({
        tenantId: tenant2.id,
        orderNumber: `ORD-${Date.now()}-t2`,
        customerName: "Tenant 2 Customer",
        customerEmail: "t2@example.com",
        status: "pending",
        total: "99.99",
      });

      const tenant1Orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.tenantId, tenant.id));

      const tenant2Orders = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.tenantId, tenant2.id));

      // Verify tenant isolation
      expect(tenant1Orders.every((o) => o.tenantId === tenant.id)).toBe(true);
      expect(tenant2Orders.every((o) => o.tenantId === tenant2.id)).toBe(true);
    });
  });
});
