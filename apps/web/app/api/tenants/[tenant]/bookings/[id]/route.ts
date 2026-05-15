import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { bookings, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
      .returning({ id: bookings.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to this tenant" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const result = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)),
      with: { service: true, staff: true, customer: true },
    });

    if (!result) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: { ...result, totalPrice: Number(result.totalPrice) },
    });
  } catch (error) {
    console.error("Booking GET by ID error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
