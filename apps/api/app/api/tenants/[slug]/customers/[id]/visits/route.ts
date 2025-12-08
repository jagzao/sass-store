import { NextRequest, NextResponse } from "next/server";
import {
  db,
  customers,
  customerVisits,
  customerVisitServices,
  services,
} from "@sass-store/database";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/tenants/[slug]/customers/[id]/visits
 * Get all visits for a customer
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;

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

    // Get visits using Core Query Builder to avoid aliasing issues
    const visitsData = await db
      .select({
        visit: customerVisits,
        service: services,
        visitService: customerVisitServices,
      })
      .from(customerVisits)
      .leftJoin(
        customerVisitServices,
        eq(customerVisits.id, customerVisitServices.visitId)
      )
      .leftJoin(services, eq(customerVisitServices.serviceId, services.id))
      .where(eq(customerVisits.customerId, id))
      .orderBy(desc(customerVisits.visitDate));

    // Group by visit
    const visitsMap = new Map();

    visitsData.forEach((row) => {
      if (!visitsMap.has(row.visit.id)) {
        visitsMap.set(row.visit.id, {
          ...row.visit,
          services: [],
        });
      }

      if (row.service && row.visitService) {
        visitsMap.get(row.visit.id).services.push({
          id: row.visitService.id,
          serviceName: row.service.name,
          quantity: parseFloat(row.visitService.quantity),
          unitPrice: parseFloat(row.visitService.unitPrice),
          subtotal: parseFloat(row.visitService.subtotal),
        });
      }
    });

    const formattedVisits = Array.from(visitsMap.values()).map((visit) => ({
      id: visit.id,
      visitNumber: visit.visitNumber,
      visitDate: visit.visitDate,
      totalAmount: parseFloat(visit.totalAmount),
      notes: visit.notes,
      nextVisitFrom: visit.nextVisitFrom,
      nextVisitTo: visit.nextVisitTo,
      status: visit.status,
      services: visit.services,
    }));

    return NextResponse.json({ visits: formattedVisits });
  } catch (error) {
    console.error(
      "[GET /api/tenants/[slug]/customers/[id]/visits] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenants/[slug]/customers/[id]/visits
 * Create a new visit for a customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
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
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
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
        { status: 400 },
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
          .returning(),
      ),
    );

    return NextResponse.json(
      {
        visit: {
          ...newVisit,
          services: visitServices.flat(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "[POST /api/tenants/[slug]/customers/[id]/visits] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
