/**
 * Tenant Security Utilities
 * SEC-005: Prevents tenant header spoofing and enforces strict tenant isolation
 * 
 * Security Principles:
 * 1. Never trust client-provided tenant headers for authorization
 * 2. Always validate tenant against authenticated session/token
 * 3. Enforce Origin/Host validation for mutation requests
 * 4. Reject inconsistent tenant contexts with safe errors
 */

import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

/**
 * Tenant context from authenticated session/token
 */
export interface AuthenticatedTenantContext {
  userId: string;
  tenantId: string;
  tenantSlug?: string;
  role: string;
}

/**
 * Tenant resolution result
 */
export interface ResolvedTenant {
  id: string;
  slug: string;
  source: "session" | "header" | "path" | "subdomain" | "fallback";
}

/**
 * Origin validation result
 */
export interface OriginValidationResult {
  isValid: boolean;
  origin?: string;
  reason?: string;
}

/**
 * Allowed origins configuration
 * In production, this should come from environment/Tenant DB
 */
const getAllowedOrigins = (): string[] => {
  const baseOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  // Add production origins from environment
  if (process.env.NEXT_PUBLIC_APP_URL) {
    baseOrigins.push(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.ALLOWED_ORIGINS) {
    baseOrigins.push(...process.env.ALLOWED_ORIGINS.split(","));
  }

  return baseOrigins;
};

/**
 * Validate Origin header for mutation requests
 * Prevents CSRF attacks by ensuring request comes from allowed origin
 * 
 * @param origin - The Origin header value
 * @param host - The Host header value
 * @returns OriginValidationResult
 */
export function validateOriginForMutation(
  origin: string | null,
  host: string | null
): OriginValidationResult {
  // If no origin (same-origin request), check host
  if (!origin) {
    // For same-origin requests, origin might be null
    // In this case, we rely on CSRF token validation
    return {
      isValid: true,
      reason: "same_origin_request",
    };
  }

  const allowedOrigins = getAllowedOrigins();
  
  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return {
      isValid: true,
      origin,
    };
  }

  // Check if origin matches host (same-origin)
  if (host) {
    const originHost = extractHostFromOrigin(origin);
    const isSameOrigin = originHost === host || 
                         originHost === `localhost:${host.split(":")[1]}` ||
                         host.startsWith(originHost);
    
    if (isSameOrigin) {
      return {
        isValid: true,
        origin,
      };
    }
  }

  // Check for tenant-specific subdomain patterns
  // e.g., tenant.sassstore.com or tenant.localhost:3001
  const originHostname = extractHostnameFromOrigin(origin);
  if (isValidTenantSubdomain(originHostname, host)) {
    return {
      isValid: true,
      origin,
    };
  }

  return {
    isValid: false,
    origin,
    reason: "origin_not_allowed",
  };
}

/**
 * Extract host from origin URL
 */
function extractHostFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    return url.host;
  } catch {
    return origin;
  }
}

/**
 * Extract hostname from origin URL
 */
function extractHostnameFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    return url.hostname;
  } catch {
    return origin;
  }
}

/**
 * Check if origin is a valid tenant subdomain
 */
function isValidTenantSubdomain(originHostname: string, host: string | null): boolean {
  // Allow localhost with any subdomain for development
  if (process.env.NODE_ENV === "development") {
    if (originHostname === "localhost" || originHostname.endsWith(".localhost")) {
      return true;
    }
  }

  // Check for production subdomain pattern
  const productionDomain = process.env.PRODUCTION_DOMAIN || "sassstore.com";
  if (originHostname.endsWith(`.${productionDomain}`)) {
    return true;
  }

  return false;
}

/**
 * Validate tenant consistency between session and request
 * This is the core security check to prevent tenant spoofing
 * 
 * @param sessionTenant - Tenant from authenticated session/token
 * @param requestTenant - Tenant from request (header/path/subdomain)
 * @returns Result indicating if tenant context is valid
 */
export function validateTenantConsistency(
  sessionTenant: AuthenticatedTenantContext | null,
  requestTenant: ResolvedTenant | null
): Result<void, DomainError> {
  // If no session (unauthenticated), allow request to proceed
  // Public routes don't require tenant validation
  if (!sessionTenant) {
    return Ok(undefined);
  }

  // If session has no tenant (super admin), allow
  if (!sessionTenant.tenantId) {
    return Ok(undefined);
  }

  // If no request tenant resolved, this is an error for authenticated users
  if (!requestTenant) {
    return Err(
      ErrorFactories.validation(
        "tenant_required",
        "Tenant context required for authenticated request"
      )
    );
  }

  // CRITICAL: Validate tenant ID matches
  // The request tenant MUST match the session tenant
  if (sessionTenant.tenantId !== requestTenant.id) {
    // Log security event (in production, use proper security logging)
    console.warn(
      `[SECURITY] Tenant mismatch detected: session=${sessionTenant.tenantId}, request=${requestTenant.id}, user=${sessionTenant.userId}`
    );

    return Err(
      ErrorFactories.authorization(
        "Tenant context mismatch",
        "tenant_isolation_violation"
      )
    );
  }

  return Ok(undefined);
}

