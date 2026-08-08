import { describe, it, expect, vi, afterEach } from "vitest";

describe("ai-chat-service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_AI_CHAT_WEBHOOK_URL;
    vi.resetModules();
  });

  it("SC-05 — retorna error de configuracion cuando el webhook no esta configurado", async () => {
    delete process.env.N8N_AI_CHAT_WEBHOOK_URL;
    const { sendAiChatMessage } =
      await import("../../../apps/web/lib/services/ai-chat-service");

    const result = await sendAiChatMessage({
      tenantSlug: "wondernails",
      message: "hola",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("ConfigurationError");
  });

  it("SC-05 — retorna error de red cuando fetch falla", async () => {
    process.env.N8N_AI_CHAT_WEBHOOK_URL = "https://n8n.test/webhook/wonder";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const { sendAiChatMessage } =
      await import("../../../apps/web/lib/services/ai-chat-service");

    const result = await sendAiChatMessage({
      tenantSlug: "wondernails",
      message: "hola",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("NetworkError");
  });

  it("SC-04 — retorna Ok con el reply cuando el webhook responde bien", async () => {
    process.env.N8N_AI_CHAT_WEBHOOK_URL = "https://n8n.test/webhook/wonder";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          reply: "¡Hola! Soy Wonder 🐾",
          sessionId: "abc",
        }),
      }),
    );
    const { sendAiChatMessage } =
      await import("../../../apps/web/lib/services/ai-chat-service");

    const result = await sendAiChatMessage({
      tenantSlug: "wondernails",
      message: "hola",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.reply).toBe("¡Hola! Soy Wonder 🐾");
  });

  it("retorna error cuando el webhook responde sin reply", async () => {
    process.env.N8N_AI_CHAT_WEBHOOK_URL = "https://n8n.test/webhook/wonder";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      }),
    );
    const { sendAiChatMessage } =
      await import("../../../apps/web/lib/services/ai-chat-service");

    const result = await sendAiChatMessage({
      tenantSlug: "wondernails",
      message: "hola",
    });

    expect(result.success).toBe(false);
  });
});
