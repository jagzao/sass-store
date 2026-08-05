import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  customers,
  services,
  tenants,
} from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { enqueueBookingRescheduleNotification } from "@/lib/notifications/booking-reschedule-notification";
import { rescheduleBookingReminderNotifications } from "@/lib/notifications/booking-reminder-notification";
import { cancelPendingBookingNotifications } from "@/lib/notifications/scheduled-notification-queue";
import { enqueueBookingCancelledNotification } from "@/lib/notifications/booking-cancelled-notification";
import { enqueueBookingConfirmedNotification } from "@/lib/notifications/booking-confirmation-notification";
import { rescheduleStaffReminderNotifications } from "@/lib/notifications/booking-staff-notification";

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

async function resolveTenantId(
  tenantSlug: string,
): Promise<Result<{ id: string; name: string }, DomainError>> {
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant) return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  return Ok(tenant);
}

export const DELETE = withResultHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug, id: bookingId } = await context.params;
    const tenantResult = await resolveTenantId(tenantSlug);
    if (!tenantResult.success) return tenantResult;
    const tenant = tenantResult.data;

    const [deleted] = await db
      .delete(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)))
      .returning({ id: bookings.id });

    if (!deleted) {
      return Err(ErrorFactories.notFound("Booking", bookingId));
    }

    cancelPendingBookingNotifications(bookingId, [
      "booking_reminder_24h",
      "booking_reminder_1h",
    ]).catch((e) => console.error("[bookings] reminder cancel error:", e));

    return Ok({ success: true, id: deleted.id });
  },
);

export const GET = withResultHandler(
  async (
    _request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug, id: bookingId } = await context.params;
    const tenantResult = await resolveTenantId(tenantSlug);
    if (!tenantResult.success) return tenantResult;
    const tenant = tenantResult.data;

    const result = await db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenant.id)),
      with: { service: true, staff: true, customer: true },
    });

    if (!result) {
      return Err(ErrorFactories.notFound("Booking", bookingId));
    }

    return Ok({ data: { ...result, totalPrice: Number(result.totalPrice) } });
  },
);

export const PATCH = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string; id: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug, id: bookingId } = await context.params;

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return Err(
        ErrorFactories.validation(
          "Failed to parse request body",
          undefined,
          undefined,
          error,
        ),
      );
    }

    const validated = validateWithZod(patchSchema, body);
    if (!validated.success) return validated;
    const data = validated.data;

    const tenantResult = await resolveTenantId(tenantSlug);
    if (!tenantResult.success) return tenantResult;
    const tenant = tenantResult.data;

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
      return Err(ErrorFactories.notFound("Booking", bookingId));
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
        return Err(ErrorFactories.notFound("Customer", data.customerId));
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
      return Err(ErrorFactories.notFound("Booking", bookingId));
    }

    let scheduledNotification = null;
    let bookingReminders = null;
    let statusNotification = null;

    const notifBase = {
      tenantId: tenant.id,
      tenantSlug,
      tenantName: tenant.name,
      bookingId: updated.id,
      customerId: updated.customerId,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      serviceName: existingBooking.serviceName,
      startTime: updatePayload.startTime ?? existingBooking.startTime,
    };

    if (data.status === "cancelled") {
      try {
        await cancelPendingBookingNotifications(updated.id, [
          "booking_reminder_24h",
          "booking_reminder_1h",
          "booking_review_request",
        ]);
      } catch (cancelError) {
        console.error("Booking reminder cancel error:", cancelError);
      }
      try {
        statusNotification =
          await enqueueBookingCancelledNotification(notifBase);
      } catch (e) {
        console.error("Booking cancelled notification error:", e);
      }
    }

    if (data.status === "confirmed") {
      try {
        statusNotification =
          await enqueueBookingConfirmedNotification(notifBase);
      } catch (e) {
        console.error("Booking confirmed notification error:", e);
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
        const rescheduleParams = {
          tenantId: tenant.id,
          tenantSlug,
          tenantName: tenant.name,
          bookingId: updated.id,
          customerId: updated.customerId,
          customerName: updated.customerName,
          customerPhone: updated.customerPhone,
          serviceName: existingBooking.serviceName,
          startTime: updatePayload.startTime!,
        };
        try {
          bookingReminders =
            await rescheduleBookingReminderNotifications(rescheduleParams);
        } catch (reminderError) {
          console.error("Booking reminder reschedule error:", reminderError);
        }
        try {
          await rescheduleStaffReminderNotifications(rescheduleParams);
        } catch (e) {
          console.error("Staff reminder reschedule error:", e);
        }
      }
    }

    return Ok({
      data: { ...updated, totalPrice: Number(updated.totalPrice) },
      scheduledNotification,
      bookingReminders,
      statusNotification,
    });
  },
);
