import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { customers, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  phone: z.string().min(1, "El teléfono es requerido").optional(),
  generalNotes: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
  tags: z.array(z.string()).optional(),
});

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

    // Find customer
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

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Customer GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json();
    const data = updateCustomerSchema.parse(body);

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenant.id)),
      )
      .returning();

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error) {
    console.error("Customer PATCH error:", error);

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

    // Delete customer
    const [deletedCustomer] = await db
      .delete(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenant.id)),
      )
      .returning();

    if (!deletedCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Customer DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
