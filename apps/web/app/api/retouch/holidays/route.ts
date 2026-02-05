import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenantHolidays } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/retouch/holidays
 * Get all holidays for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID

    const holidays = await db
      .select()
      .from(tenantHolidays)
      .where(eq(tenantHolidays.tenantId, tenantId))
      .orderBy(desc(tenantHolidays.date));

    return NextResponse.json({ success: true, data: holidays });
  } catch (error) {
    console.error("Error in GET /api/retouch/holidays:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/retouch/holidays
 * Create a new holiday
 */
export async function POST(request: NextRequest) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID

    const body = await request.json();
    const { date, name, affectsRetouch = true } = body;

    // Validate required fields
    if (!date || !name) {
      return NextResponse.json(
        { error: "Missing required fields: date, name" },
        { status: 400 },
      );
    }

    // Validate date format
    const holidayDate = new Date(date);
    if (isNaN(holidayDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Check if holiday already exists
    const existingHoliday = await db
      .select()
      .from(tenantHolidays)
      .where(
        and(
          eq(tenantHolidays.tenantId, tenantId),
          eq(tenantHolidays.date, holidayDate.toISOString().split("T")[0]),
        ),
      )
      .limit(1);

    if (existingHoliday.length > 0) {
      return NextResponse.json(
        { error: "Holiday already exists for this date" },
        { status: 400 },
      );
    }

    // Create holiday
    const newHoliday = await db
      .insert(tenantHolidays)
      .values({
        tenantId,
        date: holidayDate.toISOString().split("T")[0],
        name,
        affectsRetouch,
        metadata: {},
      })
      .returning();

    return NextResponse.json({ success: true, data: newHoliday[0] });
  } catch (error) {
    console.error("Error in POST /api/retouch/holidays:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/retouch/holidays
 * Delete a holiday
 */
export async function DELETE(request: NextRequest) {
  try {
    // For testing purposes, we'll use a fixed tenant ID
    // In production, this should come from authentication
    const tenantId = "c5f09699-c10e-4b3e-90b4-d65375a74516"; // Zo System tenant ID

    const { searchParams } = new URL(request.url);
    const holidayId = searchParams.get("id");

    if (!holidayId) {
      return NextResponse.json(
        { error: "Missing holiday ID" },
        { status: 400 },
      );
    }

    // Check if holiday exists and belongs to tenant
    const existingHoliday = await db
      .select()
      .from(tenantHolidays)
      .where(
        and(
          eq(tenantHolidays.tenantId, tenantId),
          eq(tenantHolidays.id, holidayId),
        ),
      )
      .limit(1);

    if (existingHoliday.length === 0) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    // Delete holiday
    await db
      .delete(tenantHolidays)
      .where(
        and(
          eq(tenantHolidays.tenantId, tenantId),
          eq(tenantHolidays.id, holidayId),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/retouch/holidays:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
