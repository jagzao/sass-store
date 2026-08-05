import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * STRY-021 SC-04, SC-04b — Idempotency key lifecycle.
 *
 * Mocks Upstash Redis so the tests are deterministic and do not need a live
 * Redis instance. Verifies:
 *   - SC-04:  consuming the same key twice returns the same bookingId.
 *   - SC-04b: issuer mismatch (different IP) → IdempotencyKeyMismatch error.
 */

const fakeStore = new Map<string, string>();

const fakeRedis = {
  get: vi.fn(async (key: string) => fakeStore.get(key) ?? null),
  set: vi.fn(
    async (
      key: string,
      value: string,
      opts?: { nx?: boolean; ex?: number },
    ): Promise<"OK" | null> => {
      if (opts?.nx && fakeStore.has(key)) return null;
      fakeStore.set(key, value);
      return "OK";
    },
  ),
  expire: vi.fn(async () => 1),
  incr: vi.fn(async (key: string) => {
    const next = (Number(fakeStore.get(key) ?? "0") || 0) + 1;
    fakeStore.set(key, String(next));
    return next;
  }),
  ttl: vi.fn(async () => 60),
  del: vi.fn(async (key: string) => {
    fakeStore.delete(key);
    return 1;
  }),
};

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn(function () {
    return fakeRedis;
  }),
}));

// Set the env vars the module reads at import time.
beforeEach(() => {
  fakeStore.clear();
  vi.resetModules();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
});

describe("STRY-021 idempotency (SC-04, SC-04b)", () => {
  it("SC-04: second consume returns the first bookingId (replay)", async () => {
    const { issueKey, consumeKey } =
      await import("../../apps/web/lib/booking/idempotency");

    const issued = await issueKey("1.2.3.4", "wondernails");
    if (!issued.success) throw new Error("issueKey failed");
    const key = issued.data.key;

    const first = await consumeKey(key, "booking-001");
    expect(first.success).toBe(true);
    if (first.success) expect(first.data.replayed).toBe(false);

    const second = await consumeKey(key, "booking-001");
    expect(second.success).toBe(true);
    if (second.success) {
      expect(second.data.replayed).toBe(true);
      expect(second.data.bookingId).toBe("booking-001");
    }
  });

  it("SC-04b: issuer mismatch returns IdempotencyKeyMismatch", async () => {
    const { issueKey, verifyIssuer } =
      await import("../../apps/web/lib/booking/idempotency");

    const issued = await issueKey("1.2.3.4", "wondernails");
    if (!issued.success) throw new Error("issueKey failed");
    const key = issued.data.key;

    // Attacker from a different IP tries to consume the same key.
    const verify = await verifyIssuer(key, "9.9.9.9", "wondernails");
    expect(verify.success).toBe(false);
    if (!verify.success) {
      expect(verify.error.type).toBe("IdempotencyKeyMismatchError");
    }
  });

  it("SC-04b: original issuer is accepted", async () => {
    const { issueKey, verifyIssuer } =
      await import("../../apps/web/lib/booking/idempotency");

    const issued = await issueKey("1.2.3.4", "wondernails");
    if (!issued.success) throw new Error("issueKey failed");

    const verify = await verifyIssuer(
      issued.data.key,
      "1.2.3.4",
      "wondernails",
    );
    expect(verify.success).toBe(true);
  });
});
