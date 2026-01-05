import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { db } from "@sass-store/database";
import {
  customerAdvances,
  advanceApplications,
  customerVisits,
  bookings,
} from "@sass-store/database/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for validating advance application
const applyAdvanceSchema = z.object({
  visitId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
});

// POST /api/advances/[id]/apply - Apply an advance to a visit/booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = applyAdvanceSchema.parse(body);
    const advanceId = params.id;

    // Convert amount to number
    const amountApplied = parseFloat(validatedData.amountApplied);

    // Check if advance exists and is active
    const [advance] = await db
      .select()
      .from(customerAdvances)
      .where(eq(customerAdvances.id, advanceId));

    if (!advance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    if (advance.status !== "active") {
      return NextResponse.json(
        { error: "Advance is not active and cannot be applied" },
        { status: 400 },
      );
    }

    // Check if amount applied is available
    if (amountApplied > parseFloat(advance.amount.toString())) {
      return NextResponse.json(
        { error: "Amount applied exceeds available advance amount" },
        { status: 400 },
      );
    }

    // Validate that either visitId or bookingId is provided
    if (!validatedData.visitId && !validatedData.bookingId) {
      return NextResponse.json(
        { error: "Either visitId or bookingId must be provided" },
        { status: 400 },
      );
    }

    // If visitId is provided, get visit details
    let visit = null;
    if (validatedData.visitId) {
      [visit] = await db
        .select()
        .from(customerVisits)
        .where(eq(customerVisits.id, validatedData.visitId));

      if (!visit) {
        return NextResponse.json({ error: "Visit not found" }, { status: 404 });
      }
    }

    // Create the advance application
    const [newApplication] = await db
      .insert(advanceApplications)
      .values({
        tenantId: advance.tenantId,
        advanceId: advance.id,
        customerId: advance.customerId,
        visitId: validatedData.visitId || null,
        bookingId: validatedData.bookingId || null,
        amountApplied,
        notes: validatedData.notes || null,
      })
      .returning();

    // Update advance status and remaining amount
    await db.execute(sql`
      SELECT update_advance_status(${advanceId})
    `);

    // Update customer balance favor
    await db.execute(sql`
      SELECT calculate_customer_balance_favor(${advance.customerId})
    `);

    // If visitId was provided, update visit payment status
    if (validatedData.visitId) {
      // First, get the total advance applied to this visit
      const [totalAdvanceResult] = await db.execute(sql`
        SELECT COALESCE(SUM(amount_applied), 0) as total_advance
        FROM advance_applications
        WHERE visit_id = ${validatedData.visitId}
      `);

      const totalAdvance = parseFloat(
        totalAdvanceResult[0]?.total_advance || "0",
      );

      // Update the visit with the total advance applied
      await db
        .update(customerVisits)
        .set({
          advanceApplied: totalAdvance,
        })
        .where(eq(customerVisits.id, validatedData.visitId));

      // Update visit payment status
      await db.execute(sql`
        SELECT update_visit_payment_status(${validatedData.visitId})
      `);
    }

    return NextResponse.json(
      {
        message: "Advance applied successfully",
        application: newApplication,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error applying advance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
