import { NextRequest } from "next/server";
import { db } from "@sass-store/database";
import {
  bookings,
  tenants,
  services,
  staff,
  customers,
  userRoles,
  users,
} from "@sass-store/database/schema";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";
import { withResultHandler } from "@sass-store/core/src/middleware/result-handler";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import {
  findCustomerMatches,
  pickBestCustomerMatch,
} from "@/lib/customers/match-customer";
import { enqueueBookingReminderNotifications } from "@/lib/notifications/booking-reminder-notification";
import { enqueueBookingConfirmationNotification } from "@/lib/notifications/booking-confirmation-notification";
import {
  enqueueStaffNewBookingNotification,
  enqueueStaffReminderNotifications,
} from "@/lib/notifications/booking-staff-notification";
import { byIp, byPhone, getClientIp } from "@/lib/middleware/rate-limit";
import { consumeKey, verifyIssuer } from "@/lib/booking/idempotency";

/**
 * STRY-021 — Bookings API Endpoint (migrated to Result Pattern).
 *
 * The mobile 3-step flow hits POST with an X-Idempotency-Key header issued by
 * GET /api/tenants/[tenant]/book/idempotency-key. Rate limiting applies to
 * both endpoints.
 */

const PHONE_REGEX = /^[0-9]{10}$/; // mirrors CommonSchemas.phoneMX()

/** Strip non-digits, drop the leading "52" country code if present. */
function normalizePhoneInput(value: unknown): string {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  return digits;
}

const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  customerPhone: z
    .string()
    .optional()
    .transform((v) => normalizePhoneInput(v ?? ""))
    .refine(
      (v) => v === "" || PHONE_REGEX.test(v),
      "Teléfono debe tener 10 dígitos",
    ),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
  totalPrice: z.number().positive(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
});

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function notifyTenantAdminsAboutBooking(input: {
  tenantId: string;
  tenantName: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  startTime: Date;
  endTime: Date;
}) {
  if (!resendClient) return;

  const adminUsers = await db
    .select({ email: users.email, name: users.name })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(
      and(
        eq(userRoles.tenantId, input.tenantId),
        inArray(userRoles.role, ["Admin", "Gerente"]),
      ),
    );

  const emails = adminUsers
    .map((u) => u.email)
    .filter((email): email is string => Boolean(email));
  if (!emails.length) return;

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const dateText = input.startTime.toLocaleDateString("es-MX");
  const startText = input.startTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endText = input.endTime.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await Promise.allSettled(
    emails.map((to) =>
      resendClient.emails.send({
        from,
        to,
        subject: `Nueva cita agendada - ${input.tenantName}`,
        html: `
          <h2>Nueva cita agendada</h2>
          <p>Se registro una nueva cita en <strong>${input.tenantName}</strong>.</p>
          <ul>
            <li><strong>Cliente:</strong> ${input.customerName}</li>
            <li><strong>Telefono:</strong> ${input.customerPhone || "No proporcionado"}</li>
            <li><strong>Email:</strong> ${input.customerEmail || "No proporcionado"}</li>
            <li><strong>Fecha:</strong> ${dateText}</li>
            <li><strong>Horario:</strong> ${startText} - ${endText}</li>
          </ul>
        `,
      }),
    ),
  );
}

interface TenantRow {
  id: string;
  name: string;
  mode: string;
  slug: string;
}

async function resolveTenant(
  tenantSlug: string,
): Promise<Result<TenantRow, DomainError>> {
  const [tenant] = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      mode: tenants.mode,
      slug: tenants.slug,
    })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }
  if (tenant.mode !== "booking") {
    return Err(ErrorFactories.tenantNotBookingMode(tenantSlug, tenant.mode));
  }
  return Ok(tenant);
}

async function resolveTenantReadOnly(
  tenantSlug: string,
): Promise<Result<{ id: string; name: string }, DomainError>> {
  const [tenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant) return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  return Ok(tenant);
}

/** Postgres unique_violation — emitted by the booking_slot_uniq partial index. */
function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string } | undefined)?.code;
  return code === "23505";
}

/**
 * GET /api/tenants/[tenant]/bookings
 *
 * Fetch all bookings for a tenant with optional filters.
 */
