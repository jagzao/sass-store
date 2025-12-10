/**
 * Server-only utility to get tenant data
 * Use this in Server Components instead of fetchStatic
 * This avoids HTTP calls and uses direct DB access
 */

import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import type { Tenant } from "@/types/tenant";

/**
 * Get tenant by slug - Server-side only
 * @param slug - Tenant slug
 * @returns Tenant data or null if not found
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    if (!tenant) {
      console.log(`[getTenantBySlug] Tenant not found: ${slug}`);
      return null;
    }

    console.log(`[getTenantBySlug] Found tenant: ${tenant.name}`);
    return tenant as Tenant;
  } catch (error) {
    console.error(`[getTenantBySlug] Error fetching tenant ${slug}:`, error);
    throw error;
  }
}
