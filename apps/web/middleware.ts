import { NextRequest, NextResponse } from "next/server";
import {
  generateCsrfToken,
  hashCsrfToken,
  validateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_PROTECTED_METHODS,
  isCsrfExempt,
} from "@sass-store/core";
import { validateTenantAccess } from "@/lib/auth/tenant-validation";

// Known tenant slugs from seed data
const KNOWN_TENANTS = [
  "wondernails",
  "vigistudio",
  "centro-tenistico",
  "vainilla-vargas",
  "delirios",
  "nom-nom",
  "zo-system",
];

interface ResolvedTenant {
  id: string;
  slug: string;
  featureMode: "catalog" | "booking";
  locale: string;
  currency: string;
}

let unknownHostCount = 0;
let totalHostResolutions = 0;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const host = request.headers.get("host") || "";
  const method = request.method;

  totalHostResolutions++;

  // CSRF Protection (skip for exempt paths)
  if (!isCsrfExempt(pathname)) {
    // For protected methods, validate CSRF token
    if (CSRF_PROTECTED_METHODS.includes(method)) {
      const csrfTokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
      const cookieHeader = request.headers.get("cookie") || "";
      const csrfTokenFromCookie = extractCookieValue(
        cookieHeader,
        CSRF_COOKIE_NAME,
      );

      if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
        console.warn(`[CSRF] Missing CSRF token for ${method} ${pathname}`);
        return new NextResponse("CSRF token missing", { status: 403 });
      }

      // Validate the token
      const isValid = await validateCsrfToken(
        csrfTokenFromHeader,
        csrfTokenFromCookie,
      );
      if (!isValid) {
        console.warn(`[CSRF] Invalid CSRF token for ${method} ${pathname}`);
        return new NextResponse("Invalid CSRF token", { status: 403 });
      }
    }
  }

  // 1. Resolve tenant following priority order
  const resolvedTenant = await resolveTenantStrict(request);

  // 2. For tenant routes (/t/{tenant}/*), validate tenant exists but don't enforce strict matching in development
  if (pathname.startsWith("/t/")) {
    const pathSegments = pathname.split("/");
    if (pathSegments.length >= 3) {
      const urlTenantSlug = pathSegments[2];

      // Check if the URL tenant exists
      if (!KNOWN_TENANTS.includes(urlTenantSlug)) {
        console.warn(
          `Unknown tenant in URL: '${urlTenantSlug}' - returning 404`,
        );
        return new NextResponse("Tenant not found", { status: 404 });
      }

      // In development, allow URL tenant to override resolved tenant
      if (process.env.NODE_ENV === "development") {
        // Override the resolved tenant with the URL tenant for tenant routes
        const urlTenantResolved = buildTenantResponse(urlTenantSlug);
        const response = NextResponse.next();
        response.headers.set("x-tenant", urlTenantResolved.slug);
        response.headers.set("x-tenant-id", urlTenantResolved.id);
        response.headers.set("x-tenant-mode", urlTenantResolved.featureMode);
        response.headers.set("x-tenant-locale", urlTenantResolved.locale);
        response.headers.set("x-tenant-currency", urlTenantResolved.currency);
        return response;
      }

      // In production, enforce strict matching
      if (urlTenantSlug !== resolvedTenant.slug) {
        console.warn(
          `Tenant mismatch: URL has '${urlTenantSlug}' but resolved to '${resolvedTenant.slug}' - returning 404`,
        );
        return new NextResponse("Tenant not found", { status: 404 });
      }
    }
  }

  // 3. Validate tenant access for authenticated users
  const tenantValidation = await validateTenantAccess(request);
  if (tenantValidation.status === 302) {
    return tenantValidation; // This is a redirect response
  }

  // 4. Set headers for all internal requests
  const response = NextResponse.next();
  response.headers.set("x-tenant", resolvedTenant.slug);
  response.headers.set("x-tenant-id", resolvedTenant.id);
  response.headers.set("x-tenant-mode", resolvedTenant.featureMode);
  response.headers.set("x-tenant-locale", resolvedTenant.locale);
  response.headers.set("x-tenant-currency", resolvedTenant.currency);

  // Add security headers to prevent session sharing
  response.headers.set("x-tenant-isolation", "strict");

  // Set CSRF token for GET requests if not already set
  if (method === "GET" && !isCsrfExempt(pathname)) {
    const cookieHeader = request.headers.get("cookie") || "";
    const existingToken = extractCookieValue(cookieHeader, CSRF_COOKIE_NAME);

    if (!existingToken) {
      // Generate new CSRF token
      const csrfToken = generateCsrfToken();
      const csrfHash = await hashCsrfToken(csrfToken);

      // Set cookie with the hash
      response.cookies.set(CSRF_COOKIE_NAME, csrfHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      // Set header with the raw token for client-side access
      response.headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  // 4. Log metrics for unknown hosts
  const unknownHostRate = (unknownHostCount / totalHostResolutions) * 100;
  if (unknownHostRate > 5) {
    // Log if > 5% of resolutions use fallback
    console.log(
      `High unknown host rate: ${unknownHostRate.toFixed(2)}% (${unknownHostCount}/${totalHostResolutions})`,
    );
  }

  return response;
}

async function resolveTenantStrict(
  request: NextRequest,
): Promise<ResolvedTenant> {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const host = request.headers.get("host") || "";

  // 1. Check X-Tenant header (for internal requests)
  const tenantHeader = request.headers.get("x-tenant");
  if (tenantHeader && KNOWN_TENANTS.includes(tenantHeader)) {
    return buildTenantResponse(tenantHeader);
  }

  // 2. Check subdomain
  const subdomain = extractSubdomain(host);
  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "api" &&
    KNOWN_TENANTS.includes(subdomain)
  ) {
    return buildTenantResponse(subdomain);
  }

  // 3. Check path parameter (/t/{tenant})
  if (pathname.startsWith("/t/")) {
    const pathSegments = pathname.split("/");
    if (pathSegments.length >= 3) {
      const tenantSlug = pathSegments[2];
      if (KNOWN_TENANTS.includes(tenantSlug)) {
        return buildTenantResponse(tenantSlug);
      }
    }
  }

  // 4. Check localhost development with query param (?tenant=wondernails)
  if (
    process.env.NODE_ENV === "development" &&
    (host.includes("localhost") || host.includes("127.0.0.1"))
  ) {
    const tenantQuery = url.searchParams.get("tenant");
    if (tenantQuery && KNOWN_TENANTS.includes(tenantQuery)) {
      return buildTenantResponse(tenantQuery);
    }
  }

  // 5. Check cookie (development only)
  if (process.env.NODE_ENV === "development") {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const tenantCookie = extractCookieValue(cookieHeader, "tenant");
      if (tenantCookie && KNOWN_TENANTS.includes(tenantCookie)) {
        return buildTenantResponse(tenantCookie);
      }
    }
  }

  // 6. Fallback to zo-system and log unknown host
  unknownHostCount++;
  console.log(`Unknown host '${host}' using fallback tenant 'zo-system'`);
  return buildTenantResponse("zo-system");
}

function buildTenantResponse(slug: string): ResolvedTenant {
  // Simplified mapping - in production this would come from DB
  const tenantModes: Record<string, "catalog" | "booking"> = {
    wondernails: "booking",
    vigistudio: "booking",
    "centro-tenistico": "booking",
    "vainilla-vargas": "catalog",
    delirios: "catalog",
    "nom-nom": "catalog",
    "zo-system": "catalog",
  };

  return {
    id: slug, // In production, this would be a UUID
    slug,
    featureMode: tenantModes[slug] || "catalog",
    locale: "es-MX",
    currency: "MXN",
  };
}

function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(":")[0];
  const parts = hostWithoutPort.split(".");

  // For localhost development
  if (
    hostWithoutPort === "localhost" ||
    hostWithoutPort.includes("127.0.0.1")
  ) {
    return null;
  }

  // For production domains like tenant.sassstore.com
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

function extractCookieValue(
  cookieHeader: string,
  cookieName: string,
): string | null {
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - tenants (tenant assets - images, CSS, etc.)
     * - public static assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|tenants).*)",
  ],
};
