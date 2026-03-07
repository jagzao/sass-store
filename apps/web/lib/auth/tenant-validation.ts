import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants, userRoles } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  validateTenantAccess as coreValidateTenantAccess,
  validateTenantConsistency,
  createTenantContextFromJWT,
  AuthenticatedTenantContext,
  ResolvedTenant,
} from "@sass-store/core";
import { verifyAuthToken } from "@sass-store/core/src/middleware/auth-middleware";
import { Result, Err, Ok } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

/**
 * Middleware to validate tenant context for authenticated users
 * This ensures that users can only access tenants they have permissions for
 * 
 * SECURITY: This function enforces strict tenant isolation
 * - Validates tenant from session against request tenant
 * - Prevents tenant header spoofing
 * - Ensures user has explicit role in tenant
 */
export async function validateTenantAccess(request: NextRequest) {
  const session = await auth();

  // If user is not authenticated, allow the request to continue
  // (Public routes will handle their own access control)
  if (!session?.user) {
    return NextResponse.next();
  }

  // Get tenant slug from the request headers (set by the main middleware)
  const tenantSlug = request.headers.get("x-tenant");
  const tenantId = request.headers.get("x-tenant-id");

  if (!tenantSlug) {
    console.error("[TenantValidation] Missing x-tenant header");
    return NextResponse.redirect(
      new URL("/auth/signin?error=missing_tenant", request.url),
    );
  }

  // SECURITY: Validate session tenant matches request tenant
  // This prevents users from spoofing tenant headers to access other tenants
  if (session.user.tenantSlug && session.user.tenantSlug !== tenantSlug) {
    console.warn(
      `[SECURITY] Tenant mismatch detected: session tenant '${session.user.tenantSlug}' != request tenant '${tenantSlug}' - user: ${session.user.id}`,
    );

    // Invalidate session and redirect to login
    // This ensures strict tenant isolation
    return NextResponse.redirect(
      new URL(
        `/t/${tenantSlug}/login?error=tenant_mismatch`,
        request.url,
      ),
    );
  }

  // If tenant matches session tenant, validate tenant exists and set context
  try {
    // Check if the tenant exists in database
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      console.error(`[TenantValidation] Tenant not found: ${tenantSlug}`);
      return NextResponse.redirect(
        new URL("/auth/signin?error=tenant_not_found", request.url),
      );
    }

    // SECURITY: Verify the tenant ID from header matches database
    if (tenantId && tenant.id !== tenantId) {
      console.error(
        `[SECURITY] Tenant ID mismatch: header='${tenantId}' != db='${tenant.id}'`,
      );
      return NextResponse.redirect(
        new URL("/auth/signin?error=invalid_tenant", request.url),
      );
    }

    // SECURITY: Check if the user has explicit access to this tenant
    const [userRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.tenantId, tenant.id),
        ),
      )
      .limit(1);

    if (!userRole) {
      console.error(
        `[SECURITY] User ${session.user.id} does not have access to tenant ${tenantSlug}`,
      );
      return NextResponse.redirect(
        new URL("/auth/signin?error=access_denied", request.url),
      );
    }

    // Set the tenant context in the database for RLS
    try {
      await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);
    } catch (error) {
      console.error("[TenantValidation] Failed to set tenant context:", error);
      return NextResponse.redirect(
        new URL("/auth/signin?error=database_error", request.url),
      );
    }

    // Create response with tenant validation headers
    const response = NextResponse.next();
    response.headers.set("x-tenant-validated", "true");
    response.headers.set("x-tenant-user-role", userRole.role);
    response.headers.set("x-tenant-db-id", tenant.id);

    return response;
  } catch (error) {
    console.error("[TenantValidation] Error validating tenant access:", error);
    return NextResponse.redirect(
      new URL("/auth/signin?error=validation_error", request.url),
    );
  }
}

/**
 * Helper function to get the current tenant context with validation
 * This can be used in server components and API routes
 * 
 * SECURITY: Returns typed Result instead of throwing errors
 */
export async function getValidatedTenantContext(
  request: NextRequest,
): Promise<
  Result<
    {
      tenant: { id: string; slug: string };
      userRole: string;
      user: { id: string; email?: string; tenantSlug?: string };
    },
    DomainError
  >
