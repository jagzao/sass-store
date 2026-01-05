import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  advanceApplications,
  customerAdvances,
  customerVisits,
} from "@/packages/database/schema";
import { eq, and } from "drizzle-orm";

// GET /api/advances/applications - List advance applications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const advanceId = searchParams.get("advanceId");
    const visitId = searchParams.get("visitId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    // Build where conditions
    const whereConditions = [eq(advanceApplications.tenantId, tenantId)];

    if (customerId) {
      whereConditions.push(eq(advanceApplications.customerId, customerId));
    }

    if (advanceId) {
      whereConditions.push(eq(advanceApplications.advanceId, advanceId));
    }

    if (visitId) {
      whereConditions.push(eq(advanceApplications.visitId, visitId));
    }

    const applications = await db
      .select({
        id: advanceApplications.id,
        tenantId: advanceApplications.tenantId,
        advanceId: advanceApplications.advanceId,
        customerId: advanceApplications.customerId,
        visitId: advanceApplications.visitId,
        bookingId: advanceApplications.bookingId,
        amountApplied: advanceApplications.amountApplied,
        notes: advanceApplications.notes,
        createdAt: advanceApplications.createdAt,
        updatedAt: advanceApplications.updatedAt,
        // Include related data
        advance: {
          id: customerAdvances.id,
          paymentMethod: customerAdvances.paymentMethod,
          status: customerAdvances.status,
        },
        visit: {
          id: customerVisits.id,
          visitDate: customerVisits.visitDate,
          totalAmount: customerVisits.totalAmount,
          paymentStatus: customerVisits.paymentStatus,
        },
      })
      .from(advanceApplications)
      .leftJoin(
        customerAdvances,
        eq(advanceApplications.advanceId, customerAdvances.id),
      )
      .leftJoin(
        customerVisits,
        eq(advanceApplications.visitId, customerVisits.id),
      )
      .where(and(...whereConditions))
      .orderBy(advanceApplications.createdAt, "desc");

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching advance applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
