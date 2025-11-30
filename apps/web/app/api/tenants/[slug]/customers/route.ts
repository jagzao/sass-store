import { NextRequest, NextResponse } from "next/server";
import { db, customers, customerVisits } from "@sass-store/database";
import { eq, and, desc, or, ilike, sql } from "drizzle-orm";

/**
 * GET /api/tenants/[slug]/customers
 * List all customers for a tenant with optional search and filters
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    // First, get the tenant ID from slug
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Build where conditions
    let whereConditions = [eq(customers.tenantId, tenant.id)];

    if (search) {
      whereConditions.push(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`)
        )!
      );
    }

    if (status && status !== "all") {
      whereConditions.push(eq(customers.status, status as any));
    }

    // Fetch customers
    const customersList = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(and(...whereConditions))
      .orderBy(desc(customers.createdAt));

    // For each customer, get visit stats
    const customersWithStats = await Promise.all(
      customersList.map(async (customer) => {
        const visits = await db
          .select({
            count: sql<number>`count(*)::int`,
            total: sql<number>`sum(${customerVisits.totalAmount})::numeric`,
            lastVisit: sql<string>`max(${customerVisits.visitDate})`,
          })
          .from(customerVisits)
          .where(
            and(
              eq(customerVisits.customerId, customer.id),
              eq(customerVisits.status, "completed")
            )
          );

        return {
          ...customer,
          visitCount: visits[0]?.count || 0,
          totalSpent: parseFloat(visits[0]?.total?.toString() || "0"),
          lastVisit: visits[0]?.lastVisit || null,
        };
      })
    );

    return NextResponse.json({
      customers: customersWithStats,
      count: customersWithStats.length,
    });
  } catch (error) {
    console.error("[GET /api/tenants/[slug]/customers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenants/[slug]/customers
 * Create a new customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    // Get tenant ID
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    // Create customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        tenantId: tenant.id,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        generalNotes: body.generalNotes || null,
        tags: body.tags || [],
        status: body.status || "active",
      })
      .returning();

    if (!newCustomer || !newCustomer.id) {
      console.error("[POST /api/tenants/[slug]/customers] Error: Customer was not created properly");
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tenants/[slug]/customers] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
