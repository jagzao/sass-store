/* eslint-disable no-console */
/**
 * Domain-aware structured logger for sass-store.
 *
 * Features:
 * - Per-domain loggers: tenant | auth | cart | finance | db | api | app
 * - Environment-aware defaults: production → warn+error only, dev → info+
 * - Per-domain override via env vars: LOG_LEVEL_TENANT=debug
 * - Global override: LOG_LEVEL=debug
 * - Message deduplication in dev (same message suppressed within 10s)
 * - Backward-compatible `logger` export (AppLogger API preserved)
 *
 * Usage:
 *   import { logger }          from "@/lib/logger";           // generic (backward compat)
 *   import { tenantLogger }    from "@/lib/logger";
 *   import { authLogger }      from "@/lib/logger";
 *   import { financeLogger }   from "@/lib/logger";
 *   import { cartLogger }      from "@/lib/logger";
 *   import { dbLogger }        from "@/lib/logger";
 *   import { apiLogger }       from "@/lib/logger";
 */

export type LogLevel = "error" | "warn" | "info" | "debug";
export type LogDomain =
  | "tenant"
  | "auth"
  | "cart"
  | "finance"
  | "db"
  | "api"
  | "app";

const LEVELS: LogLevel[] = ["error", "warn", "info", "debug"];

// ── Environment-aware defaults ────────────────────────────────────────────────

function resolveLevel(domain: LogDomain): LogLevel {
  // Per-domain override: LOG_LEVEL_TENANT=debug
  const domainKey = `LOG_LEVEL_${domain.toUpperCase()}`;
  const domainEnv = process.env[domainKey] as LogLevel | undefined;
  if (domainEnv && LEVELS.includes(domainEnv)) return domainEnv;

  // Global override: LOG_LEVEL=info
  const globalEnv = process.env.LOG_LEVEL as LogLevel | undefined;
  if (globalEnv && LEVELS.includes(globalEnv)) return globalEnv;

  // Default: production logs only warn+error; development logs info+
  return process.env.NODE_ENV === "production" ? "warn" : "info";
}

// ── Message deduplication (dev only) ─────────────────────────────────────────
// Prevents the same warning from flooding the console on every request.
// Not used in production (serverless: no shared memory across invocations).

const DEDUP_MS = process.env.NODE_ENV !== "production" ? 10_000 : 0;
const _dedup = new Map<string, number>();

function isDuplicate(key: string): boolean {
  if (!DEDUP_MS) return false;
  const now = Date.now();
  const last = _dedup.get(key);
  if (last !== undefined && now - last < DEDUP_MS) return true;
  _dedup.set(key, now);
  // Prevent unbounded growth — evict oldest entry when > 500 keys
  if (_dedup.size > 500) {
    const firstKey = _dedup.keys().next().value;
    if (firstKey !== undefined) _dedup.delete(firstKey);
  }
  return false;
}

// ── Core DomainLogger class ───────────────────────────────────────────────────

export class DomainLogger {
  private readonly minLevel: LogLevel;

  constructor(
    private readonly domain: LogDomain | string,
    minLevel?: LogLevel,
  ) {
    this.minLevel = minLevel ?? resolveLevel((domain as LogDomain) || "app");
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS.indexOf(level) <= LEVELS.indexOf(this.minLevel);
  }

  private emit(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    // Deduplicate repetitive non-error messages in dev
    if (level !== "error") {
      const dedupKey = `${this.domain}:${level}:${message}`;
      if (isDuplicate(dedupKey)) return;
    }

    const ts = new Date().toISOString();
    const prefix = `[${ts}] [${level.toUpperCase()}] [${this.domain}]`;

    if (data !== undefined) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  error(message: string, data?: unknown): void {
    this.emit("error", message, data);
  }

  warn(message: string, data?: unknown): void {
    this.emit("warn", message, data);
  }

  info(message: string, data?: unknown): void {
    this.emit("info", message, data);
  }

  debug(message: string, data?: unknown): void {
    this.emit("debug", message, data);
  }

  /** Return a child logger with a sub-context label, e.g. tenantLogger.child("resolver") */
  child(subContext: string): DomainLogger {
    return new DomainLogger(`${this.domain}/${subContext}`, this.minLevel);
  }

  /** @deprecated use child() */
  withContext(context: string): DomainLogger {
    return this.child(context);
  }
}

// ── Domain loggers ────────────────────────────────────────────────────────────

/** Tenant resolution, middleware, slug/id lookup */
export const tenantLogger = new DomainLogger("tenant");

/** Authentication, sessions, tokens, OAuth */
export const authLogger = new DomainLogger("auth");

/** Cart operations, cart-store, checkout */
export const cartLogger = new DomainLogger("cart");

/** Finance, POS, budgets, movements, reports */
export const financeLogger = new DomainLogger("finance");

/** Database connections, queries, migrations */
export const dbLogger = new DomainLogger("db");

/** API routes, external HTTP calls */
export const apiLogger = new DomainLogger("api");

/** Generic / unclassified — backward-compatible default */
export const appLogger = new DomainLogger("app");

// ── Backward-compat AppLogger class (preserves existing `logger` API) ─────────

/** @deprecated Prefer domain loggers (tenantLogger, authLogger, etc.) */
export class AppLogger extends DomainLogger {
  constructor(options: { level?: LogLevel; context?: string } = {}) {
    super((options.context as LogDomain) ?? "app", options.level);
  }
}

/**
 * Generic logger — kept for backward compatibility.
 * New code should use domain-specific loggers instead.
 */
export const logger = new AppLogger();
