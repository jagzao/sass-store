/**
 * STRY-021 — Rate limiting helpers for the booking mobile flow.
 *
 * Thin Result-returning wrapper around Upstash Redis INCR + EXPIRE.
 * Fail-open (returns Ok) when Redis is unavailable so the booking flow does
 * not hard-depend on infrastructure — mirrors the policy in
 * @/lib/security/rate-limiter.ts.
 *
 * Two scopes are required by the spec:
 *   - byIp(req)            → 5 req / 60s   per client IP
 *   - byPhone(tenantId, p) → 3 req / 3600s per (tenant, normalized phone)
 */

import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

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

/**
 * Extracts the client IP from Next.js runtime.
 *
 * Trusts ONLY Cloudflare's `cf-connecting-ip` (set por el edge de CF, no
 * spoofable por el cliente). Cualquier otro header (X-Forwarded-For,
 * X-Real-IP) es trivialmente spoofable y fue rejectado por el review
 * STRY-021 (NEW H-A). Si no hay cf-connecting-ip → "unknown" y el limiter
 * degrada (fail-open para usuarios legítimos detrás de proxy no-Cloudflare;
 * pendiente configurar TRUST_PROXY en ops si se usa otro CDN).
 *
 * IPv6 normalizado a /64 (ver normalizeIp).
 */
export function getClientIp(request: NextRequest): string {
  const raw = request.headers.get("cf-connecting-ip") ?? "unknown";
  return normalizeIp(raw);
}

export function normalizeIp(ip: string): string {
  if (ip.includes(":") && ip.includes(".")) return ip;
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 4) {
      return parts.slice(0, 4).join(":"); // /64 prefix
    }
  }
  return ip;
}

/** Normalize a phone input to digits-only, max 15 chars (E.164 cap). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(0, 15);
}

/**
 * Core limiter. Returns Ok when within budget, Err(RateLimitExceeded) when
 * the counter is at or above `limit` for the current window.
 *
 * Implementation: INCR + EXPIRE pattern. The first INCR in a window primes
 * the key; subsequent INCRs bump the counter. EXPIRE is only set on the
 * first INCR (value === 1) to avoid resetting the window on every request.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<Result<void, DomainError>> {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] Redis no configurado — rate limiting desactivado",
      );
    }
    return Ok(undefined);
  }

  try {
    const count = (await redis.incr(key)) as number;
    if (count === 1) {
      await redis.expire(key, windowSec);
    }
    if (count > limit) {
      const ttl = (await redis.ttl(key)) as number;
      return Err(
        ErrorFactories.rateLimitExceeded(
          limit,
          `${windowSec}s`,
          undefined,
          ttl > 0 ? ttl : windowSec,
        ),
      );
    }
    return Ok(undefined);
  } catch (error) {
    console.error("[rate-limit] Redis error:", error);
    return Ok(undefined); // fail-open
  }
}

/** 5 req / 60s per IP. Cubre SC-14. */
export function byIp(request: NextRequest): Promise<Result<void, DomainError>> {
  const ip = getClientIp(request);
  return checkRateLimit(`rl:ip:${ip}`, 5, 60);
}

/** 3 req / 3600s per (tenantId, phone). Cubre SC-14b. */
export function byPhone(
  tenantId: string,
  phone: string,
): Promise<Result<void, DomainError>> {
  const normalized = normalizePhone(phone);
  if (!normalized) return Promise.resolve(Ok(undefined));
  return checkRateLimit(`rl:phone:${tenantId}:${normalized}`, 3, 3600);
}
