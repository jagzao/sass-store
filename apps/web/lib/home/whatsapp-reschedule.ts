import { generateWhatsAppLink } from "./whatsapp-link";

export function buildRescheduleWhatsAppLink(input: {
  phone: string;
  customerName: string;
  tenantName: string;
  serviceName: string;
  previousStart: Date;
  newStart: Date;
}): string {
  const fmt = (d: Date) =>
    d.toLocaleString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

  const message = `Hola ${input.customerName}, te escribimos de ${input.tenantName} para informarte que tu cita de ${input.serviceName} se reprogramó.

Horario anterior: ${fmt(input.previousStart)}
Nuevo horario: ${fmt(input.newStart)}

¿Confirmas el cambio? ¡Gracias!`;

  return generateWhatsAppLink({
    phone: input.phone,
    customerName: input.customerName,
    tenantName: input.tenantName,
    customMessage: message,
  });
}
