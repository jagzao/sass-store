import { NextRequest, NextResponse } from "next/server";
import { db, tenants } from "@sass-store/database";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Clear Google Calendar connection
    await db
      .update(tenants)
      .set({
        googleCalendarId: null,
        googleCalendarTokens: null,
        googleCalendarConnected: false,
      })
      .where(eq(tenants.id, tenant.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect calendar error:", error);
    return NextResponse.json(
      {
        error: "Failed to disconnect calendar",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
