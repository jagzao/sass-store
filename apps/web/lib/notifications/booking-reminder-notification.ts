import crypto from "crypto";
import { db } from "@sass-store/database";
import { tenantConfigs, waTenantConfig } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import {
  formatAppointmentDateTime,
  getTenantReminderTemplates,
  interpolateTemplate,
  NOTIFICATIONS_CATEGORY,
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
 * STRY-021 — Returns true when the tenant has WhatsApp connected
 * (wa_tenant_config row exists for this slug). The reminder flow is gated on
 * this so that tenants without WhatsApp still create bookings silently
 * (SC-06) without surfacing warnings to the client.
 */
export async function tenantHasWhatsApp(tenantSlug: string): Promise<boolean> {
  const [row] = await db
    .select({ slug: waTenantConfig.tenantSlug })
    .from(waTenantConfig)
    .where(eq(waTenantConfig.tenantSlug, tenantSlug))
    .limit(1);
  return Boolean(row);
}

/**
 * STRY-021 — Resolve the per-tenant HMAC secret used to sign reminder tokens.
 *
 * Canonical source: `tenantConfigs` row (category=notifications,
 * key=whatsapp_hmac_secret). Stored as jsonb — accepted as `{secret: string}`
 * or a bare string.
 * Fallback: empty string (logged once) so the flow still works during setup.
 */
export async function getTenantHmacSecret(
  tenantId: string,
): Promise<{ secret: string; warned: boolean }> {
  const [row] = await db
    .select({ value: tenantConfigs.value })
    .from(tenantConfigs)
    .where(
      and(
        eq(tenantConfigs.tenantId, tenantId),
        eq(tenantConfigs.category, NOTIFICATIONS_CATEGORY),
        eq(tenantConfigs.key, "whatsapp_hmac_secret"),
      ),
    )
    .limit(1);

  const raw = row?.value;
  const secret =
    typeof raw === "string"
      ? raw
      : raw && typeof raw === "object" && "secret" in raw
        ? String((raw as { secret: unknown }).secret)
        : "";
  if (!secret) {
    // SECURITY: Redacted sensitive log;
  }
  return { secret, warned: !secret };
}

/**
 * STRY-021 — Compute the HMAC token embedded in reminder quick-reply buttons.
 *
 * Token = HMAC-SHA256(`${bookingId}${tenantSecret}`, WEBHOOK_SIGNING_SECRET).
 * The webhook handler recomputes the same token from the inbound button
 * payload to validate triple-match (SC-07..09c).
 */
export function computeBookingToken(
  bookingId: string,
  tenantSecret: string,
): string {
  const key = process.env.WEBHOOK_SIGNING_SECRET ?? "";
  if (!key) {
    // SECURITY: Redacted sensitive log;
  }
  return crypto
    .createHmac("sha256", key)
    .update(`${bookingId}${tenantSecret}`)
    .digest("hex");
}

/**
 * Encola recordatorios WhatsApp 24h y 1h antes de la cita (n8n envía cuando scheduled_at <= now).
 *
 * STRY-021 — Gate: solo programa cuando el tenant tiene WhatsApp conectado
 * (wa_tenant_config). Sin WhatsApp → silencioso, sin error (SC-06).
 */
export async function enqueueBookingReminderNotifications(
  params: BookingReminderParams,
) {
  // Gate SC-06 — silencioso cuando el tenant no tiene WhatsApp.
  const hasWa = await tenantHasWhatsApp(params.tenantSlug);
  if (!hasWa) {
    console.warn("[bookings] WhatsApp no configurado — reminders omitidos", {
      tenantSlug: params.tenantSlug,
    });
    return { reminder24h: null, reminder1h: null };
  }

  const phone = normalizePhone(params.customerPhone);
  if (!phone) {
    return { reminder24h: null, reminder1h: null };
  }

  const schedule = computeReminderSchedule(params.startTime);
  if (!schedule.reminder24h && !schedule.reminder1h) {
    return { reminder24h: null, reminder1h: null };
  }

  const { secret: tenantSecret } = await getTenantHmacSecret(params.tenantId);
  const token = computeBookingToken(params.bookingId, tenantSecret);

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
      token,
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
