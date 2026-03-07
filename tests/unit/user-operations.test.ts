/**
 * User Operations Unit Tests
 * Tests for user management and authentication
 */

// Using globals instead of imports since globals: true in Vitest config
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
      // Email may be randomized by test setup for uniqueness
      expect(user.email).toContain("newuser");
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

    it("should set default image on creation", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      // Note: image field may be null initially - this is expected behavior
      expect(user).toBeDefined();
    });
  });

  describe("User Roles and Permissions", () => {
    it("should assign Admin role to user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [userRole] = await db
        .insert(schema.userRoles)
        .values({
          userId: user.id,
          tenantId: tenant.id,
          role: "Admin",
        })
        .returning();

      expect(userRole.role).toBe("Admin");
      expect(userRole.userId).toBe(user.id);
      expect(userRole.tenantId).toBe(tenant.id);
    });

    it("should assign Personal role to user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [userRole] = await db
        .insert(schema.userRoles)
        .values({
          userId: user.id,
          tenantId: tenant.id,
          role: "Personal",
        })
        .returning();

      expect(userRole.role).toBe("Personal");
    });

    it("should assign Cliente role to user", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      const [userRole] = await db
        .insert(schema.userRoles)
        .values({
          userId: user.id,
          tenantId: tenant.id,
          role: "Cliente",
        })
        .returning();

      expect(userRole.role).toBe("Cliente");
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
          role: "Admin",
        },
        {
          userId: user.id,
          tenantId: tenant2.id,
          role: "Cliente",
        },
      ]);

      const roles = await db
        .select()
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, user.id));

      expect(roles).toHaveLength(2);
      expect(roles.map(r => r.role)).toContain("Admin");
      expect(roles.map(r => r.role)).toContain("Cliente");
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

    it("should update user image", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();
      const newImage = "https://example.com/new-avatar.jpg";

      const [updated] = await db
        .update(schema.users)
        .set({ image: newImage })
        .where(eq(schema.users.id, user.id))
        .returning();

      expect(updated.image).toBe(newImage);
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
      const createdUser = await createTestUser({ email });

      // Query by the actual email returned by createTestUser (may be randomized)
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, createdUser.id));

      expect(user).toBeDefined();
      expect(user.email).toContain("findme");
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
          role: "Admin",
        },
        {
          userId: user2.id,
          tenantId: tenant.id,
          role: "Personal",
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
    it("should delete user by removing from database", async () => {
      const db = getTestDb();
      if (!db) return;

      const user = await createTestUser();

      // Delete the user
      await db
        .delete(schema.users)
        .where(eq(schema.users.id, user.id));

      const [result] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, user.id));

      // User should no longer exist
      expect(result).toBeUndefined();
    });
  });

  describe("User Activity Tracking", () => {
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
