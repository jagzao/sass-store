import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants, userRoles } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Middleware to validate tenant context for authenticated users
 * This ensures that users can only access tenants they have permissions for
 */
export async function validateTenantAccess(request: NextRequest) {
  const session = await auth();

  // If user is not authenticated, allow the request to continue
  if (!session?.user) {
    return NextResponse.next();
  }

  // Get tenant slug from the request headers (set by the main middleware)
  const tenantSlug = request.headers.get("x-tenant");

  if (!tenantSlug) {
    console.error("[TenantValidation] Missing x-tenant header");
    return NextResponse.redirect(
      new URL("/auth/signin?error=missing_tenant", request.url),
    );
  }

  // If the user's session tenant doesn't match the current tenant, invalidate session
  if (session.user.tenantSlug !== tenantSlug) {
    console.warn(
      `[TenantValidation] Session tenant mismatch: user session is for '${session.user.tenantSlug}' but trying to access '${tenantSlug}' - invalidating session`,
    );

    // For tenant mismatch, we need to invalidate the current session and redirect to login
    // This ensures strict tenant isolation
    return NextResponse.redirect(
      new URL(
        `/t/${tenantSlug}/login?error=tenant_mismatch&current_tenant=${session.user.tenantSlug}`,
        request.url,
      ),
    );
  }

  // If tenant matches session tenant, validate tenant exists and set context
  try {
    // Check if the tenant exists
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      console.error(`[TenantValidation] Tenant not found: ${tenantSlug}`);
      return NextResponse.redirect(
        new URL("/auth/signin?error=tenant_not_found", request.url),
      );
    }

    // Check if the user has access to this tenant
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
        `[TenantValidation] User ${session.user.id} does not have access to tenant ${tenantSlug}`,
      );
      return NextResponse.redirect(
        new URL("/auth/signin?error=access_denied", request.url),
      );
    }

    // Set the tenant context in the database for this request
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
 */
export async function getValidatedTenantContext(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  const tenantSlug = request.headers.get("x-tenant");

  if (!tenantSlug) {
    return { error: "Missing tenant context", status: 400 };
  }

  try {
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return { error: "Tenant not found", status: 404 };
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
      return { error: "Access denied", status: 403 };
    }

    // Set tenant context in database
    await db.execute(sql`SELECT set_tenant_context(${tenant.id}::uuid)`);

    return {
      tenant,
      userRole: userRole.role,
      user: session.user,
    };
  } catch (error) {
    console.error(
      "[TenantValidation] Error getting validated tenant context:",
      error,
    );
    return { error: "Internal server error", status: 500 };
  }
}
