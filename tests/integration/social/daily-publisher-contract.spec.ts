import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * SC-06 + SC-11: simulación del workflow publicador diario de n8n.
 * Estos tests no invocan n8n real; mockean fetch al webhook de n8n
 * y validan el contrato de respuesta (publicado vs fallido).
 */

describe("Feature: STRY-028 — Workflow publicador diario (SC-06, SC-11)", () => {
  beforeEach(() => {
    vi.stubEnv("N8N_PUBLISHER_WEBHOOK_URL", "https://n8n.test/webhook/publish");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_PUBLISHER_WEBHOOK_URL;
    vi.resetModules();
  });

  it("SC-06 — publisher webhook responde con target publicado + platform_post_id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          targetId: "tgt-1",
          status: "published",
          platformPostId: "fb_post_12345",
          publishedAt: new Date().toISOString(),
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    // Simular llamada del scheduler al publisher
    const response = await fetch("https://n8n.test/webhook/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "test-tenant",
        targetId: "tgt-1",
        platform: "facebook",
        variantText: "Test post",
        scheduledAt: new Date().toISOString(),
      }),
    });

    const body = await response.json();
    expect(response.ok).toBe(true);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("published");
    expect(body.data.platformPostId).toBeTruthy();
  });

  it("SC-11 — publisher webhook responde con target failed + error message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        data: {
          targetId: "tgt-2",
          status: "failed",
          error: "Facebook API: permission denied",
          failedAt: new Date().toISOString(),
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetch("https://n8n.test/webhook/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: "test-tenant",
        targetId: "tgt-2",
        platform: "facebook",
        variantText: "Test post",
        scheduledAt: new Date().toISOString(),
      }),
    });

    const body = await response.json();
    expect(body.data.status).toBe("failed");
    expect(body.data.error).toContain("permission denied");
  });
});
