import {
  formatAppointmentDateTime,
  getTenantSessionTemplates,
  interpolateTemplate,
} from "./notification-template";
import {
  cancelPendingSessionEnrollmentNotifications,
  enqueueScheduledNotification,
} from "./scheduled-notification-queue";

const MS_24H = 24 * 60 * 60 * 1000;
const MS_1H = 60 * 60 * 1000;

export type SessionNotificationParams = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  enrollmentId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  sessionTitle: string;
  location?: string | null;
  startTime: Date;
};

export function computeSessionReminderSchedule(
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

export async function enqueueSessionReminderNotifications(
  params: SessionNotificationParams,
) {
  const phone = normalizePhone(params.customerPhone);
  if (!phone) {
    return { reminder24h: null, reminder1h: null };
  }

  const schedule = computeSessionReminderSchedule(params.startTime);
  if (!schedule.reminder24h && !schedule.reminder1h) {
    return { reminder24h: null, reminder1h: null };
  }

  const templates = await getTenantSessionTemplates(params.tenantId);
  const sessionDateTime = formatAppointmentDateTime(params.startTime);
  const vars = {
    customerName: params.customerName,
    tenantName: params.tenantName,
    sessionTitle: params.sessionTitle,
    sessionDateTime,
    location: params.location ?? "",
  };

  const base = {
    tenantId: params.tenantId,
    channel: "whatsapp" as const,
    recipientPhone: phone,
    recipientName: params.customerName,
    customerId: params.customerId,
    relatedEntityType: "session_enrollment",
    relatedEntityId: params.enrollmentId,
    createdBy: "session_enrollment",
    payload: {
      tenantSlug: params.tenantSlug,
      sessionTitle: params.sessionTitle,
      startIso: params.startTime.toISOString(),
      location: params.location,
    },
  };

  const startIso = params.startTime.toISOString();
  let reminder24h = null;
  let reminder1h = null;

  if (schedule.reminder24h) {
    reminder24h = await enqueueScheduledNotification({
      ...base,
      scheduledAt: schedule.reminder24h,
      body: interpolateTemplate(templates.sessionReminder24h, vars),
      templateKey: "session_reminder_24h",
      idempotencyKey: `session_reminder_24h:${params.enrollmentId}:${startIso}`,
    });
  }

  if (schedule.reminder1h) {
    reminder1h = await enqueueScheduledNotification({
      ...base,
      scheduledAt: schedule.reminder1h,
      body: interpolateTemplate(templates.sessionReminder1h, vars),
      templateKey: "session_reminder_1h",
      idempotencyKey: `session_reminder_1h:${params.enrollmentId}:${startIso}`,
    });
  }

  return { reminder24h, reminder1h };
}

export async function rescheduleSessionReminderNotifications(
  params: SessionNotificationParams,
) {
  await cancelPendingSessionEnrollmentNotifications(params.enrollmentId, [
    "session_reminder_24h",
    "session_reminder_1h",
    "session_enrollment_confirmation",
  ]);
  return enqueueSessionReminderNotifications(params);
}
