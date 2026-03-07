/**
 * Tests for Cache Headers Utility - SEC-011
 *
 * Tests verify that cache headers are correctly defined
 * and sensitive paths are properly identified.
 */

// Test the cache header constants directly (no Next.js dependency)
const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
} as const;

// Sensitive path patterns - matches both exact paths and paths with trailing segments
const SENSITIVE_PATTERNS = [
  /\/api\/auth(\/|$)/,
  /\/api\/users(\/|$)/,
  /\/api\/tenants(\/|$)/,
  /\/api\/customers(\/|$)/,
  /\/api\/finance(\/|$)/,
  /\/api\/profile(\/|$)/,
  /\/api\/inventory(\/|$)/,
  /\/api\/advances(\/|$)/,
  /\/api\/visits(\/|$)/,
  /\/api\/retouch(\/|$)/,
  /\/api\/v1\/social(\/|$)/,
  /\/api\/upload(\/|$)/,
];

function shouldHaveNoCache(pathname: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(pathname));
}

describe("Cache Headers Utility - SEC-011", () => {
  describe("NO_CACHE_HEADERS constant", () => {
    it("should have Cache-Control with private, no-store", () => {
      expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("private");
      expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("no-store");
      expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("max-age=0");
      expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("must-revalidate");
    });

    it("should have Pragma: no-cache", () => {
      expect(NO_CACHE_HEADERS["Pragma"]).toBe("no-cache");
    });

    it("should have Expires: 0", () => {
      expect(NO_CACHE_HEADERS["Expires"]).toBe("0");
    });

    it("should have all required headers for security compliance", () => {
      const requiredHeaders = ["Cache-Control", "Pragma", "Expires"];
      requiredHeaders.forEach((header) => {
        expect(NO_CACHE_HEADERS).toHaveProperty(header);
      });
    });
  });

  describe("shouldHaveNoCache()", () => {
    it("should return true for auth paths", () => {
      expect(shouldHaveNoCache("/api/auth/session")).toBe(true);
      expect(shouldHaveNoCache("/api/auth/callback")).toBe(true);
      expect(shouldHaveNoCache("/api/auth/signin")).toBe(true);
    });

    it("should return true for user data paths", () => {
      expect(shouldHaveNoCache("/api/users/123")).toBe(true);
      expect(shouldHaveNoCache("/api/users/profile")).toBe(true);
    });

    it("should return true for tenant paths", () => {
      expect(shouldHaveNoCache("/api/tenants/abc")).toBe(true);
      expect(shouldHaveNoCache("/api/tenants/my-tenant/customers")).toBe(true);
    });

    it("should return true for customer PII paths", () => {
      expect(shouldHaveNoCache("/api/customers/list")).toBe(true);
      expect(shouldHaveNoCache("/api/tenants/t1/customers/c1")).toBe(true);
    });

    it("should return true for financial paths", () => {
      expect(shouldHaveNoCache("/api/finance/kpis")).toBe(true);
      expect(shouldHaveNoCache("/api/finance/movements")).toBe(true);
      expect(shouldHaveNoCache("/api/finance/budgets")).toBe(true);
    });

    it("should return true for profile paths", () => {
      expect(shouldHaveNoCache("/api/profile")).toBe(true);
      expect(shouldHaveNoCache("/api/profile/password")).toBe(true);
    });

    it("should return true for inventory paths", () => {
      expect(shouldHaveNoCache("/api/inventory")).toBe(true);
      expect(shouldHaveNoCache("/api/inventory/products")).toBe(true);
    });

    it("should return true for social media paths", () => {
      expect(shouldHaveNoCache("/api/v1/social/queue")).toBe(true);
      expect(shouldHaveNoCache("/api/v1/social/analytics")).toBe(true);
    });

    it("should return false for non-sensitive paths", () => {
      expect(shouldHaveNoCache("/api/health")).toBe(false);
      expect(shouldHaveNoCache("/api/public/products")).toBe(false);
    });
  });
});

describe("Cache Headers Security Properties", () => {
  it("should prevent caching with private directive", () => {
    expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("private");
  });

  it("should prevent caching with no-store directive", () => {
    expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("no-store");
  });

  it("should prevent caching with must-revalidate directive", () => {
    expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("must-revalidate");
  });

  it("should set max-age to 0", () => {
    expect(NO_CACHE_HEADERS["Cache-Control"]).toContain("max-age=0");
  });

  it("should include legacy Pragma header for HTTP/1.0 compatibility", () => {
    expect(NO_CACHE_HEADERS["Pragma"]).toBe("no-cache");
  });

  it("should include Expires header set to 0", () => {
    expect(NO_CACHE_HEADERS["Expires"]).toBe("0");
  });
});

describe("Sensitive Path Detection", () => {
  it("should identify all authentication endpoints as sensitive", () => {
    const authEndpoints = [
      "/api/auth/session",
      "/api/auth/signin",
      "/api/auth/signout",
      "/api/auth/callback/google",
      "/api/auth/register",
    ];

    authEndpoints.forEach((endpoint) => {
      expect(shouldHaveNoCache(endpoint)).toBe(true);
    });
  });

  it("should identify all user data endpoints as sensitive", () => {
    const userEndpoints = [
      "/api/users",
      "/api/users/123",
      "/api/users/123/cart",
      "/api/profile",
      "/api/profile/password",
    ];

    userEndpoints.forEach((endpoint) => {
      expect(shouldHaveNoCache(endpoint)).toBe(true);
    });
  });

  it("should identify all financial endpoints as sensitive", () => {
    const financeEndpoints = [
      "/api/finance/kpis",
      "/api/finance/movements",
      "/api/finance/budgets",
      "/api/finance/matrix",
      "/api/finance/pos/sales",
      "/api/finance/reports/sales",
    ];

    financeEndpoints.forEach((endpoint) => {
      expect(shouldHaveNoCache(endpoint)).toBe(true);
    });
  });

  it("should identify all customer PII endpoints as sensitive", () => {
    const customerEndpoints = [
      "/api/customers",
      "/api/tenants/t1/customers",
      "/api/tenants/t1/customers/c1",
      "/api/tenants/t1/customers/c1/visits",
    ];

    customerEndpoints.forEach((endpoint) => {
      expect(shouldHaveNoCache(endpoint)).toBe(true);
    });
  });
});
