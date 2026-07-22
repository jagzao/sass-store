import { describe, it, expect } from "vitest";
import { db } from "../../../packages/database";
import { tenants, tenantConfigs } from "../../../packages/database/schema";
import { eq, and } from "drizzle-orm";

describe("Feature: zo-system business type development", () => {
  it("SC-01 — tenant_configs tiene business=development sin duplicados", async () => {
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, "zo-system"))
      .limit(1);

    expect(tenant).toBeDefined();

    const configs = await db
      .select({ value: tenantConfigs.value })
      .from(tenantConfigs)
      .where(
        and(
          eq(tenantConfigs.tenantId, tenant.id),
          eq(tenantConfigs.category, "business"),
          eq(tenantConfigs.key, "type"),
        ),
      );

    expect(configs.length).toBe(1);
    const raw = configs[0].value;
    const parsed =
      typeof raw === "string"
        ? (() => {
            try {
              return JSON.parse(raw);
            } catch {
              return raw;
            }
          })()
        : raw;
    expect(parsed).toBe("development");
  });
});
