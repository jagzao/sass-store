import { NextRequest, NextResponse } from "next/server";
import {
  generateCsrfToken,
  hashCsrfToken,
  validateCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_PROTECTED_METHODS,
  isCsrfExempt,
  validateOriginForMutation,
  validateTenantConsistency,
  validateMutationSecurity,
  createTenantContextFromJWT,
  ResolvedTenant,
  AuthenticatedTenantContext,
} from "@sass-store/core";
import { verifyAuthToken } from "@sass-store/core/src/middleware/auth-middleware";


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

interface TenantResolution {
  tenant: ResolvedTenant;
  source: "header" | "subdomain" | "path" | "query" | "cookie" | "fallback";
}

let unknownHostCount = 0;
let totalHostResolutions = 0;

/**
 * Extract session tenant from JWT token in Authorization header or cookie
 */
async function getSessionTenant(
  request: NextRequest,
): Promise<AuthenticatedTenantContext | null> {
  try {
    // Try Authorization header first
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const verifyResult = await verifyAuthToken(token);
      if (verifyResult.success) {
        return createTenantContextFromJWT(verifyResult.data);
      }
    }

    // Try session cookie (for web sessions)
    const cookieHeader = request.headers.get("cookie") || "";
    const sessionToken = extractCookieValue(cookieHeader, "session-token");
    if (sessionToken) {
      const verifyResult = await verifyAuthToken(sessionToken);
      if (verifyResult.success) {
        return createTenantContextFromJWT(verifyResult.data);
      }
    }

    return null;
  } catch (error) {
    // Token verification failed - return null (unauthenticated)
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const host = request.headers.get("host") || "";
  const method = request.method;
  const origin = request.headers.get("origin");

  totalHostResolutions++;

  // =========================================
  // STEP 1: Resolve tenant from request
  // =========================================
  const resolution = await resolveTenantStrict(request);
  const resolvedTenant = resolution.tenant;

  // =========================================
  // STEP 2: Get session tenant for security validation
  // =========================================
  const sessionTenant = await getSessionTenant(request);

  // =========================================
  // STEP 3: SECURITY CHECK - Tenant Consistency
  // For authenticated users, validate tenant context
  // =========================================
  if (sessionTenant) {
    const consistencyResult = validateTenantConsistency(
      sessionTenant,
      resolvedTenant,
    );

    if (!consistencyResult.success) {
      // Tenant mismatch - potential spoofing attack
      console.warn(
        `[SECURITY] Tenant consistency check failed for user ${sessionTenant.userId}`,
      );

      // Return safe error without revealing internals
      return new NextResponse("Access denied", { status: 403 });
    }
  }

  // =========================================
  // STEP 4: SECURITY CHECK - CSRF Protection
  // For mutation methods, validate CSRF token
  // =========================================
  if (!isCsrfExempt(pathname)) {
    if (CSRF_PROTECTED_METHODS.includes(method)) {
      const csrfTokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
      const cookieHeader = request.headers.get("cookie") || "";
      const csrfTokenFromCookie = extractCookieValue(
        cookieHeader,
        CSRF_COOKIE_NAME,
      );

      if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
        console.warn(
          `[SECURITY] Missing CSRF token for ${method} ${pathname}`,
        );
        return new NextResponse("CSRF token missing", { status: 403 });
      }

      // Validate the token
      const isValid = await validateCsrfToken(
        csrfTokenFromHeader,
        csrfTokenFromCookie,
      );
      if (!isValid) {
        console.warn(
          `[SECURITY] Invalid CSRF token for ${method} ${pathname}`,
        );
        return new NextResponse("Invalid CSRF token", { status: 403 });
      }
    }
  }

  // =========================================
  // STEP 5: SECURITY CHECK - Origin Validation
  // For mutation methods, validate Origin header
  // =========================================
  if (CSRF_PROTECTED_METHODS.includes(method)) {
    const originResult = validateOriginForMutation(origin, host);

    if (!originResult.isValid) {
      console.warn(
        `[SECURITY] Origin validation failed: origin=${origin}, host=${host}, reason=${originResult.reason}`,
      );
      return new NextResponse("Invalid request origin", { status: 403 });
    }
  }

  // =========================================
  // STEP 6: For tenant routes (/t/{tenant}/*)
  // Validate URL tenant matches resolved tenant
  // =========================================
  if (pathname.startsWith("/t/")) {
    const pathSegments = pathname.split("/");
    if (pathSegments.length >= 3) {
      const urlTenantSlug = pathSegments[2];

      // SECURITY: For authenticated users, URL tenant must match session tenant
      if (sessionTenant && sessionTenant.tenantId) {
        const urlTenantResolved = buildTenantResponse(urlTenantSlug);

        // If URL tenant doesn't match session tenant, this could be:
        // 1. User trying to access another tenant's data
        // 2. Attacker trying to spoof tenant via URL
        if (urlTenantResolved.id !== sessionTenant.tenantId) {
          console.warn(
            `[SECURITY] URL tenant mismatch: url=${urlTenantSlug}, session=${sessionTenant.tenantId}`,
          );

          // Redirect to user's actual tenant
          const correctPath = pathname.replace(
            `/t/${urlTenantSlug}`,
            `/t/${sessionTenant.tenantSlug || sessionTenant.tenantId}`,
          );
          return NextResponse.redirect(new URL(correctPath, request.url));
        }
      }

      // In development, allow URL tenant to override resolved tenant
      if (process.env.NODE_ENV === "development") {
        const urlTenantResolved = buildTenantResponse(urlTenantSlug);
        const response = NextResponse.next();
        setTenantHeaders(response, urlTenantResolved);
        return response;
      }

      // In production, warn if URL tenant doesn't match resolved tenant
      if (
        process.env.NODE_ENV === "production" &&
        urlTenantSlug !== resolvedTenant.slug &&
        !KNOWN_TENANTS.includes(urlTenantSlug)
      ) {
        console.log(
          `Tenant URL '${urlTenantSlug}' might be new or custom domain. Passing to app layer.`,
        );
      }
    }
  }

  // =========================================
  // STEP 7: Validate tenant access for authenticated users
  // Skip for public routes
  // =========================================
  const isPublicRoute =
    pathname === `/t/${resolvedTenant.slug}` ||
    pathname.startsWith(`/t/${resolvedTenant.slug}/products`) ||
    pathname.startsWith(`/t/${resolvedTenant.slug}/cart`) ||
    pathname.startsWith(`/t/${resolvedTenant.slug}/checkout`) ||
    pathname.startsWith(`/t/${resolvedTenant.slug}/login`) ||
    pathname.startsWith(`/t/${resolvedTenant.slug}/services`);

  // Database-level tenant validation and RLS context setting
  // runs at the Server Component or API Route level.

  // =========================================
  // STEP 8: Build response with security headers
  // =========================================
  const response = NextResponse.next();
  setTenantHeaders(response, resolvedTenant);

  // Add security headers to prevent session sharing
  response.headers.set("x-tenant-isolation", "strict");
  response.headers.set("x-tenant-validated", sessionTenant ? "true" : "false");

  // Add user role header for HomeTenant routing (public routes only)
  // This allows the HomeRouter to determine which home view to show
  if (isPublicRoute && sessionTenant?.role) {
    response.headers.set("x-tenant-user-role", sessionTenant.role);
  }

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
        secure: process.env.NODE_ENV === "production" && !request.url.includes("localhost"),
        sameSite: "lax", // Changed from strict to lax to allow testing without HTTPS
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      // Set header with the raw token for client-side access
      response.headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  // Log metrics for unknown hosts
  const unknownHostRate = (unknownHostCount / totalHostResolutions) * 100;
  if (unknownHostRate > 5) {
    console.log(
      `High unknown host rate: ${unknownHostRate.toFixed(2)}% (${unknownHostCount}/${totalHostResolutions})`,
    );
  }

  return response;
}

