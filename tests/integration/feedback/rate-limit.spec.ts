import { describe, it, expect, vi, beforeEach } from "vitest";

interface RedisEntry {
  score: number;
  member: string;
}

vi.mock("@upstash/redis", () => ({
  Redis: class {
    private store = new Map<string, RedisEntry[]>();
    pipeline() {
      const store = this.store;
      const keyForExec = "ratelimit:feedback:192.168.1.1";
      return {
        zremrangebyscore(key: string, _min: number, max: number) {
          const list = store.get(key) ?? [];
          store.set(
            key,
            list.filter((entry) => entry.score > max),
          );
          return this;
        },
        zcard(key: string) {
          return (store.get(key) ?? []).length;
        },
        zadd(key: string, entry: RedisEntry) {
          const list = store.get(key) ?? [];
          list.push(entry);
          store.set(key, list);
          return this;
        },
        expire() {
          return this;
        },
        async exec() {
          const count = (store.get(keyForExec) ?? []).length - 1;
          return [undefined, Math.max(0, count), undefined, undefined];
        },
      };
    }
  },
}));

describe("Feature: Captura y enrutamiento de feedback", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
  });

  it("SC-05 — permite 3 envíos y bloquea el cuarto", async () => {
    const { AdvancedRateLimiter } =
      await import("../../../apps/web/lib/security/rate-limiter");

    const limiter = new AdvancedRateLimiter({
      windowMs: 15 * 60 * 1000,
      maxRequests: 3,
      identifier: "feedback",
    });

    const request = {
      headers: {
        get: (name: string) => {
          if (name === "cf-connecting-ip") return "192.168.1.1";
          return null;
        },
      },
    } as unknown as Request;

    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await limiter.checkLimit(request as any, "feedback"));
    }

    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(true);
    expect(results[2].allowed).toBe(true);
    expect(results[3].allowed).toBe(false);
  });
});
