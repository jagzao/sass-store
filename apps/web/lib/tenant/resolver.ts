import { headers } from "next/headers";
import { cookies } from "next/headers";
import { Tenant } from "./types";
import { tenantLogger } from "@/lib/logger";

// Default fallback tenant (zo-system)
const DEFAULT_TENANT: Tenant = {
  id: "zo-system",
  name: "Zo System",
  slug: "zo-system",
  description: "Default fallback tenant for unmapped hosts",
  mode: "catalog",
  status: "active",
  branding: {
    primaryColor: "#FF8000",
    secondaryColor: "#1F2937",
    logo: "/tenants/zo-system/logo/logo.svg",
    favicon: "/favicon.ico",
    website: "https://zo.dev",
    theme: "dark",
    navLinks: [
      {
        name: "Portafolio",
        href: "https://zo-portfolio.pages.dev/",
        external: true,
      },
      { name: "SaaS Solutions", href: "/t/zo-system/products" },
      { name: "Servicios", href: "/t/zo-system/services" },
    ],
  },
  contact: {
    phone: "+1-555-0100",
    email: "hello@zo.dev",
    address: "123 Tech Avenue, San Francisco, CA 94105",
    hours: {
      monday: "9:00-17:00",
      tuesday: "9:00-17:00",
      wednesday: "9:00-17:00",
      thursday: "9:00-17:00",
      friday: "9:00-17:00",
      saturday: "closed",
      sunday: "closed",
    },
  },
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    placeId: "ChIJIQBpAG2ahYAR_6128GcTUEo",
  },
  quotas: {
    storageGB: 5,
    monthlyBudget: 25.0,
    apiCallsPerHour: 1000,
  },
};

/**
 * Resolve tenant with strict enforcement.
 * Now relies on middleware headers for tenant resolution.
 * Returns { id, slug, featureMode, locale, currency } as required.
 */
export async function resolveTenant(urlSlug?: string): Promise<Tenant> {
  const headersList = await headers();

  // Get resolved tenant from middleware headers (mandatory)
  const tenantSlug = urlSlug || headersList.get("x-tenant");
  const tenantId = headersList.get("x-tenant-id");
  const tenantMode = headersList.get("x-tenant-mode") as "catalog" | "booking";
  const tenantLocale = headersList.get("x-tenant-locale");
  const tenantCurrency = headersList.get("x-tenant-currency");

  if (!tenantSlug) {
    tenantLogger.warn(
      "resolveTenant: no x-tenant header and no urlSlug — falling back to zo-system",
    );
    // Fallback to default if everything is missing
    return DEFAULT_TENANT;
  }

  // Fetch full tenant data using resolved slug
  const tenant = await fetchTenantBySlug(tenantSlug);
  if (tenant) {
    // Enrich with middleware resolution data if available
    return {
      ...tenant,
      id: tenantId || tenant.id, // Fallback to DB UUID if header missing
      mode: tenantMode || tenant.mode,
      // Add additional resolution metadata if needed
      resolvedAt: new Date().toISOString(),
      locale: tenantLocale || "es-MX",
      currency: tenantCurrency || "MXN",
    } as Tenant & { resolvedAt: string; locale: string; currency: string };
  }

  // If tenant data not found but middleware resolved it, use fallback
  tenantLogger.warn(
    `resolveTenant: DB returned null for slug '${tenantSlug}' — falling back`,
  );
  return DEFAULT_TENANT;
}

function extractSubdomain(host: string): string | null {
  const parts = host.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

async function fetchTenantBySlug(slug: string): Promise<Tenant | null> {
  try {
    // Import the TenantService here to avoid circular dependency
    const { TenantService } = await import("../db/tenant-service");

    // Fetch tenant from database
    const tenant = await TenantService.getTenantBySlug(slug);

    if (tenant) {
      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        description: tenant.description || "No description",
        mode: tenant.mode as "catalog" | "booking",
        status: tenant.status as "active" | "inactive" | "suspended",
        branding: tenant.branding as any,
        contact: tenant.contact as any,
        location: tenant.location as any,
        quotas: tenant.quotas as any,
      };
    }
  } catch (error) {
    tenantLogger.error("fetchTenantBySlug error", error);
  }

  return null;
}

export async function getTenantSlug(): Promise<string> {
  const headersList = await headers();

  // Get resolved tenant slug from middleware (should always be present)
  const tenantSlug = headersList.get("x-tenant");
  if (tenantSlug) return tenantSlug;

  // Fallback if middleware headers are missing
  tenantLogger.debug(
    "getTenantSlug: x-tenant header missing — fallback zo-system",
  );
  return "zo-system";
}

export async function getTenantId(): Promise<string> {
  try {
    const headersList = await headers();

    // Get resolved tenant ID from middleware
    const tenantId = headersList.get("x-tenant-id");
    if (tenantId) return tenantId;

    // Fallback
    tenantLogger.debug(
      "getTenantId: x-tenant-id header missing — fallback zo-system",
    );
    return "zo-system";
  } catch {
    // During build time or static prerendering, headers() may not be available
    return "zo-system";
  }
}

export async function getTenantIdForRequest(
  request?: Request,
): Promise<string> {
  try {
    // For API routes, we can read headers from the request object
    if (request) {
      const tenantId = request.headers.get("x-tenant-id");
      if (tenantId) return tenantId;
    }

    // During static generation, try to get from Next.js headers with fallback
    const headersList = await headers();
    const tenantId = headersList.get("x-tenant-id");
    if (tenantId) return tenantId;
  } catch {
    // During build time or static prerendering — silent fallback
  }

  // Fallback to default
  return "zo-system";
}
