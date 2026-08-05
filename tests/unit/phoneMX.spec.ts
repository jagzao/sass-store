import { describe, expect, it } from "vitest";
import { CommonSchemas } from "../../packages/validation/src/zod-result";

/**
 * STRY-021 SC-03a — phoneMX validation.
 * 10 digits OK, 9/11/12 digits fail, letters fail, empty fails.
 * Backend normalizes +52 country code before validating.
 */
describe("CommonSchemas.phoneMX", () => {
  const phoneMX = CommonSchemas.phoneMX;

  it("accepts exactly 10 digits", () => {
    const r = phoneMX.parse("5512345678");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("5512345678");
  });

  it("rejects 9 digits", () => {
    const r = phoneMX.parse("551234567");
    expect(r.success).toBe(false);
  });

  it("rejects 11 digits", () => {
    const r = phoneMX.parse("55123456789");
    expect(r.success).toBe(false);
  });

  it("rejects letters interleaved", () => {
    const r = phoneMX.parse("55a1234567");
    expect(r.success).toBe(false);
  });

  it("rejects empty string", () => {
    const r = phoneMX.parse("");
    expect(r.success).toBe(false);
  });

  it("rejects undefined", () => {
    const r = phoneMX.parse(undefined);
    expect(r.success).toBe(false);
  });

  it("does NOT normalize +52 on its own — caller must strip (documented contract)", () => {
    // phoneMX is a pure validator; normalization happens at the boundary
    // (route.ts normalizePhoneInput) before parse. "+525512345678" is not
    // 10 digits so the raw value correctly fails here.
    const r = phoneMX.parse("+525512345678");
    expect(r.success).toBe(false);
  });

  it("accepts the normalized form after +52 strip", () => {
    const normalized = "+525512345678".replace(/\D/g, "").replace(/^52/, "");
    const r = phoneMX.parse(normalized);
    expect(r.success).toBe(true);
  });
});
