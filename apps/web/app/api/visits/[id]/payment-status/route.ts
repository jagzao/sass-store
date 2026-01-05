import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  customerVisits,
  advanceApplications,
  customerAdvances,
} from "@/packages/database/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/visits/[id]/payment-status - Get visit payment status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const visitId = params.id;

    // Check if visit exists
    const [visit] = await db
      .select()
      .from(customerVisits)
      .where(eq(customerVisits.id, visitId));

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Get all advance applications for this visit
    const applications = await db
      .select({
        id: advanceApplications.id,
        advanceId: advanceApplications.advanceId,
        amountApplied: advanceApplications.amountApplied,
        createdAt: advanceApplications.createdAt,
        // Include advance details
        advance: {
          id: customerAdvances.id,
          paymentMethod: customerAdvances.paymentMethod,
          status: customerAdvances.status,
        },
      })
      .from(advanceApplications)
      .leftJoin(
        customerAdvances,
        eq(advanceApplications.advanceId, customerAdvances.id),
      )
      .where(eq(advanceApplications.visitId, visitId))
      .orderBy(advanceApplications.createdAt, "desc");

    // Calculate total advance applied
    const totalAdvanceApplied = applications.reduce(
      (sum: number, app: any) => sum + parseFloat(app.amountApplied.toString()),
      0,
    );

    // Calculate remaining amount
    const totalAmount = parseFloat(visit.totalAmount.toString());
    const remainingAmount = totalAmount - totalAdvanceApplied;

    // Determine payment status
    let paymentStatus = visit.paymentStatus;
    if (totalAdvanceApplied === 0) {
      paymentStatus = "pending";
    } else if (totalAdvanceApplied < totalAmount) {
      paymentStatus = "partially_paid";
    } else if (totalAdvanceApplied === totalAmount) {
      paymentStatus = "fully_paid";
    } else {
      paymentStatus = "overpaid";
    }

    // Update visit with current payment status if needed
    if (paymentStatus !== visit.paymentStatus) {
      await db
        .update(customerVisits)
        .set({
          advanceApplied: totalAdvanceApplied,
          remainingAmount,
          paymentStatus,
        })
        .where(eq(customerVisits.id, visitId));
    }

    return NextResponse.json({
      visitId,
      totalAmount,
      advanceApplied: totalAdvanceApplied,
      remainingAmount,
      paymentStatus,
      applications,
    });
  } catch (error) {
    console.error("Error fetching visit payment status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
