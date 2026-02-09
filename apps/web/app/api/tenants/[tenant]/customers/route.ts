import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  customers,
  tenants,
  customerVisits,
  bookings,
} from "@sass-store/database/schema";
import { eq, desc, asc, sql, or, ilike, and, gt, ne } from "drizzle-orm";
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
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Define calculated fields for reuse in selection and sorting
    const totalSpentSql = sql<number>`COALESCE(SUM(${customerVisits.totalAmount}), 0)`.mapWith(Number);
    const visitCountSql = sql<number>`COUNT(${customerVisits.id})`.mapWith(Number);
    const lastVisitSql = sql<string>`MAX(${customerVisits.visitDate})`;
    
    // Subquery for next appointment: earliest booking in the future that is not cancelled
    const nextAppointmentSql = sql<string>`(
      SELECT MIN(start_time)
      FROM ${bookings}
      WHERE ${bookings.customerId} = ${customers.id}
      AND ${bookings.startTime} > NOW()
      AND ${bookings.status} != 'cancelled'
    )`;

    // Define estimated next appointment for sorting (Last Visit + 15 days)
    // Adding interval to date/timestamp in SQL
    const estimatedNextAppointmentSql = sql<string>`(${lastVisitSql} + INTERVAL '15 days')`;
    
    // Effective Next Appointment: Use real appointment if exists, otherwise use estimated
    const effectiveNextAppointmentSql = sql<string>`COALESCE(${nextAppointmentSql}, ${estimatedNextAppointmentSql})`;

    // Build the query
    let query = db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        status: customers.status,
        createdAt: customers.createdAt,
        totalSpent: totalSpentSql,
        visitCount: visitCountSql,
        lastVisit: lastVisitSql,
        nextAppointment: nextAppointmentSql,
      })
      .from(customers)
      .leftJoin(customerVisits, eq(customers.id, customerVisits.customerId))
      .where(eq(customers.tenantId, tenant.id));

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`),
        ),
      );
    }

    // Apply status filter
    if (status && status !== "all") {
      query = query.where(eq(customers.status, status as any));
    }

    // Grouping
    const queryWithGroup = query.groupBy(
      customers.id,
      customers.name,
      customers.phone,
      customers.email,
      customers.status,
      customers.createdAt,
    );

    // Apply sorting
    let orderByClause;
    const direction = order === "asc" ? asc : desc;

    switch (sort) {
      case "name":
        orderByClause = direction(customers.name);
        break;
      case "totalSpent":
        orderByClause = direction(totalSpentSql);
        break;
      case "visitCount":
        orderByClause = direction(visitCountSql);
        break;
      case "lastVisit":
        // Sort by last visit, handling nulls (customers with no visits)
        // PostgreSQL: NULLS LAST / NULLS FIRST
        // Drizzle might not support nullsLast() directly on sql chunks in all versions, 
        // but typically desc puts nulls first by default in some DBs, last in others. 
        // We'll trust the default for now or refine if needed.
        orderByClause = direction(lastVisitSql);
        break;
      case "customer": // Alias for name
        orderByClause = direction(customers.name);
        break;
      case "status":
        orderByClause = direction(customers.status);
        break;
      case "nextAppointment":
        orderByClause = direction(effectiveNextAppointmentSql);
        break;
      case "createdAt":
      default:
        orderByClause = direction(customers.createdAt);
        break;
    }

    const customersWithData = await queryWithGroup.orderBy(orderByClause);

    // Format response
    const formattedCustomers = customersWithData.map((c) => ({
      ...c,
      email: c.email || undefined,
      // nextAppointment is now returned from DB
    }));

    // Apply rate limiting headers
    const rateLimitResult = await applyRateLimit(request, "customers");
    if (rateLimitResult) {
      const headers = createRateLimitHeaders(rateLimitResult);
      return NextResponse.json(
        { customers: formattedCustomers },
        {
          status: 200,
          headers,
        },
      );
    }

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    console.error("Customers GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
