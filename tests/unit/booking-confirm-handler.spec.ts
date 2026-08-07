import { describe, expect, it } from "vitest";
import {
  parseButtonPayload,
  canonicalizePhone,
  cancellationAllowed,
} from "../../apps/web/lib/wa/booking-confirm-handler";

/**
 * STRY-021 SC-07..09c — Pure helpers of the booking confirm handler.
 * The full handler requires a DB and is exercised by integration tests; here
 * we lock down the deterministic time-boundary and parsing logic.
 */
describe("parseButtonPayload", () => {
  it("parses a well-formed confirm payload", () => {
    expect(parseButtonPayload("confirm|R1|tok123")).toEqual({
      action: "confirm",
      bookingId: "R1",
      token: "tok123",
    });
  });

  it("parses a well-formed cancel payload", () => {
    expect(parseButtonPayload("cancel|R1|tok123")).toEqual({
      action: "cancel",
      bookingId: "R1",
      token: "tok123",
    });
  });

  it("rejects unknown actions", () => {
    expect(parseButtonPayload("delete|R1|tok")).toBeNull();
  });

  it("rejects payloads with wrong segment count", () => {
    expect(parseButtonPayload("confirm|R1")).toBeNull();
    expect(parseButtonPayload("confirm|R1|tok|extra")).toBeNull();
    expect(parseButtonPayload("")).toBeNull();
  });

  it("rejects empty bookingId or token", () => {
    expect(parseButtonPayload("confirm||tok")).toBeNull();
    expect(parseButtonPayload("confirm|R1|")).toBeNull();
  });
});

describe("canonicalizePhone", () => {
  it("strips non-digits", () => {
    expect(canonicalizePhone("(551) 234-5678")).toBe("5512345678");
  });

  it("drops the leading 52 country code (12 digits)", () => {
    expect(canonicalizePhone("525512345678")).toBe("5512345678");
  });

  it("drops the leading 1 country code (11 digits)", () => {
    expect(canonicalizePhone("15512345678")).toBe("5512345678");
  });

  it("leaves 10-digit numbers untouched", () => {
    expect(canonicalizePhone("5512345678")).toBe("5512345678");
  });

  it("returns empty string for undefined-like input", () => {
    expect(canonicalizePhone("")).toBe("");
  });
});

describe("cancellationAllowed (SC-08, SC-09, SC-09b)", () => {
  const now = new Date("2026-08-04T12:00:00Z");

  it("allows cancellation with more than 2h remaining (SC-08)", () => {
    const start = new Date(now.getTime() + 5 * 60 * 60 * 1000); // +5h
    expect(cancellationAllowed(start, now)).toBe(true);
  });

  it("forbids cancellation with less than 2h remaining (SC-09)", () => {
    const start = new Date(now.getTime() + 90 * 60 * 1000); // +1h30
    expect(cancellationAllowed(start, now)).toBe(false);
  });

  it("allows cancellation at EXACTLY 2h (inclusive boundary, SC-09b)", () => {
    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2h exact
    expect(cancellationAllowed(start, now)).toBe(true);
  });

  it("forbids cancellation for a start in the past", () => {
    const start = new Date(now.getTime() - 60 * 60 * 1000); // -1h
    expect(cancellationAllowed(start, now)).toBe(false);
  });
});
