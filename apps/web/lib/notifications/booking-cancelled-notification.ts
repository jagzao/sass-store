import {
  formatAppointmentDateTime,
  getTenantNotificationTemplates,
  interpolateTemplate,
} from "./notification-template";
import { enqueueScheduledNotification } from "./scheduled-notification-queue";

export type EnqueueBookingCancelledParams = {
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

/** Notifica al cliente que su cita fue cancelada. */
export async function enqueueBookingCancelledNotification(
  params: EnqueueBookingCancelledParams,
) {
  const phone = params.customerPhone?.replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const templates = await getTenantNotificationTemplates(params.tenantId);
  const body = interpolateTemplate(templates.cancelled, {
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
    templateKey: "booking_cancelled",
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    // No idempotencyKey: si se cancela y reactiva varias veces se puede notificar cada vez
    createdBy: "booking_cancel",
    payload: {
      tenantSlug: params.tenantSlug,
      serviceName: params.serviceName,
      startIso: params.startTime.toISOString(),
    },
  });
}

/** Notifica al cliente después de la cita para pedir reseña (scheduledAt = endTime + 2h). */
export async function enqueueBookingReviewRequestNotification(
  params: EnqueueBookingCancelledParams & { endTime: Date },
) {
  const phone = params.customerPhone?.replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const scheduledAt = new Date(params.endTime.getTime() + 2 * 60 * 60 * 1000);
  const templates = await getTenantNotificationTemplates(params.tenantId);
  const body = interpolateTemplate(templates.reviewRequest, {
    customerName: params.customerName,
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime: formatAppointmentDateTime(params.startTime),
  });

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt,
    recipientPhone: phone,
    recipientName: params.customerName,
    body,
    templateKey: "booking_review_request",
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    idempotencyKey: `booking_review_request:${params.bookingId}`,
    createdBy: "booking_complete",
    payload: {
      tenantSlug: params.tenantSlug,
      serviceName: params.serviceName,
      startIso: params.startTime.toISOString(),
    },
  });
}

/** Notifica al cliente cuando no asistió (scheduledAt = startTime + 30min). */
export async function enqueueBookingNoShowNotification(
  params: EnqueueBookingCancelledParams,
) {
  const phone = params.customerPhone?.replace(/\D/g, "");
  if (!phone || phone.length < 10) return null;

  const scheduledAt = new Date(params.startTime.getTime() + 30 * 60 * 1000);
  const templates = await getTenantNotificationTemplates(params.tenantId);
  const body = interpolateTemplate(templates.noshow, {
    customerName: params.customerName,
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    appointmentDateTime: formatAppointmentDateTime(params.startTime),
  });

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt,
    recipientPhone: phone,
    recipientName: params.customerName,
    body,
    templateKey: "booking_noshow",
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    idempotencyKey: `booking_noshow:${params.bookingId}`,
    createdBy: "booking_noshow",
    payload: {
      tenantSlug: params.tenantSlug,
      serviceName: params.serviceName,
      startIso: params.startTime.toISOString(),
    },
  });
}
