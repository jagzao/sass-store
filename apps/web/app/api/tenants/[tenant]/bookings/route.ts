import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  tenants,
  services,
  customers,
} from "@sass-store/database/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { z } from "zod";

/**
 * Bookings API Endpoint
 *
 * Manages bookings/appointments for a tenant
 */

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
  totalPrice: z.number().positive(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
});

/**
 * GET /api/tenants/[tenant]/bookings
 *
 * Fetch all bookings for a tenant with optional filters
 *
 * Query Parameters:
 * - status: Filter by status (pending, confirmed, completed, cancelled)
 * - from: Filter bookings starting from this date (ISO string)
 * - to: Filter bookings until this date (ISO string)
 * - limit: Maximum number of bookings to return (default: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  try {
    const { tenant: tenantSlug } = await params;
    const { searchParams } = new URL(request.url);

    // Find tenant
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Build query conditions
    const conditions = [eq(bookings.tenantId, tenant.id)];

    // Filter by status
    const status = searchParams.get("status");
    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    // Filter by date range
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) {
      conditions.push(gte(bookings.startTime, new Date(from)));
    }
    if (to) {
      conditions.push(lte(bookings.startTime, new Date(to)));
    }

    // Get limit
    const limit = parseInt(searchParams.get("limit") || "100");

    // Fetch bookings with relations
    const allBookings = await db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        service: true,
        staff: true,
        customer: true,
      },
      orderBy: [desc(bookings.startTime)],
      limit,
    });

    // Transform for frontend
    const formattedBookings = allBookings.map((booking) => ({
      ...booking,
      totalPrice: Number(booking.totalPrice),
    }));

    return NextResponse.json({ bookings: formattedBookings });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenants/[tenant]/bookings
 *
 * Create a new booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
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
    const data = createBookingSchema.parse(body);

    // Verify service exists and belongs to tenant
    const [service] = await db
      .select()
      .from(services)
      .where(
        and(eq(services.id, data.serviceId), eq(services.tenantId, tenant.id)),
      )
      .limit(1);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or does not belong to this tenant" },
        { status: 404 },
      );
    }

    // Verify customer exists if customerId is provided
    if (data.customerId) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.id, data.customerId),
            eq(customers.tenantId, tenant.id),
          ),
        )
        .limit(1);

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found or does not belong to this tenant" },
          { status: 404 },
        );
      }
    }

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        tenantId: tenant.id,
        serviceId: data.serviceId,
        customerId: data.customerId || null,
        staffId: data.staffId || null,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        status: data.status || "pending",
        notes: data.notes || null,
        totalPrice: data.totalPrice.toString(),
      })
      .returning();

    return NextResponse.json({ data: newBooking }, { status: 201 });
  } catch (error) {
    console.error("Bookings POST error:", error);

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
