import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware to verify tenant access for protected routes
 * Should be used in API routes that require tenant-specific access
 */
export async function verifyTenantAccess(
  request: NextRequest,
  tenantSlug: string
) {
  try {
    // Get session
    const session = await auth();

    if (!session?.user?.id) {
      return {
        error: "Unauthorized",
        status: 401,
        hasAccess: false,
      };
    }

    // Check if tenant exists
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return {
        error: "Tenant not found",
        status: 404,
        hasAccess: false,
      };
    }

    // For now, allow access if user exists and tenant exists
    // In the future, we can add role-based permissions
    return {
      hasAccess: true,
      tenant,
      user: session.user,
    };
  } catch (error) {
    console.error("Tenant access verification error:", error);
    return {
      error: "Internal server error",
      status: 500,
      hasAccess: false,
    };
  }
}

/**
 * Helper function to create tenant-protected API responses
 */
export function createTenantResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

export function createTenantError(
  error: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error }, { status });
}

/**
 * Higher-order function to wrap API handlers with tenant verification
 */
export function withTenantVerification(
  handler: (request: NextRequest, tenantData: any) => Promise<NextResponse>
) {
  return async function tenantProtectedHandler(
    request: NextRequest,
    context: { params: { tenant: string } }
  ) {
    const tenantSlug = context.params.tenant;

    if (!tenantSlug) {
      return createTenantError("Tenant slug is required", 400);
    }

    const accessResult = await verifyTenantAccess(request, tenantSlug);

    if (!accessResult.hasAccess) {
      return createTenantError(
        accessResult.error || "Access denied",
        accessResult.status || 403
      );
    }

    return handler(request, accessResult);
  };
}
