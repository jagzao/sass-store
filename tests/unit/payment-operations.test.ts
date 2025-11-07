import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestUser,
} from "../setup/test-database";
import { orders } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("Payment Operations", () => {
  let testTenantId: string;
  let testUserId: string;

  beforeEach(async () => {
    const tenant = await createTestTenant({
      slug: "test-store",
      name: "Test Store",
      mode: "catalog",
    });
    testTenantId = tenant.id;

    const user = await createTestUser(testTenantId, {
      email: "buyer@test.com",
      name: "Test Buyer",
    });
    testUserId = user.id;
  });

  describe("Create Order", () => {
    it("should create a new order with payment information", async () => {
      const db = getTestDb();

      const [order] = await db
        .insert(orders)
        .values({
          tenantId: testTenantId,
          userId: testUserId,
          total: "99.99",
          status: "pending",
          items: [
            {
              id: "product-1",
              name: "Test Product",
              price: 99.99,
              quantity: 1,
            },
          ],
          paymentMethod: {
            type: "credit_card",
            lastFourDigits: "4242",
          },
        })
        .returning();

      expect(order).toBeDefined();
      expect(order.total).toBe("99.99");
      expect(order.status).toBe("pending");
    });

    it("should enforce tenant isolation for orders", async () => {
      const db = getTestDb();

      // Create another tenant
      const tenant2 = await createTestTenant({
        slug: "test-store-2",
        name: "Test Store 2",
        mode: "catalog",
      });

      // Create order for first tenant
      await db
        .insert(orders)
        .values({
          tenantId: testTenantId,
          userId: testUserId,
          total: "99.99",
          status: "pending",
        })
        .returning();

      // Query orders for second tenant (should be empty)
      const tenant2Orders = await db
        .select()
        .from(orders)
        .where(eq(orders.tenantId, tenant2.id));

      expect(tenant2Orders).toHaveLength(0);

      // Query orders for first tenant (should have 1)
      const tenant1Orders = await db
        .select()
        .from(orders)
        .where(eq(orders.tenantId, testTenantId));

      expect(tenant1Orders).toHaveLength(1);
    });
  });

  describe("Payment Status", () => {
    it("should update payment status from pending to paid", async () => {
      const db = getTestDb();

      const [order] = await db
        .insert(orders)
        .values({
          tenantId: testTenantId,
          userId: testUserId,
          total: "99.99",
          status: "pending",
        })
        .returning();

      // Update status to paid
      const [updated] = await db
        .update(orders)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      expect(updated.status).toBe("paid");
      expect(updated.paidAt).toBeDefined();
    });

    it("should handle failed payments", async () => {
      const db = getTestDb();

      const [order] = await db
        .insert(orders)
        .values({
          tenantId: testTenantId,
          userId: testUserId,
          total: "99.99",
          status: "pending",
        })
        .returning();

      // Update status to failed
      const [updated] = await db
        .update(orders)
        .set({
          status: "failed",
          failureReason: "Insufficient funds",
        })
        .where(eq(orders.id, order.id))
        .returning();

      expect(updated.status).toBe("failed");
    });
  });

  describe("Payment Methods", () => {
    it("should support multiple payment methods", async () => {
      const db = getTestDb();

      const paymentMethods = ["credit_card", "debit_card", "cash", "transfer"];

      for (const method of paymentMethods) {
        const [order] = await db
          .insert(orders)
          .values({
            tenantId: testTenantId,
            userId: testUserId,
            total: "50.00",
            status: "pending",
            paymentMethod: {
              type: method,
            },
          })
          .returning();

        expect(order.paymentMethod).toBeDefined();
        expect((order.paymentMethod as any).type).toBe(method);
      }
    });
  });

  describe("Order Totals", () => {
    it("should calculate correct order total", async () => {
      const db = getTestDb();

      const items = [
        { id: "1", name: "Product 1", price: 25.0, quantity: 2 },
        { id: "2", name: "Product 2", price: 30.0, quantity: 1 },
      ];

      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const [order] = await db
        .insert(orders)
        .values({
          tenantId: testTenantId,
          userId: testUserId,
          total: total.toFixed(2),
          status: "pending",
          items,
        })
        .returning();

      expect(parseFloat(order.total)).toBe(80.0);
    });
  });

  describe("Refunds", () => {
    it("should process refunds for paid orders", async () => {
      const db = getTestDb();

      const [order] = await db
        .insert(orders)
        .values({
          tenantId: testTenantId,
          userId: testUserId,
          total: "99.99",
          status: "paid",
          paidAt: new Date(),
        })
        .returning();

      // Process refund
      const [refunded] = await db
        .update(orders)
        .set({
          status: "refunded",
          refundedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      expect(refunded.status).toBe("refunded");
      expect(refunded.refundedAt).toBeDefined();
    });
  });
});
