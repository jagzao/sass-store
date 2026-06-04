import {
  formatAppointmentDateTime,
  getTenantSessionTemplates,
  interpolateTemplate,
} from "./notification-template";
import { enqueueScheduledNotification } from "./scheduled-notification-queue";
import type { SessionNotificationParams } from "./session-reminder-notification";

function normalizePhone(phone?: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length < 10) return null;
  return digits;
}

export async function enqueueSessionEnrollmentConfirmation(
  params: SessionNotificationParams,
) {
  const phone = normalizePhone(params.customerPhone);
  if (!phone) return null;

  const templates = await getTenantSessionTemplates(params.tenantId);
  const sessionDateTime = formatAppointmentDateTime(params.startTime);
  const vars = {
    customerName: params.customerName,
    tenantName: params.tenantName,
    sessionTitle: params.sessionTitle,
    sessionDateTime,
    location: params.location ?? "",
  };

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt: new Date(),
    recipientPhone: phone,
    recipientName: params.customerName,
    customerId: params.customerId,
    body: interpolateTemplate(templates.sessionEnrollmentConfirmation, vars),
    templateKey: "session_enrollment_confirmation",
    relatedEntityType: "session_enrollment",
    relatedEntityId: params.enrollmentId,
    idempotencyKey: `session_enrollment_confirmation:${params.enrollmentId}`,
    createdBy: "session_enrollment",
    payload: {
      tenantSlug: params.tenantSlug,
      sessionTitle: params.sessionTitle,
      startIso: params.startTime.toISOString(),
    },
  });
}
