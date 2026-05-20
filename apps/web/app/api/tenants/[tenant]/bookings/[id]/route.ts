import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  customers,
  services,
  tenants,
} from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { enqueueBookingRescheduleNotification } from "@/lib/notifications/booking-reschedule-notification";
import { rescheduleBookingReminderNotifications } from "@/lib/notifications/booking-reminder-notification";
import { cancelPendingBookingNotifications } from "@/lib/notifications/scheduled-notification-queue";

const VALID_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
const patchSchema = z
  .object({
    status: z.enum(VALID_STATUSES).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    customerId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).length > 0 &&
      (data.startTime === undefined) === (data.endTime === undefined),
    {
      message:
        "startTime y endTime deben enviarse juntos, o ninguno de los dos",
    },
  );

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
      .returning({ id: bookings.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Booking not found or does not belong to this tenant" },
        { status: 404 },
      );
    }

    try {
      await cancelPendingBookingNotifications(bookingId, [
        "booking_reminder_24h",
        "booking_reminder_1h",
      ]);
    } catch (cancelError) {
      console.error("Booking reminder cancel on delete:", cancelError);
    }

    return NextResponse.json({ success: true, id: deleted.id });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;

    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const result = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)),
      with: { service: true, staff: true, customer: true },
    });

    if (!result) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: { ...result, totalPrice: Number(result.totalPrice) },
    });
  } catch (error) {
    console.error("Booking GET by ID error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  try {
    const { tenant: tenantSlug, id: bookingId } = await params;
    const body = await request.json();
    const data = patchSchema.parse(body);

    const [tenant] = await db
      .select({ id: tenants.id, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const [existingBooking] = await db
      .select({
        id: bookings.id,
        customerId: bookings.customerId,
        customerName: bookings.customerName,
        customerPhone: bookings.customerPhone,
        startTime: bookings.startTime,
        serviceId: bookings.serviceId,
        serviceName: services.name,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
      .limit(1);

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (data.customerId) {
      const [customer] = await db
        .select({ id: customers.id })
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
          { error: "Cliente no encontrado en este tenant" },
          { status: 404 },
        );
      }
    }

    const updatePayload: {
      updatedAt: Date;
      status?: (typeof VALID_STATUSES)[number];
      startTime?: Date;
      endTime?: Date;
      customerId?: string | null;
    } = { updatedAt: new Date() };
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.startTime !== undefined) {
      updatePayload.startTime = new Date(data.startTime);
      updatePayload.endTime = new Date(data.endTime!);
    }
    if (data.customerId !== undefined) {
      updatePayload.customerId = data.customerId;
    }

    const [updated] = await db
      .update(bookings)
      .set(updatePayload)
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let scheduledNotification = null;
    let bookingReminders = null;

    if (data.status === "cancelled") {
      try {
        await cancelPendingBookingNotifications(updated.id, [
          "booking_reminder_24h",
          "booking_reminder_1h",
        ]);
      } catch (cancelError) {
        console.error("Booking reminder cancel error:", cancelError);
      }
    }

    if (
      data.startTime !== undefined &&
      existingBooking.startTime.getTime() !== updatePayload.startTime!.getTime()
    ) {
      try {
        scheduledNotification = await enqueueBookingRescheduleNotification({
          tenantId: tenant.id,
          tenantSlug,
          tenantName: tenant.name,
          bookingId: updated.id,
          customerId: updated.customerId,
          customerName: updated.customerName,
          customerPhone: updated.customerPhone,
          serviceName: existingBooking.serviceName,
          previousStart: existingBooking.startTime,
          newStart: updatePayload.startTime!,
        });
      } catch (notifyError) {
        console.error("Booking reschedule notification enqueue:", notifyError);
      }

      if (updated.status !== "cancelled") {
        try {
          bookingReminders = await rescheduleBookingReminderNotifications({
            tenantId: tenant.id,
            tenantSlug,
            tenantName: tenant.name,
            bookingId: updated.id,
            customerId: updated.customerId,
            customerName: updated.customerName,
            customerPhone: updated.customerPhone,
            serviceName: existingBooking.serviceName,
            startTime: updatePayload.startTime!,
          });
        } catch (reminderError) {
          console.error("Booking reminder reschedule error:", reminderError);
        }
      }
    }

    return NextResponse.json({
      data: { ...updated, totalPrice: Number(updated.totalPrice) },
      scheduledNotification,
      bookingReminders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Estado inválido", details: error.errors },
        { status: 400 },
      );
    }
    console.error("Booking PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
