import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { customerVisits, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateVisitSchema = z.object({
  visitDate: z.string().optional(),
  serviceType: z.string().optional(),
  amount: z.number().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
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
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const visitData = updateVisitSchema.parse(body);

    // Update visit
    const [updatedVisit] = await db
      .update(customerVisits)
      .set(visitData)
      .where(
        and(
          eq(customerVisits.id, visitId),
          eq(customerVisits.customerId, customerId),
        ),
      )
      .returning();

    if (!updatedVisit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedVisit });
  } catch (error) {
    console.error("Visit PATCH error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
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
