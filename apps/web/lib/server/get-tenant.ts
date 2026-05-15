/**
 * Server-only utility to get tenant data
 * Use this in Server Components instead of fetchStatic
 * This avoids HTTP calls and uses direct DB access
 */

import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import type { Tenant } from "@/types/tenant";

// In-memory short-lived cache to prevent DB pool exhaustion during warmup
const _cache = new Map<string, { tenant: Tenant | null; ts: number }>();
const CACHE_TTL_MS = 60_000;

function getCached(slug: string): Tenant | null | undefined {
  const entry = _cache.get(slug);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _cache.delete(slug);
    return undefined;
  }
  return entry.tenant;
}

function setCached(slug: string, tenant: Tenant | null) {
  _cache.set(slug, { tenant, ts: Date.now() });
}

function isTransientDbError(err: unknown): boolean {
  const codeSet = new Set([
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EPIPE",
    "ENOTFOUND",
  ]);
  const seen = new Set<unknown>();
  let current: unknown = err;
  for (let depth = 0; depth < 8 && current != null; depth++) {
    if (seen.has(current)) break;
    seen.add(current);
    if (typeof current === "object" && current !== null) {
      const o = current as {
        code?: unknown;
        message?: unknown;
        cause?: unknown;
      };
      if (o.code && codeSet.has(String(o.code))) return true;
      const msg = typeof o.message === "string" ? o.message : String(current);
      for (const c of codeSet) {
        if (msg.includes(c)) return true;
      }
      if (/connection.*(reset|terminated|closed)/i.test(msg)) return true;
      current = o.cause;
      continue;
    }
    break;
  }
  const fallback = err instanceof Error ? err.message : String(err);
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|EPIPE|connection.*(reset|terminated|closed)/i.test(
    fallback,
  );
}

async function withTransientRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 8,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const retry = isTransientDbError(e) && i < attempts - 1;
      if (retry) {
        const delay = Math.min(12_000, 350 * 2 ** i);
        console.warn(
          `[getTenantBySlug] ${label} transient DB error (attempt ${i + 1}/${attempts}), retry in ${delay}ms:`,
          e instanceof Error ? e.message : e,
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw last;
}

/**
 * Get tenant by slug - Server-side only
 * @param slug - Tenant slug
 * @returns Tenant data or null if not found
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cached = getCached(slug);
  if (cached !== undefined) return cached;

  try {
    console.warn(`[getTenantBySlug] Looking for tenant: ${slug}`);

    const tenant = await withTransientRetry("findFirst", () =>
      db.query.tenants.findFirst({
        where: eq(tenants.slug, slug),
      }),
    );

    if (!tenant) {
      console.warn(`[getTenantBySlug] Tenant not found: ${slug}`);

      try {
        const allTenants = await withTransientRetry("list sample", () =>
          db.select().from(tenants).limit(5),
        );
        console.warn(
          `[getTenantBySlug] Available tenants:`,
          allTenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
        );
      } catch (logError) {
        console.error(
          `[getTenantBySlug] Error logging available tenants:`,
          logError,
        );
      }

      setCached(slug, null);
      return null;
    }

    console.warn(
      `[getTenantBySlug] Found tenant: ${tenant.name} (${tenant.id})`,
    );

    // FIX: Intercept yellow branding colors and convert to Blanco Hueso (#F5F5DC)
    // and Wondernails Gold (#C5A059) globally for any tenant to fix the UI breaking bug.
    // This affects 'wondernails' and 'manada-juma' equally.
    if (tenant.branding) {
      const b = tenant.branding as any;
      const isYellow = (color: string) =>
        color?.toLowerCase() === "yellow" ||
        color?.toLowerCase() === "#ffff00" ||
        color?.toLowerCase() === "rgb(255, 255, 0)";

      if (isYellow(b.primaryColor)) {
        b.primaryColor = "#C5A059"; // Gold
      }
      if (isYellow(b.secondaryColor)) {
        b.secondaryColor = "#F5F5DC"; // Blanco Hueso
      }
      if (
        isYellow(b.backgroundColor) ||
        b.backgroundColor?.toLowerCase() === "#ffffff"
      ) {
        b.backgroundColor = "#F8F9FA"; // Blanco Hueso Variant
      }
    }

    setCached(slug, tenant as Tenant);
    return tenant as Tenant;
  } catch (error) {
    console.error(`[getTenantBySlug] Error fetching tenant ${slug}:`, error);
    throw error;
  }
}
