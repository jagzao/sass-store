import { buildRescheduleWhatsAppLink } from "@/lib/home/whatsapp-reschedule";
import { enqueueScheduledNotification } from "./scheduled-notification-queue";

function formatDateTime(d: Date): string {
  return d.toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type EnqueueBookingRescheduleParams = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  bookingId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  serviceName: string;
  previousStart: Date;
  newStart: Date;
};

/**
 * Encola WhatsApp de reprogramación para que n8n envíe (Cloud API o wa.me según workflow).
 */
export async function enqueueBookingRescheduleNotification(
  params: EnqueueBookingRescheduleParams,
) {
  const phone = params.customerPhone?.replace(/\D/g, "");
  if (!phone || phone.length < 10) {
    return null;
  }

  const body = `Hola ${params.customerName}, te escribimos de ${params.tenantName} para informarte que tu cita de ${params.serviceName} se reprogramó.

Horario anterior: ${formatDateTime(params.previousStart)}
Nuevo horario: ${formatDateTime(params.newStart)}

¿Confirmas el cambio? ¡Gracias!`;

  const waLink = buildRescheduleWhatsAppLink({
    phone: params.customerPhone!,
    customerName: params.customerName,
    tenantName: params.tenantName,
    serviceName: params.serviceName,
    previousStart: params.previousStart,
    newStart: params.newStart,
  });

  return enqueueScheduledNotification({
    tenantId: params.tenantId,
    channel: "whatsapp",
    scheduledAt: new Date(),
    recipientPhone: phone,
    recipientName: params.customerName,
    body,
    templateKey: "booking_reschedule",
    customerId: params.customerId ?? undefined,
    bookingId: params.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: params.bookingId,
    idempotencyKey: `booking_reschedule:${params.bookingId}:${params.newStart.toISOString()}`,
    createdBy: "admin_calendar",
    payload: {
      tenantSlug: params.tenantSlug,
      waLink,
      previousStartIso: params.previousStart.toISOString(),
      newStartIso: params.newStart.toISOString(),
      serviceName: params.serviceName,
    },
  });
}
