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
import { tenantLogger } from "@/lib/logger";

// Known tenant slugs from seed data
const KNOWN_TENANTS = [
  "wondernails",
  "centro-tenistico",
  "delirios",
  "manada-juma",
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

// STRY-021: Next.js 16 renombró middleware → proxy. El export debe llamarse `proxy`.
export async function proxy(request: NextRequest) {
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
      tenantLogger.warn(
        `[SECURITY] Tenant consistency check failed for user ${sessionTenant.userId}`,
      );

      // Return safe error without revealing internals
      return new NextResponse("Access denied", { status: 403 });
    }
  }

  // =========================================
  // STEP 4: SECURITY CHECK - CSRF Protection
  // Para rutas de página (formularios SSR). Las rutas /api/* no necesitan
  // CSRF token explícito porque:
  //   a) Están protegidas por auth() + SameSite=lax cookies
  //   b) Los componentes React usan fetch sin CSRF headers (no hay middleware global)
  //   c) El Origin check (STEP 5) protege contra CSRF cross-origin para APIs
  // =========================================
  const isApiRoute = pathname.startsWith("/api/");
  const isExternalWebhook =
    pathname.startsWith("/api/whatsapp/") ||
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/internal/");

  // Solo aplicar CSRF token check a rutas de PÁGINA (no APIs)
  if (!isCsrfExempt(pathname) && !isExternalWebhook && !isApiRoute) {
    if (CSRF_PROTECTED_METHODS.includes(method)) {
      const csrfTokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
      const cookieHeader = request.headers.get("cookie") || "";
      const csrfTokenFromCookie = extractCookieValue(
        cookieHeader,
        CSRF_COOKIE_NAME,
      );

      if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
        // SECURITY: Redacted sensitive log;
        return new NextResponse("CSRF token missing", { status: 403 });
      }

      // Validate the token
      const isValid = await validateCsrfToken(
        csrfTokenFromHeader,
        csrfTokenFromCookie,
      );
      if (!isValid) {
        // SECURITY: Redacted sensitive log;
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
      tenantLogger.warn(
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
          tenantLogger.warn(
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
        const devHeaders = new Headers(request.headers);
        devHeaders.set("x-tenant", urlTenantResolved.slug);
        devHeaders.set("x-tenant-id", urlTenantResolved.id);
        devHeaders.set("x-tenant-mode", urlTenantResolved.featureMode);
        devHeaders.set("x-tenant-locale", urlTenantResolved.locale);
        devHeaders.set("x-tenant-currency", urlTenantResolved.currency);
        const response = NextResponse.next({
          request: { headers: devHeaders },
        });
        setTenantHeaders(response, urlTenantResolved);
        return response;
      }

      // In production, warn if URL tenant doesn't match resolved tenant
      if (
        process.env.NODE_ENV === "production" &&
        urlTenantSlug !== resolvedTenant.slug &&
        !KNOWN_TENANTS.includes(urlTenantSlug)
      ) {
        tenantLogger.warn(
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
  // Forward tenant headers to the request so Server Components can read
  // them via `headers()` from next/headers (response.headers alone does not
  // reach Server Component / API Route handlers in Next.js App Router).
  // =========================================
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("x-tenant", resolvedTenant.slug);
  forwardedHeaders.set("x-tenant-id", resolvedTenant.id);
  forwardedHeaders.set(
    "x-tenant-mode",
    resolvedTenant.featureMode || "catalog",
  );
  forwardedHeaders.set("x-tenant-locale", resolvedTenant.locale || "es-MX");
  forwardedHeaders.set("x-tenant-currency", resolvedTenant.currency || "MXN");

  const response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });
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
        secure:
          process.env.NODE_ENV === "production" &&
          !request.url.includes("localhost"),
        sameSite: "lax", // Changed from strict to lax to allow testing without HTTPS
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      });

      // Set header with the raw token for client-side access
      response.headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  // Log metrics for unknown hosts (only in production or when rate is high)
  const unknownHostRate = (unknownHostCount / totalHostResolutions) * 100;
  if (unknownHostRate > 5 && process.env.NODE_ENV === "production") {
    tenantLogger.warn(
      `High unknown host rate: ${unknownHostRate.toFixed(2)}% (${unknownHostCount}/${totalHostResolutions})`,
    );
  }

  return response;
}

/**
 * Set tenant headers on response
 */
function setTenantHeaders(response: NextResponse, tenant: any) {
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

  // Priority 3 (ELIMINADO STRY-021 SEC-006):
  // x-internal-request era falseable por cualquier cliente externo.
  // Las llamadas servicio-a-servicio deben usar /t/{slug}/ o subdomain.
  // Si se necesita en el futuro: implementar con JWT firmado o IP allowlist.

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

  // Fallback: Use default tenant (zo-system)
  unknownHostCount++;

  // Only warn for unexpected external hosts in production.
  // In development, localhost paths without a /t/ prefix (e.g. /, /auth, /admin)
  // always reach this branch — that is expected and not worth logging.
  const isLocalhost =
    host.includes("localhost") || host.includes("127.0.0.1") || host === "";
  if (process.env.NODE_ENV === "production" || !isLocalhost) {
    console.warn(
      `[TenantResolution] Unknown host '${host}' — falling back to 'zo-system'`,
    );
  }

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

// STRY-021 SEC-005: Mapa slug → UUID real.
// Poblar con los UUIDs de la BD: SELECT id, slug FROM tenants;
// Hasta que se implemente la consulta edge (STRY-022), las vars de entorno
// son la fuente de verdad. Si una var no está seteada, cae en el slug como
// fallback (compatible hacia atrás, pero sin protección UUID real).
const TENANT_UUID_MAP: Record<string, string> = {
  wondernails: process.env.TENANT_UUID_WONDERNAILS || "wondernails",
  "centro-tenistico":
    process.env.TENANT_UUID_CENTRO_TENISTICO || "centro-tenistico",
  delirios: process.env.TENANT_UUID_DELIRIOS || "delirios",
  "manada-juma": process.env.TENANT_UUID_MANADA_JUMA || "manada-juma",
  "zo-system": process.env.TENANT_UUID_ZO_SYSTEM || "zo-system",
};

function buildTenantResponse(slug: string): FullResolvedTenant {
  const tenantModes: Record<string, "catalog" | "booking"> = {
    wondernails: "booking",
    "centro-tenistico": "booking",
    delirios: "catalog",
    "manada-juma": "booking",
    "zo-system": "catalog",
  };

  return {
    // STRY-021 SEC-005: usar UUID real cuando está disponible vía env var
    id: TENANT_UUID_MAP[slug] ?? slug,
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
     * STRY-021 SEC-004: /api/* ahora INCLUIDO para que reciba headers de
     * tenant (x-tenant, x-tenant-id) y las verificaciones de seguridad.
     * Solo se excluyen assets estáticos de Next.js y tenants/ (logos/CSS).
     */
    "/((?!_next/static|_next/image|favicon.ico|tenants/).*)",
  ],
};
