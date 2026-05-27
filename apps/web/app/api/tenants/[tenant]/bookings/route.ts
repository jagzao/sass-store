import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  tenants,
  services,
  customers,
  userRoles,
  users,
} from "@sass-store/database/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";
import {
  findCustomerMatches,
  pickBestCustomerMatch,
} from "@/lib/customers/match-customer";
import { enqueueBookingReminderNotifications } from "@/lib/notifications/booking-reminder-notification";
import { enqueueBookingConfirmationNotification } from "@/lib/notifications/booking-confirmation-notification";
import {
  enqueueStaffNewBookingNotification,
  enqueueStaffReminderNotifications,
} from "@/lib/notifications/booking-staff-notification";

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

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function notifyTenantAdminsAboutBooking(input: {
  tenantId: string;
  tenantName: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  startTime: Date;
  endTime: Date;
}) {
  if (!resendClient) {
    return;
  }

  const adminUsers = await db
    .select({
      email: users.email,
      name: users.name,
    })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(
      and(
        eq(userRoles.tenantId, input.tenantId),
        inArray(userRoles.role, ["Admin", "Gerente"]),
      ),
    );

  const emails = adminUsers
    .map((user) => user.email)
    .filter((email): email is string => Boolean(email));

  if (!emails.length) {
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const dateText = input.startTime.toLocaleDateString("es-MX");
  const startText = input.startTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endText = input.endTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await Promise.allSettled(
    emails.map((to) =>
      resendClient.emails.send({
        from,
        to,
        subject: `Nueva cita agendada - ${input.tenantName}`,
        html: `
          <h2>Nueva cita agendada</h2>
          <p>Se registro una nueva cita en <strong>${input.tenantName}</strong>.</p>
          <ul>
            <li><strong>Cliente:</strong> ${input.customerName}</li>
            <li><strong>Telefono:</strong> ${input.customerPhone || "No proporcionado"}</li>
            <li><strong>Email:</strong> ${input.customerEmail || "No proporcionado"}</li>
            <li><strong>Fecha:</strong> ${dateText}</li>
            <li><strong>Horario:</strong> ${startText} - ${endText}</li>
          </ul>
        `,
      }),
    ),
  );
}

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
      .select({ id: tenants.id, name: tenants.name })
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

    // Pagination
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

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
      offset,
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

    // Resolve tenant before consuming request body (stream can only be read once)
    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Parse and validate body
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Resolve service and optional customer in parallel
    const [serviceResult, customerResult] = await Promise.all([
      db
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, data.serviceId),
            eq(services.tenantId, tenant.id),
          ),
        )
        .limit(1),
      data.customerId
        ? db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.id, data.customerId),
                eq(customers.tenantId, tenant.id),
              ),
            )
            .limit(1)
        : Promise.resolve([] as (typeof customers.$inferSelect)[]),
    ]);

    const [service] = serviceResult;

    if (!service) {
      return NextResponse.json(
        { error: "Service not found or does not belong to this tenant" },
        { status: 404 },
      );
    }

    let linkedCustomerId = data.customerId ?? null;

    if (linkedCustomerId) {
      const [customer] = customerResult;

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found or does not belong to this tenant" },
          { status: 404 },
        );
      }
    } else {
      const matches = await findCustomerMatches(tenant.id, {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone,
      });
      const best = pickBestCustomerMatch(matches);
      if (best) {
        linkedCustomerId = best.id;
      }
    }

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        tenantId: tenant.id,
        serviceId: data.serviceId,
        customerId: linkedCustomerId,
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

    try {
      await notifyTenantAdminsAboutBooking({
        tenantId: tenant.id,
        tenantName: tenant.name,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      });
    } catch (notificationError) {
      console.error("Bookings admin notification error:", notificationError);
    }

    let bookingReminders = null;
    let bookingConfirmation = null;
    const bookingStatus = data.status || "pending";

    if (bookingStatus !== "cancelled") {
      const notifParams = {
        tenantId: tenant.id,
        tenantSlug,
        tenantName: tenant.name,
        bookingId: newBooking.id,
        customerId: linkedCustomerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        serviceName: service.name,
        startTime: new Date(data.startTime),
      };

      try {
        bookingConfirmation =
          await enqueueBookingConfirmationNotification(notifParams);
      } catch (e) {
        console.error("Booking confirmation enqueue error:", e);
      }

      try {
        bookingReminders =
          await enqueueBookingReminderNotifications(notifParams);
      } catch (reminderError) {
        console.error("Booking reminder enqueue error:", reminderError);
      }

      // Staff alerts: new booking alert + evening before + 2h before
      try {
        await enqueueStaffNewBookingNotification(notifParams);
      } catch (e) {
        console.error("Staff new booking notification error:", e);
      }
      try {
        await enqueueStaffReminderNotifications(notifParams);
      } catch (e) {
        console.error("Staff reminder notification error:", e);
      }
    }

    return NextResponse.json(
      { data: newBooking, bookingConfirmation, bookingReminders },
      { status: 201 },
    );
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
