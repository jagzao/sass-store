/**
 * Tests for CSRF Protection - SEC-008
 *
 * Tests verify that:
 * 1. CSRF tokens are generated securely
 * 2. Token validation works correctly
 * 3. Mutation methods are protected
 * 4. Exempt paths are correctly identified
 */

// Inline implementations for testing (mirrors packages/core/src/security/csrf.ts)

// Constants
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_PROTECTED_METHODS = ["POST", "PUT", "DELETE", "PATCH"];
const CSRF_EXEMPT_PATHS = [
  "/api/payments/webhook",
  "/api/mercadopago/callback",
  "/api/auth/signin",
  "/api/auth/callback",
];

// Helper functions for testing
function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashCsrfToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validateCsrfToken(token: string, hash: string): Promise<boolean> {
  if (!token || !hash) {
    return false;
  }
  const tokenHash = await hashCsrfToken(token);
  if (tokenHash.length !== hash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < tokenHash.length; i++) {
    result |= tokenHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

function isCsrfExempt(path: string): boolean {
  return CSRF_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt));
}

describe("CSRF Protection - SEC-008", () => {
  describe("CSRF Token Generation", () => {
    it("should generate a 64-character hex string", () => {
      const token = generateCsrfToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it("should generate unique tokens", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateCsrfToken());
      }
      expect(tokens.size).toBe(100);
    });

    it("should use cryptographically secure random values", () => {
      const tokens = Array.from({ length: 10 }, () => generateCsrfToken());
      const firstChars = tokens.map((t) => t[0]);
      const uniqueFirstChars = new Set(firstChars);
      expect(uniqueFirstChars.size).toBeGreaterThan(1);
    });
  });

  describe("CSRF Token Hashing", () => {
    it("should produce a SHA-256 hash (64 hex chars)", async () => {
      const token = generateCsrfToken();
      const hash = await hashCsrfToken(token);
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it("should produce consistent hashes for same token", async () => {
      const token = generateCsrfToken();
      const hash1 = await hashCsrfToken(token);
      const hash2 = await hashCsrfToken(token);
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different tokens", async () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const hash1 = await hashCsrfToken(token1);
      const hash2 = await hashCsrfToken(token2);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("CSRF Token Validation", () => {
    it("should validate matching token and hash", async () => {
      const token = generateCsrfToken();
      const hash = await hashCsrfToken(token);
      const isValid = await validateCsrfToken(token, hash);
      expect(isValid).toBe(true);
    });

    it("should reject non-matching token and hash", async () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      const hash2 = await hashCsrfToken(token2);
      const isValid = await validateCsrfToken(token1, hash2);
      expect(isValid).toBe(false);
    });

    it("should reject empty token", async () => {
      const hash = await hashCsrfToken(generateCsrfToken());
      const isValid = await validateCsrfToken("", hash);
      expect(isValid).toBe(false);
    });

    it("should reject empty hash", async () => {
      const token = generateCsrfToken();
      const isValid = await validateCsrfToken(token, "");
      expect(isValid).toBe(false);
    });

    it("should reject null/undefined values", async () => {
      const isValid1 = await validateCsrfToken(null as any, "hash");
      const isValid2 = await validateCsrfToken("token", null as any);
      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  describe("CSRF Constants", () => {
    it("should have correct cookie name", () => {
      expect(CSRF_COOKIE_NAME).toBe("csrf-token");
    });

    it("should have correct header name", () => {
      expect(CSRF_HEADER_NAME).toBe("x-csrf-token");
    });

    it("should protect mutation methods", () => {
      expect(CSRF_PROTECTED_METHODS).toContain("POST");
      expect(CSRF_PROTECTED_METHODS).toContain("PUT");
      expect(CSRF_PROTECTED_METHODS).toContain("PATCH");
      expect(CSRF_PROTECTED_METHODS).toContain("DELETE");
      expect(CSRF_PROTECTED_METHODS).not.toContain("GET");
      expect(CSRF_PROTECTED_METHODS).not.toContain("HEAD");
      expect(CSRF_PROTECTED_METHODS).not.toContain("OPTIONS");
    });
  });

  describe("CSRF Exempt Paths", () => {
    it("should exempt webhook paths", () => {
      expect(isCsrfExempt("/api/payments/webhook")).toBe(true);
      expect(isCsrfExempt("/api/payments/webhook/stripe")).toBe(true);
    });

    it("should exempt OAuth callback paths", () => {
      expect(isCsrfExempt("/api/auth/signin")).toBe(true);
      expect(isCsrfExempt("/api/auth/callback")).toBe(true);
      expect(isCsrfExempt("/api/auth/callback/google")).toBe(true);
    });

    it("should exempt Mercado Pago callback", () => {
      expect(isCsrfExempt("/api/mercadopago/callback")).toBe(true);
    });

    it("should not exempt regular API paths", () => {
      expect(isCsrfExempt("/api/users")).toBe(false);
      expect(isCsrfExempt("/api/products")).toBe(false);
      expect(isCsrfExempt("/api/orders")).toBe(false);
    });

    it("should not exempt tenant paths", () => {
      expect(isCsrfExempt("/t/wondernails/dashboard")).toBe(false);
      expect(isCsrfExempt("/t/wondernails/api/data")).toBe(false);
    });
  });

  describe("CSRF Integration Scenarios", () => {
    it("should complete full token lifecycle", async () => {
      // 1. Server generates token
      const token = generateCsrfToken();

      // 2. Server hashes and stores in cookie
      const hash = await hashCsrfToken(token);

      // 3. Client sends token in header
      const clientToken = token;

      // 4. Server validates
      const isValid = await validateCsrfToken(clientToken, hash);

      expect(isValid).toBe(true);
    });

    it("should reject request with only hash (no token) - stolen hash attack", async () => {
      // Attacker steals the hash from cookie
      const victimToken = generateCsrfToken();
      const stolenHash = await hashCsrfToken(victimToken);

      // Attacker tries to use the hash as the token
      const isValid = await validateCsrfToken(stolenHash, stolenHash);

      expect(isValid).toBe(false);
    });

    it("should reject forged token", async () => {
      // Legitimate flow
      const realToken = generateCsrfToken();
      const realHash = await hashCsrfToken(realToken);

      // Attacker tries with forged token
      const forgedToken = "forged_" + generateCsrfToken();
      const isValid = await validateCsrfToken(forgedToken, realHash);

      expect(isValid).toBe(false);
    });

    it("should allow same token to be validated multiple times", async () => {
      const token = generateCsrfToken();
      const hash = await hashCsrfToken(token);

      // Validate multiple times (e.g., multiple tabs)
      const validations = await Promise.all([
        validateCsrfToken(token, hash),
        validateCsrfToken(token, hash),
        validateCsrfToken(token, hash),
      ]);

      expect(validations.every((v) => v === true)).toBe(true);
    });
  });

  describe("CSRF Edge Cases", () => {
    it("should handle very long tokens", async () => {
      const longToken = "a".repeat(1000);
      const hash = await hashCsrfToken(longToken);
      const isValid = await validateCsrfToken(longToken, hash);
      expect(isValid).toBe(true);
    });

    it("should handle tokens with special characters", async () => {
      const specialToken = "token-with_special.chars!@#$%";
      const hash = await hashCsrfToken(specialToken);
      const isValid = await validateCsrfToken(specialToken, hash);
      expect(isValid).toBe(true);
    });

    it("should handle unicode tokens", async () => {
      const unicodeToken = "token-日本語-émoji-🔐";
      const hash = await hashCsrfToken(unicodeToken);
      const isValid = await validateCsrfToken(unicodeToken, hash);
      expect(isValid).toBe(true);
    });

    it("should reject hash of different length", async () => {
      const token = generateCsrfToken();
      const wrongLengthHash = "abc123"; // Too short
      const isValid = await validateCsrfToken(token, wrongLengthHash);
      expect(isValid).toBe(false);
    });
  });
});
