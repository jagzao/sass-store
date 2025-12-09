
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  customerVisits,
  customerVisitServices,
  visitPhotos,
  tenants,
  services,
} from "@sass-store/database/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const createVisitSchema = z.object({
  visitDate: z.string(),
  totalAmount: z.number(),
  notes: z.string().optional(),
  nextVisitFrom: z.string().nullable().optional(),
  nextVisitTo: z.string().nullable().optional(),
  status: z.enum(["pending", "scheduled", "completed", "cancelled"]).default("completed"),
  services: z.array(
    z.object({
      serviceId: z.string(),
      description: z.string().optional(),
      unitPrice: z.number(),
      quantity: z.number(),
      subtotal: z.number(),
    })
  ),
  photos: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["BEFORE", "AFTER"]),
    })
  ).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> }
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

    // Fetch visits with relations
    const visits = await db.query.customerVisits.findMany({
      where: and(
        eq(customerVisits.customerId, customerId),
        eq(customerVisits.tenantId, tenant.id)
      ),
      with: {
        services: {
          with: {
            service: true, // Join to get service name
          },
        },
        photos: true,
      },
      orderBy: [desc(customerVisits.visitDate)],
    });

    // Transform scans to match frontend expectations
    const formattedVisits = visits.map((visit) => ({
      ...visit,
      services: visit.services.map((vs) => ({
        id: vs.serviceId, // CRITICAL: Frontend expects Service Definition ID here
        serviceName: vs.service.name,
        quantity: Number(vs.quantity),
        unitPrice: Number(vs.unitPrice),
        subtotal: Number(vs.subtotal),
      })),
    }));

    return NextResponse.json({ visits: formattedVisits });
  } catch (error) {
    console.error("Visits GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> }
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

    // Parse and validate request body
    const body = await request.json();
    const data = createVisitSchema.parse(body);

    const newVisit = await db.transaction(async (tx) => {
      // 1. Create Visit
      const [visit] = await tx
        .insert(customerVisits)
        .values({
          tenantId: tenant.id,
          customerId: customerId,
          visitNumber: await getNextVisitNumber(tx, customerId),
          visitDate: new Date(data.visitDate),
          totalAmount: data.totalAmount.toString(),
          notes: data.notes,
          nextVisitFrom: data.nextVisitFrom ? data.nextVisitFrom : null,
          nextVisitTo: data.nextVisitTo ? data.nextVisitTo : null,
          status: data.status,
        })
        .returning();

      // 2. Create Services
      if (data.services.length > 0) {
        await tx.insert(customerVisitServices).values(
          data.services.map((s) => ({
            visitId: visit.id,
            serviceId: s.serviceId,
            description: s.description,
            unitPrice: s.unitPrice.toString(),
            quantity: s.quantity.toString(),
            subtotal: s.subtotal.toString(),
          }))
        );
      }

      // 3. Create Photos
      if (data.photos && data.photos.length > 0) {
        await tx.insert(visitPhotos).values(
          data.photos.map((p) => ({
            visitId: visit.id,
            url: p.url,
            type: p.type,
          }))
        );
      }

      return visit;
    });

    return NextResponse.json({ data: newVisit }, { status: 201 });
  } catch (error) {
    console.error("Visits POST error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getNextVisitNumber(tx: any, customerId: string) {
  const result = await tx
    .select({ count: customerVisits.visitNumber })
    .from(customerVisits)
    .where(eq(customerVisits.customerId, customerId))
    .orderBy(desc(customerVisits.visitNumber))
    .limit(1);

  return result.length > 0 ? result[0].count + 1 : 1;
}
