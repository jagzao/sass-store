import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  customers,
  customerVisits,
  tenants,
} from "@sass-store/database/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  phone: z.string().min(1, "El teléfono es requerido").optional(),
  email: z
    .union([z.string().email("Correo inválido"), z.literal(""), z.null()])
    .optional(),
  generalNotes: z.union([z.string(), z.null()]).optional(),
  address: z.union([z.string(), z.null()]).optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
  tags: z.array(z.string()).optional(),
  birthday: z.union([z.string(), z.null()]).optional(),
  medicalHistory: z.any().optional(),
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

    // Get stats for delete warning
    const [visitsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerVisits)
      .where(
        and(
          eq(customerVisits.customerId, customerId),
          eq(customerVisits.tenantId, tenant.id),
        ),
      );

    const [bookingsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, customerId),
          eq(bookings.tenantId, tenant.id),
        ),
      );

    // Unpack metadata into birthday and medicalHistory for frontend convenience
    const enrichedCustomer = {
      ...customer,
      birthday: (customer.metadata as any)?.birthday || null,
      medicalHistory: (customer.metadata as any)?.medicalHistory || null,
    };

    return NextResponse.json({
      customer: enrichedCustomer,
      stats: {
        visits: Number(visitsCount?.count || 0),
        bookings: Number(bookingsCount?.count || 0),
      },
    });
  } catch (error) {
    console.error("Customer GET error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        // STRY-022: stack trace removido
      },
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

    // Fetch existing customer for metadata merge
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.tenantId, tenant.id)),
      )
      .limit(1);

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Build update payload
    const updatePayload: Record<string, any> = {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      generalNotes: data.generalNotes,
      status: data.status,
      tags: data.tags,
      updatedAt: new Date(),
    };

    // Merge birthday and medicalHistory into metadata JSONB
    if (data.birthday !== undefined || data.medicalHistory !== undefined) {
      const existingMeta = (existingCustomer.metadata as any) || {};
      updatePayload.metadata = {
        ...existingMeta,
        ...(data.birthday !== undefined && { birthday: data.birthday }),
        ...(data.medicalHistory !== undefined && {
          medicalHistory: data.medicalHistory,
        }),
      };
    }

    // Remove undefined keys
    Object.keys(updatePayload).forEach((key) => {
      if (updatePayload[key] === undefined) {
        delete updatePayload[key];
      }
    });

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set(updatePayload)
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

    // Enrich response for frontend convenience
    const responseCustomer = {
      ...updatedCustomer,
      birthday: (updatedCustomer.metadata as any)?.birthday || null,
      medicalHistory: (updatedCustomer.metadata as any)?.medicalHistory || null,
    };

    return NextResponse.json({ customer: responseCustomer });
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

    // Unlink bookings regarding this customer to avoid FK constraints
    await db
      .update(bookings)
      .set({ customerId: null })
      .where(
        and(
          eq(bookings.customerId, customerId),
          eq(bookings.tenantId, tenant.id),
        ),
      );

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
