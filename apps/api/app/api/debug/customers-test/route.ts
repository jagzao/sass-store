import { NextResponse } from "next/server";
import { db, customers, customerVisits } from "@sass-store/database";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Debug endpoint to test customers query logic
 */
export async function GET() {
  const steps: string[] = [];

  try {
    // Step 1: Find tenant
    steps.push("Step 1: Finding tenant wondernails...");
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, "wondernails"),
    });

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant not found",
          steps,
        },
        { status: 404 },
      );
    }

    steps.push(`Step 1: Found tenant - ${tenant.name} (ID: ${tenant.id})`);

    // Step 2: Query customers
    steps.push("Step 2: Querying customers...");
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
      .where(eq(customers.tenantId, tenant.id))
      .orderBy(desc(customers.createdAt))
      .limit(5);

    steps.push(`Step 2: Found ${customersList.length} customers`);

    // Step 3: Get visit stats for first customer
    if (customersList.length > 0) {
      steps.push("Step 3: Getting visit stats for first customer...");
      const firstCustomer = customersList[0];

      const visits = await db
        .select({
          count: sql<number>`count(*)::int`,
          total: sql<number>`sum(${customerVisits.totalAmount})::numeric`,
          lastVisit: sql<string>`max(${customerVisits.visitDate})`,
        })
        .from(customerVisits)
        .where(
          and(
            eq(customerVisits.customerId, firstCustomer.id),
            eq(customerVisits.status, "completed"),
          ),
        );

      steps.push(
        `Step 3: Visit stats - count: ${visits[0]?.count || 0}, total: ${visits[0]?.total || 0}`,
      );
    }

    return NextResponse.json({
      success: true,
      steps,
      customerCount: customersList.length,
      sampleCustomers: customersList.slice(0, 2).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DEBUG /api/debug/customers-test] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        steps,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
