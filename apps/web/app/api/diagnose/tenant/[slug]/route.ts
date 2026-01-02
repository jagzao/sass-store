import { NextRequest, NextResponse } from "next/server";
import { getTenantBySlug } from "@/lib/server/get-tenant";
import { checkDatabaseConnection } from "@sass-store/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Check database connection
    const dbConnected = await checkDatabaseConnection();

    // Get tenant data
    const tenant = await getTenantBySlug(slug);

    return NextResponse.json({
      success: true,
      data: {
        slug,
        tenantExists: !!tenant,
        tenant: tenant
          ? {
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              mode: tenant.mode,
              branding: tenant.branding,
            }
          : null,
        databaseConnected: dbConnected,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`[DIAGNOSE] Error checking tenant:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check tenant",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
