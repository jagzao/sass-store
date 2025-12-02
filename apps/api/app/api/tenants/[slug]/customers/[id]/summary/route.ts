import { NextRequest, NextResponse } from "next/server";
import { db, customers, customerVisits, bookings } from "@sass-store/database";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/tenants/[slug]/customers/[id]/summary
 * Get customer summary statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } },
) {
  try {
    const { slug, id } = params;

    // Get tenant ID
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify customer exists
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenant.id)),
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Get visit statistics
    const visitStats = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalSpent: sql<number>`sum(${customerVisits.totalAmount})::numeric`,
        lastVisit: sql<string>`max(${customerVisits.visitDate})`,
      })
      .from(customerVisits)
      .where(
        and(
          eq(customerVisits.customerId, id),
          eq(customerVisits.status, "completed"),
        ),
      );

    // Get next appointment from bookings table
    const nextAppointment = await db
      .select({
        startTime: bookings.startTime,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.tenantId, tenant.id),
          eq(bookings.customerName, customer.name), // Match by name for now
          sql`${bookings.startTime} > NOW()`,
          sql`${bookings.status} IN ('pending', 'confirmed')`,
        ),
      )
      .orderBy(bookings.startTime)
      .limit(1);

    const summary = {
      totalSpent: parseFloat(visitStats[0]?.totalSpent?.toString() || "0"),
      visitCount: visitStats[0]?.count || 0,
      lastVisit: visitStats[0]?.lastVisit || null,
      nextAppointment: nextAppointment[0]?.startTime || null,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(
      "[GET /api/tenants/[slug]/customers/[id]/summary] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
