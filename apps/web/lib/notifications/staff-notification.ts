/**
 * STRY-021 — Staff notification on new booking (SC-10, SC-10b).
 *
 * Lookup order:
 *   1. The staff member assigned to the booking (when staffId is provided and
 *      that staff row has a phone).
 *   2. Fallback: the tenant admin who has a phone configured.
 *
 * When neither staff nor an admin with a phone exists, the request is pushed
 * to a Redis dead-letter queue (`notifications:dlq:{tenantSlug}`) so it is
 * monitorable. The booking is never rolled back — SC-10b is explicit about
 * this.
 *
 * This is intentionally separate from the legacy
 * @/lib/notifications/booking-staff-notification.ts which is tenant-config
 * based. This module is staff-row based (per STRY-021 plan §7).
 */

import { Redis } from "@upstash/redis";
import { db } from "@sass-store/database";
import { staff, userRoles, users } from "@sass-store/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import {
  formatAppointmentDateTime,
  getTenantNotificationTemplates,
  interpolateTemplate,
} from "./notification-template";
import { enqueueScheduledNotification } from "./scheduled-notification-queue";

let redisClient: Redis | null = null;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_TOKEN?.trim();
  if (!url || !token) return null;
  redisClient = new Redis({ url, token });
  return redisClient;
}

function normalizePhone(phone?: string | null): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits.length >= 10 ? digits : null;
}

async function dlqPush(
  tenantSlug: string,
  payload: { bookingId: string; reason: string },
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    console.warn(
      "[staff-notification] DLQ no disponible (Redis ausente) — descartando",
      { tenantSlug, bookingId: payload.bookingId },
    );
    return;
  }
  try {
    await redis.lpush(
      `notifications:dlq:${tenantSlug}`,
      JSON.stringify(payload),
    );
  } catch (e) {
    console.error("[staff-notification] DLQ push error:", e);
  }
}

export interface StaffNotificationInput {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  bookingId: string;
  staffId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  serviceName: string;
  startTime: Date;
}

export interface StaffNotificationResult {
  deliveredTo: "staff" | "admin" | "dlq";
  recipientPhone: string | null;
  scheduledNotificationId: string | null;
}

/**
 * Enqueue a "new booking" notification for the assigned staff. Falls back to
 * an admin with a phone, then to the Redis DLQ (SC-10b).
 */
export async function enqueueStaffNotification(
  input: StaffNotificationInput,
): Promise<StaffNotificationResult> {
  // 1. Resolve staff phone.
  let recipientPhone: string | null = null;
  let recipientLabel = "Staff";

  if (input.staffId) {
    const [staffRow] = await db
      .select({ name: staff.name, phone: staff.phone })
      .from(staff)
      .where(
        and(eq(staff.id, input.staffId), eq(staff.tenantId, input.tenantId)),
      )
      .limit(1);
    if (staffRow) {
      recipientPhone = normalizePhone(staffRow.phone);
      recipientLabel = staffRow.name;
    }
  }

  // 2. Fallback: tenant admin with a phone.
  if (!recipientPhone) {
    const admins = await db
      .select({ name: users.name, phone: users.phone })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(
        and(
          eq(userRoles.tenantId, input.tenantId),
          inArray(userRoles.role, ["Admin", "Gerente"]),
        ),
      );
    const adminWithPhone = admins.find((a) => normalizePhone(a.phone));
    if (adminWithPhone) {
      recipientPhone = normalizePhone(adminWithPhone.phone);
      recipientLabel = adminWithPhone.name ?? "Admin";
    }
  }

  // 3. No reachable human → DLQ, no rollback (SC-10b).
  if (!recipientPhone) {
    await dlqPush(input.tenantSlug, {
      bookingId: input.bookingId,
      reason: "no_staff_no_admin_phone",
    });
    return {
      deliveredTo: "dlq",
      recipientPhone: null,
      scheduledNotificationId: null,
    };
  }

  // 4. Enqueue WhatsApp notification.
  const templates = await getTenantNotificationTemplates(input.tenantId);
  const body = interpolateTemplate(templates.staffNewBooking, {
    customerName: input.customerName,
    customerPhone: normalizePhone(input.customerPhone) ?? "Sin teléfono",
    tenantName: input.tenantName,
    serviceName: input.serviceName,
    appointmentDateTime: formatAppointmentDateTime(input.startTime),
  });

  const scheduled = await enqueueScheduledNotification({
    tenantId: input.tenantId,
    channel: "whatsapp",
    scheduledAt: new Date(),
    recipientPhone,
    recipientName: `Staff - ${recipientLabel}`,
    body,
    templateKey: "booking_staff_new",
    bookingId: input.bookingId,
    relatedEntityType: "booking",
    relatedEntityId: input.bookingId,
    idempotencyKey: `booking_staff_new:${input.bookingId}`,
    createdBy: "booking_create",
    payload: {
      tenantSlug: input.tenantSlug,
      serviceName: input.serviceName,
    },
  });

  return {
    deliveredTo: input.staffId ? "staff" : "admin",
    recipientPhone,
    scheduledNotificationId: scheduled?.id ?? null,
  };
}
