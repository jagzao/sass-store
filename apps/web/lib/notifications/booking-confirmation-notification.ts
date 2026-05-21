import {
  formatAppointmentDateTime,
  getTenantNotificationTemplates,
  interpolateTemplate,
} from "./notification-template";
import { enqueueScheduledNotification } from "./scheduled-notification-queue";

export type EnqueueBookingConfirmationParams = {
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

/** Encola confirmación inmediata al cliente cuando se crea la cita. */
export async function enqueueBookingConfirmationNotification(
  params: EnqueueBookingConfirmationParams,
) {
  const phone = params.customerPhone?.replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const templates = await getTenantNotificationTemplates(params.tenantId);
  const body = interpolateTemplate(templates.confirmation, {
    customerName: params.customerName,
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime: formatAppointmentDateTime(params.startTime),
  });

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt: new Date(),
    recipientPhone: phone,
    recipientName: params.customerName,
    body,
    templateKey: "booking_confirmation",
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    idempotencyKey: `booking_confirmation:${params.bookingId}`,
    createdBy: "booking_create",
    payload: {
      tenantSlug: params.tenantSlug,
      serviceName: params.serviceName,
      startIso: params.startTime.toISOString(),
    },
  });
}

/** Encola notificación cuando admin confirma una cita pendiente (pending→confirmed). */
export async function enqueueBookingConfirmedNotification(
  params: EnqueueBookingConfirmationParams,
) {
  const phone = params.customerPhone?.replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const templates = await getTenantNotificationTemplates(params.tenantId);
  const body = interpolateTemplate(templates.confirmed, {
    customerName: params.customerName,
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime: formatAppointmentDateTime(params.startTime),
  });

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt: new Date(),
    recipientPhone: phone,
    recipientName: params.customerName,
    body,
    templateKey: "booking_confirmed",
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    idempotencyKey: `booking_confirmed:${params.bookingId}`,
    createdBy: "booking_confirm",
    payload: {
      tenantSlug: params.tenantSlug,
      serviceName: params.serviceName,
      startIso: params.startTime.toISOString(),
    },
  });
}
