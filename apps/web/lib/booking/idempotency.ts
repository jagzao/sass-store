/**
 * Idempotency para STRY-021 — lifecycle en 2 fases:
 *
 *   1. Fase pre-check (sin bookingId): marca la key como "pending" si no existe,
 *      o retorna el bookingId guardado si ya se completó un POST anterior.
 *      Race protection: si 2 requests simultáneos pasan el pre-check, el unique
 *      partial index de DB (booking_slot_uniq) atrapa el segundo en el INSERT.
 *
 *   2. Fase record (con bookingId): graba el bookingId real sobreescribiendo
 *      el sentinel "pending". SET sin NX (overwrite intencional).
 *
 * El sentinel distingue "key pendiente" de "key con booking real" → segundo
 * POST ve replayed=true + bookingId real y devuelve la reserva existente.
 */

import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

const ISSUE_TTL_SEC = 300; // 5 minutes — covers filling the 3 steps on mobile
const CONSUME_TTL_SEC = 300;
const PENDING_SENTINEL = "__pending__";

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

export interface IssuedKey {
  key: string;
  issuedAt: string;
}

const issueRedisKey = (key: string) => `idem:issue:${key}`;
const consumeRedisKey = (key: string) => `booking:idem:${key}`;

/**
 * Issue a new server-side random idempotency key bound to (ip, tenantSlug).
 */
export async function issueKey(
  ip: string,
  tenantSlug: string,
): Promise<Result<IssuedKey, DomainError>> {
  const redis = getRedis();
  const key = crypto.randomBytes(32).toString("hex");
  const issuedAt = new Date().toISOString();

  if (!redis) {
    return Ok({ key, issuedAt });
  }

  try {
    await redis.set(issueRedisKey(key), `${ip}:${tenantSlug}`, {
      ex: ISSUE_TTL_SEC,
    });
    return Ok({ key, issuedAt });
  } catch (error) {
    return Ok({ key, issuedAt }); // degrade gracefully
  }
}

/**
 * Validate the issuer of `key` against the current (ip, tenantSlug).
 */
export async function verifyIssuer(
  key: string,
  ip: string,
  tenantSlug: string,
): Promise<Result<void, DomainError>> {
  const redis = getRedis();
  if (!redis) return Ok(undefined);
  try {
    const stored = (await redis.get<string>(issueRedisKey(key))) ?? null;
    if (!stored) {
      return Ok(undefined);
    }
    const expected = `${ip}:${tenantSlug}`;
    if (stored !== expected) {
      return Err(ErrorFactories.idempotencyKeyMismatch(key));
    }
    return Ok(undefined);
  } catch (error) {
    return Ok(undefined); // fail-open
  }
}

/**
 * Lifecycle consume. Comportamiento depende de `bookingId`:
 *
 *   - bookingId vacío (pre-check): si la key ya tiene un bookingId real,
 *     retorna {replayed: true, bookingId}. Sino, marca "pending" con SET NX
 *     y retorna {replayed: false}. Si ya estaba "pending", retorna
 *     {replayed: true, pending: true} (otro request en curso).
 *
 *   - bookingId no vacío (record post-insert): sobreescribe con SET (sin NX)
 *     para guardar el bookingId real. Retorna {replayed: false}.
 */
export async function consumeKey(
  key: string,
  bookingId: string,
): Promise<
  Result<
    { replayed: boolean; bookingId?: string; pending?: boolean },
    DomainError
  >
> {
  const redis = getRedis();
  if (!redis) return Ok({ replayed: false });

  try {
    if (!bookingId) {
      // pre-check
      const existing = (await redis.get<string>(consumeRedisKey(key))) ?? null;
      if (existing && existing !== PENDING_SENTINEL) {
        return Ok({ replayed: true, bookingId: existing });
      }
      if (existing === PENDING_SENTINEL) {
        return Ok({ replayed: true, pending: true });
      }
      // marcar pending atómicamente
      const setResult = (await redis.set(
        consumeRedisKey(key),
        PENDING_SENTINEL,
        {
          nx: true,
          ex: CONSUME_TTL_SEC,
        },
      )) as string | null;
      if (setResult === "OK") {
        return Ok({ replayed: false });
      }
      // perdimos la race: otro request acaba de marcar pending
      return Ok({ replayed: true, pending: true });
    }
    // record post-insert: overwrite con bookingId real
    await redis.set(consumeRedisKey(key), bookingId, {
      ex: CONSUME_TTL_SEC,
    });
    return Ok({ replayed: false });
  } catch (error) {
    return Ok({ replayed: false }); // fail-open
  }
}
