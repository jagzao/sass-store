import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  applyRateLimit,
  checkRateLimit,
  clearAllRateLimits,
  RATE_LIMIT_CONFIGS,
  withRateLimit,
} from "../../../packages/core/src/rate-limit";
import { NextResponse } from "next/server";
import { isSuccess, isFailure } from "../../../packages/core/src/result";

// Helper to create mock NextRequest for auth endpoints
function createMockRequest(options: {
  ip?: string;
  tenant?: string;
  userId?: string;
  path?: string;
}): any {
  const headers = new Map<string, string>();

  if (options.ip) {
    headers.set("x-forwarded-for", options.ip);
  }
  if (options.tenant) {
    headers.set("x-tenant", options.tenant);
  }
  if (options.userId) {
    headers.set("x-user-id", options.userId);
  }

  return {
    headers: {
      get: (name: string) => headers.get(name) || null,
    },
    nextUrl: {
      pathname: options.path || "/api/auth/login",
    },
  };
}

describe("Auth Rate Limiting - Integration Tests", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  afterEach(() => {
    clearAllRateLimits();
  });

  describe("Auth Endpoint Rate Limiting", () => {
    it("should return 429 when rate limit exceeded on auth endpoint", async () => {
      const ip = "192.168.100.1";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip, path: "/api/auth/login" });
        const response = await applyRateLimit(request, "auth");
        expect(response).toBeNull(); // Not rate limited
      }

      // Next request should be rate limited
      const request = createMockRequest({ ip, path: "/api/auth/login" });
      const response = await applyRateLimit(request, "auth");

      expect(response).not.toBeNull();
      expect(response?.status).toBe(429);

      const body = await response?.json();
      expect(body.success).toBe(false);
      expect(body.error?.type).toBe("RateLimitError");
    });

    it("should include rate limit headers in 429 response", async () => {
      const ip = "192.168.100.2";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Exhaust limit
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip, path: "/api/auth/login" });
        await applyRateLimit(request, "auth");
      }

      // Get rate limited response
      const request = createMockRequest({ ip, path: "/api/auth/login" });
      const response = await applyRateLimit(request, "auth");

      expect(response?.status).toBe(429);
      expect(response?.headers.get("Retry-After")).not.toBeNull();
      expect(response?.headers.get("X-RateLimit-Limit")).toBe(String(limit));
      expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    });

    it("should allow requests from different IPs independently", async () => {
      const ip1 = "192.168.100.10";
      const ip2 = "192.168.100.11";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Exhaust limit for IP 1
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip: ip1, path: "/api/auth/login" });
        await applyRateLimit(request, "auth");
      }

      // IP 1 should be rate limited
      const request1 = createMockRequest({ ip: ip1, path: "/api/auth/login" });
      const response1 = await applyRateLimit(request1, "auth");
      expect(response1?.status).toBe(429);

      // IP 2 should still be allowed
      const request2 = createMockRequest({ ip: ip2, path: "/api/auth/login" });
      const response2 = await applyRateLimit(request2, "auth");
      expect(response2).toBeNull();
    });

    it("should separate rate limits by tenant", async () => {
      const ip = "192.168.100.20";
      const tenant1 = "tenant-a";
      const tenant2 = "tenant-b";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Exhaust limit for tenant A
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip, tenant: tenant1, path: "/api/auth/login" });
        await applyRateLimit(request, "auth");
      }

      // Tenant A should be rate limited
      const request1 = createMockRequest({ ip, tenant: tenant1, path: "/api/auth/login" });
      const response1 = await applyRateLimit(request1, "auth");
      expect(response1?.status).toBe(429);

      // Tenant B should still be allowed (same IP, different tenant)
      const request2 = createMockRequest({ ip, tenant: tenant2, path: "/api/auth/login" });
      const response2 = await applyRateLimit(request2, "auth");
      expect(response2).toBeNull();
    });
  });

  describe("Registration Endpoint Rate Limiting", () => {
    it("should apply same strict rate limiting to registration", async () => {
      const ip = "192.168.100.30";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip, path: "/api/auth/register" });
        const response = await applyRateLimit(request, "auth");
        expect(response).toBeNull();
      }

      // Next request should be rate limited
      const request = createMockRequest({ ip, path: "/api/auth/register" });
      const response = await applyRateLimit(request, "auth");
      expect(response?.status).toBe(429);
    });
  });

  describe("Non-Critical Endpoints", () => {
    it("should have higher limits for general endpoints", async () => {
      const ip = "192.168.100.40";
      const authLimit = RATE_LIMIT_CONFIGS.auth.maxRequests;
      const generalLimit = RATE_LIMIT_CONFIGS.general.maxRequests;

      // Verify general allows more requests
      expect(generalLimit).toBeGreaterThan(authLimit);

      // Make authLimit + 1 requests to general endpoint
      for (let i = 0; i < authLimit + 1; i++) {
        const request = createMockRequest({ ip, path: "/api/products" });
        const response = await applyRateLimit(request, "general");
        expect(response).toBeNull();
      }

      // Should still be allowed (general has higher limit)
      const request = createMockRequest({ ip, path: "/api/products" });
      const response = await applyRateLimit(request, "general");
      expect(response).toBeNull();
    });

    it("should have appropriate limits for different endpoint types", async () => {
      // Verify the security principle: more sensitive = stricter limits
      const limits = {
        auth: RATE_LIMIT_CONFIGS.auth.maxRequests,
        upload: RATE_LIMIT_CONFIGS.upload.maxRequests,
        admin: RATE_LIMIT_CONFIGS.admin.maxRequests,
        services: RATE_LIMIT_CONFIGS.services.maxRequests,
        customers: RATE_LIMIT_CONFIGS.customers.maxRequests,
        general: RATE_LIMIT_CONFIGS.general.maxRequests,
      };

      // Auth should be strictest
      expect(limits.auth).toBeLessThan(limits.general);
      expect(limits.auth).toBeLessThan(limits.customers);
      expect(limits.auth).toBeLessThan(limits.services);

      // Upload should be strict (potential for abuse)
      expect(limits.upload).toBeLessThan(limits.general);

      // Admin should be moderate
      expect(limits.admin).toBeLessThan(limits.general);
    });

    it("should allow normal traffic on non-critical endpoints", async () => {
      const ip = "192.168.100.50";

      // Simulate normal usage: 20 requests to various endpoints
      for (let i = 0; i < 20; i++) {
        const request = createMockRequest({ ip, path: "/api/products" });
        const response = await applyRateLimit(request, "general");
        expect(response).toBeNull();
      }

      // Should still be allowed
      const request = createMockRequest({ ip, path: "/api/products" });
      const result = await checkRateLimit(request, "general");
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        expect(result.data.remaining).toBeGreaterThan(0);
      }
    });
  });

  describe("withRateLimit HOC Integration", () => {
    it("should protect API handlers with rate limiting", async () => {
      let handlerCalled = 0;
      const mockHandler = async () => {
        handlerCalled++;
        return new NextResponse(JSON.stringify({ success: true }), { status: 200 });
      };

      const protectedHandler = withRateLimit(mockHandler, "auth");
      const ip = "192.168.100.60";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip, path: "/api/auth/login" });
        await protectedHandler(request);
      }

      expect(handlerCalled).toBe(limit);

      // Next request should be blocked without calling handler
      const request = createMockRequest({ ip, path: "/api/auth/login" });
      const response = await protectedHandler(request);

      expect(handlerCalled).toBe(limit); // Handler not called again
      expect(response.status).toBe(429);
    });
  });

  describe("Error Response Format", () => {
    it("should return safe error response without exposing internals", async () => {
      const ip = "192.168.100.70";
      const limit = RATE_LIMIT_CONFIGS.auth.maxRequests;

      // Exhaust limit
      for (let i = 0; i < limit; i++) {
        const request = createMockRequest({ ip });
        await applyRateLimit(request, "auth");
      }

      const request = createMockRequest({ ip });
      const response = await applyRateLimit(request, "auth");
      const body = await response?.json();

      // Verify response format
      expect(body.success).toBe(false);
      expect(body.error.type).toBe("RateLimitError");
      expect(body.error.message).toBeDefined();
      expect(body.error.retryAfter).toBeDefined();

      // Should not expose internal details
      expect(JSON.stringify(body)).not.toContain("internal");
      expect(JSON.stringify(body)).not.toContain("stack");
      expect(JSON.stringify(body)).not.toContain("debug");
    });
  });

  describe("Rate Limit Configuration Validation", () => {
    it("should have valid configurations for all endpoint types", () => {
      const types = ["auth", "general", "customers", "services", "upload", "admin"] as const;

      types.forEach((type) => {
        const config = RATE_LIMIT_CONFIGS[type];

        expect(config.maxRequests).toBeGreaterThan(0);
        expect(config.windowMs).toBeGreaterThan(0);
        expect(config.blockDurationMs).toBeGreaterThan(0);
        expect(config.maxRequests).toBeLessThanOrEqual(1000); // Reasonable upper bound
        expect(config.windowMs).toBeLessThanOrEqual(60 * 60 * 1000); // Max 1 hour window
      });
    });

    it("should have stricter auth configuration than general", () => {
      const authConfig = RATE_LIMIT_CONFIGS.auth;
      const generalConfig = RATE_LIMIT_CONFIGS.general;

      expect(authConfig.maxRequests).toBeLessThan(generalConfig.maxRequests);
      expect(authConfig.windowMs).toBeGreaterThanOrEqual(generalConfig.windowMs);
    });
  });
});
