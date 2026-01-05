import { NextResponse } from "next/server";
import { db } from "@sass-store/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[DIAGNOSTIC] Testing Drizzle Query API...");

    // Check if db.query exists
    if (!db.query) {
      throw new Error("db.query is undefined. Schema might not be loaded.");
    }

    // Check if tenants table is registered
    if (!db.query.tenants) {
      throw new Error(
        "db.query.tenants is undefined. 'tenants' table not in schema.",
      );
    }

    // Attempt actual query
    const tenant = await db.query.tenants.findFirst({
      columns: { id: true, slug: true },
    });

    return NextResponse.json({
      status: "success",
      message: "Drizzle Query API is working",
      tenantFound: !!tenant,
      sample: tenant,
      schemaKeys: Object.keys(db.query || {}),
    });
  } catch (error) {
    console.error("[DIAGNOSTIC] Schema/Query Error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Drizzle Query API Failed",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        schemaKeys: Object.keys(db.query || {}),
      },
      { status: 500 },
    );
  }
}
