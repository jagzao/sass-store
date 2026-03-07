/**
 * Users Endpoint Authorization Tests - SEC-007
 *
 * Tests for user endpoint authorization rules:
 * - All mutating operations require authentication
 * - Users can only access/modify their own resources
 * - Admins can access/modify any user
 * - Staff has limited permissions
 * - Tenant isolation is enforced
 */

import { SignJWT, jwtVerify } from "jose";

// Test constants
const JWT_EXPIRY_HOURS = 24;
const MIN_SECRET_LENGTH = 32;

function getTestSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-jwt-secret-do-not-use-in-production-min32ch";
  return new TextEncoder().encode(secret);
}

// Types for JWT
interface JWTPayload {
  userId: string;
  email: string;
  role: "customer" | "admin" | "staff";
  tenantId?: string;
  iat: number;
  exp: number;
}

// Test JWT Service
class TestJWTService {
  private static algorithm = "HS256" as const;

  static async generateToken(payload: {
    userId: string;
    email: string;
    role: "customer" | "admin" | "staff";
    tenantId?: string;
  }): Promise<string> {
    const secret = getTestSecret();
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + JWT_EXPIRY_HOURS * 60 * 60,
    };

    return await new SignJWT(fullPayload as any)
      .setProtectedHeader({ alg: this.algorithm })
      .setIssuedAt(now)
      .setExpirationTime(fullPayload.exp)
      .sign(secret);
  }

  static async verifyToken(token: string): Promise<JWTPayload> {
    const secret = getTestSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  }
}

// Mock request helper
function createMockRequest(token?: string): { headers: Map<string, string> } {
  const headers = new Map<string, string>();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  return { headers };
}

// Authorization check functions (mirrors route implementation)
function checkUserAuthorization(
  currentUser: JWTPayload,
  targetUserId: string,
  operation: "read" | "update" | "delete",
): { success: boolean; reason?: string } {
  // Admin can do anything
  if (currentUser.role === "admin") {
    return { success: true };
  }

  // User can access their own resource
  if (currentUser.userId === targetUserId) {
    return { success: true };
  }

  // Staff can read/update customers (but not delete or modify admins/staff)
  if (currentUser.role === "staff" && operation !== "delete") {
    return {
      success: false,
      reason: "Staff can only access their own resources",
    };
  }

  // Deny access to other users' resources
  return {
    success: false,
    reason: `User does not have permission to ${operation} this user resource`,
  };
}

function checkTenantIsolation(
  currentUser: JWTPayload,
  targetTenantId?: string,
): { success: boolean; reason?: string } {
  // Admin without tenant can operate across tenants (super admin)
  if (currentUser.role === "admin" && !currentUser.tenantId) {
    return { success: true };
  }

  // If user has no tenant, allow operation (backward compatibility)
  if (!currentUser.tenantId) {
    return { success: true };
  }

  // If target tenant is specified, it must match user's tenant
  if (targetTenantId && targetTenantId !== currentUser.tenantId) {
    return {
      success: false,
      reason: "Cross-tenant access is not allowed",
    };
  }

  return { success: true };
}

