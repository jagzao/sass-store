/**
 * TenantResolver
 *
 * Mapea phone_number_id (de Meta) → tenant_slug.
 * L1: cache con TTL 1h (Upstash Redis vía packages/cache)
 * L2: Supabase query a wa_tenant_config
 */
import { cache } from "../../../cache/redis";

const CACHE_TTL = 3600; // 1 hora
const KEY_PREFIX = "wa:tenant:phone:";

export class TenantResolver {
  async resolve(phoneNumberId: string): Promise<string | null> {
    const cacheKey = `${KEY_PREFIX}${phoneNumberId}`;

    // L1: cache hit
    const cached = await cache.get<string>(cacheKey);
    if (cached) return cached;

    // L2: DB query — import dinámico para no acoplar el package a Next.js
    try {
      const { db } = await import("@sass-store/database");
      const { waTenantConfig } = await import("@sass-store/database/schema");
      const { eq } = await import("drizzle-orm");

      const result = await db
        .select({ tenantSlug: waTenantConfig.tenantSlug })
        .from(waTenantConfig)
        .where(eq(waTenantConfig.phoneNumberId, phoneNumberId))
        .limit(1);

      if (!result[0]) return null;

      const slug = result[0].tenantSlug;
      await cache.set(cacheKey, slug, CACHE_TTL);
      return slug;
    } catch {
      return null;
    }
  }

  /** Invalida el cache cuando se actualiza la config del tenant */
  async invalidate(phoneNumberId: string): Promise<void> {
    await cache.del(`${KEY_PREFIX}${phoneNumberId}`);
  }
}
