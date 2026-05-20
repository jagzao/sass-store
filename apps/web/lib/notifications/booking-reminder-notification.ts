import {
  formatAppointmentDateTime,
  getTenantReminderTemplates,
  interpolateTemplate,
} from "./notification-template";
import {
  cancelPendingBookingNotifications,
  enqueueScheduledNotification,
} from "./scheduled-notification-queue";

const MS_24H = 24 * 60 * 60 * 1000;
const MS_1H = 60 * 60 * 1000;

export type BookingReminderParams = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  bookingId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  serviceName: string;
  startTime: Date;
};

export function computeReminderSchedule(
  startTime: Date,
  now: Date = new Date(),
): { reminder24h: Date | null; reminder1h: Date | null } {
  const t24 = new Date(startTime.getTime() - MS_24H);
  const t1 = new Date(startTime.getTime() - MS_1H);
  return {
    reminder24h: t24 > now ? t24 : null,
    reminder1h: t1 > now ? t1 : null,
  };
}

function normalizePhone(phone?: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 10) return null;
  return digits;
}

/**
 * Encola recordatorios WhatsApp 24h y 1h antes de la cita (n8n envía cuando scheduled_at <= now).
 */
export async function enqueueBookingReminderNotifications(
  params: BookingReminderParams,
) {
  const phone = normalizePhone(params.customerPhone);
  if (!phone) {
    return { reminder24h: null, reminder1h: null };
  }

  const schedule = computeReminderSchedule(params.startTime);
  if (!schedule.reminder24h && !schedule.reminder1h) {
    return { reminder24h: null, reminder1h: null };
  }

  const templates = await getTenantReminderTemplates(params.tenantId);
  const appointmentDateTime = formatAppointmentDateTime(params.startTime);
  const vars = {
    customerName: params.customerName,
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime,
  };

  const base = {
    tenantId: params.tenantId,
    channel: "whatsapp" as const,
    recipientPhone: phone,
    recipientName: params.customerName,
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    createdBy: "booking_create",
    payload: {
      tenantSlug: params.tenantSlug,
      serviceName: params.serviceName,
      startIso: params.startTime.toISOString(),
    },
  };

  const startIso = params.startTime.toISOString();
  let reminder24h = null;
  let reminder1h = null;

  if (schedule.reminder24h) {
    reminder24h = await enqueueScheduledNotification({
      ...base,
      scheduledAt: schedule.reminder24h,
      body: interpolateTemplate(templates.reminder24h, vars),
      templateKey: "booking_reminder_24h",
      idempotencyKey: `booking_reminder_24h:${params.bookingId}:${startIso}`,
    });
  }

  if (schedule.reminder1h) {
    reminder1h = await enqueueScheduledNotification({
      ...base,
      scheduledAt: schedule.reminder1h,
      body: interpolateTemplate(templates.reminder1h, vars),
      templateKey: "booking_reminder_1h",
      idempotencyKey: `booking_reminder_1h:${params.bookingId}:${startIso}`,
    });
  }

  return { reminder24h, reminder1h };
}

/** Reprograma recordatorios: cancela pendientes y vuelve a encolar con el nuevo horario. */
export async function rescheduleBookingReminderNotifications(
  params: BookingReminderParams,
) {
  await cancelPendingBookingNotifications(params.bookingId, [
    "booking_reminder_24h",
    "booking_reminder_1h",
  ]);
  return enqueueBookingReminderNotifications(params);
}
