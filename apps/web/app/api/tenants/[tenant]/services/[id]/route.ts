import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { services, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const updateServiceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  imageUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().optional().nullable(),
  ),
  videoUrl: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().url().optional().nullable(),
  ),
  duration: z.number().positive().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: serviceId } = await params;

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
    const serviceData = updateServiceSchema.parse(body);

    // Update service
    const updateData: any = { ...serviceData };
    if (serviceData.price !== undefined) {
      // Format price to ensure it has 2 decimal places
      updateData.price = serviceData.price.toFixed(2);
    }

    const [updatedService] = await db
      .update(services)
      .set(updateData)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)))
      .returning();

    if (!updatedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updatedService });
  } catch (error) {
    console.error("Services PATCH error:", error);

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
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: serviceId } = await params;

    // Find tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Delete service
    const [deletedService] = await db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.tenantId, tenant.id)))
      .returning();

    if (!deletedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deletedService });
  } catch (error) {
    console.error("Services DELETE error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
