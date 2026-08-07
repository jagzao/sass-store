import { describe, expect, it } from "vitest";
import {
  normalizeIp,
  normalizePhone,
} from "../../apps/web/lib/middleware/rate-limit";

/**
 * STRY-021 SC-14, SC-14b — IP/phone normalization for the rate-limit keys.
 * The Redis counter is exercised by integration tests; here we lock the
 * key-derivation contract.
 */
describe("normalizeIp", () => {
  it("leaves IPv4 untouched", () => {
    expect(normalizeIp("1.2.3.4")).toBe("1.2.3.4");
  });

  it("collapses IPv6 to its /64 prefix", () => {
    const v6 = "2001:0db8:85a3:0000:1234:5678:9abc:def0";
    expect(normalizeIp(v6)).toBe("2001:0db8:85a3:0000");
  });

  it("returns 'unknown' sentinel as-is", () => {
    expect(normalizeIp("unknown")).toBe("unknown");
  });
});

describe("normalizePhone", () => {
  it("strips non-digits and caps at 15", () => {
    expect(normalizePhone("(551) 234-5678")).toBe("5512345678");
  });

  it("caps length at 15 (E.164)", () => {
    expect(normalizePhone("1234567890123456789")).toBe("123456789012345");
  });

  it("returns empty for no digits", () => {
    expect(normalizePhone("----")).toBe("");
  });
});
