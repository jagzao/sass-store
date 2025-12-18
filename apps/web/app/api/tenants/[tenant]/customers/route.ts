import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  customers,
  tenants,
  customerVisits,
} from "@sass-store/database/schema";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import {
  applyRateLimit,
  createRateLimitHeaders,
  rateLimitMiddleware,
} from "@sass-store/core/rate-limit";

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
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, "customers");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

    // Apply rate limiting headers
    const rateLimitResult = await applyRateLimit(request, "customers");
    if (rateLimitResult) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { customer: newCustomer },
        {
          status: 201,
          headers,
        },
      );
    }

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
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, "customers");
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

    // Fetch customers with calculated fields using aggregation
    const customersWithStats = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        totalSpent:
          sql<number>`COALESCE(SUM(${customerVisits.totalAmount}), 0)`.mapWith(
            Number,
          ),
        visitCount: sql<number>`COUNT(${customerVisits.id})`.mapWith(Number),
        lastVisit: sql<string>`MAX(${customerVisits.visitDate})`,
      })
      .from(customers)
      .leftJoin(customerVisits, eq(customers.id, customerVisits.customerId))
      .where(eq(customers.tenantId, tenant.id))
      .groupBy(customers.id)
      .orderBy(desc(customers.createdAt));

    // map undefined email to match interface if needed, although the query handles it
    const formattedCustomers = customersWithStats.map((c) => ({
      ...c,
      email: c.email || undefined,
      nextAppointment: undefined, // TODO: Get from bookings when we have booking data
    }));

    // Apply rate limiting headers
    const rateLimitResult = await applyRateLimit(request, "customers");
    if (rateLimitResult) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { customers: customersWithStats },
        {
          headers,
        },
      );
    }

    return NextResponse.json({ customers: customersWithStats });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