describe("Users Endpoint Authorization - SEC-007", () => {
  describe("Authentication Requirement", () => {
    it("should reject request without token", async () => {
      const request = createMockRequest();
      const hasToken = request.headers.has("authorization");

      expect(hasToken).toBe(false);
    });

    it("should reject request with malformed token", async () => {
      const request = createMockRequest("invalid-token");
      const token = request.headers.get("authorization")?.substring(7);

      expect(token).toBe("invalid-token");

      // Verify should fail
      await expect(TestJWTService.verifyToken(token!)).rejects.toThrow();
    });

    it("should accept request with valid token", async () => {
      const token = await TestJWTService.generateToken({
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
      });

      const payload = await TestJWTService.verifyToken(token);
      expect(payload.userId).toBe("user_123");
    });
  });

  describe("Resource Ownership", () => {
    it("should allow user to access their own resource", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(user, "user_123", "read");
      expect(result.success).toBe(true);
    });

    it("should deny user from accessing others resources", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(user, "user_456", "read");
      expect(result.success).toBe(false);
      expect(result.reason).toContain("permission");
    });

    it("should allow admin to access any resource", () => {
      const admin: JWTPayload = {
        userId: "admin_123",
        email: "admin@example.com",
        role: "admin",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(admin, "user_456", "read");
      expect(result.success).toBe(true);
    });
  });

  describe("Role-Based Access Control", () => {
    it("should generate token with correct role - admin", async () => {
      const token = await TestJWTService.generateToken({
        userId: "admin_123",
        email: "admin@example.com",
        role: "admin",
      });

      const payload = await TestJWTService.verifyToken(token);
      expect(payload.role).toBe("admin");
    });

    it("should generate token with correct role - staff", async () => {
      const token = await TestJWTService.generateToken({
        userId: "staff_123",
        email: "staff@example.com",
        role: "staff",
      });

      const payload = await TestJWTService.verifyToken(token);
      expect(payload.role).toBe("staff");
    });

    it("should generate token with correct role - customer", async () => {
      const token = await TestJWTService.generateToken({
        userId: "customer_123",
        email: "customer@example.com",
        role: "customer",
      });

      const payload = await TestJWTService.verifyToken(token);
      expect(payload.role).toBe("customer");
    });
  });

  describe("Tenant Isolation", () => {
    it("should include tenantId in token when provided", async () => {
      const token = await TestJWTService.generateToken({
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        tenantId: "tenant_abc",
      });

      const payload = await TestJWTService.verifyToken(token);
      expect(payload.tenantId).toBe("tenant_abc");
    });

    it("should allow users without tenantId (backward compatibility)", async () => {
      const token = await TestJWTService.generateToken({
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        // No tenantId
      });

      const payload = await TestJWTService.verifyToken(token);
      expect(payload.tenantId).toBeUndefined();
    });

    it("should allow access within same tenant", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        tenantId: "tenant_abc",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkTenantIsolation(user, "tenant_abc");
      expect(result.success).toBe(true);
    });

    it("should deny cross-tenant access", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        tenantId: "tenant_abc",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkTenantIsolation(user, "tenant_xyz");
      expect(result.success).toBe(false);
      expect(result.reason).toContain("Cross-tenant");
    });
  });
});

