/**
 * Cola de notificaciones programadas.
 *
 * La app encola aquí; n8n (u otro worker) consulta `pending` y actualiza con
 * markProcessing / markSent / markFailed.
 */

import { db } from "@sass-store/database";
import { scheduledNotifications } from "@sass-store/database/schema";
import { and, eq, sql } from "drizzle-orm";
import type {
  ScheduledNotificationChannel,
  ScheduledNotificationStatus,
} from "@sass-store/database/schema";

export type EnqueueScheduledNotificationInput = {
  tenantId: string;
  channel?: ScheduledNotificationChannel;
  scheduledAt?: Date;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientName?: string;
  subject?: string;
  body: string;
  templateKey?: string;
  payload?: Record<string, unknown>;
  customerId?: string;
  bookingId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  idempotencyKey?: string;
  createdBy?: string;
};

/** Encola una notificación (idempotente si se repite la misma key). */
export async function enqueueScheduledNotification(
  input: EnqueueScheduledNotificationInput,
) {
  const values = {
    tenantId: input.tenantId,
    channel: input.channel ?? "whatsapp",
    status: "pending" as ScheduledNotificationStatus,
    scheduledAt: input.scheduledAt ?? new Date(),
    recipientPhone: input.recipientPhone ?? null,
    recipientEmail: input.recipientEmail ?? null,
    recipientName: input.recipientName ?? null,
    subject: input.subject ?? null,
    body: input.body,
    templateKey: input.templateKey ?? null,
    payload: input.payload ?? null,
    customerId: input.customerId ?? null,
    bookingId: input.bookingId ?? null,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    idempotencyKey: input.idempotencyKey ?? null,
    createdBy: input.createdBy ?? "system",
  };

  if (input.idempotencyKey) {
    const [row] = await db
      .insert(scheduledNotifications)
      .values(values)
      .onConflictDoNothing({ target: scheduledNotifications.idempotencyKey })
      .returning();
    if (row) return row;
    const [existing] = await db
      .select()
      .from(scheduledNotifications)
      .where(eq(scheduledNotifications.idempotencyKey, input.idempotencyKey))
      .limit(1);
    return existing ?? null;
  }

  const [row] = await db
    .insert(scheduledNotifications)
    .values(values)
    .returning();
  return row;
}

/** Para n8n: filas listas para enviar (pending y scheduled_at <= now). */
export async function listDueScheduledNotifications(
  limit = 50,
  tenantId?: string,
) {
  const conditions = [
    eq(scheduledNotifications.status, "pending"),
    sql`scheduled_notifications.scheduled_at <= NOW()`,
    sql`scheduled_notifications.attempts < scheduled_notifications.max_attempts`,
  ];
  if (tenantId) {
    conditions.push(eq(scheduledNotifications.tenantId, tenantId));
  }
  return db
    .select()
    .from(scheduledNotifications)
    .where(and(...conditions))
    .orderBy(scheduledNotifications.scheduledAt)
    .limit(limit);
}

export async function markNotificationProcessing(id: string) {
  const [row] = await db
    .update(scheduledNotifications)
    .set({
      status: "processing",
      processedAt: new Date(),
      attempts: sql`${scheduledNotifications.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(scheduledNotifications.id, id))
    .returning();
  return row;
}

export async function markNotificationSent(
  id: string,
  externalMessageId?: string,
) {
  const [row] = await db
    .update(scheduledNotifications)
    .set({
      status: "sent",
      sentAt: new Date(),
      externalMessageId: externalMessageId ?? null,
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(scheduledNotifications.id, id))
    .returning();
  return row;
}

export async function markNotificationFailed(id: string, error: string) {
  const [row] = await db
    .update(scheduledNotifications)
    .set({
      status: "failed",
      lastError: error.slice(0, 2000),
      updatedAt: new Date(),
    })
    .where(eq(scheduledNotifications.id, id))
    .returning();
  return row;
}
