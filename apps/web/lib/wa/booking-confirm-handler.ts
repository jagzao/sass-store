/**
 * STRY-021 SC-07..09c — Internal handler for booking confirm/cancel intents.
 *
 * NOT a public HTTP route. Invoked by the WhatsApp webhook router after the
 * main webhook has validated the Meta HMAC signature and the message
 * timestamp (±5 min). This function only owns the booking state machine.
 *
 * Triple-match auth: (tenantSlug, customerPhone, bookingId + HMAC token).
 * If any of the three fails to match the booking row → silent no-op + warn
 * log without PII (SC-09c).
 *
 * Cancellation rule (inclusive): cancel allowed when startTime - now >= 2h.
 */

import { db } from "@sass-store/database";
import { bookings, tenants } from "@sass-store/database/schema";
import { and, eq } from "drizzle-orm";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError } from "@sass-store/core/src/errors/types";
import {
  computeBookingToken,
  getTenantHmacSecret,
} from "@/lib/notifications/booking-reminder-notification";
import { cancelPendingBookingNotifications } from "@/lib/notifications/scheduled-notification-queue";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export type BookingConfirmAction = "confirm" | "cancel";

export interface BookingConfirmIntentInput {
  tenantSlug: string;
  /** Raw `messages[].from` value from Meta (may include country code). */
  customerPhone: string;
  /** Quick-reply payload `{action}|{bookingId}|{token}`. */
  buttonPayload: string;
}

export interface BookingConfirmIntentResult {
  newStatus: string;
  reply: string;
  acked?: boolean;
}

interface ParsedPayload {
  action: BookingConfirmAction;
  bookingId: string;
  token: string;
}

/**
 * Parse the quick-reply button payload. Returns null when malformed — caller
 * treats that as an unclassifiable intent (no-op).
 */
export function parseButtonPayload(payload: string): ParsedPayload | null {
  const parts = payload.split("|");
  if (parts.length !== 3) return null;
  const [action, bookingId, token] = parts;
  if (action !== "confirm" && action !== "cancel") return null;
  if (!bookingId || !token) return null;
  return { action, bookingId, token };
}

/**
 * Normalize phone numbers for comparison across the booking row and the
 * inbound Meta message. Strips non-digits and drops the leading "52" country
 * code so both sides land on a 10-digit canonical form.
 */
export function canonicalizePhone(phone: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

/**
 * Pure time-boundary check used by the cancel flow. Exported for unit tests
 * (SC-08, SC-09, SC-09b inclusive boundary).
 *
 * `true` → cancellation allowed (>= 2h remaining).
 * `false` → too late (< 2h remaining).
 */
export function cancellationAllowed(
  startTime: Date,
  now: Date = new Date(),
): boolean {
  return startTime.getTime() - now.getTime() >= TWO_HOURS_MS;
}

/**
 * Validate triple-match and apply the booking state transition.
 *
 * On any mismatch (token / phone / tenant / missing booking) the function
 * returns `Ok({ newStatus: "noop" })` and logs a warn — the webhook must
 * NOT distinguish "not found" from "found but wrong token" to avoid leaking
 * booking existence (SC-09c).
 */
export async function handleBookingConfirmIntent(
  input: BookingConfirmIntentInput,
): Promise<Result<BookingConfirmIntentResult, DomainError>> {
  const parsed = parseButtonPayload(input.buttonPayload);
  if (!parsed) {
    // Malformed payload → treat as unclassifiable, do not mutate.
    return Ok({ newStatus: "noop", reply: "" });
  }

  const [booking] = await db
    .select({
      id: bookings.id,
      tenantId: bookings.tenantId,
      status: bookings.status,
      customerPhone: bookings.customerPhone,
      startTime: bookings.startTime,
      metadata: bookings.metadata,
    })
    .from(bookings)
    .where(eq(bookings.id, parsed.bookingId))
    .limit(1);

  if (!booking) {
    console.warn("[wa-confirm] triple-match failed — booking not found", {
      tenantSlug: input.tenantSlug,
      bookingId: parsed.bookingId,
    });
    return Ok({ newStatus: "noop", reply: "" });
  }

  // Resolve tenant slug for this booking and compare with the inbound tenant.
  const [tenant] = await db
    .select({ slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.id, booking.tenantId))
    .limit(1);
  if (!tenant || tenant.slug !== input.tenantSlug) {
    console.warn("[wa-confirm] triple-match failed — tenant mismatch", {
      tenantSlug: input.tenantSlug,
      bookingId: parsed.bookingId,
    });
    return Ok({ newStatus: "noop", reply: "" });
  }

  // Phone match.
  const expectedPhone = canonicalizePhone(booking.customerPhone ?? "");
  const inboundPhone = canonicalizePhone(input.customerPhone);
  if (!expectedPhone || expectedPhone !== inboundPhone) {
    console.warn("[wa-confirm] triple-match failed — phone mismatch", {
      tenantSlug: input.tenantSlug,
      bookingId: parsed.bookingId,
    });
    return Ok({ newStatus: "noop", reply: "" });
  }

  // Token match (HMAC).
  const { secret: tenantSecret } = await getTenantHmacSecret(booking.tenantId);
  const expectedToken = computeBookingToken(parsed.bookingId, tenantSecret);
  if (parsed.token !== expectedToken) {
    // SECURITY: Redacted sensitive log;
    return Ok({ newStatus: "noop", reply: "" });
  }

  // Triple-match OK → dispatch by action.
  if (parsed.action === "confirm") {
    return Ok(handleConfirm(booking));
  }
  return Ok(await handleCancel(booking));
}

function handleConfirm(booking: {
  status: string;
  startTime: Date;
}): BookingConfirmIntentResult {
  if (booking.status === "cancelled") {
    // SC-07b — informational, no mutation.
    return {
      newStatus: booking.status,
      reply:
        "Tu reserva fue cancelada previamente. Si quieres reagendar, hazlo aquí: /book",
      acked: false,
    };
  }
  // SC-07 — ack, no mutation.
  return {
    newStatus: booking.status,
    reply: `Tu reserva sigue confirmada para ${booking.startTime.toISOString()}`,
    acked: true,
  };
}

async function handleCancel(booking: {
  id: string;
  status: string;
  startTime: Date;
  metadata: unknown;
}): Promise<BookingConfirmIntentResult> {
  if (booking.status === "cancelled") {
    return {
      newStatus: booking.status,
      reply: "Tu reserva ya estaba cancelada.",
    };
  }

  const now = new Date();
  if (!cancellationAllowed(booking.startTime, now)) {
    // SC-09 — too late: register attempt, do not mutate status.
    const meta = (booking.metadata ?? {}) as Record<string, unknown>;
    await db
      .update(bookings)
      .set({
        metadata: { ...meta, cancelAttemptAt: now.toISOString() },
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id));
    return {
      newStatus: booking.status,
      reply:
        "Ya no es posible cancelar (faltan menos de 2h). Llámanos si hay problema.",
    };
  }

  // SC-08 / SC-09b — cancel + cancel pending notifications.
  await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(bookings.id, booking.id));
  try {
    await cancelPendingBookingNotifications(booking.id, [
      "booking_reminder_24h",
      "booking_reminder_1h",
    ]);
  } catch (e) {
    console.error("[wa-confirm] cancel pending notifications error:", e);
  }

  return {
    newStatus: "cancelled",
    reply: "Reserva cancelada. Te esperamos pronto.",
  };
}
