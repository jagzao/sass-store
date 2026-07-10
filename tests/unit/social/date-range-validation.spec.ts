import { describe, it, expect } from "vitest";
import { validateGenerateInput } from "@/lib/services/social-generate-service";

describe("SC-09: Date range validation", () => {
  const baseInput = {
    tenant: "wondernails",
    objective: "brand" as const,
    vibe: "professional" as const,
    platforms: ["facebook"],
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    frequency: { postsPerWeek: 1, reelsPerWeek: 0, storiesPerWeek: 0 },
    contentMix: { promotions: 100, before_after: 0, trends: 0, tips: 0 },
    businessContext: "",
  };

  it("accepts valid range > 1 day", () => {
    const result = validateGenerateInput(baseInput);
    expect(result.success).toBe(true);
  });

  it("rejects same-day start and end", () => {
    const result = validateGenerateInput({
      ...baseInput,
      startDate: "2026-08-01",
      endDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain("al menos 1 día");
    }
  });

  it("rejects end before start", () => {
    const result = validateGenerateInput({
      ...baseInput,
      startDate: "2026-08-31",
      endDate: "2026-08-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid date strings", () => {
    const result = validateGenerateInput({
      ...baseInput,
      startDate: "not-a-date",
      endDate: "also-not-a-date",
    });
    expect(result.success).toBe(false);
  });
});
