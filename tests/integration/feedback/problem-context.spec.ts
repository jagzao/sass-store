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
import type { FeedbackContext } from "../../../apps/web/lib/services/feedback-service";

describe("Feature: Captura y enrutamiento de feedback", () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    const db = getTestDb();
    await setupTestDatabase();
    if (!db) return;
    tenant = await createTestTenant({ slug: "feedback-problem" });
  });

  beforeEach(() => {
    process.env.N8N_FEEDBACK_WEBHOOK_URL = "https://n8n.test/webhook/feedback";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_FEEDBACK_WEBHOOK_URL;
    vi.resetModules();
  });

  it("SC-02 — payload de problema incluye contexto de error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ received: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { submitFeedback } =
      await import("../../../apps/web/lib/services/feedback-service");

    const context: FeedbackContext = {
      route: "/t/wondernails/book",
      previousError: {
        message: "button did not respond",
        component: "BookButton",
      },
    };

    const result = await submitFeedback({
      tenantId: tenant.id,
      category: "problema",
      message: "No puedo completar la reserva",
      context,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe("sent");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://n8n.test/webhook/feedback");
    const body = JSON.parse(init.body);
    expect(body.category).toBe("problema");
    expect(body.context.previousError.message).toBe("button did not respond");
  });
});
