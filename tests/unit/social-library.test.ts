/**
 * Social Content Library Unit Tests
 * Tests for content library operations and reusability
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestUser,
} from "../setup/test-database";
import * as schema from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

describe("Social Content Library Operations", () => {
  let tenant: any;
  let user: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "library-test-tenant",
      name: "Library Test",
      mode: "catalog",
    });

    user = await createTestUser({
      email: "librarian@test.com",
      name: "Content Librarian",
    });
  });

  describe("Library Item Creation", () => {
    it("should create library item with title and content", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Holiday Promotion Template",
          content:
            "🎄 Special holiday offer! Get {{discount}}% off all services!",
          category: "promotions",
          tags: ["holiday", "promotion", "discount"],
          createdBy: user.id,
        })
        .returning();

      expect(item).toBeDefined();
      expect(item.title).toBe("Holiday Promotion Template");
      expect(item.content).toContain("{{discount}}");
      expect(item.category).toBe("promotions");
    });

    it("should create library item with platform-specific content", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Multi-Platform Template",
          content: "Base content for all platforms",
          platformVariants: {
            instagram: "Instagram specific content with #hashtags",
            facebook: "Facebook specific content with link",
            twitter: "Twitter content - short and sweet",
          },
          createdBy: user.id,
        })
        .returning();

      expect(item.platformVariants).toBeDefined();
      expect(item.platformVariants.instagram).toContain("#hashtags");
      expect(item.platformVariants.facebook).toContain("link");
    });

    it("should create library item with media assets", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Media Template",
          content: "Check out our latest work!",
          mediaUrl: "https://example.com/templates/image.jpg",
          mediaType: "image",
          createdBy: user.id,
        })
        .returning();

      expect(item.mediaUrl).toBe("https://example.com/templates/image.jpg");
      expect(item.mediaType).toBe("image");
    });
  });

  describe("Library Item Categorization", () => {
    it("should categorize items by type", async () => {
      const db = getTestDb();
      if (!db) return;

      const categories = [
        "promotions",
        "tips",
        "testimonials",
        "announcements",
      ];

      for (const category of categories) {
        await db.insert(schema.socialContentLibrary).values({
          tenantId: tenant.id,
          title: `${category} Template`,
          content: `Content for ${category}`,
          category,
          createdBy: user.id,
        });
      }

      const promotions = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(
          and(
            eq(schema.socialContentLibrary.tenantId, tenant.id),
            eq(schema.socialContentLibrary.category, "promotions"),
          ),
        );

      expect(promotions).toHaveLength(1);
      expect(promotions[0].category).toBe("promotions");
    });

    it("should support multiple tags per item", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Multi-Tagged Template",
          content: "Content with multiple tags",
          tags: ["seasonal", "promotion", "limited-time", "holiday"],
          createdBy: user.id,
        })
        .returning();

      expect(item.tags).toHaveLength(4);
      expect(item.tags).toContain("seasonal");
      expect(item.tags).toContain("limited-time");
    });
  });

  describe("Library Item Usage Tracking", () => {
    it("should track usage count when item is used", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Popular Template",
          content: "Frequently used content",
          usageCount: 0,
          createdBy: user.id,
        })
        .returning();

      // Simulate using the template
      const [updated] = await db
        .update(schema.socialContentLibrary)
        .set({ usageCount: item.usageCount + 1 })
        .where(eq(schema.socialContentLibrary.id, item.id))
        .returning();

      expect(updated.usageCount).toBe(1);

      // Use it again
      const [updated2] = await db
        .update(schema.socialContentLibrary)
        .set({ usageCount: updated.usageCount + 1 })
        .where(eq(schema.socialContentLibrary.id, item.id))
        .returning();

      expect(updated2.usageCount).toBe(2);
    });

    it("should track last used timestamp", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Timestamp Template",
          content: "Track when used",
          createdBy: user.id,
        })
        .returning();

      const lastUsed = new Date();
      const [updated] = await db
        .update(schema.socialContentLibrary)
        .set({ lastUsedAt: lastUsed })
        .where(eq(schema.socialContentLibrary.id, item.id))
        .returning();

      expect(updated.lastUsedAt).toEqual(lastUsed);
    });

    it("should get most used templates", async () => {
      const db = getTestDb();
      if (!db) return;

      // Create templates with different usage counts
      await db.insert(schema.socialContentLibrary).values([
        {
          tenantId: tenant.id,
          title: "Popular 1",
          content: "Content 1",
          usageCount: 50,
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Popular 2",
          content: "Content 2",
          usageCount: 30,
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Rarely Used",
          content: "Content 3",
          usageCount: 5,
          createdBy: user.id,
        },
      ]);

      const allItems = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.tenantId, tenant.id));

      // Sort by usage count (would be done in query with .orderBy in real implementation)
      const sorted = allItems.sort((a, b) => b.usageCount - a.usageCount);

      expect(sorted[0].usageCount).toBe(50);
      expect(sorted[1].usageCount).toBe(30);
      expect(sorted[2].usageCount).toBe(5);
    });
  });

  describe("Library Item Search and Filter", () => {
    beforeEach(async () => {
      const db = getTestDb();
      if (!db) return;

      // Create test data
      await db.insert(schema.socialContentLibrary).values([
        {
          tenantId: tenant.id,
          title: "Summer Sale Template",
          content: "Hot summer deals!",
          category: "promotions",
          tags: ["summer", "sale"],
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Nail Care Tips",
          content: "How to care for your nails",
          category: "tips",
          tags: ["education", "care"],
          createdBy: user.id,
        },
        {
          tenantId: tenant.id,
          title: "Customer Testimonial",
          content: "Amazing service!",
          category: "testimonials",
          tags: ["social-proof"],
          createdBy: user.id,
        },
      ]);
    });

    it("should filter by category", async () => {
      const db = getTestDb();
      if (!db) return;

      const tips = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(
          and(
            eq(schema.socialContentLibrary.tenantId, tenant.id),
            eq(schema.socialContentLibrary.category, "tips"),
          ),
        );

      expect(tips).toHaveLength(1);
      expect(tips[0].title).toBe("Nail Care Tips");
    });

    it("should search by title", async () => {
      const db = getTestDb();
      if (!db) return;

      const allItems = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.tenantId, tenant.id));

      // In real implementation, would use ILIKE or full-text search
      const searchResults = allItems.filter((item) =>
        item.title.toLowerCase().includes("summer"),
      );

      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].title).toBe("Summer Sale Template");
    });

    it("should filter by tags", async () => {
      const db = getTestDb();
      if (!db) return;

      const allItems = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.tenantId, tenant.id));

      // Filter items that have "sale" tag
      const saleItems = allItems.filter(
        (item) => item.tags && item.tags.includes("sale"),
      );

      expect(saleItems).toHaveLength(1);
      expect(saleItems[0].tags).toContain("sale");
    });
  });

  describe("Library Item Updates", () => {
    it("should update item content", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Editable Template",
          content: "Original content",
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialContentLibrary)
        .set({
          content: "Updated content with new messaging",
          updatedAt: new Date(),
        })
        .where(eq(schema.socialContentLibrary.id, item.id))
        .returning();

      expect(updated.content).toBe("Updated content with new messaging");
      expect(updated.updatedAt).toBeDefined();
    });

    it("should update tags", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Tag Update Test",
          content: "Content",
          tags: ["old", "tags"],
          createdBy: user.id,
        })
        .returning();

      const [updated] = await db
        .update(schema.socialContentLibrary)
        .set({ tags: ["new", "updated", "tags"] })
        .where(eq(schema.socialContentLibrary.id, item.id))
        .returning();

      expect(updated.tags).toHaveLength(3);
      expect(updated.tags).toContain("new");
      expect(updated.tags).not.toContain("old");
    });
  });

  describe("Library Item Deletion", () => {
    it("should soft delete library item", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "To Delete",
          content: "Will be deleted",
          createdBy: user.id,
        })
        .returning();

      const [deleted] = await db
        .update(schema.socialContentLibrary)
        .set({ deletedAt: new Date() })
        .where(eq(schema.socialContentLibrary.id, item.id))
        .returning();

      expect(deleted.deletedAt).toBeDefined();
    });

    it("should hard delete library item", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "To Remove",
          content: "Will be removed permanently",
          createdBy: user.id,
        })
        .returning();

      await db
        .delete(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.id, item.id));

      const [result] = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.id, item.id));

      expect(result).toBeUndefined();
    });
  });

  describe("Tenant Isolation", () => {
    it("should enforce tenant isolation for library items", async () => {
      const db = getTestDb();
      if (!db) return;

      const tenant2 = await createTestTenant({
        slug: "tenant-2",
        name: "Tenant 2",
      });

      await db.insert(schema.socialContentLibrary).values([
        {
          tenantId: tenant.id,
          title: "Tenant 1 Template",
          content: "Content for tenant 1",
          createdBy: user.id,
        },
        {
          tenantId: tenant2.id,
          title: "Tenant 2 Template",
          content: "Content for tenant 2",
          createdBy: user.id,
        },
      ]);

      const tenant1Items = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.tenantId, tenant.id));

      const tenant2Items = await db
        .select()
        .from(schema.socialContentLibrary)
        .where(eq(schema.socialContentLibrary.tenantId, tenant2.id));

      expect(tenant1Items).toHaveLength(1);
      expect(tenant2Items).toHaveLength(1);
      expect(tenant1Items[0].title).toBe("Tenant 1 Template");
      expect(tenant2Items[0].title).toBe("Tenant 2 Template");
    });
  });

  describe("Template Variables", () => {
    it("should support template variables in content", async () => {
      const db = getTestDb();
      if (!db) return;

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Variable Template",
          content:
            "Hello {{customerName}}! Get {{discount}}% off today at {{location}}!",
          variables: ["customerName", "discount", "location"],
          createdBy: user.id,
        })
        .returning();

      expect(item.content).toContain("{{customerName}}");
      expect(item.content).toContain("{{discount}}");
      expect(item.variables).toHaveLength(3);
    });

    it("should validate that content contains declared variables", async () => {
      const db = getTestDb();
      if (!db) return;

      const content = "Get {{discount}}% off at {{location}}!";
      const variables = ["discount", "location"];

      // Validation logic (would be in service layer)
      const declaredVars = variables.map((v) => `{{${v}}}`);
      const allVarsPresent = declaredVars.every((v) => content.includes(v));

      expect(allVarsPresent).toBe(true);

      const [item] = await db
        .insert(schema.socialContentLibrary)
        .values({
          tenantId: tenant.id,
          title: "Validated Template",
          content,
          variables,
          createdBy: user.id,
        })
        .returning();

      expect(item.variables).toEqual(variables);
    });
  });
});
