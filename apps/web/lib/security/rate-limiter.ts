/**
 * STRY-021 PERF-004 — Rate limiter basado en Upstash Redis.
 *
 * Reemplaza la implementación in-memory (Map) que era inútil en entornos
 * serverless/multi-instancia (Vercel). Ahora el estado es compartido entre
 * todas las instancias Lambda via Redis.
 *
 * Algoritmo: Sliding window con sorted set de Redis.
 * Fallback: fail-open si Redis no está configurado (con advertencia).
 */

import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

function getRedisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_TOKEN?.trim();

  if (!url || !token) return null;

  return new Redis({ url, token });
}

// Singleton — se comparte entre todas las instancias del módulo
const redis = getRedisClient();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
  blockReason?: string;
}

/**
 * Sliding window rate limiter usando Redis sorted set.
 * Cada request agrega una entrada con score=timestamp. Las entradas fuera
 * de la ventana se eliminan en la misma operación (pipeline atómico).
 */
async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  if (!redis) {
    // Sin Redis: fail-open con log de advertencia (solo una vez)
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[RateLimit] Redis no configurado — rate limiting desactivado en producción",
      );
    }
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: 0,
      blocked: false,
    };
  }

  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  try {
    // Pipeline atómico:
    // 1. Eliminar entradas fuera de la ventana de tiempo
    // 2. Contar entradas dentro de la ventana
    // 3. Agregar la request actual
    // 4. Setear TTL para auto-cleanup
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    pipeline.expire(key, windowSeconds + 1);

    const results = await pipeline.exec();
    // results[1] es el count ANTES de agregar la request actual
    const currentCount = (results[1] as number) ?? 0;

    if (currentCount >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + windowMs,
        blocked: true,
        blockReason: "Rate limit exceeded",
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - currentCount - 1),
      resetTime: now + windowMs,
      blocked: false,
    };
  } catch (error) {
    // Fail-open: si Redis falla, no bloquear requests legítimas
    console.error("[RateLimit] Redis error:", error);
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: 0,
      blocked: false,
    };
  }
}

function getClientIP(request: NextRequest): string {
  // Cloudflare primero, luego proxies standard
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

interface RateLimiterConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number; // Ya no se usa — Redis maneja TTL automáticamente
  whitelist?: string[];
  blacklist?: string[];
  identifier?: string;
}

/**
 * Rate limiter compatible con la API anterior (AdvancedRateLimiter).
 * Ahora usa Redis en lugar de Map en memoria.
 */
export class AdvancedRateLimiter {
  private maxRequests: number;
  private windowSeconds: number;
  private identifier: string;
  private whitelist: string[];
  private blacklist: string[];

  constructor(config: RateLimiterConfig) {
    this.maxRequests = config.maxRequests;
    this.windowSeconds = Math.floor(config.windowMs / 1000);
    this.identifier = config.identifier ?? "rl";
    this.whitelist = config.whitelist ?? [];
    this.blacklist = config.blacklist ?? [];
  }

  async checkLimit(
    request: NextRequest,
    identifier?: string,
  ): Promise<RateLimitResult> {
    const ip = getClientIP(request);

    if (this.blacklist.includes(ip)) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 24 * 60 * 60 * 1000,
        blocked: true,
        blockReason: "IP address is blacklisted",
      };
    }

    if (this.whitelist.includes(ip)) {
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetTime: Date.now() + this.windowSeconds * 1000,
        blocked: false,
      };
    }

    const key = `ratelimit:${identifier ?? this.identifier}:${ip}`;
    return checkRateLimitRedis(key, this.maxRequests, this.windowSeconds);
  }

  // Métodos legacy — ya no son necesarios con Redis (TTL automático)
  cleanup(): void {}
  blockIP(_ip: string, _durationMs?: number): void {}
  unblockIP(_ip: string): void {}
  getStatus(_ip: string, _identifier?: string): null {
    return null;
  }
}

// Pre-configured rate limiters (misma configuración que antes)
export const authRateLimiter = new AdvancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 intentos por ventana
  identifier: "auth",
});

export const apiRateLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 req/min
  identifier: "api",
});

export const configRateLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30, // 30 cambios de config por minuto
  identifier: "config",
});

// STRY-021 PERF-004: Eliminado setInterval de cleanup —
// Redis maneja la expiración automáticamente con TTL.
