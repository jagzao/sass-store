import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  customers,
  tenants,
  customerVisits,
} from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: customerId } = await params;

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify customer exists and belongs to tenant
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenant.id)),
      )
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Get all visits for this customer
    const allVisits = await db
      .select()
      .from(customerVisits)
      .where(eq(customerVisits.customerId, customerId))
      .orderBy(desc(customerVisits.visitDate));

    // Calculate summary statistics
    const totalSpent = allVisits.reduce((sum, visit) => {
      return sum + parseFloat(visit.totalAmount || "0");
    }, 0);

    const visitCount = allVisits.length;

    const lastVisit = allVisits.length > 0 ? allVisits[0].visitDate : undefined;

    // TODO: Implement nextAppointment when bookings table is created
    const nextAppointment = undefined;

    const summary = {
      totalSpent,
      visitCount,
      lastVisit: lastVisit ? lastVisit.toISOString() : undefined,
      nextAppointment,
    };

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Customer summary GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
