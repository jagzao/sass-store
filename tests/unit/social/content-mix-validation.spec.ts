import { describe, it, expect } from "vitest";
import { validateGenerateInput } from "@/lib/services/social-generate-service";

describe("SC-03: Content mix validation", () => {
  const baseInput = {
    tenant: "wondernails",
    objective: "brand" as const,
    vibe: "professional" as const,
    platforms: ["facebook", "instagram"],
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    frequency: { postsPerWeek: 2, reelsPerWeek: 1, storiesPerWeek: 2 },
    contentMix: { promotions: 40, before_after: 30, trends: 20, tips: 10 },
    businessContext: "",
  };

  it("accepts mix that sums to 100%", () => {
    const result = validateGenerateInput(baseInput);
    expect(result.success).toBe(true);
  });

  it("rejects mix that sums to 90%", () => {
    const result = validateGenerateInput({
      ...baseInput,
      contentMix: { promotions: 40, before_after: 30, trends: 20, tips: 0 },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("100%");
      expect(result.error.message).toContain("90%");
    }
  });

  it("rejects mix that sums to 110%", () => {
    const result = validateGenerateInput({
      ...baseInput,
      contentMix: { promotions: 50, before_after: 30, trends: 20, tips: 10 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects mix with negative values via Zod", () => {
    const result = validateGenerateInput({
      ...baseInput,
      contentMix: { promotions: -10, before_after: 40, trends: 30, tips: 40 },
    });
    expect(result.success).toBe(false);
  });
});
