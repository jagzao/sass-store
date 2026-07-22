import { describe, it, expect, beforeAll } from "vitest";
import {
  getTestDb,
  setupTestDatabase,
  createTestTenant,
} from "../../setup/test-database";
import { listFeedbackByTenant } from "../../../apps/web/lib/services/feedback-service";

describe("Feature: Captura y enrutamiento de feedback", () => {
  let tenantA: Awaited<ReturnType<typeof createTestTenant>>;

  beforeAll(async () => {
    const db = getTestDb();
    await setupTestDatabase();
    if (!db) return;
    tenantA = await createTestTenant({ slug: "feedback-iso-a" });
  });

  it("SC-04 — listado de feedback solo devuelve registros del tenant solicitado", async () => {
    const result = await listFeedbackByTenant({
      tenantId: tenantA.id,
      page: 1,
      limit: 20,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    for (const item of result.data.items) {
      expect(item.tenantId).toBe(tenantA.id);
    }
  });

  it("SC-04 — listado sin tenantId retorna error de validación", async () => {
    const result = await listFeedbackByTenant({
      tenantId: "",
      page: 1,
      limit: 20,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("ValidationError");
  });
});
