import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTestDb,
  setupTestDatabase,
  createTestTenant,
} from "../../setup/test-database";

describe("Feature: STRY-028 — Aprobar y agendar borrador (SC-05)", () => {
  let tenant: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    const db = getTestDb();
    await setupTestDatabase();
    if (!db) return;
    tenant = await createTestTenant({ slug: "social-approve-test" });
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

  it("SC-05 — POST /api/v1/social/queue cambia status draft→scheduled", async () => {
    const { db } = await import("../../../packages/database");
    const { socialPosts } = await import("@sass-store/database/schema");
    const { eq } = await import("drizzle-orm");

    // 1. Insert draft directly
    const [inserted] = await db
      .insert(socialPosts)
      .values({
        tenantId: tenant.id,
        title: "Borrador IA",
        baseText: "Texto generado por IA",
        status: "draft",
        createdBy: "test",
      })
      .returning();

    expect(inserted.status).toBe("draft");

    // 2. Simular aprobación via queue POST upsert con id
    const { POST } =
      await import("../../../apps/web/app/api/v1/social/queue/route");

    const request = new Request("http://test/api/v1/social/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: inserted.id,
        tenant: tenant.slug, // slug real (unique)
        title: "Borrador IA editado",
        baseText: "Texto editado por admin",
        status: "scheduled",
        scheduledAtUtc: new Date(Date.now() + 86400000).toISOString(),
        timezone: "America/Mexico_City",
        platforms: [
          {
            platform: "facebook",
            variantText: "Versión FB",
            status: "scheduled",
          },
        ],
        updatedBy: "admin",
      }),
    });
    const response = await POST(request as any);
    expect(response.status).toBeLessThan(500);

    // 3. Verificar DB
    const [updated] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, inserted.id));
    expect(updated.status).toBe("scheduled");
    expect(updated.title).toBe("Borrador IA editado");
  });
});
