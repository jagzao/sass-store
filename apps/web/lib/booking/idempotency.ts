/**
 * STRY-021 — Idempotency key lifecycle for the 3-step mobile booking flow.
 *
 * Lifecycle:
 *   1. Client opens /book → UI calls GET /api/tenants/{t}/book/idempotency-key
 *      → server issues random 32-byte hex key, registers the issuance in Redis
 *      bound to (ip, tenantSlug) for 300s.
 *   2. Client submits the booking with `X-Idempotency-Key: <key>`.
 *   3. Server consumes the key: verifies the issuer matches the current
 *      (ip, tenantSlug), then `SET booking:idem:{key} {bookingId} NX EX 300`.
 *      - If the key already exists → return the stored bookingId (replay).
 *      - If the issuer mismatches → Err(IdempotencyKeyMismatch) → 401 (SC-04b).
 *
 * Keys are always server-issued, never derived from client input.
 */

import crypto from "crypto";
import { Redis } from "@upstash/redis";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

const ISSUE_TTL_SEC = 300; // 5 minutes — covers filling the 3 steps on mobile
const CONSUME_TTL_SEC = 300;

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
 * Stores `"{ip}:{tenantSlug}"` in Redis for 300s so consumeKey can verify
 * the issuer later.
 */
export async function issueKey(
  ip: string,
  tenantSlug: string,
): Promise<Result<IssuedKey, DomainError>> {
  const redis = getRedis();
  const key = crypto.randomBytes(32).toString("hex");
  const issuedAt = new Date().toISOString();

  if (!redis) {
    // Without Redis we still hand the client a key (the flow must not break),
    // but replay protection and IDOR checks become no-ops. Acceptable in dev.
    return Ok({ key, issuedAt });
  }

  try {
    await redis.set(issueRedisKey(key), `${ip}:${tenantSlug}`, {
      ex: ISSUE_TTL_SEC,
    });
    return Ok({ key, issuedAt });
  } catch (error) {
    // SECURITY: Redacted sensitive log;
    return Ok({ key, issuedAt }); // degrade gracefully
  }
}

/**
 * Validate the issuer of `key` against the current (ip, tenantSlug).
 * Used as a guard before consuming the key on POST.
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
      // Unknown / expired key — treat as new request, do not block.
      return Ok(undefined);
    }
    const expected = `${ip}:${tenantSlug}`;
    if (stored !== expected) {
      return Err(ErrorFactories.idempotencyKeyMismatch(key));
    }
    return Ok(undefined);
  } catch (error) {
    console.error("[idempotency] verifyIssuer Redis error:", error);
    return Ok(undefined); // fail-open
  }
}

/**
 * Atomically record the bookingId for `key` using SET NX so concurrent
 * submits (double tap) collapse to a single insert.
 *
 * Returns:
 *   - { replayed: true, bookingId }  when the key was already consumed
 *   - { replayed: false }            when this call won the race (caller inserts)
 */
export async function consumeKey(
  key: string,
  bookingId: string,
): Promise<Result<{ replayed: boolean; bookingId?: string }, DomainError>> {
  const redis = getRedis();
  if (!redis) return Ok({ replayed: false });

  try {
    const setResult = (await redis.set(consumeRedisKey(key), bookingId, {
      nx: true,
      ex: CONSUME_TTL_SEC,
    })) as string | null;
    if (setResult === "OK") {
      return Ok({ replayed: false });
    }
    const existing =
      (await redis.get<string>(consumeRedisKey(key))) ?? bookingId;
    return Ok({ replayed: true, bookingId: existing });
  } catch (error) {
    // SECURITY: Redacted sensitive log;
    return Ok({ replayed: false }); // fail-open: caller proceeds with insert
  }
}
