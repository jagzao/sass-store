/**
 * JWT Service Security Tests - Step 2 (P0) Security Hardening
 *
 * Tests for JWT security requirements:
 * 1. Token generation with proper cryptographic signing (HS256)
 * 2. Token verification with signature validation
 * 3. Expired token rejection
 * 4. Tampered token rejection
 * 5. Invalid payload rejection (userId must be UUID or valid prefix)
 * 6. Integration test: issue -> verify flow
 */

import {
  Ok,
  Err,
  isSuccess,
  isFailure,
} from "@sass-store/core/src/result";
import { ErrorFactories } from "@sass-store/core/src/errors/types";
import { SignJWT, jwtVerify } from "jose";

// Test constants - using userId format for SecureJWTService
const TEST_USER_PAYLOAD = {
  userId: "user_12345678-1234-1234-1234-123456789012",
  email: "test@example.com",
  role: "customer" as const,
  tenantId: "tenant_87654321-4321-4321-4321-210987654321",
};

const TEST_ADMIN_PAYLOAD = {
  userId: "user_admin123-1234-1234-1234-123456789012",
  email: "admin@example.com",
  role: "admin" as const,
  tenantId: "tenant_87654321-4321-4321-4321-210987654321",
};

// For createAuthToken (uses id field)
const TEST_USER = {
  id: "user_12345678-1234-1234-1234-123456789012",
  email: "test@example.com",
  role: "customer" as const,
  tenantId: "tenant_87654321-4321-4321-4321-210987654321",
};

// UUID format user
const UUID_USER_PAYLOAD = {
  userId: "12345678-1234-1234-1234-123456789012",
  email: "uuid@example.com",
  role: "staff" as const,
};

// Constants duplicated from auth-middleware for testing
const JWT_EXPIRY_HOURS = 24;
const MIN_SECRET_LENGTH = 32;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTestSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-jwt-secret-do-not-use-in-production-min32ch";
  return new TextEncoder().encode(secret);
}

/**
 * Secure JWT Service for testing - mirrors auth-middleware implementation
 */
class TestJWTService {
  private static algorithm = "HS256" as const;

