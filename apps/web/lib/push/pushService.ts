/**
 * STRY-026 — Servicio de suscripciones push (Web Push) por tenant.
 *
 * Solo persiste/elimina suscripciones. El envío real de notificaciones
 * (web-push send, cron worker) vive en STRY-006.
 *
 * Sigue Result Pattern: todas las operaciones que tocan la DB devuelven
 * Result<T, DomainError> (sin try/catch en lógica de negocio).
 */

import { db } from "@sass-store/database";
import { pushSubscriptions, tenants } from "@sass-store/database/schema";
import { eq, and } from "drizzle-orm";
import { Result, Ok, Err, fromPromise } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { validateWithZod } from "@sass-store/validation/src/zod-result";
import { z } from "zod";

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().optional(),
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

export interface PushSubscriptionRow {
  id: string;
  tenantId: string;
  endpoint: string;
  active: boolean;
  createdAt: Date;
}

async function resolveTenantId(
  tenantSlug: string,
): Promise<Result<string, DomainError>> {
  const lookup = await fromPromise(
    db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "resolve_tenant_for_push",
        `Failed to resolve tenant ${tenantSlug}`,
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );

  if (!lookup.success) return Err(lookup.error);

  const tenant = lookup.data[0];
  if (!tenant) {
    return Err(ErrorFactories.notFound("Tenant", tenantSlug));
  }
  return Ok(tenant.id);
}

/**
 * Crea (o reactiva) una suscripción push para el tenant.
 */
export async function subscribeToPush(
  tenantSlug: string,
  input: unknown,
): Promise<Result<PushSubscriptionRow, DomainError>> {
  const validated = validateSubscription(input);
  if (!validated.success) return Err(validated.error);

  const tenantResult = await resolveTenantId(tenantSlug);
  if (!tenantResult.success) return Err(tenantResult.error);
  const tenantId = tenantResult.data;

  const data = validated.data;

  // Upsert: si ya existe el endpoint, reactivarlo y actualizar keys.
  const existing = await fromPromise(
    db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, data.endpoint))
      .limit(1),
    (error) =>
      ErrorFactories.database(
        "find_push_subscription",
        "Failed to look up existing push subscription",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );
  if (!existing.success) return Err(existing.error);

  if (existing.data[0]) {
    const updated = await fromPromise(
      db
        .update(pushSubscriptions)
        .set({
          active: true,
          tenantId,
          p256dh: data.keys.p256dh,
          auth: data.keys.auth,
          userAgent: data.userAgent ?? null,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existing.data[0].id))
        .returning({
          id: pushSubscriptions.id,
          tenantId: pushSubscriptions.tenantId,
          endpoint: pushSubscriptions.endpoint,
          active: pushSubscriptions.active,
          createdAt: pushSubscriptions.createdAt,
        }),
      (error) =>
        ErrorFactories.database(
          "update_push_subscription",
          "Failed to reactivate push subscription",
          undefined,
          error instanceof Error ? error : undefined,
        ),
    );
    if (!updated.success) return Err(updated.error);
    return Ok(updated.data[0]);
  }

  const inserted = await fromPromise(
    db
      .insert(pushSubscriptions)
      .values({
        tenantId,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent: data.userAgent ?? null,
      })
      .returning({
        id: pushSubscriptions.id,
        tenantId: pushSubscriptions.tenantId,
        endpoint: pushSubscriptions.endpoint,
        active: pushSubscriptions.active,
        createdAt: pushSubscriptions.createdAt,
      }),
    (error) =>
      ErrorFactories.database(
        "insert_push_subscription",
        "Failed to store push subscription",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );
  if (!inserted.success) return Err(inserted.error);
  return Ok(inserted.data[0]);
}

/**
 * Desactiva/elimina una suscripción por endpoint dentro del tenant.
 */
export async function unsubscribeFromPush(
  tenantSlug: string,
  endpoint: string,
): Promise<Result<{ removed: boolean }, DomainError>> {
  if (!endpoint || typeof endpoint !== "string") {
    return Err(
      ErrorFactories.validation(
        "endpoint is required to unsubscribe",
        "endpoint",
      ),
    );
  }

  const tenantResult = await resolveTenantId(tenantSlug);
  if (!tenantResult.success) return Err(tenantResult.error);
  const tenantId = tenantResult.data;

  const deleted = await fromPromise(
    db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.tenantId, tenantId),
        ),
      )
      .returning({ id: pushSubscriptions.id }),
    (error) =>
      ErrorFactories.database(
        "delete_push_subscription",
        "Failed to remove push subscription",
        undefined,
        error instanceof Error ? error : undefined,
      ),
  );
  if (!deleted.success) return Err(deleted.error);

  return Ok({ removed: deleted.data.length > 0 });
}

function validateSubscription(
  input: unknown,
): Result<PushSubscribeInput, DomainError> {
  const zResult = validateWithZod(pushSubscribeSchema, input, "payload");
  if (!zResult.success) {
    return Err(zResult.error);
  }
  return Ok(zResult.data);
}