> {
  const session = await auth();

  if (!session?.user) {
    return Err(
      ErrorFactories.authentication("missing_token", "Authentication required"),
    );
  }

  const tenantSlug = request.headers.get("x-tenant");

  if (!tenantSlug) {
    return Err(
      ErrorFactories.validation("tenant_required", "Missing tenant context"),
    );
  }

  try {
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return Err(
        ErrorFactories.notFound("Tenant", tenantSlug),
      );
    }

    // SECURITY: Verify session tenant matches request tenant
    if (session.user.tenantSlug && session.user.tenantSlug !== tenantSlug) {
      console.warn(
        `[SECURITY] Cross-tenant access attempt: user=${session.user.id}, sessionTenant=${session.user.tenantSlug}, requestTenant=${tenantSlug}`,
      );
      return Err(
        ErrorFactories.authorization(
          "Cross-tenant access is not allowed",
          "tenant_isolation",
        ),
      );
    }

    const [userRole] = await db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, session.user.id),
          eq(userRoles.tenantId, tenant.id),
        ),
      )
      .limit(1);

    if (!userRole) {
      return Err(
        ErrorFactories.authorization(
          "Access denied to this tenant",
          "tenant_access_denied",
        ),
      );
    }

    // Set tenant context in database for RLS
    await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

    return Ok({
      tenant,
      userRole: userRole.role,
      user: {
        id: session.user.id,
        email: session.user.email,
        tenantSlug: session.user.tenantSlug,
      },
    });
  } catch (error) {
    console.error(
      "[TenantValidation] Error getting validated tenant context:",
      error,
    );
    return Err(
      ErrorFactories.database(
        "get_tenant_context",
        "Failed to get tenant context",
        undefined,
        error as Error,
      ),
    );
  }
}

/**
 * Validate tenant access for API routes with JWT authentication
 * This is used by API routes that use Bearer token authentication
 * 
 * @param request - The incoming request
 * @param targetTenantId - Optional target tenant ID from request body/params
 * @returns Result with tenant context or error
 */
export async function validateApiTenantAccess(
  request: NextRequest,
  targetTenantId?: string,
): Promise<
  Result<
    {
      userId: string;
      tenantId: string;
      role: string;
    },
    DomainError
  >
> {
  // Extract JWT from Authorization header
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Err(
      ErrorFactories.authentication(
        "missing_token",
        "Authorization header with Bearer token is required",
      ),
    );
  }

  const token = authHeader.substring(7);

  // Verify JWT
  const verifyResult = await verifyAuthToken(token);
  if (!verifyResult.success) {
    return verifyResult;
  }

  const payload = verifyResult.data;

  // Create tenant context from JWT
  const sessionTenant = createTenantContextFromJWT(payload);
  if (!sessionTenant) {
    return Err(
      ErrorFactories.authentication(
        "invalid_token",
        "Invalid token payload",
      ),
    );
  }

  // Get request tenant from header
  const requestTenantId = request.headers.get("x-tenant-id");
  const requestTenantSlug = request.headers.get("x-tenant");

  // SECURITY: Validate tenant consistency
  // If user has a tenant, request must match
  if (sessionTenant.tenantId) {
    // Check header tenant matches session
    if (requestTenantId && requestTenantId !== sessionTenant.tenantId) {
      console.warn(
        `[SECURITY] API tenant header mismatch: session=${sessionTenant.tenantId}, header=${requestTenantId}`,
      );
      return Err(
        ErrorFactories.authorization(
          "Tenant context mismatch",
          "tenant_isolation_violation",
        ),
      );
    }

    // Check target tenant if specified
    if (targetTenantId && targetTenantId !== sessionTenant.tenantId) {
      console.warn(
        `[SECURITY] API cross-tenant access blocked: user=${sessionTenant.userId}, tenant=${sessionTenant.tenantId}, target=${targetTenantId}`,
      );
      return Err(
        ErrorFactories.authorization(
          "Cross-tenant access is not allowed",
          "tenant_isolation",
        ),
      );
    }
  }

  // Verify user has role in tenant (if tenant specified)
  if (sessionTenant.tenantId) {
    try {
      const [userRole] = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, sessionTenant.userId),
            eq(userRoles.tenantId, sessionTenant.tenantId),
          ),
        )
        .limit(1);

      if (!userRole) {
        return Err(
          ErrorFactories.authorization(
            "Access denied to this tenant",
            "tenant_access_denied",
          ),
        );
      }

      return Ok({
        userId: sessionTenant.userId,
        tenantId: sessionTenant.tenantId,
        role: userRole.role,
      });
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "verify_tenant_role",
          "Failed to verify tenant access",
          undefined,
          error as Error,
        ),
      );
    }
  }

  // User without tenant (super admin) - allow
  return Ok({
    userId: sessionTenant.userId,
    tenantId: "",
    role: sessionTenant.role,
  });
}

/**
 * Check if a request is for a tenant-aware resource
 */
export function isTenantAwareRequest(request: NextRequest): boolean {
  const pathname = request.nextUrl.pathname;
  return pathname.startsWith("/t/") || 
         request.headers.has("x-tenant") ||
         request.headers.has("x-tenant-id");
}

/**
 * Extract tenant slug from request path
 */
export function extractTenantFromPath(pathname: string): string | null {
  if (pathname.startsWith("/t/")) {
    const segments = pathname.split("/");
    if (segments.length >= 3) {
      return segments[2];
    }
  }
  return null;
}
