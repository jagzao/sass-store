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
    // Add more detailed logging for debugging
    console.log(`[getTenantBySlug] Looking for tenant: ${slug}`);

    // Check database connection first
    try {
      await db.select().from(tenants).limit(1);
      console.log(`[getTenantBySlug] Database connection successful`);
    } catch (dbError) {
      console.error(`[getTenantBySlug] Database connection error:`, dbError);
      throw new Error(
        `Database connection failed: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
      );
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });

    if (!tenant) {
      console.log(`[getTenantBySlug] Tenant not found: ${slug}`);

      // Log available tenants for debugging
      try {
        const allTenants = await db.select().from(tenants).limit(5);
        console.log(
          `[getTenantBySlug] Available tenants:`,
          allTenants.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
        );
      } catch (logError) {
        console.error(
          `[getTenantBySlug] Error logging available tenants:`,
          logError,
        );
      }

      return null;
    }

    console.log(
      `[getTenantBySlug] Found tenant: ${tenant.name} (${tenant.id})`,
    );

    // FIX: Intercept yellow branding colors and convert to Blanco Hueso (#F5F5DC)
    // and Wondernails Gold (#C5A059) globally for any tenant to fix the UI breaking bug.
    // This affects 'wondernails' and 'manada-juma' equally.
    if (tenant.branding) {
      const b = tenant.branding as any;
      const isYellow = (color: string) => 
        color?.toLowerCase() === 'yellow' || 
        color?.toLowerCase() === '#ffff00' || 
        color?.toLowerCase() === 'rgb(255, 255, 0)';

      if (isYellow(b.primaryColor)) {
        b.primaryColor = '#C5A059'; // Gold
      }
      if (isYellow(b.secondaryColor)) {
        b.secondaryColor = '#F5F5DC'; // Blanco Hueso
      }
      if (isYellow(b.backgroundColor) || b.backgroundColor?.toLowerCase() === '#ffffff') {
        b.backgroundColor = '#F8F9FA'; // Blanco Hueso Variant
      }
    }

    return tenant as Tenant;
  } catch (error) {
    console.error(`[getTenantBySlug] Error fetching tenant ${slug}:`, error);
    throw error;
  }
}
