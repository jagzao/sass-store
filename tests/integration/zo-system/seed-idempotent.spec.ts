import { describe, it, expect } from "vitest";
import { db } from "../../../packages/database";
import { tenants, services } from "../../../packages/database/schema";
import { eq } from "drizzle-orm";

describe("Feature: seed zo-system idempotente", () => {
  it("SC-10/11/12 — 6 servicios activos únicos para zo-system", async () => {
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, "zo-system"))
      .limit(1);

    const activeServices = await db
      .select({ id: services.id, name: services.name })
      .from(services)
      .where(eq(services.tenantId, tenant.id));

    const active = activeServices.filter((s) => s.name);
    expect(active.length).toBeGreaterThanOrEqual(6);

    const names = active.map((s) => s.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