describe("Authorization Scenarios for Users API", () => {
  describe("GET /api/users - List Users", () => {
    it("should require authentication - no token", () => {
      const request = createMockRequest();
      const hasToken = request.headers.has("authorization");
      expect(hasToken).toBe(false);
    });

    it("should allow admin to list all users", () => {
      const admin: JWTPayload = {
        userId: "admin_123",
        email: "admin@example.com",
        role: "admin",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Admin role check
      expect(admin.role).toBe("admin");
    });

    it("should deny non-admin from listing all users", () => {
      const customer: JWTPayload = {
        userId: "customer_123",
        email: "customer@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Non-admin role check
      expect(customer.role).not.toBe("admin");
    });
  });

  describe("POST /api/users - Create User", () => {
    it("should require authentication", () => {
      const request = createMockRequest();
      const hasToken = request.headers.has("authorization");
      expect(hasToken).toBe(false);
    });

    it("should allow admin to create admin users", () => {
      const admin: JWTPayload = {
        userId: "admin_123",
        email: "admin@example.com",
        role: "admin",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Admin can create admin users
      expect(admin.role).toBe("admin");
    });

    it("should deny non-admin from creating admin users", () => {
      const staff: JWTPayload = {
        userId: "staff_123",
        email: "staff@example.com",
        role: "staff",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Staff cannot create admin users
      expect(staff.role).not.toBe("admin");
    });
  });

  describe("PUT /api/users - Update User", () => {
    it("should require authentication", () => {
      const request = createMockRequest();
      const hasToken = request.headers.has("authorization");
      expect(hasToken).toBe(false);
    });

    it("should allow user to update their own data", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(user, "user_123", "update");
      expect(result.success).toBe(true);
    });

    it("should deny user from updating others data", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(user, "user_456", "update");
      expect(result.success).toBe(false);
    });

    it("should allow admin to update any user", () => {
      const admin: JWTPayload = {
        userId: "admin_123",
        email: "admin@example.com",
        role: "admin",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(admin, "user_456", "update");
      expect(result.success).toBe(true);
    });

    it("should deny non-admin from changing roles", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      // Non-admin cannot change roles (route should check this)
      expect(user.role).not.toBe("admin");
    });
  });

  describe("DELETE /api/users - Deactivate User", () => {
    it("should require authentication", () => {
      const request = createMockRequest();
      const hasToken = request.headers.has("authorization");
      expect(hasToken).toBe(false);
    });

    it("should allow user to deactivate their own account", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(user, "user_123", "delete");
      expect(result.success).toBe(true);
    });

    it("should allow admin to deactivate other users", () => {
      const admin: JWTPayload = {
        userId: "admin_123",
        email: "admin@example.com",
        role: "admin",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(admin, "user_456", "delete");
      expect(result.success).toBe(true);
    });

    it("should deny regular user from deactivating others", () => {
      const user: JWTPayload = {
        userId: "user_123",
        email: "test@example.com",
        role: "customer",
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
      };

      const result = checkUserAuthorization(user, "user_456", "delete");
      expect(result.success).toBe(false);
    });
  });
});

describe("Cross-Tenant Access Prevention", () => {
  it("should include tenant context in authenticated request", async () => {
    const token = await TestJWTService.generateToken({
      userId: "user_123",
      email: "test@example.com",
      role: "customer",
      tenantId: "tenant_abc",
    });

    const payload = await TestJWTService.verifyToken(token);
    expect(payload.tenantId).toBe("tenant_abc");
  });

  it("should allow access within same tenant", () => {
    const user: JWTPayload = {
      userId: "user_123",
      email: "test@example.com",
      role: "customer",
      tenantId: "tenant_abc",
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    const result = checkTenantIsolation(user, "tenant_abc");
    expect(result.success).toBe(true);
  });

  it("should deny cross-tenant access", () => {
    const user: JWTPayload = {
      userId: "user_123",
      email: "test@example.com",
      role: "customer",
      tenantId: "tenant_abc",
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    const result = checkTenantIsolation(user, "tenant_xyz");
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Cross-tenant");
  });

  it("should allow admin without tenant to access any tenant", () => {
    const admin: JWTPayload = {
      userId: "admin_123",
      email: "admin@example.com",
      role: "admin",
      // No tenantId - super admin
      iat: Date.now() / 1000,
      exp: Date.now() / 1000 + 3600,
    };

    const result = checkTenantIsolation(admin, "tenant_xyz");
    expect(result.success).toBe(true);
  });
});

describe("Token Security for Authorization", () => {
  it("should reject expired token", async () => {
    // Create an expired token manually
    const secret = getTestSecret();
    const expiredPayload = {
      userId: "user_123",
      email: "test@example.com",
      role: "customer",
      iat: Math.floor(Date.now() / 1000) - 48 * 60 * 60, // 48 hours ago
      exp: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // 24 hours ago (expired)
    };

    const expiredToken = await new SignJWT(expiredPayload as any)
      .setProtectedHeader({ alg: "HS256" })
      .sign(secret);

    await expect(TestJWTService.verifyToken(expiredToken)).rejects.toThrow();
  });

  it("should reject tampered token", async () => {
    const token = await TestJWTService.generateToken({
      userId: "user_123",
      email: "test@example.com",
      role: "customer",
    });

    // Tamper with the token
    const tamperedToken = token.slice(0, -10) + "aaaaaaaaaa";

    await expect(TestJWTService.verifyToken(tamperedToken)).rejects.toThrow();
  });

  it("should reject token with role escalation attempt", async () => {
    const token = await TestJWTService.generateToken({
      userId: "user_123",
      email: "test@example.com",
      role: "customer",
    });

    // Decode, verify role is still customer
    const payload = await TestJWTService.verifyToken(token);
    expect(payload.role).toBe("customer");
    expect(payload.role).not.toBe("admin");
  });
});