export const GET = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug } = await context.params;
    const tenantResult = await resolveTenantReadOnly(tenantSlug);
    if (!tenantResult.success) return tenantResult;
    const tenant = tenantResult.data;

    const { searchParams } = new URL(request.url);
    const conditions = [eq(bookings.tenantId, tenant.id)];
    const status = searchParams.get("status");
    if (status) conditions.push(eq(bookings.status, status));
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from) conditions.push(gte(bookings.startTime, new Date(from)));
    if (to) conditions.push(lte(bookings.startTime, new Date(to)));

    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100,
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const allBookings = await db.query.bookings.findMany({
      where: and(...conditions),
      with: { service: true, staff: true, customer: true },
      orderBy: [desc(bookings.startTime)],
      limit,
      offset,
    });

    const formattedBookings = allBookings.map((b) => ({
      ...b,
      totalPrice: Number(b.totalPrice),
    }));

    return Ok({ bookings: formattedBookings });
  },
);

/**
 * POST /api/tenants/[tenant]/bookings
 *
 * STRY-021 — Create a booking. Mobile flow sends X-Idempotency-Key.
 * Defaults status to "confirmed" (override of DB default "pending") when the
 * client does not specify one — matches SC-01.
 */
export const POST = withResultHandler(
  async (
    request: NextRequest,
    context: { params: Promise<{ tenant: string }> },
  ): Promise<Result<unknown, DomainError>> => {
    const { tenant: tenantSlug } = await context.params;

    // 1. Rate limit (SC-14, SC-14b). Fail-open if Redis is down.
    const ipLimit = await byIp(request);
    if (!ipLimit.success) return ipLimit;

    // 2. Resolve tenant and enforce booking mode (SC-11).
    const tenantResult = await resolveTenant(tenantSlug);
    if (!tenantResult.success) return tenantResult;
    const tenant = tenantResult.data;

    // 3. Parse + validate body.
    const bodyResult = await readJsonBody(request);
    if (!bodyResult.success) return bodyResult;
    const validated = validateWithZod(createBookingSchema, bodyResult.data);
    if (!validated.success) return validated;
    const data = validated.data;

    // 4. Rate limit by phone if provided.
    if (data.customerPhone) {
      const phoneLimit = await byPhone(tenant.id, data.customerPhone);
      if (!phoneLimit.success) return phoneLimit;
    }

    // 5. Idempotency: replay guard (SC-04, SC-04b).
    const idempotencyKey = request.headers.get("x-idempotency-key");
    const clientIp = getClientIp(request);
    if (idempotencyKey) {
      const verify = await verifyIssuer(idempotencyKey, clientIp, tenantSlug);
      if (!verify.success) return verify;

      const consumed = await consumeKey(idempotencyKey, "");
      if (!consumed.success) return consumed;
      if (consumed.data.replayed && consumed.data.bookingId) {
        const [existing] = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.id, consumed.data.bookingId),
              eq(bookings.tenantId, tenant.id),
            ),
          )
          .limit(1);
        if (existing) {
          return Ok({
            data: { ...existing, totalPrice: Number(existing.totalPrice) },
            replayed: true,
          });
        }
      }
    }

    // 6. Resolve service + optional customer in parallel.
    const [serviceResult, customerResult] = await Promise.all([
      db
        .select()
        .from(services)
        .where(
          and(
            eq(services.id, data.serviceId),
            eq(services.tenantId, tenant.id),
          ),
        )
        .limit(1),
      data.customerId
        ? db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.id, data.customerId),
                eq(customers.tenantId, tenant.id),
              ),
            )
            .limit(1)
        : Promise.resolve([] as (typeof customers.$inferSelect)[]),
    ]);

    const [service] = serviceResult;
    if (!service) {
      return Err(
        ErrorFactories.notFound("Service", data.serviceId, {
          tenantId: tenant.id,
        }),
      );
    }

    let linkedCustomerId = data.customerId ?? null;
    if (linkedCustomerId) {
      const [customer] = customerResult;
      if (!customer) {
        return Err(
          ErrorFactories.notFound("Customer", data.customerId!, {
            tenantId: tenant.id,
          }),
        );
      }
    } else {
      const matches = await findCustomerMatches(tenant.id, {
        name: data.customerName,
        email: data.customerEmail,
        phone: data.customerPhone || undefined,
      });
      const best = pickBestCustomerMatch(matches);
      if (best) linkedCustomerId = best.id;
    }

    // 7. Insert. Mobile flow forces "confirmed" when no explicit status.
    const finalStatus = data.status ?? "confirmed";

    // SC-12: si no llega staffId, asignar primer staff activo del tenant.
    // Sin esto, todas las reservas mobile quedan staffId=null y el unique
    // partial index (con cláusula staff_id IS NOT NULL) no protege contra duplicados.
    let finalStaffId = data.staffId ?? null;
    if (!finalStaffId) {
      const [fallbackStaff] = await db
        .select({ id: staff.id })
        .from(staff)
        .where(and(eq(staff.tenantId, tenant.id), eq(staff.active, true)))
        .orderBy(staff.createdAt)
        .limit(1);
      finalStaffId = fallbackStaff?.id ?? null;
    }

    let newBooking: typeof bookings.$inferSelect;
    try {
      const [inserted] = await db
        .insert(bookings)
        .values({
          tenantId: tenant.id,
          serviceId: data.serviceId,
          customerId: linkedCustomerId,
          staffId: finalStaffId,
          customerName: data.customerName,
          customerEmail: data.customerEmail || null,
          customerPhone: data.customerPhone || null,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          status: finalStatus,
          notes: data.notes || null,
          totalPrice: data.totalPrice.toString(),
          metadata: { source: "mobile-3step", version: 1 },
        })
        .returning();
      newBooking = inserted;
    } catch (insertError) {
      if (isUniqueViolation(insertError)) {
        // SC-12 — race condition resolved by the partial unique index.
        return Err(
          ErrorFactories.bookingSlotTaken(undefined, undefined, data.startTime),
        );
      }
      throw insertError;
    }

    // 8. Idempotency: record bookingId so concurrent submits replay.
    if (idempotencyKey) {
      consumeKey(idempotencyKey, newBooking.id).catch((e) =>
        console.error("[bookings] idempotency consume error:", e),
      );
    }

    // 9. Side-effects: admin email + customer/staff notifications.
    //    Wrapped individually so a failing notification never rolls back the
    //    booking (SC-10b: "no rollback"). These are NOT business logic.
    notifyTenantAdminsAboutBooking({
      tenantId: tenant.id,
      tenantName: tenant.name,
      customerName: data.customerName,
      customerPhone: data.customerPhone || undefined,
      customerEmail: data.customerEmail || undefined,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    }).catch((e) => console.error("[bookings] admin email error:", e));

    let bookingReminders: unknown = null;
    let bookingConfirmation: unknown = null;

    if (finalStatus !== "cancelled") {
      const notifParams = {
        tenantId: tenant.id,
        tenantSlug,
        tenantName: tenant.name,
        bookingId: newBooking.id,
        customerId: linkedCustomerId,
        customerName: data.customerName,
        customerPhone: data.customerPhone || undefined,
        serviceName: service.name,
        startTime: new Date(data.startTime),
      };

      bookingConfirmation = await safeEnqueue(
        () => enqueueBookingConfirmationNotification(notifParams),
        "confirmation",
      );
      bookingReminders = await safeEnqueue(
        () => enqueueBookingReminderNotifications(notifParams),
        "reminder",
      );
      await safeEnqueue(
        () => enqueueStaffNewBookingNotification(notifParams),
        "staff_new",
      );
      await safeEnqueue(
        () => enqueueStaffReminderNotifications(notifParams),
        "staff_reminder",
      );
    }

    return Ok({
      data: { ...newBooking, totalPrice: Number(newBooking.totalPrice) },
      bookingConfirmation,
      bookingReminders,
      replayed: false,
    });
  },
);

async function readJsonBody(
  request: NextRequest,
): Promise<Result<unknown, DomainError>> {
  try {
    const body = await request.json();
    return Ok(body);
  } catch (error) {
    return Err(
      ErrorFactories.validation(
        "Failed to parse request body",
        undefined,
        undefined,
        error,
      ),
    );
  }
}

/** Run a side-effecting notification enqueue without ever throwing. */
async function safeEnqueue<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    console.error(`[bookings] ${label} notification error:`, e);
    return null;
  }
}
