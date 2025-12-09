import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { customerVisits, tenants, customerVisitServices, visitPhotos } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateVisitSchema = z.object({
  visitDate: z.string().optional(),
  totalAmount: z.number().optional(),
  notes: z.string().optional(),
  nextVisitFrom: z.string().nullable().optional(),
  nextVisitTo: z.string().nullable().optional(),
  status: z.enum(["pending", "scheduled", "completed", "cancelled"]).optional(),
  services: z.array(
    z.object({
      serviceId: z.string(),
      description: z.string().optional(),
      unitPrice: z.number(),
      quantity: z.number(),
      subtotal: z.number(),
    })
  ).optional(),
  photos: z.array(
    z.object({
      url: z.string(),
      type: z.enum(["BEFORE", "AFTER"]),
    })
  ).optional(),
});

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ tenant: string; id: string; visitId: string }>;
  },
) {
  try {
    const { tenant: tenantSlug, id: customerId, visitId } = await params;

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
    const data = updateVisitSchema.parse(body);

    const updatedVisit = await db.transaction(async (tx) => {
        // 1. Update Visit logic
        const updatePayload: any = {};
        if (data.visitDate) updatePayload.visitDate = new Date(data.visitDate);
        if (data.totalAmount !== undefined) updatePayload.totalAmount = data.totalAmount.toString();
        if (data.notes !== undefined) updatePayload.notes = data.notes;
        if (data.nextVisitFrom !== undefined) updatePayload.nextVisitFrom = data.nextVisitFrom;
        if (data.nextVisitTo !== undefined) updatePayload.nextVisitTo = data.nextVisitTo;
        if (data.status) updatePayload.status = data.status;

        let visit;
        if (Object.keys(updatePayload).length > 0) {
            [visit] = await tx
              .update(customerVisits)
              .set(updatePayload)
              .where(
                and(
                  eq(customerVisits.id, visitId),
                  eq(customerVisits.customerId, customerId),
                ),
              )
              .returning();
        } else {
             // Fetch existing if no update needed on main table
             [visit] = await tx.select().from(customerVisits).where(eq(customerVisits.id, visitId));
        }

        if (!visit) {
            throw new Error("Visit not found");
        }

        // 2. Update Services (Re-write strategies usually easier: delete all and insert new)
        if (data.services) {
            await tx.delete(customerVisitServices).where(eq(customerVisitServices.visitId, visitId));
            if (data.services.length > 0) {
                await tx.insert(customerVisitServices).values(
                  data.services.map((s) => ({
                    visitId: visitId,
                    serviceId: s.serviceId,
                    description: s.description,
                    unitPrice: s.unitPrice.toString(),
                    quantity: s.quantity.toString(),
                    subtotal: s.subtotal.toString(),
                  }))
                );
            }
        }

        // 3. Update Photos (Re-write)
        if (data.photos) {
            await tx.delete(visitPhotos).where(eq(visitPhotos.visitId, visitId));
            if (data.photos.length > 0) {
                await tx.insert(visitPhotos).values(
                  data.photos.map((p) => ({
                    visitId: visitId,
                    url: p.url,
                    type: p.type as "BEFORE" | "AFTER",
                  }))
                );
            }
        }

        return visit;
    });

    return NextResponse.json({ data: updatedVisit });
  } catch (error) {
    console.error("Visit PATCH error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }
    
    if (error instanceof Error && error.message === "Visit not found") {
         return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ tenant: string; id: string; visitId: string }>;
  },
) {
  try {
    const { tenant: tenantSlug, id: customerId, visitId } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Delete visit
    const [deletedVisit] = await db
      .delete(customerVisits)
      .where(
        and(
          eq(customerVisits.id, visitId),
          eq(customerVisits.customerId, customerId),
        ),
      )
      .returning();

    if (!deletedVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deletedVisit });
  } catch (error) {
    console.error("Visit DELETE error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
