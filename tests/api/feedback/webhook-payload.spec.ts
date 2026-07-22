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
    tenant = await createTestTenant({ slug: "feedback-webhook" });
  });

  beforeEach(() => {
    process.env.N8N_FEEDBACK_WEBHOOK_URL = "https://n8n.test/webhook/feedback";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_FEEDBACK_WEBHOOK_URL;
    vi.resetModules();
  });

  it("SC-01 — payload enviado a n8n contiene categoría opinion", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ received: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { submitFeedback } =
      await import("../../../apps/web/lib/services/feedback-service");

    const result = await submitFeedback({
      tenantId: tenant.id,
      category: "opinion",
      message: "Me encanta la usabilidad del sitio",
      route: "/t/zo-system/products",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe("sent");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://n8n.test/webhook/feedback");
    const body = JSON.parse(init.body);
    expect(body.category).toBe("opinion");
    expect(body.tenantSlug).toBeDefined();
    expect(body.message).toBe("Me encanta la usabilidad del sitio");
  });
});
