import { NextRequest, NextResponse } from "next/server";
import { db, customers } from "@sass-store/database";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/tenants/[slug]/customers/[id]
 * Get a specific customer
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

    // Get customer
    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.id, id), eq(customers.tenantId, tenant.id)),
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("[GET /api/tenants/[slug]/customers/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/tenants/[slug]/customers/[id]
 * Update a customer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; id: string } },
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

    // Build update object
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.generalNotes !== undefined)
      updateData.generalNotes = body.generalNotes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenant.id)))
      .returning();

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error) {
    console.error("[PATCH /api/tenants/[slug]/customers/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tenants/[slug]/customers/[id]
 * Delete a customer (requires admin role)
 */
export async function DELETE(
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

    // Delete customer (visits will cascade)
    await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenant.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tenants/[slug]/customers/[id]] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
