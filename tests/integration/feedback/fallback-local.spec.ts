import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import {
  getTestDb,
  setupTestDatabase,
  createTestTenant,
} from "../../setup/test-database";

describe("Feature: Captura y enrutamiento de feedback", () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    const db = getTestDb();
    await setupTestDatabase();
    if (!db) return;
    tenant = await createTestTenant({ slug: "feedback-fallback" });
  });

  beforeEach(() => {
    process.env.N8N_FEEDBACK_WEBHOOK_URL = "https://n8n.test/webhook/feedback";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_FEEDBACK_WEBHOOK_URL;
    vi.resetModules();
  });

  it("SC-03 — cuando n8n falla el feedback se almacena localmente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: "Service unavailable" }),
      }),
    );

    const { submitFeedback } =
      await import("../../../apps/web/lib/services/feedback-service");

    const result = await submitFeedback({
      tenantId: tenant.id,
      category: "opinion",
      message: "Mensaje de prueba para fallback local",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe("stored");
    expect(result.data.message).toBe("Lo guardamos, lo procesaremos más tarde");
  });
});
