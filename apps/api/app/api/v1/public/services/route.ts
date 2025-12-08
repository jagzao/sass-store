import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq, and, desc, sql } from "drizzle-orm";

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

    try {
      // First try using the ORM approach
      const conditions = [
        eq(services.tenantId, tenant.id),
        eq(services.active, true),
      ];

      if (featured) {
        conditions.push(eq(services.featured, true));
      }

      // Fetch services using ORM
      const data = await db.query.services.findMany({
        where: and(...conditions),
        orderBy: [desc(services.createdAt)],
        limit: limit,
      });

      return NextResponse.json({ data });
    } catch (ormError) {
      console.log("[API] ORM query failed, falling back to raw SQL:", ormError);
      
      // If ORM fails, try with raw SQL using snake_case column names
      // First, let's try without the problematic columns
      let query = sql`
        SELECT
          id,
          tenant_id as "tenantId",
          name,
          description,
          price,
          duration,
          featured,
          active,
          metadata,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM services
        WHERE tenant_id = ${tenant.id}
        AND active = true
      `;

      if (featured) {
        query = sql`${query} AND featured = true`;
      }

      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit}`;

      console.log("Executing fallback query:", query);
      const result = await db.execute(query);
      console.log("Fallback query result:", result);

      // The result from execute is already in the correct format
      const data = result;
      
      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error("[API] Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
