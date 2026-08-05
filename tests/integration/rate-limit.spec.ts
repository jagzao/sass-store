import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * STRY-021 SC-14, SC-14b — Rate limiting counter via Redis INCR + EXPIRE.
 *
 * Mocks Upstash Redis so the sliding-window contract is verified without a
 * live instance. The window-counter semantics: requests beyond the limit in
 * the same window must return RateLimitExceededError.
 */

const fakeStore = new Map<string, { count: number; ttl: number }>();

const fakeRedis = {
  incr: vi.fn(async (key: string) => {
    const entry = fakeStore.get(key) ?? { count: 0, ttl: 60 };
    entry.count += 1;
    fakeStore.set(key, entry);
    return entry.count;
  }),
  expire: vi.fn(async (key: string, ttl: number) => {
    const entry = fakeStore.get(key);
    if (entry) {
      entry.ttl = ttl;
      fakeStore.set(key, entry);
    }
    return 1;
  }),
  ttl: vi.fn(async () => 60),
  get: vi.fn(async () => null),
  set: vi.fn(async () => "OK"),
  del: vi.fn(async () => 1),
};

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(function () {
    return fakeRedis;
  }),
}));

beforeEach(() => {
  fakeStore.clear();
  vi.resetModules();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

describe("STRY-021 rate limiting (SC-14, SC-14b)", () => {
  it("SC-14: allows up to 5 requests per IP window then rejects", async () => {
    const { checkRateLimit } =
      await import("../../apps/web/lib/middleware/rate-limit");

    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit("rl:ip:1.2.3.4", 5, 60);
      expect(r.success).toBe(true);
    }
    const blocked = await checkRateLimit("rl:ip:1.2.3.4", 5, 60);
    expect(blocked.success).toBe(false);
    if (!blocked.success) {
      expect(blocked.error.type).toBe("RateLimitExceededError");
    }
  });

  it("SC-14b: phone counter is independent per (tenantId, phone)", async () => {
    const { checkRateLimit } =
      await import("../../apps/web/lib/middleware/rate-limit");

    for (let i = 0; i < 3; i++) {
      const r = await checkRateLimit("rl:phone:tenant-a:5512345678", 3, 3600);
      expect(r.success).toBe(true);
    }
    const blockedSame = await checkRateLimit(
      "rl:phone:tenant-a:5512345678",
      3,
      3600,
    );
    expect(blockedSame.success).toBe(false);

    // Different tenant or phone → separate bucket, still allowed.
    const other = await checkRateLimit("rl:phone:tenant-b:5512345678", 3, 3600);
    expect(other.success).toBe(true);
  });
});
