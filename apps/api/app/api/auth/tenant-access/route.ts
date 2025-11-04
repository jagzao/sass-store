import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@sass-store/database";
import { tenants, users } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/auth/tenant-access
 * Verify if user has access to a specific tenant
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", hasAccess: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tenantSlug } = body;

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "tenantSlug is required", hasAccess: false },
        { status: 400 }
      );
    }

    // Check if tenant exists
    const [tenant] = await db
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found", hasAccess: false },
        { status: 404 }
      );
    }

    // Check if user has access to this tenant
    // For now, we'll allow access if the user exists and tenant exists
    // In the future, we can add more complex permission checks
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const hasAccess = !!user;

    return NextResponse.json({
      hasAccess,
      tenant: hasAccess ? { id: tenant.id, slug: tenant.slug } : null,
    });
  } catch (error) {
    console.error("Tenant access check error:", error);
    return NextResponse.json(
      { error: "Internal server error", hasAccess: false },
      { status: 500 }
    );
  }
}
