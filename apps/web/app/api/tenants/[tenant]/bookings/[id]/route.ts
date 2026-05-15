import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { bookings, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
const patchSchema = z.object({
  status: z.enum(VALID_STATUSES),
});

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;
    const body = await request.json();
    const { status } = patchSchema.parse(body);

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: { ...updated, totalPrice: Number(updated.totalPrice) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Estado inválido", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Booking PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
