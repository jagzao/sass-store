import { headers } from "next/headers";
import { cookies } from "next/headers";
import { Tenant } from "./types";

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
    logo: "https://placeholder.zo.dev/logos/zo-system.png",
    favicon: "https://placeholder.zo.dev/favicons/zo-system.ico",
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
export async function resolveTenant(): Promise<Tenant> {
  const headersList = await headers();

  // Get resolved tenant from middleware headers (mandatory)
  const tenantSlug = headersList.get("x-tenant");
  const tenantId = headersList.get("x-tenant-id");
  const tenantMode = headersList.get("x-tenant-mode") as "catalog" | "booking";
  const tenantLocale = headersList.get("x-tenant-locale");
  const tenantCurrency = headersList.get("x-tenant-currency");

  if (!tenantSlug || !tenantId) {
    console.error("Missing tenant resolution headers from middleware");
    // Fallback to default if middleware headers are missing
    return DEFAULT_TENANT;
  }

  // Fetch full tenant data using resolved slug
  const tenant = await fetchTenantBySlug(tenantSlug);
  if (tenant) {
    // Enrich with middleware resolution data
    return {
      ...tenant,
      id: tenantId,
      mode: tenantMode || tenant.mode,
      // Add additional resolution metadata if needed
      resolvedAt: new Date().toISOString(),
      locale: tenantLocale || "es-MX",
      currency: tenantCurrency || "MXN",
    } as Tenant & { resolvedAt: string; locale: string; currency: string };
  }

  // If tenant data not found but middleware resolved it, use fallback
  console.warn(`Tenant data not found for resolved slug: ${tenantSlug}`);
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
        branding: tenant.branding,
        contact: tenant.contact,
        location: tenant.location,
        quotas: tenant.quotas,
      };
    }
  } catch (error) {
    console.error("Error fetching tenant from database:", error);
  }

  return null;
}

export async function getTenantSlug(): Promise<string> {
  const headersList = await headers();

  // Get resolved tenant slug from middleware (should always be present)
  const tenantSlug = headersList.get("x-tenant");
  if (tenantSlug) return tenantSlug;

  // Fallback if middleware headers are missing
  console.warn("Missing x-tenant header from middleware");
  return "zo-system";
}

export async function getTenantId(): Promise<string> {
  try {
    const headersList = await headers();

    // Get resolved tenant ID from middleware
    const tenantId = headersList.get("x-tenant-id");
    if (tenantId) return tenantId;

    // Fallback
    console.warn("Missing x-tenant-id header from middleware");
    return "zo-system";
  } catch (error) {
    // During build time or static prerendering, headers() may not be available
    // Return fallback tenant ID
    console.warn("Unable to read headers during static generation:", error);
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
  } catch (error) {
    // During build time or static prerendering, headers() may not be available
    console.warn(
      "Unable to read headers during static generation, using fallback tenant",
    );
  }

  // Fallback to default
  return "zo-system";
}
