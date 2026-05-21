import { db } from "@sass-store/database";
import { tenantConfigs } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import {
  formatAppointmentDateTime,
  getTenantNotificationTemplates,
  interpolateTemplate,
  NOTIFICATIONS_CATEGORY,
} from "./notification-template";
import { enqueueScheduledNotification } from "./scheduled-notification-queue";

export type StaffNotificationParams = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  bookingId: string;
  customerName: string;
  customerPhone?: string | null;
  serviceName: string;
  startTime: Date;
  endTime?: Date;
};

export type StaffReminderSchedule = {
  eveningBefore: Date | null;
  twoHoursBefore: Date | null;
};

/** Gets the configured staff WhatsApp number for a tenant. */
export async function getTenantStaffPhone(
  tenantId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenantId),
        eq(tenantConfigs.category, NOTIFICATIONS_CATEGORY),
        eq(tenantConfigs.key, "staff_whatsapp_phone"),
      ),
    )
    .limit(1);

  if (!row) return null;
  const raw = row.value;
  const phone =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "phone" in raw
        ? String((raw as { phone: unknown }).phone)
        : null;

  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? digits : null;
}

/**
 * Computes when to send staff reminders.
 * - eveningBefore: previous day at 20:00 UTC (~2pm Mexico City), only if in the future
 * - twoHoursBefore: startTime - 2h, only if in the future
 */
export function computeStaffReminderSchedule(
  startTime: Date,
  now: Date = new Date(),
): StaffReminderSchedule {
  // Evening before: day before at 20:00 UTC
  const evening = new Date(startTime);
  evening.setUTCDate(evening.getUTCDate() - 1);
  evening.setUTCHours(20, 0, 0, 0);

  const twoH = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);

  return {
    eveningBefore: evening > now ? evening : null,
    twoHoursBefore: twoH > now ? twoH : null,
  };
}

/** Enqueues immediate staff alert when a new booking is created. */
export async function enqueueStaffNewBookingNotification(
  params: StaffNotificationParams,
) {
  const staffPhone = await getTenantStaffPhone(params.tenantId);
  if (!staffPhone) return null;

  const templates = await getTenantNotificationTemplates(params.tenantId);
  const body = interpolateTemplate(templates.staffNewBooking, {
    customerName: params.customerName,
    customerPhone: params.customerPhone?.replace(/\D/g, "") ?? "Sin teléfono",
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime: formatAppointmentDateTime(params.startTime),
  });

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt: new Date(),
    recipientPhone: staffPhone,
    recipientName: `Staff - ${params.tenantName}`,
    body,
    templateKey: "staff_new_booking",
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    idempotencyKey: `staff_new_booking:${params.bookingId}`,
    createdBy: "booking_create",
    payload: { tenantSlug: params.tenantSlug, serviceName: params.serviceName },
  });
}

/** Enqueues evening-before and 2h-before reminders for staff. */
export async function enqueueStaffReminderNotifications(
  params: StaffNotificationParams,
) {
  const staffPhone = await getTenantStaffPhone(params.tenantId);
  if (!staffPhone) return { eveningBefore: null, twoHoursBefore: null };

  const schedule = computeStaffReminderSchedule(params.startTime);
  const templates = await getTenantNotificationTemplates(params.tenantId);
  const vars = {
    customerName: params.customerName,
    customerPhone: params.customerPhone?.replace(/\D/g, "") ?? "Sin teléfono",
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime: formatAppointmentDateTime(params.startTime),
  };

  const base = {
    tenantId: params.tenantId,
    channel: "whatsapp" as const,
    recipientPhone: staffPhone,
    recipientName: `Staff - ${params.tenantName}`,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    createdBy: "booking_create",
    payload: { tenantSlug: params.tenantSlug, serviceName: params.serviceName },
  };

  const startIso = params.startTime.toISOString();
  let eveningBefore = null;
  let twoHoursBefore = null;

  if (schedule.eveningBefore) {
    eveningBefore = await enqueueScheduledNotification({
      ...base,
      scheduledAt: schedule.eveningBefore,
      body: interpolateTemplate(templates.staffReminderEvening, vars),
      templateKey: "staff_reminder_evening",
      idempotencyKey: `staff_reminder_evening:${params.bookingId}:${startIso}`,
    });
  }

  if (schedule.twoHoursBefore) {
    twoHoursBefore = await enqueueScheduledNotification({
      ...base,
      scheduledAt: schedule.twoHoursBefore,
      body: interpolateTemplate(templates.staffReminder2h, vars),
      templateKey: "staff_reminder_2h",
      idempotencyKey: `staff_reminder_2h:${params.bookingId}:${startIso}`,
    });
  }

  return { eveningBefore, twoHoursBefore };
}

/** Re-enqueues staff reminders after reschedule (cancels old ones first). */
export async function rescheduleStaffReminderNotifications(
  params: StaffNotificationParams,
) {
  const { cancelPendingBookingNotifications } =
    await import("./scheduled-notification-queue");
  await cancelPendingBookingNotifications(params.bookingId, [
    "staff_reminder_evening",
    "staff_reminder_2h",
  ]);
  return enqueueStaffReminderNotifications(params);
}
