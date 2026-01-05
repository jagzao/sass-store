import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { db } from "@sass-store/database";
import { customerAdvances } from "@sass-store/database/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for validating advance updates
const updateAdvanceSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    })
    .optional(),
  paymentMethod: z.string().min(1).optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  status: z.enum(["active", "used", "expired", "cancelled"]).optional(),
});

// GET /api/advances/[id] - Get a single advance
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const advanceId = params.id;

    const [advance] = await db
      .select()
      .from(customerAdvances)
      .where(eq(customerAdvances.id, advanceId));

    if (!advance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    return NextResponse.json({ advance });
  } catch (error) {
    console.error("Error fetching advance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/advances/[id] - Update an advance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateAdvanceSchema.parse(body);
    const advanceId = params.id;

    // Check if advance exists
    const [existingAdvance] = await db
      .select()
      .from(customerAdvances)
      .where(eq(customerAdvances.id, advanceId));

    if (!existingAdvance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.paymentMethod !== undefined) {
      updateData.paymentMethod = validatedData.paymentMethod;
    }

    if (validatedData.referenceNumber !== undefined) {
      updateData.referenceNumber = validatedData.referenceNumber || null;
    }

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes || null;
    }

    if (validatedData.validUntil !== undefined) {
      updateData.validUntil = validatedData.validUntil
        ? new Date(validatedData.validUntil)
        : null;
    }

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }

    // Update the advance
    const [updatedAdvance] = await db
      .update(customerAdvances)
      .set(updateData)
      .where(eq(customerAdvances.id, advanceId))
      .returning();

    // Update customer balance favor if status changed
    if (validatedData.status === "cancelled") {
      await db.execute(sql`
        SELECT calculate_customer_balance_favor(${existingAdvance.customerId})
      `);
    }

    return NextResponse.json({
      message: "Advance updated successfully",
      advance: updatedAdvance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating advance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/advances/[id] - Cancel an advance
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const advanceId = params.id;

    // Check if advance exists
    const [existingAdvance] = await db
      .select()
      .from(customerAdvances)
      .where(eq(customerAdvances.id, advanceId));

    if (!existingAdvance) {
      return NextResponse.json({ error: "Advance not found" }, { status: 404 });
    }

    // Check if advance has been partially or fully used
    if (
      existingAdvance.status === "partially_used" ||
      existingAdvance.status === "fully_used"
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot cancel an advance that has been partially or fully used",
        },
        { status: 400 },
      );
    }

    // Cancel the advance
    const [cancelledAdvance] = await db
      .update(customerAdvances)
      .set({ status: "cancelled" })
      .where(eq(customerAdvances.id, advanceId))
      .returning();

    // Update customer balance favor
    await db.execute(sql`
      SELECT calculate_customer_balance_favor(${existingAdvance.customerId})
    `);

    return NextResponse.json({
      message: "Advance cancelled successfully",
      advance: cancelledAdvance,
    });
  } catch (error) {
    console.error("Error cancelling advance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
