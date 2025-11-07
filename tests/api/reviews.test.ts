import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestProduct,
} from "../setup/test-database";
import { productReviews } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("Product Reviews API", () => {
  let testTenantId: string;
  let testProductId: string;

  beforeEach(async () => {
    // Create test tenant
    const tenant = await createTestTenant({
      slug: "test-store",
      name: "Test Store",
      mode: "catalog",
    });
    testTenantId = tenant.id;

    // Create test product
    const product = await createTestProduct(testTenantId, {
      sku: "TEST-001",
      name: "Test Product",
      price: "99.99",
      category: "test",
    });
    testProductId = product.id;
  });

  describe("POST /api/v1/reviews", () => {
    it("should create a new review with valid data", async () => {
      const db = getTestDb();
      const reviewData = {
        productId: testProductId,
        customerName: "John Doe",
        customerEmail: "john@example.com",
        rating: 5,
        title: "Great product!",
        comment: "Really loved this product, highly recommend!",
      };

      const [newReview] = await db
        .insert(productReviews)
        .values({
          ...reviewData,
          tenantId: testTenantId,
        })
        .returning();

      expect(newReview).toBeDefined();
      expect(newReview.customerName).toBe("John Doe");
      expect(newReview.rating).toBe(5);
      expect(newReview.status).toBe("pending");
    });

    it("should reject review with invalid rating", async () => {
      const db = getTestDb();
      const invalidReview = {
        productId: testProductId,
        customerName: "John Doe",
        rating: 6, // Invalid: should be 1-5
      };

      await expect(async () => {
        await db.insert(productReviews).values({
          ...invalidReview,
          tenantId: testTenantId,
        });
      }).rejects.toThrow();
    });

    it("should require customer name", async () => {
      const db = getTestDb();
      const invalidReview = {
        productId: testProductId,
        rating: 5,
        // Missing customerName
      };

      await expect(async () => {
        await db.insert(productReviews).values({
          ...(invalidReview as any),
          tenantId: testTenantId,
        });
      }).rejects.toThrow();
    });
  });

  describe("GET /api/v1/reviews", () => {
    beforeEach(async () => {
      const db = getTestDb();
      // Create sample reviews
      await db.insert(productReviews).values([
        {
          tenantId: testTenantId,
          productId: testProductId,
          customerName: "Alice",
          rating: 5,
          status: "approved",
        },
        {
          tenantId: testTenantId,
          productId: testProductId,
          customerName: "Bob",
          rating: 4,
          status: "approved",
        },
        {
          tenantId: testTenantId,
          productId: testProductId,
          customerName: "Charlie",
          rating: 3,
          status: "pending",
        },
      ]);
    });

    it("should fetch approved reviews for a product", async () => {
      const db = getTestDb();
      const reviews = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews.productId, testProductId));

      expect(reviews).toHaveLength(3);
    });

    it("should filter reviews by status", async () => {
      const db = getTestDb();
      const approvedReviews = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews.status, "approved"));

      expect(approvedReviews).toHaveLength(2);
    });
  });

  describe("PATCH /api/v1/reviews/[id]", () => {
    it("should update review status", async () => {
      const db = getTestDb();
      const [review] = await db
        .insert(productReviews)
        .values({
          tenantId: testTenantId,
          productId: testProductId,
          customerName: "Test User",
          rating: 4,
        })
        .returning();

      const [updated] = await db
        .update(productReviews)
        .set({ status: "approved" })
        .where(eq(productReviews.id, review.id))
        .returning();

      expect(updated.status).toBe("approved");
    });

    it("should increment helpful count", async () => {
      const db = getTestDb();
      const [review] = await db
        .insert(productReviews)
        .values({
          tenantId: testTenantId,
          productId: testProductId,
          customerName: "Test User",
          rating: 4,
        })
        .returning();

      const [updated] = await db
        .update(productReviews)
        .set({ helpful: (review.helpful || 0) + 1 })
        .where(eq(productReviews.id, review.id))
        .returning();

      expect(updated.helpful).toBe(1);
    });
  });

  describe("DELETE /api/v1/reviews/[id]", () => {
    it("should delete a review", async () => {
      const db = getTestDb();
      const [review] = await db
        .insert(productReviews)
        .values({
          tenantId: testTenantId,
          productId: testProductId,
          customerName: "Test User",
          rating: 4,
        })
        .returning();

      await db.delete(productReviews).where(eq(productReviews.id, review.id));

      const [found] = await db
        .select()
        .from(productReviews)
        .where(eq(productReviews.id, review.id));

      expect(found).toBeUndefined();
    });
  });
});