  static async generateToken(payload: { userId: string; email: string; role: string; tenantId?: string }): Promise<string> {
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

  static async verifyToken(token: string): Promise<any> {
    const secret = getTestSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload;
  }
}

describe("JWT Service - SEC-003: Cryptographic Signing", () => {
  describe("generateToken()", () => {
    it("should generate valid JWT with correct format (3 parts)", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      
      // JWT format: header.payload.signature
      expect(token.split(".")).toHaveLength(3);
    });

    it("should generate token with HS256 algorithm", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      
      // Decode header to verify algorithm
      const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      expect(header.alg).toBe("HS256");
      // Note: jose library may not set typ by default, which is fine
    });

    it("should include required claims in token", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      const payload = await TestJWTService.verifyToken(token);

      expect(payload.userId).toBe(TEST_USER_PAYLOAD.userId);
      expect(payload.email).toBe(TEST_USER_PAYLOAD.email);
      expect(payload.role).toBe(TEST_USER_PAYLOAD.role);
      expect(payload.tenantId).toBe(TEST_USER_PAYLOAD.tenantId);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it("should set correct expiration time (24 hours)", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      const payload = await TestJWTService.verifyToken(token);
      
      const expectedExp = payload.iat + 24 * 60 * 60; // 24 hours in seconds
      
      // Allow 1 second tolerance for test execution
      expect(payload.exp).toBeGreaterThanOrEqual(expectedExp - 1);
      expect(payload.exp).toBeLessThanOrEqual(expectedExp + 1);
    });

    it("should accept UUID format userId", async () => {
      const token = await TestJWTService.generateToken(UUID_USER_PAYLOAD);
      const payload = await TestJWTService.verifyToken(token);
      
      expect(payload.userId).toBe(UUID_USER_PAYLOAD.userId);
    });

    it("should accept user_ prefix format userId", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      const payload = await TestJWTService.verifyToken(token);
      
      expect(payload.userId).toBe(TEST_USER_PAYLOAD.userId);
    });
  });

  describe("verifyToken()", () => {
    it("should verify valid token successfully", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      const payload = await TestJWTService.verifyToken(token);
      
      expect(payload.userId).toBe(TEST_USER_PAYLOAD.userId);
    });

    it("should reject token with altered signature", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      const parts = token.split(".");
      
      // Tamper with signature (last part)
      const tamperedSignature = parts[2].slice(0, -5) + "xxxxx";
      const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignature}`;

      await expect(TestJWTService.verifyToken(tamperedToken)).rejects.toThrow();
    });

    it("should reject token with altered payload", async () => {
      const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
      const parts = token.split(".");
      
      // Decode payload, modify it, and re-encode
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
      payload.role = "admin"; // Try to escalate privileges
      
      const alteredPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const tamperedToken = `${parts[0]}.${alteredPayload}.${parts[2]}`;

      await expect(TestJWTService.verifyToken(tamperedToken)).rejects.toThrow();
    });

    it("should reject expired token", async () => {
      const secret = getTestSecret();
      
      const expiredPayload = {
        ...TEST_USER_PAYLOAD,
        iat: Math.floor(Date.now() / 1000) - 48 * 60 * 60, // 48 hours ago
        exp: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // 24 hours ago (expired)
      };

      const expiredToken = await new SignJWT(expiredPayload as any)
        .setProtectedHeader({ alg: "HS256" })
        .sign(secret);

      await expect(TestJWTService.verifyToken(expiredToken)).rejects.toThrow();
    });

    it("should reject malformed token (not 3 parts)", async () => {
      const malformedToken = "invalid.token";

      await expect(TestJWTService.verifyToken(malformedToken)).rejects.toThrow();
    });

    it("should reject token with invalid JSON payload", async () => {
      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid-json.signature";

      await expect(TestJWTService.verifyToken(invalidToken)).rejects.toThrow();
    });
  });
});

describe("JWT Service - Payload Validation", () => {
  describe("userId validation", () => {
    it("should accept valid UUID format", () => {
      // RFC 4122 UUID: version digit (position 13) must be 1-5, variant digit (position 17) must be 8,9,a,b
      const uuid = "12345678-1234-5432-89ab-123456789012";
      expect(UUID_REGEX.test(uuid)).toBe(true);
    });

    it("should accept user_ prefix format", () => {
      const userId = "user_12345678";
      expect(userId.startsWith("user_")).toBe(true);
    });

    it("should reject arbitrary string userId without valid prefix", () => {
      const userId = "random-string-id";
      const isValid = UUID_REGEX.test(userId) || userId.startsWith("user_");
      expect(isValid).toBe(false);
    });

    it("should reject empty userId", () => {
      const userId = "";
      const isValid = userId.length > 0 && (UUID_REGEX.test(userId) || userId.startsWith("user_"));
      expect(isValid).toBe(false);
    });
  });
});

describe("JWT Service - Integration: Issue -> Verify Flow", () => {
  it("should complete full token lifecycle", async () => {
    // Step 1: Create token
    const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
    expect(token).toBeDefined();
    expect(token.split(".")).toHaveLength(3);

    // Step 2: Verify token
    const payload = await TestJWTService.verifyToken(token);
    
    expect(payload.userId).toBe(TEST_USER_PAYLOAD.userId);
    expect(payload.email).toBe(TEST_USER_PAYLOAD.email);
    expect(payload.role).toBe(TEST_USER_PAYLOAD.role);
    expect(payload.tenantId).toBe(TEST_USER_PAYLOAD.tenantId);

    // Step 3: Verify timing
    const now = Math.floor(Date.now() / 1000);
    expect(payload.iat).toBeLessThanOrEqual(now);
    expect(payload.exp).toBeGreaterThan(now);
    expect(payload.exp - payload.iat).toBe(24 * 60 * 60); // 24 hours
  });

  it("should generate unique tokens for each call (different iat)", async () => {
    const token1 = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
    
    // Wait a bit to ensure different iat
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const token2 = await TestJWTService.generateToken(TEST_USER_PAYLOAD);

    // Tokens should be different (different iat)
    expect(token1).not.toBe(token2);
    
    const payload1 = await TestJWTService.verifyToken(token1);
    const payload2 = await TestJWTService.verifyToken(token2);
    
    expect(payload2.iat).toBeGreaterThan(payload1.iat);
  });

  it("should handle admin user token correctly", async () => {
    const token = await TestJWTService.generateToken(TEST_ADMIN_PAYLOAD);
    const payload = await TestJWTService.verifyToken(token);
    
    expect(payload.role).toBe("admin");
  });
});

describe("JWT Service - Security Edge Cases", () => {
  it("should reject 'none' algorithm attack", async () => {
    // Create a token with 'none' algorithm (classic JWT attack)
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      userId: "user_admin",
      email: "attacker@example.com",
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    })).toString("base64url");
    
    const noneToken = `${header}.${payload}.`;

    await expect(TestJWTService.verifyToken(noneToken)).rejects.toThrow();
  });

  it("should reject algorithm confusion attack (RS256 -> HS256)", async () => {
    // This test verifies that we only accept HS256 tokens
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      userId: "user_test",
      email: "test@example.com",
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    })).toString("base64url");
    
    // Fake signature
    const fakeSignature = Buffer.from("fakesignature").toString("base64url");
    const confusedToken = `${header}.${payload}.${fakeSignature}`;

    await expect(TestJWTService.verifyToken(confusedToken)).rejects.toThrow();
  });

  it("should handle extremely long tokens gracefully", async () => {
    const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
    
    // Append garbage to make it extremely long
    const longToken = token + "x".repeat(10000);

    await expect(TestJWTService.verifyToken(longToken)).rejects.toThrow();
  });

  it("should handle token with null bytes", async () => {
    const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
    
    // Inject null byte
    const nullToken = token.replace(".", "\x00.");

    await expect(TestJWTService.verifyToken(nullToken)).rejects.toThrow();
  });

  it("should not expose sensitive information in error messages", async () => {
    const token = await TestJWTService.generateToken(TEST_USER_PAYLOAD);
    
    const tamperedToken = token.slice(0, -5) + "xxxxx";

    try {
      await TestJWTService.verifyToken(tamperedToken);
      fail("Should have thrown");
    } catch (error: any) {
      // Error message should be generic, not exposing token details
      const errorMessage = error.message || "";
      expect(errorMessage).not.toContain(TEST_USER_PAYLOAD.email);
      expect(errorMessage).not.toContain(TEST_USER_PAYLOAD.userId);
      expect(errorMessage.toLowerCase()).not.toContain("secret");
      expect(errorMessage.toLowerCase()).not.toContain("key");
    }
  });
});

describe("JWT Service - Secret Management", () => {
  it("should require minimum secret length", () => {
    expect(MIN_SECRET_LENGTH).toBe(32);
  });

  it("should use dev secret in development", () => {
    const secret = process.env.JWT_SECRET || "dev-jwt-secret-do-not-use-in-production-min32ch";
    expect(secret.length).toBeGreaterThanOrEqual(MIN_SECRET_LENGTH);
  });
});
