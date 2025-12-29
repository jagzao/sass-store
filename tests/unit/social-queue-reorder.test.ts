/**
 * Social Queue Reorder Tests
 * Tests for the POST /api/v1/social/queue/reorder endpoint
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "../../apps/web/app/api/v1/social/queue/reorder/route";
import {
  getTestDb,
  createTestTenant,
  createTestUser,
} from "../setup/test-database";
import * as schema from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

describe("Social Queue Reorder API", () => {
  let tenant: any;
  let user: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "reorder-test-tenant",
      name: "Reorder Test Tenant",
      mode: "catalog",
    });

    user = await createTestUser({
      email: "reorder@test.com",
      name: "Reorder Tester",
    });
  });

  describe("Parameter Validation", () => {
    it("should reject request without tenant slug", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            postIds: ["uuid1", "uuid2"],
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Tenant slug");
    });

    it("should reject request without postIds", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: "reorder-test-tenant",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("postIds");
    });

    it("should reject request with empty postIds array", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: "reorder-test-tenant",
            postIds: [],
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("At least one post ID");
    });

    it("should reject request with invalid tenant", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: "non-existent-tenant",
            postIds: ["uuid1", "uuid2"],
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Tenant not found");
    });
  });

  describe("Reordering with Existing Dates", () => {
    it("should reorder posts by redistributing existing dates", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create 3 posts with specific scheduled dates
      const date1 = new Date("2024-12-25T10:00:00Z");
      const date2 = new Date("2024-12-26T14:00:00Z");
      const date3 = new Date("2024-12-27T18:00:00Z");

      const [post1] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Post 1",
          baseText: "First post",
          scheduledAtUtc: date1,
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [post2] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Post 2",
          baseText: "Second post",
          scheduledAtUtc: date2,
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [post3] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Post 3",
          baseText: "Third post",
          scheduledAtUtc: date3,
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      // Reorder: Move post3 to first, post1 to second, post2 to third
      const newOrder = [post3.id, post1.id, post2.id];

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: newOrder,
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.reorderedCount).toBe(3);

      // Verify the new order
      const [updatedPost3] = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.id, post3.id));

      const [updatedPost1] = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.id, post1.id));

      const [updatedPost2] = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.id, post2.id));

      // Post3 should now have the earliest date (date1)
      expect(updatedPost3.scheduledAtUtc?.getTime()).toBe(date1.getTime());
      // Post1 should have the middle date (date2)
      expect(updatedPost1.scheduledAtUtc?.getTime()).toBe(date2.getTime());
      // Post2 should have the latest date (date3)
      expect(updatedPost2.scheduledAtUtc?.getTime()).toBe(date3.getTime());
    });

    it("should maintain chronological order after reordering", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create posts with dates
      const baseDate = new Date("2024-12-20T10:00:00Z");
      const posts = [];

      for (let i = 0; i < 5; i++) {
        const date = new Date(baseDate);
        date.setHours(baseDate.getHours() + i * 2); // 2 hour intervals

        const [post] = await db
          .insert(schema.socialPosts)
          .values({
            tenantId: tenant.id,
            title: `Post ${i + 1}`,
            baseText: `Content ${i + 1}`,
            scheduledAtUtc: date,
            status: "scheduled",
            createdBy: user.id,
          })
          .returning();

        posts.push(post);
      }

      // Reverse the order
      const reversedOrder = posts.reverse().map((p) => p.id);

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: reversedOrder,
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Fetch all posts and verify they're in chronological order
      const updatedPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id))
        .orderBy(schema.socialPosts.scheduledAtUtc);

      // Verify dates are still in ascending order
      for (let i = 1; i < updatedPosts.length; i++) {
        const prevDate = updatedPosts[i - 1].scheduledAtUtc!;
        const currDate = updatedPosts[i].scheduledAtUtc!;
        expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
      }

      // Verify the IDs match the reversed order
      const updatedIds = updatedPosts.map((p) => p.id);
      expect(updatedIds).toEqual(reversedOrder);
    });
  });

  describe("Reordering without Scheduled Dates", () => {
    it("should generate new dates starting from now with 1-hour intervals", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create 3 posts without scheduled dates
      const posts = [];
      for (let i = 0; i < 3; i++) {
        const [post] = await db
          .insert(schema.socialPosts)
          .values({
            tenantId: tenant.id,
            title: `Draft Post ${i + 1}`,
            baseText: `Draft content ${i + 1}`,
            scheduledAtUtc: null,
            status: "draft",
            createdBy: user.id,
          })
          .returning();

        posts.push(post);
      }

      const beforeReorder = Date.now();

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: posts.map((p) => p.id),
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify all posts now have scheduled dates
      const updatedPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id))
        .orderBy(schema.socialPosts.scheduledAtUtc);

      updatedPosts.forEach((post) => {
        expect(post.scheduledAtUtc).not.toBeNull();
        // Verify date is after the reorder started
        expect(post.scheduledAtUtc!.getTime()).toBeGreaterThanOrEqual(
          beforeReorder,
        );
      });

      // Verify approximately 1-hour intervals between posts
      for (let i = 1; i < updatedPosts.length; i++) {
        const prevDate = updatedPosts[i - 1].scheduledAtUtc!.getTime();
        const currDate = updatedPosts[i].scheduledAtUtc!.getTime();
        const diff = currDate - prevDate;
        const oneHour = 60 * 60 * 1000;
        // Allow 1 second tolerance for test execution time
        expect(diff).toBeGreaterThanOrEqual(oneHour - 1000);
        expect(diff).toBeLessThanOrEqual(oneHour + 1000);
      }
    });
  });

  describe("Mixed Scenarios", () => {
    it("should handle posts with some having dates and others not", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create posts: 2 with dates, 2 without
      const date1 = new Date("2024-12-25T10:00:00Z");
      const date2 = new Date("2024-12-26T14:00:00Z");

      const [postWithDate1] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Scheduled Post 1",
          baseText: "Has date",
          scheduledAtUtc: date1,
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [postWithDate2] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Scheduled Post 2",
          baseText: "Has date",
          scheduledAtUtc: date2,
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [postNoDate1] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Draft Post 1",
          baseText: "No date",
          scheduledAtUtc: null,
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [postNoDate2] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Draft Post 2",
          baseText: "No date",
          scheduledAtUtc: null,
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const newOrder = [
        postNoDate1.id,
        postWithDate1.id,
        postNoDate2.id,
        postWithDate2.id,
      ];

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: newOrder,
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      // All posts should now have dates
      const updatedPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id));

      updatedPosts.forEach((post) => {
        expect(post.scheduledAtUtc).not.toBeNull();
      });

      // Verify they're in chronological order
      const sortedPosts = updatedPosts.sort(
        (a, b) => a.scheduledAtUtc!.getTime() - b.scheduledAtUtc!.getTime(),
      );

      const sortedIds = sortedPosts.map((p) => p.id);
      expect(sortedIds).toEqual(newOrder);
    });
  });

  describe("Tenant Isolation", () => {
    it("should not reorder posts from different tenants", async () => {
      const db = getTestDb();
      if (!db) return;

      const tenant2 = await createTestTenant({
        slug: "tenant-2-reorder",
        name: "Tenant 2",
      });

      // Create posts for tenant 1
      const [post1] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Tenant 1 Post",
          baseText: "Content 1",
          scheduledAtUtc: new Date("2024-12-25T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      // Create post for tenant 2
      const [post2] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant2.id,
          title: "Tenant 2 Post",
          baseText: "Content 2",
          scheduledAtUtc: new Date("2024-12-26T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      // Try to reorder tenant 1's post using tenant 2's post ID
      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: [post1.id, post2.id],
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      // Should fail because post2 doesn't belong to tenant 1
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    });

    it("should only reorder posts belonging to the specified tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      const tenant2 = await createTestTenant({
        slug: "tenant-2-isolated",
        name: "Tenant 2 Isolated",
      });

      // Create 2 posts for tenant 1
      const [t1post1] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "T1 Post 1",
          baseText: "Content",
          scheduledAtUtc: new Date("2024-12-25T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [t1post2] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "T1 Post 2",
          baseText: "Content",
          scheduledAtUtc: new Date("2024-12-26T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      // Create post for tenant 2
      const [t2post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant2.id,
          title: "T2 Post",
          baseText: "Content",
          scheduledAtUtc: new Date("2024-12-27T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const originalT2Date = t2post.scheduledAtUtc!.getTime();

      // Reorder tenant 1's posts
      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: [t1post2.id, t1post1.id], // Reverse order
          }),
        },
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify tenant 2's post was NOT affected
      const [unchangedT2Post] = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.id, t2post.id));

      expect(unchangedT2Post.scheduledAtUtc!.getTime()).toBe(originalT2Date);
    });
  });

  describe("Edge Cases", () => {
    it("should handle reordering a single post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Single Post",
          baseText: "Content",
          scheduledAtUtc: new Date("2024-12-25T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: [post.id],
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.reorderedCount).toBe(1);
    });

    it("should handle large number of posts", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create 20 posts
      const posts = [];
      const baseDate = new Date("2024-12-01T10:00:00Z");

      for (let i = 0; i < 20; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);

        const [post] = await db
          .insert(schema.socialPosts)
          .values({
            tenantId: tenant.id,
            title: `Post ${i + 1}`,
            baseText: `Content ${i + 1}`,
            scheduledAtUtc: date,
            status: "scheduled",
            createdBy: user.id,
          })
          .returning();

        posts.push(post);
      }

      // Shuffle the order
      const shuffled = [...posts].sort(() => Math.random() - 0.5);
      const newOrder = shuffled.map((p) => p.id);

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: newOrder,
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.reorderedCount).toBe(20);

      // Verify all posts were updated
      const updatedPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id))
        .orderBy(schema.socialPosts.scheduledAtUtc);

      expect(updatedPosts).toHaveLength(20);

      // Verify IDs match the new order
      const updatedIds = updatedPosts.map((p) => p.id);
      expect(updatedIds).toEqual(newOrder);
    });
  });

  describe("UpdatedAt Timestamp", () => {
    it("should update the updatedAt field when reordering", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Timestamp Test",
          baseText: "Content",
          scheduledAtUtc: new Date("2024-12-25T10:00:00Z"),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const originalUpdatedAt = post.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const request = new NextRequest(
        "http://localhost:3000/api/v1/social/queue/reorder",
        {
          method: "POST",
          body: JSON.stringify({
            tenant: tenant.slug,
            postIds: [post.id],
          }),
        },
      );

      await POST(request);

      const [updatedPost] = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.id, post.id));

      expect(updatedPost.updatedAt!.getTime()).toBeGreaterThan(
        originalUpdatedAt!.getTime(),
      );
    });
  });
});
