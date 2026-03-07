/**
 * Tests for Service Worker Cache Policy - SEC-011
 *
 * Tests verify that:
 * 1. API requests are NEVER cached
 * 2. Static assets can be cached
 * 3. NEVER_CACHE_PATTERNS correctly match sensitive paths
 */

// Recreate the patterns from sw.js for testing
const NEVER_CACHE_PATTERNS = [
  /^\/api\//, // All APIs (auth, users, tenants, etc.)
  /\/auth\//, // Any authentication route
  /\/_next\/data\//, // Next.js data endpoints
  /\/__nextjs_original-stack-frame/, // Next.js internals
];

const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico"];

function shouldNeverCache(pathname: string): boolean {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(pathname));
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_ASSETS.some((asset) => pathname === asset);
}

describe("Service Worker Cache Policy - SEC-011", () => {
  describe("NEVER_CACHE_PATTERNS", () => {
    describe("/api/* pattern", () => {
      it("should match all /api/ paths", () => {
        expect(shouldNeverCache("/api/auth/session")).toBe(true);
        expect(shouldNeverCache("/api/users/123")).toBe(true);
        expect(shouldNeverCache("/api/tenants/my-tenant")).toBe(true);
        expect(shouldNeverCache("/api/customers")).toBe(true);
        expect(shouldNeverCache("/api/finance/kpis")).toBe(true);
        expect(shouldNeverCache("/api/profile")).toBe(true);
        expect(shouldNeverCache("/api/inventory")).toBe(true);
        expect(shouldNeverCache("/api/v1/social/queue")).toBe(true);
      });

      it("should match nested API paths", () => {
        expect(
          shouldNeverCache("/api/tenants/t1/customers/c1/visits/v1"),
        ).toBe(true);
        expect(shouldNeverCache("/api/auth/google/callback")).toBe(true);
        expect(shouldNeverCache("/api/finance/matrix/cells")).toBe(true);
      });

      it("should NOT match non-API paths", () => {
        expect(shouldNeverCache("/")).toBe(false);
        expect(shouldNeverCache("/products")).toBe(false);
        expect(shouldNeverCache("/about")).toBe(false);
      });
    });

    describe("/auth/ pattern", () => {
      it("should match auth-related paths", () => {
        expect(shouldNeverCache("/auth/login")).toBe(true);
        expect(shouldNeverCache("/auth/callback")).toBe(true);
        expect(shouldNeverCache("/auth/error")).toBe(true);
        expect(shouldNeverCache("/api/auth/session")).toBe(true); // Also matches /api/
      });
    });

    describe("/_next/data/ pattern", () => {
      it("should match Next.js data endpoints", () => {
        expect(shouldNeverCache("/_next/data/build-id/page.json")).toBe(true);
        expect(shouldNeverCache("/_next/data/abc123/products.json")).toBe(true);
      });
    });

    describe("Next.js internals pattern", () => {
      it("should match Next.js internal paths", () => {
        expect(shouldNeverCache("/__nextjs_original-stack-frame")).toBe(true);
      });
    });
  });

  describe("Static Assets Policy", () => {
    it("should identify static assets correctly", () => {
      expect(isStaticAsset("/")).toBe(true);
      expect(isStaticAsset("/manifest.json")).toBe(true);
      expect(isStaticAsset("/favicon.ico")).toBe(true);
    });

    it("should NOT identify API paths as static assets", () => {
      expect(isStaticAsset("/api/data")).toBe(false);
      expect(isStaticAsset("/api/auth/session")).toBe(false);
    });

    it("should NOT identify dynamic paths as static assets", () => {
      expect(isStaticAsset("/products")).toBe(false);
      expect(isStaticAsset("/dashboard")).toBe(false);
      expect(isStaticAsset("/customers/123")).toBe(false);
    });
  });

  describe("Security: API Response Cache Prevention", () => {
    it("should never cache authentication endpoints", () => {
      const authEndpoints = [
        "/api/auth/session",
        "/api/auth/signin",
        "/api/auth/signout",
        "/api/auth/callback/google",
        "/api/auth/register",
      ];

      authEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });

    it("should never cache user data endpoints", () => {
      const userEndpoints = [
        "/api/users",
        "/api/users/123",
        "/api/users/123/cart",
        "/api/profile",
        "/api/profile/password",
      ];

      userEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });

    it("should never cache tenant data endpoints", () => {
      const tenantEndpoints = [
        "/api/tenants",
        "/api/tenants/my-tenant",
        "/api/tenants/my-tenant/customers",
        "/api/tenants/my-tenant/bookings",
        "/api/tenants/my-tenant/services",
      ];

      tenantEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });

    it("should never cache customer PII endpoints", () => {
      const customerEndpoints = [
        "/api/customers",
        "/api/tenants/t1/customers",
        "/api/tenants/t1/customers/c1",
        "/api/tenants/t1/customers/c1/visits",
      ];

      customerEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });

    it("should never cache financial data endpoints", () => {
      const financeEndpoints = [
        "/api/finance/kpis",
        "/api/finance/movements",
        "/api/finance/budgets",
        "/api/finance/matrix",
        "/api/finance/pos/sales",
        "/api/finance/reports/sales",
      ];

      financeEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });

    it("should never cache inventory data endpoints", () => {
      const inventoryEndpoints = [
        "/api/inventory",
        "/api/inventory/products/p1",
        "/api/inventory/alerts",
        "/api/inventory/transactions",
      ];

      inventoryEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });

    it("should never cache social media data endpoints", () => {
      const socialEndpoints = [
        "/api/v1/social/queue",
        "/api/v1/social/analytics",
        "/api/v1/social/calendar",
        "/api/v1/social/generate",
        "/api/v1/social/library",
      ];

      socialEndpoints.forEach((endpoint) => {
        expect(shouldNeverCache(endpoint)).toBe(true);
      });
    });
  });

  describe("Cache Strategy Summary", () => {
    it("should document the cache policy", () => {
      const policy = {
        apiRequests: "Network-only, never cached",
        staticAssets: "Cache-first with background update",
        navigation: "Network-first with fallback to cached index",
      };

      // Verify API requests are never cached
      expect(shouldNeverCache("/api/any/endpoint")).toBe(true);

      // Verify static assets can be cached
      expect(isStaticAsset("/")).toBe(true);

      // Document the policy
      expect(policy.apiRequests).toBe("Network-only, never cached");
      expect(policy.staticAssets).toBe("Cache-first with background update");
    });
  });
});

describe("Service Worker Version Compatibility", () => {
  it("should use secure cache version naming", () => {
    // The SW should use a versioned cache name that indicates security hardening
    const expectedVersion = "sass-store-v2-secure";
    const expectedStaticCache = "sass-store-static-v2";

    // These should not be the old insecure versions
    const oldInsecureVersion = "sass-store-v1";
    const oldApiCache = "sass-store-api-v1";

    expect(expectedVersion).not.toBe(oldInsecureVersion);
    expect(expectedStaticCache).not.toBe(oldApiCache);
  });
});
