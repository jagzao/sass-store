import { NextRequest, NextResponse } from "next/server";
import {
  db,
  customers,
  customerVisits,
  customerVisitServices,
} from "@sass-store/database";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/tenants/[slug]/customers/[id]/visits/[visitId]
 * Get a specific visit
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; id: string; visitId: string }> },
) {
  try {
    const { slug, id, visitId } = await params;

    // Get tenant ID
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get visit with services
    const visit = await db.query.customerVisits.findFirst({
      where: and(
        eq(customerVisits.id, visitId),
        eq(customerVisits.customerId, id),
        eq(customerVisits.tenantId, tenant.id),
      ),
      with: {
        services: {
          with: {
            service: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Format visit
    const formattedVisit = {
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
    };

    return NextResponse.json({ visit: formattedVisit });
  } catch (error) {
    console.error(
      "[GET /api/tenants/[slug]/customers/[id]/visits/[visitId]] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/tenants/[slug]/customers/[id]/visits/[visitId]
 * Update a visit
 */
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; id: string; visitId: string }> },
) {
  try {
    const { slug, id, visitId } = await params;
    const body = await request.json();

    // Get tenant ID
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Verify visit exists
    const existingVisit = await db.query.customerVisits.findFirst({
      where: and(
        eq(customerVisits.id, visitId),
        eq(customerVisits.customerId, id),
        eq(customerVisits.tenantId, tenant.id),
      ),
    });

    if (!existingVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Update visit
    const [updatedVisit] = await db
      .update(customerVisits)
      .set({
        visitDate: body.visitDate
          ? new Date(body.visitDate)
          : existingVisit.visitDate,
        totalAmount: body.totalAmount?.toString() || existingVisit.totalAmount,
        notes: body.notes !== undefined ? body.notes : existingVisit.notes,
        nextVisitFrom:
          body.nextVisitFrom !== undefined
            ? body.nextVisitFrom
            : existingVisit.nextVisitFrom,
        nextVisitTo:
          body.nextVisitTo !== undefined
            ? body.nextVisitTo
            : existingVisit.nextVisitTo,
        status: body.status || existingVisit.status,
        updatedAt: new Date(),
      })
      .where(eq(customerVisits.id, visitId))
      .returning();

    // Update services if provided
    if (body.services && Array.isArray(body.services)) {
      // Delete existing services
      await db
        .delete(customerVisitServices)
        .where(eq(customerVisitServices.visitId, visitId));

      // Insert new services
      if (body.services.length > 0) {
        await Promise.all(
          body.services.map((service: any) =>
            db.insert(customerVisitServices).values({
              visitId: visitId,
              serviceId: service.serviceId,
              description: service.description || null,
              unitPrice: service.unitPrice.toString(),
              quantity: service.quantity.toString(),
              subtotal: service.subtotal.toString(),
            }),
          ),
        );
      }
    }

    return NextResponse.json({ visit: updatedVisit });
  } catch (error) {
    console.error(
      "[PATCH /api/tenants/[slug]/customers/[id]/visits/[visitId]] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tenants/[slug]/customers/[id]/visits/[visitId]
 * Delete a visit (requires admin role)
 */
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ slug: string; id: string; visitId: string }> },
) {
  try {
    const { slug, id, visitId } = await params;

    // Get tenant ID
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // TODO: Add permission check for admin role

    // Delete visit (services will cascade)
    await db
      .delete(customerVisits)
      .where(
        and(
          eq(customerVisits.id, visitId),
          eq(customerVisits.customerId, id),
          eq(customerVisits.tenantId, tenant.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[DELETE /api/tenants/[slug]/customers/[id]/visits/[visitId]] Error:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
