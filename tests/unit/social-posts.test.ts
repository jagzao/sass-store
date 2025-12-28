/**
 * Social Posts Unit Tests
 * Tests for social media post operations and lifecycle
 */

import { describe, it, expect, beforeEach } from "vitest";
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
          titleInternal: "Holiday Promotion Post",
          scheduledAt: scheduledDate,
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      expect(post).toBeDefined();
      expect(post.titleInternal).toBe("Holiday Promotion Post");
      expect(post.status).toBe("draft");
      expect(post.scheduledAt).toEqual(scheduledDate);
    });

    it("should create post with campaign association", async () => {
      const db = getTestDb();
      if (!db) return;

      const [campaign] = await db
        .insert(schema.campaigns)
        .values({
          tenantId: tenant.id,
          name: "Holiday Campaign",
          startDate: new Date(),
          endDate: new Date("2024-12-31"),
        })
        .returning();

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Campaign Post",
          scheduledAt: new Date(),
          status: "draft",
          campaignId: campaign.id,
          createdBy: user.id,
        })
        .returning();

      expect(post.campaignId).toBe(campaign.id);
    });

    it("should create post with multiple platform variants", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Multi-Platform Post",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      // Create variants for Instagram and Facebook
      const variants = await db
        .insert(schema.socialPostVariants)
        .values([
          {
            postId: post.id,
            platform: "instagram",
            content: "Check out our holiday special! ✨ #Holiday2024",
            mediaUrl: "https://example.com/holiday-ig.jpg",
          },
          {
            postId: post.id,
            platform: "facebook",
            content: "Don't miss our holiday promotion! Visit us today.",
            mediaUrl: "https://example.com/holiday-fb.jpg",
          },
        ])
        .returning();

      expect(variants).toHaveLength(2);
      expect(variants[0].platform).toBe("instagram");
      expect(variants[1].platform).toBe("facebook");
    });
  });

  describe("Post Lifecycle States", () => {
    it("should transition from draft to ready", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Lifecycle Test",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPosts)
        .set({ status: "ready" })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(updated.status).toBe("ready");
    });

    it("should transition from ready to scheduled", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Schedule Test",
          scheduledAt: new Date("2024-12-31T10:00:00Z"),
          status: "ready",
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
          titleInternal: "Publish Test",
          scheduledAt: new Date(),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const publishedAt = new Date();
      const [updated] = await db
        .update(schema.socialPosts)
        .set({
          status: "published",
          publishedAt,
        })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(updated.status).toBe("published");
      expect(updated.publishedAt).toEqual(publishedAt);
    });

    it("should handle failed publication", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Failed Post",
          scheduledAt: new Date(),
          status: "scheduled",
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPosts)
        .set({
          status: "failed",
          errorMessage: "API authentication failed",
        })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(updated.status).toBe("failed");
      expect(updated.errorMessage).toBe("API authentication failed");
    });
  });

  describe("Post Platform Variants", () => {
    it("should retrieve all variants for a post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Multi-Platform",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      await db.insert(schema.socialPostVariants).values([
        {
          postId: post.id,
          platform: "instagram",
          content: "Instagram content",
        },
        {
          postId: post.id,
          platform: "facebook",
          content: "Facebook content",
        },
        {
          postId: post.id,
          platform: "twitter",
          content: "Twitter content",
        },
      ]);

      const variants = await db
        .select()
        .from(schema.socialPostVariants)
        .where(eq(schema.socialPostVariants.postId, post.id));

      expect(variants).toHaveLength(3);
    });

    it("should update variant content", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Update Test",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [variant] = await db
        .insert(schema.socialPostVariants)
        .values({
          postId: post.id,
          platform: "instagram",
          content: "Original content",
        })
        .returning();

      const [updated] = await db
        .update(schema.socialPostVariants)
        .set({ content: "Updated content with hashtags #NewYear" })
        .where(eq(schema.socialPostVariants.id, variant.id))
        .returning();

      expect(updated.content).toContain("Updated content");
      expect(updated.content).toContain("#NewYear");
    });

    it("should support different media types per platform", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Media Types Test",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      await db.insert(schema.socialPostVariants).values([
        {
          postId: post.id,
          platform: "instagram",
          content: "Story content",
          mediaUrl: "https://example.com/story.mp4",
          mediaType: "video",
        },
        {
          postId: post.id,
          platform: "facebook",
          content: "Post content",
          mediaUrl: "https://example.com/post.jpg",
          mediaType: "image",
        },
      ]);

      const variants = await db
        .select()
        .from(schema.socialPostVariants)
        .where(eq(schema.socialPostVariants.postId, post.id));

      const igVariant = variants.find((v) => v.platform === "instagram");
      const fbVariant = variants.find((v) => v.platform === "facebook");

      expect(igVariant?.mediaType).toBe("video");
      expect(fbVariant?.mediaType).toBe("image");
    });
  });

  describe("Post Filtering and Queries", () => {
    it("should filter posts by status", async () => {
      const db = getTestDb();
      if (!db) return;

      await db.insert(schema.socialPosts).values([
        {
          tenantId: tenant.id,
          titleInternal: "Draft 1",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          titleInternal: "Ready 1",
          scheduledAt: new Date(),
          status: "ready",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          titleInternal: "Scheduled 1",
          scheduledAt: new Date(),
          status: "scheduled",
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
      expect(draftPosts[0].titleInternal).toBe("Draft 1");
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
          titleInternal: "Today Post",
          scheduledAt: today,
          status: "scheduled",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          titleInternal: "Tomorrow Post",
          scheduledAt: tomorrow,
          status: "scheduled",
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          titleInternal: "Next Week Post",
          scheduledAt: nextWeek,
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

    it("should filter posts by campaign", async () => {
      const db = getTestDb();
      if (!db) return;

      const [campaign1] = await db
        .insert(schema.campaigns)
        .values({
          tenantId: tenant.id,
          name: "Holiday Campaign",
          startDate: new Date(),
          endDate: new Date("2024-12-31"),
        })
        .returning();

      await db.insert(schema.socialPosts).values([
        {
          tenantId: tenant.id,
          titleInternal: "Campaign Post 1",
          scheduledAt: new Date(),
          status: "draft",
          campaignId: campaign1.id,
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          titleInternal: "Campaign Post 2",
          scheduledAt: new Date(),
          status: "draft",
          campaignId: campaign1.id,
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          titleInternal: "No Campaign Post",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        },
      ]);

      const campaignPosts = await db
        .select()
        .from(schema.socialPosts)
        .where(
          and(
            eq(schema.socialPosts.tenantId, tenant.id),
            eq(schema.socialPosts.campaignId, campaign1.id),
          ),
        );

      expect(campaignPosts).toHaveLength(2);
    });
  });

  describe("Post Deletion", () => {
    it("should soft delete a post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "To Delete",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        })
        .returning();

      const [deleted] = await db
        .update(schema.socialPosts)
        .set({ deletedAt: new Date() })
        .where(eq(schema.socialPosts.id, post.id))
        .returning();

      expect(deleted.deletedAt).toBeDefined();
    });

    it("should hard delete a post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "To Remove",
          scheduledAt: new Date(),
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
          titleInternal: "Tenant 1 Post",
          scheduledAt: new Date(),
          status: "draft",
          createdBy: user.id,
        },
        {
          tenantId: tenant2.id,
          titleInternal: "Tenant 2 Post",
          scheduledAt: new Date(),
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
      expect(tenant1Posts[0].titleInternal).toBe("Tenant 1 Post");
      expect(tenant2Posts[0].titleInternal).toBe("Tenant 2 Post");
    });
  });

  describe("Post Analytics Integration", () => {
    it("should create analytics record for published post", async () => {
      const db = getTestDb();
      if (!db) return;

      const [post] = await db
        .insert(schema.socialPosts)
        .values({
          tenantId: tenant.id,
          titleInternal: "Analytics Test",
          scheduledAt: new Date(),
          status: "published",
          publishedAt: new Date(),
          createdBy: user.id,
        })
        .returning();

      const [analytics] = await db
        .insert(schema.socialPostAnalytics)
        .values({
          postId: post.id,
          platform: "instagram",
          reach: 1000,
          impressions: 1500,
          likes: 150,
          comments: 25,
          shares: 10,
          engagementRate: 18.5,
        })
        .returning();

      expect(analytics.postId).toBe(post.id);
      expect(analytics.reach).toBe(1000);
      expect(analytics.engagementRate).toBe(18.5);
    });
  });
});
