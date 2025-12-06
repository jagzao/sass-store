import { NextResponse } from "next/server";
import { db } from "@sass-store/database";

/**
 * Debug endpoint to verify database connection and query tenants
 */
export async function GET() {
  try {
    console.log("[DEBUG /api/debug/db] Testing database connection...");

    // Try to query tenants
    const tenants = await db.query.tenants.findMany({
      limit: 5,
    });

    console.log(`[DEBUG /api/debug/db] Found ${tenants.length} tenants`);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      tenantCount: tenants.length,
      tenants: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG /api/debug/db] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
