/**
 * WA Tenant Resolver — integración Next.js
 *
 * Mapea phone_number_id (de Meta) → tenant_slug.
 * L1: Upstash Redis (getCached/setCache de @/lib/cache/redis), TTL 1h
 * L2: Supabase query a wa_tenant_config
 */

import { getCached, setCache } from "@/lib/cache/redis";
import { db } from "@sass-store/database";
import { waTenantConfig } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

const CACHE_TTL = 3600;
const KEY = (phoneNumberId: string) => `wa:tenant:phone:${phoneNumberId}`;

export async function resolveTenant(
  phoneNumberId: string,
): Promise<string | null> {
  // L1: cache
  const cached = await getCached<string>(KEY(phoneNumberId));
  if (cached) return cached;

  // L2: DB
  try {
    const rows = await db
      .select({ tenantSlug: waTenantConfig.tenantSlug })
      .from(waTenantConfig)
      .where(eq(waTenantConfig.phoneNumberId, phoneNumberId))
      .limit(1);

    if (!rows[0]) return null;

    const slug = rows[0].tenantSlug;
    await setCache(KEY(phoneNumberId), slug, CACHE_TTL);
    return slug;
  } catch (err) {
    console.error("[WA TenantResolver] DB error:", err);
    return null;
  }
}

/** Invalida el cache cuando el tenant actualiza su config WA */
export async function invalidateTenantCache(
  phoneNumberId: string,
): Promise<void> {
  const { deleteCache } = await import("@/lib/cache/redis");
  await deleteCache(KEY(phoneNumberId));
}
