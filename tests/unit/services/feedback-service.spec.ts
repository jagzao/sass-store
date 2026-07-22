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

describe("feedback-service — cobertura de branches de error", () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    const db = getTestDb();
    await setupTestDatabase();
    if (!db) return;
    tenant = await createTestTenant({ slug: "feedback-branches" });
  });

  beforeEach(() => {
    process.env.N8N_FEEDBACK_WEBHOOK_URL = "https://n8n.test/webhook/feedback";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_FEEDBACK_WEBHOOK_URL;
    vi.resetModules();
  });

  it("retorna stored cuando webhook no está configurado", async () => {
    delete process.env.N8N_FEEDBACK_WEBHOOK_URL;
    const { submitFeedback } =
      await import("../../../apps/web/lib/services/feedback-service");

    const result = await submitFeedback({
      tenantId: tenant.id,
      category: "opinion",
      message: "test sin webhook",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.status).toBe("stored");
  });

  it("retorna stored cuando fetch lanza error de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const { submitFeedback } =
      await import("../../../apps/web/lib/services/feedback-service");

    const result = await submitFeedback({
      tenantId: tenant.id,
      category: "problem",
      message: "test fetch error",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.status).toBe("stored");
  });

  it("retorna error cuando tenant no existe", async () => {
    const { submitFeedback } =
      await import("../../../apps/web/lib/services/feedback-service");

    const result = await submitFeedback({
      tenantId: "00000000-0000-0000-0000-000000000000",
      category: "opinion",
      message: "test tenant inexistente",
    });

    expect(result.success).toBe(false);
  });

  it("retorna error de validación cuando listFeedbackByTenant no tiene tenantId", async () => {
    const { listFeedbackByTenant } =
      await import("../../../apps/web/lib/services/feedback-service");

    const result = await listFeedbackByTenant({
      tenantId: "",
      page: 1,
      limit: 10,
    });

    expect(result.success).toBe(false);
  });

  it("lista feedback con filtros category y status aplicados", async () => {
    const { submitFeedback, listFeedbackByTenant } =
      await import("../../../apps/web/lib/services/feedback-service");

    await submitFeedback({
      tenantId: tenant.id,
      category: "opinion",
      message: "para filtro",
    });

    const result = await listFeedbackByTenant({
      tenantId: tenant.id,
      category: "opinion",
      status: "pending",
      page: 1,
      limit: 10,
    });

    expect(result.success).toBe(true);
  });
});
