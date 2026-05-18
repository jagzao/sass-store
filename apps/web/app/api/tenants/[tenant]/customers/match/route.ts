import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";
import {
  findCustomerMatches,
  pickBestCustomerMatch,
} from "@/lib/customers/match-customer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name") ?? undefined;
    const email = searchParams.get("email") ?? undefined;
    const phone = searchParams.get("phone") ?? undefined;

    const matches = await findCustomerMatches(tenant.id, {
      name,
      email,
      phone,
    });
    const suggested = pickBestCustomerMatch(matches);

    return NextResponse.json({
      data: {
        matches,
        suggestedCustomerId: suggested?.id ?? null,
        suggested,
      },
    });
  } catch (error) {
    console.error("Customer match error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
