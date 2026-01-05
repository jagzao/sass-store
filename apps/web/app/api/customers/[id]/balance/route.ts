import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  customers,
  customerAdvances,
  advanceApplications,
} from "@/packages/database/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/customers/[id]/balance - Get customer balance favor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = params.id;

    // Check if customer exists
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId));

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Get customer's current balance favor
    const balanceFavor = parseFloat(customer.balanceFavor?.toString() || "0");

    // Get all advances for the customer
    const advances = await db
      .select({
        id: customerAdvances.id,
        amount: customerAdvances.amount,
        originalAmount: customerAdvances.originalAmount,
        paymentMethod: customerAdvances.paymentMethod,
        status: customerAdvances.status,
        createdAt: customerAdvances.createdAt,
      })
      .from(customerAdvances)
      .where(eq(customerAdvances.customerId, customerId))
      .orderBy(customerAdvances.createdAt, "desc");

    // Get all applications of those advances
    const applications = await db
      .select({
        id: advanceApplications.id,
        advanceId: advanceApplications.advanceId,
        visitId: advanceApplications.visitId,
        bookingId: advanceApplications.bookingId,
        amountApplied: advanceApplications.amountApplied,
        createdAt: advanceApplications.createdAt,
      })
      .from(advanceApplications)
      .where(eq(advanceApplications.customerId, customerId))
      .orderBy(advanceApplications.createdAt, "desc");

    // Calculate total advances and total applied
    const totalAdvances = advances.reduce(
      (sum, advance) => sum + parseFloat(advance.originalAmount.toString()),
      0,
    );
    const totalApplied = applications.reduce(
      (sum, application) =>
        sum + parseFloat(application.amountApplied.toString()),
      0,
    );

    // Group advances by status
    const advancesByStatus = {
      active: advances.filter((a) => a.status === "active"),
      partially_used: advances.filter((a) => a.status === "partially_used"),
      fully_used: advances.filter((a) => a.status === "fully_used"),
      cancelled: advances.filter((a) => a.status === "cancelled"),
    };

    // Calculate available balance (sum of active advances minus their applications)
    const availableBalance = advancesByStatus.active.reduce(
      (sum, advance) => sum + parseFloat(advance.amount.toString()),
      0,
    );

    return NextResponse.json({
      customerId,
      balanceFavor,
      totalAdvances,
      totalApplied,
      availableBalance,
      advances: advancesByStatus,
      applications,
    });
  } catch (error) {
    console.error("Error fetching customer balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
