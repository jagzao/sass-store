import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTestDb,
  setupTestDatabase,
  createTestTenant,
} from "../../setup/test-database";

describe("Feature: STRY-028 — Tenant sin canales habilitados (SC-07)", () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    const db = getTestDb();
    await setupTestDatabase();
    if (!db) return;
    tenant = await createTestTenant({ slug: "no-channels-test" });
    // No seed tenant_channels → el tenant no tiene canales sociales
  });

  beforeEach(() => {
    vi.stubEnv(
      "N8N_SOCIAL_GENERATE_WEBHOOK_URL",
      "https://n8n.test/webhook/social-generate",
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.N8N_SOCIAL_GENERATE_WEBHOOK_URL;
    vi.resetModules();
  });

  it("SC-07 — generate con platforms=[] retorna error de validación", async () => {
    const { validateGenerateInput } =
      await import("../../../apps/web/lib/services/social-generate-service");

    const result = validateGenerateInput({
      tenant: "no-channels-test",
      objective: "sales",
      vibe: "professional",
      platforms: [], // sin canales
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      frequency: { postsPerWeek: 2, reelsPerWeek: 1, storiesPerWeek: 2 },
      contentMix: { promotions: 40, before_after: 20, trends: 20, tips: 20 },
    });

    // El servicio valida que al menos 1 plataforma esté seleccionada
    expect(result.success).toBe(false);
  });
});
