import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import type { Tenant } from "@/types/tenant";

/**
 * Get tenant data by slug - Server-side only
 * Use this in Server Components instead of fetching from API endpoint
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    if (!tenant) {
      return null;
    }

    return tenant as Tenant;
  } catch (error) {
    console.error(`[getTenantBySlug] Error fetching tenant ${slug}:`, error);
    throw error;
  }
}
