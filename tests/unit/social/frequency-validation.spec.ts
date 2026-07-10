import { describe, it, expect } from "vitest";
import { validateGenerateInput } from "@/lib/services/social-generate-service";

describe("SC-10: Frequency validation", () => {
  const baseInput = {
    tenant: "wondernails",
    objective: "brand" as const,
    vibe: "professional" as const,
    platforms: ["facebook"],
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    frequency: { postsPerWeek: 0, reelsPerWeek: 0, storiesPerWeek: 0 },
    contentMix: { promotions: 100, before_after: 0, trends: 0, tips: 0 },
    businessContext: "",
  };

  it("accepts zero frequency (generates 0 posts, not an error)", () => {
    const result = validateGenerateInput(baseInput);
    expect(result.success).toBe(true);
  });

  it("accepts normal frequency values", () => {
    const result = validateGenerateInput({
      ...baseInput,
      frequency: { postsPerWeek: 3, reelsPerWeek: 1, storiesPerWeek: 2 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative frequency via Zod", () => {
    const result = validateGenerateInput({
      ...baseInput,
      frequency: { postsPerWeek: -1, reelsPerWeek: 0, storiesPerWeek: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty platforms array", () => {
    const result = validateGenerateInput({
      ...baseInput,
      platforms: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required tenant", () => {
    const result = validateGenerateInput({
      ...baseInput,
      tenant: "",
    });
    expect(result.success).toBe(false);
  });
});
