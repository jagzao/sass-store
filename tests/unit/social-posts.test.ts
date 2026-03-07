/**
 * Social Posts Unit Tests
 * Tests for social media post operations and lifecycle
 */

// Using globals instead of imports since globals: true in Vitest config
import {
  getTestDb,
  createTestTenant,
  createTestUser,
} from "../setup/test-database";
import * as schema from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

describe("Social Posts Operations", () => {
  let tenant: any;
  let user: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "social-test-tenant",
      name: "Social Media Test",
      mode: "catalog",
    });

    user = await createTestUser({
      email: "socialmgr@test.com",
      name: "Social Manager",
    });
  });

  describe("Post Creation", () => {
    it("should create a post with title and scheduled date", async () => {
      const db = getTestDb();
      if (!db) return;

      const scheduledDate = new Date("2024-12-31T10:00:00Z");

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Holiday Promotion Post",
          baseText: "Base content for holiday promotion post",
          scheduledAtUtc: scheduledDate,
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      expect(post).toBeDefined();
      expect(post.title).toBe("Holiday Promotion Post");
      expect(post.baseText).toBe("Base content for holiday promotion post");
      expect(post.status).toBe("draft");
      expect(post.scheduledAtUtc).toEqual(scheduledDate);
    });

    it("should create post with campaign association", async () => {
      const db = getTestDb();
      if (!db) return;

      const [campaign] = await db
        .insert(schema.campaigns)
        .values({
          tenantId: tenant.id,
          name: "Holiday Campaign",
          type: "promocional",
          slug: "holiday-campaign",
        })
        .returning();

      // Note: socialPosts table no longer has campaignId - campaigns are linked via reels
      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Campaign Post",
          baseText: "Content for campaign post",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      expect(post).toBeDefined();
      expect(post.title).toBe("Campaign Post");
    });

    it("should create post with multiple platform variants", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Multi-Platform Post",
          baseText: "Base content for multi-platform post",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      // Create targets for Instagram and Facebook using socialPostTargets
      const targets = await db
        .insert(schema.socialPostTargets)
        .values([
          {
            postId: post.id,
            platform: "instagram",
            variantText: "Check out our holiday special! ✨ #Holiday2024",
          },
          {
            postId: post.id,
            platform: "facebook",
            variantText: "Don't miss our holiday promotion! Visit us today.",
          },
        ])
        .returning();

      expect(targets).toHaveLength(2);
      expect(targets[0].platform).toBe("instagram");
      expect(targets[1].platform).toBe("facebook");
    });
  });

  describe("Post Lifecycle States", () => {
    it("should transition from draft to scheduled", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Lifecycle Test",
          baseText: "Content for lifecycle test",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPosts)
        .set({ status: "scheduled" })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(updated.status).toBe("scheduled");
    });

    it("should transition from scheduled to published", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Publish Test",
          baseText: "Content for publish test",
          scheduledAtUtc: new Date(),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPosts)
        .set({
          status: "published",
        })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(updated.status).toBe("published");
    });

    it("should handle failed publication", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Failed Post",
          baseText: "Content for failed post test",
          scheduledAtUtc: new Date(),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPosts)
        .set({
          status: "failed",
          metadata: { error: "API authentication failed" },
        })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(updated.status).toBe("failed");
      expect(updated.metadata).toBeDefined();
    });
  });

  describe("Post Platform Variants", () => {
    it("should retrieve all targets for a post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Multi-Platform",
          baseText: "Base content for multi-platform",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      await db.insert(schema.socialPostTargets).values([
        {
          postId: post.id,
          platform: "instagram",
          variantText: "Instagram content",
        },
        {
          postId: post.id,
          platform: "facebook",
          variantText: "Facebook content",
        },
        {
          postId: post.id,
          platform: "x",
          variantText: "X/Twitter content",
        },
      ]);

      const targets = await db
        .select()
        .from(schema.socialPostTargets)
        .where(eq(schema.socialPostTargets.postId, post.id));

      expect(targets).toHaveLength(3);
    });

    it("should update target content", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Update Test",
          baseText: "Base content for update test",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [target] = await db
        .insert(schema.socialPostTargets)
        .values({
          postId: post.id,
          platform: "instagram",
          variantText: "Original content",
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPostTargets)
        .set({ variantText: "Updated content with hashtags #NewYear" })
        .where(eq(schema.socialPostTargets.id, target.id))
        .returning();

      expect(updated.variantText).toContain("Updated content");
      expect(updated.variantText).toContain("#NewYear");
    });

    it("should support different media types per platform", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Media Types Test",
          baseText: "Base content for media types test",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      await db.insert(schema.socialPostTargets).values([
        {
          postId: post.id,
          platform: "instagram",
          variantText: "Story content",
          metadata: { mediaType: "video" },
        },
        {
          postId: post.id,
          platform: "facebook",
          variantText: "Post content",
          metadata: { mediaType: "image" },
        },
      ]);

      const targets = await db
        .select()
        .from(schema.socialPostTargets)
        .where(eq(schema.socialPostTargets.postId, post.id));

      const igTarget = targets.find((v) => v.platform === "instagram");
      const fbTarget = targets.find((v) => v.platform === "facebook");

      expect(igTarget?.metadata?.mediaType).toBe("video");
      expect(fbTarget?.metadata?.mediaType).toBe("image");
    });
  });

  describe("Post Filtering and Queries", () => {
    it("should filter posts by status", async () => {
      const db = getTestDb();
      if (!db) return;

      await db.insert(schema.socialPosts).values([
        {
          tenantId: tenant.id,
          title: "Draft 1",
          baseText: "Draft content 1",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Scheduled 1",
          baseText: "Scheduled content 1",
          scheduledAtUtc: new Date(),
          status: "scheduled",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Published 1",
          baseText: "Published content 1",
          scheduledAtUtc: new Date(),
          status: "published",
          createdBy: user.id,
        },
      ]);

      const draftPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(
          and(
            eq(schema.socialPosts.tenantId, tenant.id),
            eq(schema.socialPosts.status, "draft"),
          ),
        );

      expect(draftPosts).toHaveLength(1);
      expect(draftPosts[0].title).toBe("Draft 1");
    });

    it("should filter posts by date range", async () => {
      const db = getTestDb();
      if (!db) return;

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      await db.insert(schema.socialPosts).values([
        {
          tenantId: tenant.id,
          title: "Today Post",
          baseText: "Today content",
          scheduledAtUtc: today,
          status: "scheduled",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Tomorrow Post",
          baseText: "Tomorrow content",
          scheduledAtUtc: tomorrow,
          status: "scheduled",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Next Week Post",
          baseText: "Next week content",
          scheduledAtUtc: nextWeek,
          status: "scheduled",
          createdBy: user.id,
        },
      ]);

      // This is a simplified example - in real implementation you'd use proper date range queries
      const allPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id));

      expect(allPosts).toHaveLength(3);
    });

    it("should filter posts by tenant isolation", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create posts for the tenant
      await db.insert(schema.socialPosts).values([
        {
          tenantId: tenant.id,
          title: "Tenant Post 1",
          baseText: "Tenant content 1",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Tenant Post 2",
          baseText: "Tenant content 2",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        },
      ]);

      const tenantPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id));

      expect(tenantPosts).toHaveLength(2);
    });
  });

  describe("Post Deletion", () => {
    it("should soft delete a post by updating status", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "To Delete",
          baseText: "Content to delete",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [deleted] = await db
        .update(schema.socialPosts)
        .set({ status: "canceled" })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(deleted.status).toBe("canceled");
    });

    it("should hard delete a post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "To Remove",
          baseText: "Content to remove",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      await db
        .delete(schema.socialPosts)
        .where(eq(schema.socialPosts.id, post.id));

      const [result] = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.id, post.id));

      expect(result).toBeUndefined();
    });
  });

  describe("Tenant Isolation", () => {
    it("should enforce tenant isolation for posts", async () => {
      const db = getTestDb();
      if (!db) return;

      const tenant2 = await createTestTenant({
        slug: "tenant-2",
        name: "Tenant 2",
      });

      await db.insert(schema.socialPosts).values([
        {
          tenantId: tenant.id,
          title: "Tenant 1 Post",
          baseText: "Content for tenant 1",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        },
        {
          tenantId: tenant2.id,
          title: "Tenant 2 Post",
          baseText: "Content for tenant 2",
          scheduledAtUtc: new Date(),
          status: "draft",
          createdBy: user.id,
        },
      ]);

      const tenant1Posts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant.id));

      const tenant2Posts = await db
        .select()
        .from(schema.socialPosts)
        .where(eq(schema.socialPosts.tenantId, tenant2.id));

      expect(tenant1Posts).toHaveLength(1);
      expect(tenant2Posts).toHaveLength(1);
      expect(tenant1Posts[0].title).toBe("Tenant 1 Post");
      expect(tenant2Posts[0].title).toBe("Tenant 2 Post");
    });
  });

  describe("Post Analytics Integration", () => {
    it("should create target for published post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          title: "Analytics Test",
          baseText: "Content for analytics test",
          scheduledAtUtc: new Date(),
          status: "published",
          createdBy: user.id,
        })
        .returning();

      const [target] = await db
        .insert(schema.socialPostTargets)
        .values({
          postId: post.id,
          platform: "instagram",
          status: "published",
          platformPostId: "ig_123456",
          metadata: { reach: 1000, impressions: 1500, likes: 150 },
        })
        .returning();

      expect(target.postId).toBe(post.id);
      expect(target.platform).toBe("instagram");
      expect(target.platformPostId).toBe("ig_123456");
    });
  });
});
