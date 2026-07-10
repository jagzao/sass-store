import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  callN8nGenerateWebhook,
  validateGenerateInput,
} from "@/lib/services/social-generate-service";

const validInput = {
  tenant: "wondernails",
  objective: "brand" as const,
  vibe: "professional" as const,
  platforms: ["facebook", "instagram"],
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  frequency: { postsPerWeek: 2, reelsPerWeek: 1, storiesPerWeek: 2 },
  contentMix: { promotions: 40, before_after: 30, trends: 20, tips: 10 },
  businessContext: "Salón de uñas en Mérida",
};

describe("SC-04: n8n unavailable returns NetworkError", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns error when n8n webhook is unreachable", async () => {
    const validated = validateGenerateInput(validInput);
    expect(validated.success).toBe(true);

    const result = await callN8nGenerateWebhook(validated.data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("NetworkError");
      expect(result.error.message).toMatch(/no se pudo conectar/i);
    }
  });
});

describe("SC-08: Ollama malformed JSON returns error", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          error: "No se pudo generar contenido. Intenta de nuevo.",
        }),
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns error when n8n responds with parse failure", async () => {
    const validated = validateGenerateInput(validInput);
    expect(validated.success).toBe(true);

    const result = await callN8nGenerateWebhook(validInput as any);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe("NetworkError");
    }
  });
});

describe("SC-01: n8n valid response returns generated posts", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            generatedPosts: [
              {
                id: "ai-generated-0",
                title: "Promo Manicura",
                content: "20% descuento esta semana 📅",
                platforms: ["facebook", "instagram"],
                format: "post",
                scheduledAt: "2026-08-05T14:00:00.000Z",
                status: "draft",
                contentType: "promotional",
              },
              {
                id: "ai-generated-1",
                title: "Tip de cuidado",
                content: "Hidrata tus cutículas 💅",
                platforms: ["instagram"],
                format: "story",
                scheduledAt: "2026-08-12T19:00:00.000Z",
                status: "draft",
                contentType: "tip",
              },
            ],
            summary: {
              totalPosts: 2,
              postsByFormat: { post: 1, reel: 0, story: 1 },
              postsByType: {
                promotional: 1,
                before_after: 0,
                trending: 0,
                tip: 1,
              },
              dateRange: { start: "2026-08-01", end: "2026-08-31" },
            },
          },
        }),
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("returns normalized posts from n8n response", async () => {
    const validated = validateGenerateInput(validInput);
    expect(validated.success).toBe(true);

    const result = await callN8nGenerateWebhook(validated.data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.generatedPosts).toHaveLength(2);
      expect(result.data.generatedPosts[0].title).toBe("Promo Manicura");
      expect(result.data.generatedPosts[0].platforms).toContain("facebook");
      expect(result.data.summary.totalPosts).toBe(2);
    }
  });
});