/**
 * Validate that a user has access to a specific tenant
 * This should be called for all authenticated mutation operations
 * 
 * @param userId - User ID from session
 * @param userTenantId - User's tenant ID from session
 * @param targetTenantId - Target tenant ID from request/resource
 * @returns Result indicating if access is allowed
 */
export function validateTenantAccess(
  userId: string,
  userTenantId: string | undefined,
  targetTenantId: string | undefined
): Result<void, DomainError> {
  // Super admin (no tenant) can access any tenant
  if (!userTenantId) {
    return Ok(undefined);
  }

  // If no target specified, allow (will use user's tenant)
  if (!targetTenantId) {
    return Ok(undefined);
  }

  // CRITICAL: User can only access their own tenant
  if (userTenantId !== targetTenantId) {
    console.warn(
      `[SECURITY] Cross-tenant access blocked: user=${userId}, userTenant=${userTenantId}, targetTenant=${targetTenantId}`
    );

    return Err(
      ErrorFactories.authorization(
        "Cross-tenant access is not allowed",
        "tenant_isolation"
      )
    );
  }

  return Ok(undefined);
}

/**
 * Create a secure tenant context from JWT payload
 * This extracts tenant information from a verified JWT
 */
export function createTenantContextFromJWT(payload: {
  userId: string;
  tenantId?: string;
  role: string;
}): AuthenticatedTenantContext | null {
  if (!payload.userId) {
    return null;
  }

  return {
    userId: payload.userId,
    tenantId: payload.tenantId || "",
    role: payload.role,
  };
}

/**
 * Check if a request is a mutation (state-changing) request
 */
export function isMutationRequest(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

/**
 * Combined security validation for mutation requests
 * Performs all security checks in one call
 * 
 * @param method - HTTP method
 * @param origin - Origin header
 * @param host - Host header
 * @param sessionTenant - Tenant from session
 * @param requestTenant - Tenant from request
 * @returns Result indicating if request should be allowed
 */
export function validateMutationSecurity(
  method: string,
  origin: string | null,
  host: string | null,
  sessionTenant: AuthenticatedTenantContext | null,
  requestTenant: ResolvedTenant | null
): Result<void, DomainError> {
  // 1. Validate Origin for mutation requests
  if (isMutationRequest(method)) {
    const originResult = validateOriginForMutation(origin, host);
    if (!originResult.isValid) {
      console.warn(
        `[SECURITY] Invalid origin for mutation: origin=${origin}, host=${host}, reason=${originResult.reason}`
      );
      return Err(
        ErrorFactories.authorization(
          "Invalid request origin",
          "origin_validation_failed"
        )
      );
    }
  }

  // 2. Validate tenant consistency
  const tenantResult = validateTenantConsistency(sessionTenant, requestTenant);
  if (tenantResult.success === false) {
    return tenantResult;
  }

  return Ok(undefined);
}

/**
 * Extract tenant slug from various request sources
 * Priority: path > subdomain > header
 */
export function extractTenantFromRequest(request: {
  pathname: string;
  host: string;
  headers: Record<string, string | null>;
}): string | null {
  // 1. Check path parameter (/t/{tenant})
  if (request.pathname.startsWith("/t/")) {
    const segments = request.pathname.split("/");
    if (segments.length >= 3 && segments[2]) {
      return segments[2];
    }
  }

  // 2. Check subdomain
  const subdomain = extractSubdomain(request.host);
  if (subdomain && subdomain !== "www" && subdomain !== "api") {
    return subdomain;
  }

  // 3. Check header (only for internal/trusted requests)
  const headerTenant = request.headers["x-tenant"];
  if (headerTenant) {
    // WARNING: This should only be trusted for internal service-to-service calls
    // Client requests should NOT be able to set this header for authorization
    return headerTenant;
  }

  return null;
}

/**
 * Extract subdomain from host
 */
function extractSubdomain(host: string): string | null {
  const hostWithoutPort = host.split(":")[0];
  
  // Localhost handling
  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return null;
  }

  const parts = hostWithoutPort.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Create a safe error response that doesn't leak internal information
 */
export function createSafeTenantError(
  error: DomainError
): { status: number; message: string } {
  // Map internal errors to safe public messages
  switch (error.type) {
    case "AuthorizationError":
      return {
        status: 403,
        message: "Access denied",
      };
    case "AuthenticationError":
      return {
        status: 401,
        message: "Authentication required",
      };
    case "ValidationError":
      return {
        status: 400,
        message: "Invalid request",
      };
    default:
      return {
        status: 500,
        message: "An error occurred",
      };
  }
}
