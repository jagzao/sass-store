import { NextRequest, NextResponse } from "next/server";
import { db, customers, customerVisits, customerVisitServices, services } from "@sass-store/database";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/tenants/[slug]/customers/[id]/visits
 * Get all visits for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
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
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get visits with services
    const visits = await db.query.customerVisits.findMany({
      where: eq(customerVisits.customerId, id),
      orderBy: [desc(customerVisits.visitDate)],
      with: {
        services: {
          with: {
            service: true,
          },
        },
      },
    });

    // Format visits
    const formattedVisits = visits.map((visit) => ({
      id: visit.id,
      visitNumber: visit.visitNumber,
      visitDate: visit.visitDate,
      totalAmount: parseFloat(visit.totalAmount),
      notes: visit.notes,
      nextVisitFrom: visit.nextVisitFrom,
      nextVisitTo: visit.nextVisitTo,
      status: visit.status,
      services: visit.services.map((vs) => ({
        id: vs.id,
        serviceName: vs.service.name,
        quantity: parseFloat(vs.quantity),
        unitPrice: parseFloat(vs.unitPrice),
        subtotal: parseFloat(vs.subtotal),
      })),
    }));

    return NextResponse.json({ visits: formattedVisits });
  } catch (error) {
    console.error("[GET /api/tenants/[slug]/customers/[id]/visits] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants/[slug]/customers/[id]/visits
 * Create a new visit for a customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id } = params;
    const body = await request.json();

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
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Get next visit number
    const lastVisit = await db
      .select({ visitNumber: customerVisits.visitNumber })
      .from(customerVisits)
      .where(eq(customerVisits.customerId, id))
      .orderBy(desc(customerVisits.visitNumber))
      .limit(1);

    const nextVisitNumber = (lastVisit[0]?.visitNumber || 0) + 1;

    // Validate required fields
    if (!body.visitDate || !body.services || body.services.length === 0) {
      return NextResponse.json(
        { error: "Visit date and at least one service are required" },
        { status: 400 }
      );
    }

    // Create visit
    const [newVisit] = await db
      .insert(customerVisits)
      .values({
        tenantId: tenant.id,
        customerId: id,
        visitNumber: nextVisitNumber,
        visitDate: new Date(body.visitDate),
        totalAmount: body.totalAmount.toString(),
        notes: body.notes || null,
        nextVisitFrom: body.nextVisitFrom || null,
        nextVisitTo: body.nextVisitTo || null,
        status: body.status || "completed",
        appointmentId: body.appointmentId || null,
      })
      .returning();

    // Create visit services
    const visitServices = await Promise.all(
      body.services.map((service: any) =>
        db
          .insert(customerVisitServices)
          .values({
            visitId: newVisit.id,
            serviceId: service.serviceId,
            description: service.description || null,
            unitPrice: service.unitPrice.toString(),
            quantity: service.quantity.toString(),
            subtotal: service.subtotal.toString(),
          })
          .returning()
      )
    );

    return NextResponse.json(
      {
        visit: {
          ...newVisit,
          services: visitServices.flat(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/tenants/[slug]/customers/[id]/visits] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