/**
 * Set tenant headers on response
 */
function setTenantHeaders(response: NextResponse, tenant: ResolvedTenant) {
  response.headers.set("x-tenant", tenant.slug);
  response.headers.set("x-tenant-id", tenant.id);
  response.headers.set("x-tenant-mode", tenant.featureMode);
  response.headers.set("x-tenant-locale", tenant.locale);
  response.headers.set("x-tenant-currency", tenant.currency);
}

/**
 * Resolve tenant following strict priority order
 * NEVER trust client headers alone for authorization
 */
async function resolveTenantStrict(
  request: NextRequest,
): Promise<TenantResolution> {
  const url = request.nextUrl;
  const pathname = url.pathname;
  const host = request.headers.get("host") || "";

  // Priority 1: Path parameter (/t/{tenant}) - most reliable for web routes
  if (pathname.startsWith("/t/")) {
    const pathSegments = pathname.split("/");
    if (pathSegments.length >= 3) {
      const tenantSlug = pathSegments[2];
      if (KNOWN_TENANTS.includes(tenantSlug)) {
        return {
          tenant: buildTenantResponse(tenantSlug),
          source: "path",
        };
      }
    }
  }

  // Priority 2: Subdomain (for custom domain tenants)
  const subdomain = extractSubdomain(host);
  if (
    subdomain &&
    subdomain !== "www" &&
    subdomain !== "api" &&
    KNOWN_TENANTS.includes(subdomain)
  ) {
    return {
      tenant: buildTenantResponse(subdomain),
      source: "subdomain",
    };
  }

  // Priority 3: X-Tenant header (ONLY for internal service-to-service calls)
  // WARNING: This should NOT be trusted for client authorization
  const tenantHeader = request.headers.get("x-tenant");
  const isInternalRequest =
    request.headers.get("x-internal-request") === "true" ||
    request.headers.get("user-agent")?.includes("internal-service");

  if (tenantHeader && isInternalRequest && KNOWN_TENANTS.includes(tenantHeader)) {
    return {
      tenant: buildTenantResponse(tenantHeader),
      source: "header",
    };
  }

  // Priority 4: Development-only query param (?tenant=wondernails)
  if (
    process.env.NODE_ENV === "development" &&
    (host.includes("localhost") || host.includes("127.0.0.1"))
  ) {
    const tenantQuery = url.searchParams.get("tenant");
    if (tenantQuery && KNOWN_TENANTS.includes(tenantQuery)) {
      return {
        tenant: buildTenantResponse(tenantQuery),
        source: "query",
      };
    }

    // Priority 5: Development-only cookie
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const tenantCookie = extractCookieValue(cookieHeader, "tenant");
      if (tenantCookie && KNOWN_TENANTS.includes(tenantCookie)) {
        return {
          tenant: buildTenantResponse(tenantCookie),
          source: "cookie",
        };
      }
    }
  }

  // Fallback: Use default tenant and log
  unknownHostCount++;
  console.log(
    `[TenantResolution] Unknown host '${host}' using fallback tenant 'zo-system'`,
  );
  return {
    tenant: buildTenantResponse("zo-system"),
    source: "fallback",
  };
}

interface FullResolvedTenant extends ResolvedTenant {
  featureMode: "catalog" | "booking";
  locale: string;
  currency: string;
}

function buildTenantResponse(slug: string): FullResolvedTenant {
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
    source: "fallback",
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
