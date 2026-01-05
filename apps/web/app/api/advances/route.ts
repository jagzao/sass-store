import { NextRequest, NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { db } from "@sass-store/database";
import { customerAdvances } from "@sass-store/database/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

// Schema for validating advance creation
const createAdvanceSchema = z.object({
  customerId: z.string().uuid(),
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});

// GET /api/advances - List advances
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    // Build where conditions
    const whereConditions = [eq(customerAdvances.tenantId, tenantId)];

    if (customerId) {
      whereConditions.push(eq(customerAdvances.customerId, customerId));
    }

    if (status) {
      whereConditions.push(eq(customerAdvances.status, status));
    }

    const advances = await db
      .select({
        id: customerAdvances.id,
        tenantId: customerAdvances.tenantId,
        customerId: customerAdvances.customerId,
        amount: customerAdvances.amount,
        originalAmount: customerAdvances.originalAmount,
        paymentMethod: customerAdvances.paymentMethod,
        referenceNumber: customerAdvances.referenceNumber,
        notes: customerAdvances.notes,
        status: customerAdvances.status,
        validUntil: customerAdvances.validUntil,
        createdAt: customerAdvances.createdAt,
        updatedAt: customerAdvances.updatedAt,
      })
      .from(customerAdvances)
      .where(and(...whereConditions))
      .orderBy(customerAdvances.createdAt, "desc");

    return NextResponse.json({ advances });
  } catch (error) {
    console.error("Error fetching advances:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/advances - Create a new advance
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAdvanceSchema.parse(body);

    // Convert amount to number
    const amount = parseFloat(validatedData.amount);

    // Get tenant ID from session or request body
    const tenantId = body.tenantId || session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 },
      );
    }

    // Create the advance
    const [newAdvance] = await db
      .insert(customerAdvances)
      .values({
        tenantId,
        customerId: validatedData.customerId,
        amount,
        originalAmount: amount,
        paymentMethod: validatedData.paymentMethod,
        referenceNumber: validatedData.referenceNumber || null,
        notes: validatedData.notes || null,
        validUntil: validatedData.validUntil
          ? new Date(validatedData.validUntil)
          : null,
      })
      .returning();

    // Update customer balance favor
    await db.execute(sql`
      SELECT calculate_customer_balance_favor(${validatedData.customerId})
    `);

    return NextResponse.json(
      {
        message: "Advance created successfully",
        advance: newAdvance,
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

    console.error("Error creating advance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
