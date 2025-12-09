import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { customers, tenants } from "@sass-store/database/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  generalNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive", "blocked"]).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

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
    const data = createCustomerSchema.parse(body);

    // Create customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        tenantId: tenant.id,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        generalNotes: data.generalNotes,
        tags: data.tags || [],
        status: data.status || "active",
      })
      .returning();

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    console.error("Customers POST error:", error);

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Fetch customers
    const tenantCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, tenant.id))
      .orderBy(desc(customers.createdAt));

    return NextResponse.json({ customers: tenantCustomers });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
