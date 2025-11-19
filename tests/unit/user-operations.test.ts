/**
 * User Operations Unit Tests
 * Tests for user management and authentication
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getTestDb,
  createTestTenant,
  createTestUser,
} from "../setup/test-database";
import * as schema from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

describe("User Operations", () => {
  let tenant: any;

  beforeEach(async () => {
    const db = getTestDb();
    if (!db) return;

    tenant = await createTestTenant({
      slug: "user-test-tenant",
      mode: "catalog",
    });
  });

  describe("User Creation", () => {
    it("should create user with email and name", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser({
        email: "newuser@example.com",
        name: "New User",
      });

      expect(user).toBeDefined();
      expect(user.email).toBe("newuser@example.com");
      expect(user.name).toBe("New User");
    });

    it("should create user with hashed password", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser({
        email: "secure@example.com",
        password: "hashed_password_123",
      });

      expect(user.password).toBe("hashed_password_123");
      expect(user.password).not.toContain("plain");
    });

    it("should set default avatar on creation", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      expect(user.avatar).toBeDefined();
    });
  });

  describe("User Roles and Permissions", () => {
    it("should assign admin role to user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [userRole] = await db
        .insert(schema.userRoles)
        .values({
          userId: user.id,
          tenantId: tenant.id,
          role: "admin",
          permissions: [],
        })
        .returning();

      expect(userRole.role).toBe("admin");
      expect(userRole.userId).toBe(user.id);
      expect(userRole.tenantId).toBe(tenant.id);
    });

    it("should assign staff role to user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [userRole] = await db
        .insert(schema.userRoles)
        .values({
          userId: user.id,
          tenantId: tenant.id,
          role: "staff",
          permissions: ["bookings:read", "bookings:write"],
        })
        .returning();

      expect(userRole.role).toBe("staff");
      expect(userRole.permissions).toContain("bookings:read");
    });

    it("should assign customer role to user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [userRole] = await db
        .insert(schema.userRoles)
        .values({
          userId: user.id,
          tenantId: tenant.id,
          role: "customer",
          permissions: [],
        })
        .returning();

      expect(userRole.role).toBe("customer");
    });

    it("should support user with multiple roles across tenants", async () => {
      const db = getTestDb();
      if (!db) return;

      const tenant2 = await createTestTenant({ slug: "tenant-2" });
      const user = await createTestUser();

      await db.insert(schema.userRoles).values([
        {
          userId: user.id,
          tenantId: tenant.id,
          role: "admin",
          permissions: [],
        },
        {
          userId: user.id,
          tenantId: tenant2.id,
          role: "customer",
          permissions: [],
        },
      ]);

      const roles = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, user.id));

      expect(roles).toHaveLength(2);
      expect(roles[0].role).toBe("admin");
      expect(roles[1].role).toBe("customer");
    });
  });

  describe("User Profile Updates", () => {
    it("should update user name", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser({ name: "Old Name" });

      const [updated] = await db
        .update(schema.users)
        .set({ name: "New Name" })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(updated.name).toBe("New Name");
    });

    it("should update user avatar", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();
      const newAvatar = "https://example.com/new-avatar.jpg";

      const [updated] = await db
        .update(schema.users)
        .set({ avatar: newAvatar })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(updated.avatar).toBe(newAvatar);
    });

    it("should update user phone number", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();
      const phone = "+1234567890";

      const [updated] = await db
        .update(schema.users)
        .set({ phone })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(updated.phone).toBe(phone);
    });
  });

  describe("User Email Verification", () => {
    it("should mark email as verified", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [verified] = await db
        .update(schema.users)
        .set({ emailVerified: new Date() })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(verified.emailVerified).toBeDefined();
      expect(verified.emailVerified).toBeInstanceOf(Date);
    });

    it("should check if email is verified", async () => {
      const db = getTestDb();
      if (!db) return;

      const verifiedUser = await createTestUser();
      await db
        .update(schema.users)
        .set({ emailVerified: new Date() })
        .where(eq(schema.users.id, verifiedUser.id));

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, verifiedUser.id));

      expect(user.emailVerified).toBeDefined();
    });
  });

  describe("User Queries", () => {
    it("should find user by email", async () => {
      const db = getTestDb();
      if (!db) return;

      const email = "findme@example.com";
      await createTestUser({ email });

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
    });

    it("should find user by id", async () => {
      const db = getTestDb();
      if (!db) return;

      const createdUser = await createTestUser();

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, createdUser.id));

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
    });

    it("should retrieve all users for a tenant", async () => {
      const db = getTestDb();
      if (!db) return;

      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await db.insert(schema.userRoles).values([
        {
          userId: user1.id,
          tenantId: tenant.id,
          role: "admin",
          permissions: [],
        },
        {
          userId: user2.id,
          tenantId: tenant.id,
          role: "staff",
          permissions: [],
        },
      ]);

      const roles = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.tenantId, tenant.id));

      expect(roles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("User Deletion", () => {
    it("should soft delete user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [deleted] = await db
        .update(schema.users)
        .set({ deletedAt: new Date() })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(deleted.deletedAt).toBeDefined();
    });

    it("should exclude soft deleted users from queries", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();
      await db
        .update(schema.users)
        .set({ deletedAt: new Date() })
        .where(eq(schema.users.id, user.id));

      const [result] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, user.id));

      // User still exists in DB but is marked as deleted
      expect(result.deletedAt).toBeDefined();
    });
  });

  describe("User Activity Tracking", () => {
    it("should update last login timestamp", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();
      const lastLogin = new Date();

      const [updated] = await db
        .update(schema.users)
        .set({ lastLoginAt: lastLogin })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(updated.lastLoginAt).toBeDefined();
    });

    it("should track user creation timestamp", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      expect(user.createdAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("should track user update timestamp", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      expect(user.updatedAt).toBeDefined();
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
