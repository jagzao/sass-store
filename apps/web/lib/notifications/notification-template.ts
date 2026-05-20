import { db } from "@sass-store/database";
import { tenantConfigs } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";

export const NOTIFICATIONS_CATEGORY = "notifications";

export type ReminderTemplateKey = "reminder_24h" | "reminder_1h";

export type TenantReminderTemplates = {
  reminder24h: string;
  reminder1h: string;
};

const DEFAULT_TEMPLATES: TenantReminderTemplates = {
  reminder24h:
    "Hola {{customerName}}, te recordamos que mañana tienes cita en {{tenantName}} para {{serviceName}} el {{appointmentDateTime}}. ¡Te esperamos!",
  reminder1h:
    "Hola {{customerName}}, tu cita en {{tenantName}} ({{serviceName}}) es en 1 hora: {{appointmentDateTime}}. ¡Te esperamos!",
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

export async function getTenantReminderTemplates(
  tenantId: string,
): Promise<TenantReminderTemplates> {
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
    const raw = row.value;
    const body =
      typeof raw === "string"
        ? raw
        : raw &&
            typeof raw === "object" &&
            "body" in raw &&
            typeof (raw as { body: unknown }).body === "string"
          ? (raw as { body: string }).body
          : null;
    if (!body?.trim()) continue;
    if (row.key === "reminder_24h") out.reminder24h = body.trim();
    if (row.key === "reminder_1h") out.reminder1h = body.trim();
  }
  return out;
}

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
