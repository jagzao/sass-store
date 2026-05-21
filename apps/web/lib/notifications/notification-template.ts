import { db } from "@sass-store/database";
import { tenantConfigs } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";

export const NOTIFICATIONS_CATEGORY = "notifications";

export type NotificationTemplateKey =
  | "reminder_24h"
  | "reminder_1h"
  | "confirmation"
  | "cancelled"
  | "confirmed"
  | "noshow"
  | "review_request"
  | "staff_new_booking"
  | "staff_reminder_evening"
  | "staff_reminder_2h";

// Keep old type alias for backwards compat
export type ReminderTemplateKey = "reminder_24h" | "reminder_1h";

export type TenantNotificationTemplates = {
  // Client notifications
  reminder24h: string;
  reminder1h: string;
  confirmation: string;
  cancelled: string;
  confirmed: string;
  noshow: string;
  reviewRequest: string;
  // Staff/owner notifications
  staffNewBooking: string;
  staffReminderEvening: string;
  staffReminder2h: string;
};

// Keep old type alias for backwards compat
export type TenantReminderTemplates = TenantNotificationTemplates;

const DEFAULT_TEMPLATES: TenantNotificationTemplates = {
  reminder24h:
    "Hola {{customerName}}, te recordamos que mañana tienes cita en {{tenantName}} para {{serviceName}} el {{appointmentDateTime}}. ¡Te esperamos!",
  reminder1h:
    "Hola {{customerName}}, tu cita en {{tenantName}} ({{serviceName}}) es en 1 hora: {{appointmentDateTime}}. ¡Te esperamos!",
  confirmation:
    "Hola {{customerName}}, tu cita en {{tenantName}} para {{serviceName}} ha sido agendada para el {{appointmentDateTime}}. ¡Te esperamos! Si necesitas cambiar algo, responde este mensaje.",
  cancelled:
    "Hola {{customerName}}, te informamos que tu cita en {{tenantName}} para {{serviceName}} del {{appointmentDateTime}} ha sido cancelada. Para reagendar, responde este mensaje.",
  confirmed:
    "Hola {{customerName}}, tu cita en {{tenantName}} para {{serviceName}} el {{appointmentDateTime}} ha sido confirmada. ¡Te esperamos!",
  noshow:
    "Hola {{customerName}}, notamos que no pudiste asistir a tu cita en {{tenantName}} para {{serviceName}}. ¿Te gustaría reagendar? Responde este mensaje y con gusto te ayudamos.",
  reviewRequest:
    "Hola {{customerName}}, esperamos que hayas disfrutado tu visita a {{tenantName}}. ¿Podrías dejarnos una reseña? Tu opinión nos ayuda mucho. ¡Gracias!",
  // Staff templates
  staffNewBooking:
    "📅 Nueva cita: {{customerName}} | {{serviceName}} | {{appointmentDateTime}}. Teléfono: {{customerPhone}}.",
  staffReminderEvening:
    "🌙 Recordatorio para mañana: {{customerName}} | {{serviceName}} | {{appointmentDateTime}}. ¡Prepara todo!",
  staffReminder2h:
    "⏰ En 2 horas: {{customerName}} para {{serviceName}} ({{appointmentDateTime}}). ¡A punto!",
};

export function formatAppointmentDateTime(d: Date): string {
  return d.toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function interpolateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => vars[key] ?? "",
  );
}

function extractBody(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  if (
    raw &&
    typeof raw === "object" &&
    "body" in raw &&
    typeof (raw as { body: unknown }).body === "string"
  )
    return (raw as { body: string }).body;
  return null;
}

const TEMPLATE_KEY_MAP: Record<string, keyof TenantNotificationTemplates> = {
  reminder_24h: "reminder24h",
  reminder_1h: "reminder1h",
  confirmation: "confirmation",
  cancelled: "cancelled",
  confirmed: "confirmed",
  noshow: "noshow",
  review_request: "reviewRequest",
  staff_new_booking: "staffNewBooking",
  staff_reminder_evening: "staffReminderEvening",
  staff_reminder_2h: "staffReminder2h",
};

export async function getTenantNotificationTemplates(
  tenantId: string,
): Promise<TenantNotificationTemplates> {
  const rows = await db
    .select({ key: tenantConfigs.key, value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenantId),
        eq(tenantConfigs.category, NOTIFICATIONS_CATEGORY),
      ),
    );

  const out = { ...DEFAULT_TEMPLATES };
  for (const row of rows) {
    const body = extractBody(row.value);
    if (!body?.trim()) continue;
    const field = TEMPLATE_KEY_MAP[row.key];
    if (field) out[field] = body.trim();
  }
  return out;
}

// Backwards-compatible alias
export const getTenantReminderTemplates = getTenantNotificationTemplates;

export async function saveTenantReminderTemplate(
  tenantId: string,
  key: ReminderTemplateKey,
  body: string,
): Promise<void> {
  await db
    .insert(tenantConfigs)
    .values({
      tenantId,
      category: NOTIFICATIONS_CATEGORY,
      key,
      value: { body: body.trim() },
    })
    .onConflictDoUpdate({
      target: [
        tenantConfigs.tenantId,
        tenantConfigs.category,
        tenantConfigs.key,
      ],
      set: { value: { body: body.trim() }, updatedAt: new Date() },
    });
}
