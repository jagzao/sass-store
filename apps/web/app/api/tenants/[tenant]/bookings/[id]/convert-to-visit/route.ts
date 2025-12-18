import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  tenants,
  customers,
  customerVisits,
  customerVisitServices,
} from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";

/**
 * Convert Booking to Customer Visit
 *
 * This endpoint converts a completed booking into a customer visit record.
 *
 * Flow:
 * 1. Verify booking exists and belongs to tenant
 * 2. Check if booking is already converted (has customerVisit linked)
 * 3. Find or create customer record
 * 4. Create customerVisit record
 * 5. Link the service to the visit
 * 6. Update booking status to completed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Find booking
    const [booking] = await db.query.bookings.findMany({
      where: and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)),
      with: {
        service: true,
      },
      limit: 1,
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking is already converted
    const existingVisits = await db
      .select()
      .from(customerVisits)
      .where(eq(customerVisits.appointmentId, booking.id))
      .limit(1);

    if (existingVisits.length > 0) {
      return NextResponse.json(
        {
          error: "Booking already converted to visit",
          visitId: existingVisits[0].id,
        },
        { status: 400 },
      );
    }

    // Find or create customer
    let customerId = booking.customerId;

    if (!customerId) {
      // Check if customer exists by email
      if (booking.customerEmail) {
        const [existingCustomer] = await db
          .select()
          .from(customers)
          .where(
            and(
              eq(customers.email, booking.customerEmail),
              eq(customers.tenantId, tenant.id),
            ),
          )
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const [newCustomer] = await db
            .insert(customers)
            .values({
              tenantId: tenant.id,
              name: booking.customerName,
              email: booking.customerEmail,
              phone: booking.customerPhone || null,
            })
            .returning();
          customerId = newCustomer.id;
        }
      } else {
        // Create customer without email
        const [newCustomer] = await db
          .insert(customers)
          .values({
            tenantId: tenant.id,
            name: booking.customerName,
            email: null,
            phone: booking.customerPhone || null,
          })
          .returning();
        customerId = newCustomer.id;
      }
    }

    // Get next visit number for this customer
    const existingVisitsForCustomer = await db
      .select()
      .from(customerVisits)
      .where(eq(customerVisits.customerId, customerId))
      .orderBy(customerVisits.visitNumber);

    const nextVisitNumber =
      existingVisitsForCustomer.length > 0
        ? Math.max(
            ...existingVisitsForCustomer.map((v) => v.visitNumber || 0),
          ) + 1
        : 1;

    // Create customer visit
    const [visit] = await db
      .insert(customerVisits)
      .values({
        tenantId: tenant.id,
        customerId,
        appointmentId: booking.id,
        visitNumber: nextVisitNumber,
        visitDate: booking.startTime,
        totalAmount: booking.totalPrice,
        status: "completed",
        notes: booking.notes || null,
      })
      .returning();

    // Link service to visit
    await db.insert(customerVisitServices).values({
      visitId: visit.id,
      serviceId: booking.serviceId,
      unitPrice: booking.totalPrice,
      quantity: "1",
      subtotal: booking.totalPrice,
      description: booking.service.description || null,
    });

    // Update booking status and link customer
    await db
      .update(bookings)
      .set({
        status: "completed",
        customerId,
      })
      .where(eq(bookings.id, booking.id));

    return NextResponse.json({
      success: true,
      visit,
      customer: { id: customerId },
    });
  } catch (error) {
    console.error("Convert booking to visit error:", error);
    return NextResponse.json(
      {
        error: "Failed to convert booking to visit",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint to check conversion status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Check if visit exists for this booking
    const [visit] = await db
      .select()
      .from(customerVisits)
      .where(eq(customerVisits.appointmentId, bookingId))
      .limit(1);

    return NextResponse.json({
      converted: !!visit,
      visitId: visit?.id || null,
    });
  } catch (error) {
    console.error("Get conversion status error:", error);
    return NextResponse.json(
      { error: "Failed to get conversion status" },
      { status: 500 },
    );
  }
}
