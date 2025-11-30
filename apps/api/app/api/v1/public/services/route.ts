import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantSlug = searchParams.get("tenant");
    const featured = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!tenantSlug) {
      return NextResponse.json(
        { error: "Tenant slug is required" },
        { status: 400 }
      );
    }

    // First get tenant ID
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, tenantSlug),
      columns: { id: true },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Build query conditions
    const conditions = [
      eq(services.tenantId, tenant.id),
      eq(services.active, true),
    ];

    if (featured) {
      conditions.push(eq(services.featured, true));
    }

    // Fetch services
    const data = await db.query.services.findMany({
      where: and(...conditions),
      orderBy: [desc(services.createdAt)],
      limit: limit,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API] Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
