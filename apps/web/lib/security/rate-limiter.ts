import { NextRequest } from "next/server";
import { securityLogger } from "./audit-logger";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // How long to block after exceeding limit
  whitelist?: string[]; // IP addresses to whitelist
  blacklist?: string[]; // IP addresses to blacklist
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
  suspiciousActivity: boolean;
}

// In-memory store (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Advanced rate limiter with attack detection
 */
export class AdvancedRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(
    request: NextRequest,
    identifier: string = "global"
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    blocked: boolean;
    blockReason?: string;
  }> {
    const ip = this.getClientIP(request);
    const key = `${identifier}:${ip}`;

    // Check blacklist
    if (this.config.blacklist?.includes(ip)) {
      await securityLogger.logSuspiciousActivity(
        null,
        null,
        "blacklisted_ip_access",
        ["blacklisted_ip"],
        ip,
        request.headers.get("user-agent") || "unknown"
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        blocked: true,
        blockReason: "IP address is blacklisted",
      };
    }

    // Check whitelist
    if (this.config.whitelist?.includes(ip)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
        blocked: false,
      };
    }

    const now = Date.now();
    let entry = rateLimitStore.get(key);

    // Initialize or reset entry if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        suspiciousActivity: false,
      };
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        blocked: true,
        blockReason: "Rate limit exceeded - temporarily blocked",
      };
    }

    // Check rate limit
    if (entry.count >= this.config.maxRequests) {
      // Block the IP
      const blockDuration = this.config.blockDurationMs || 15 * 60 * 1000; // 15 minutes default
      entry.blockedUntil = now + blockDuration;
      entry.suspiciousActivity = true;

      rateLimitStore.set(key, entry);

      // Log suspicious activity
      await securityLogger.logSuspiciousActivity(
        null,
        null,
        "rate_limit_exceeded",
        ["excessive_requests", "potential_attack"],
        ip,
        request.headers.get("user-agent") || "unknown",
        {
          requestsInWindow: entry.count,
          windowMs: this.config.windowMs,
          blockDuration,
        }
      );

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        blocked: true,
        blockReason: "Rate limit exceeded",
      };
    }

    // Allow request
    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = Math.max(0, this.config.maxRequests - entry.count);

    return {
      allowed: true,
      remaining,
      resetTime: entry.resetTime,
      blocked: false,
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request: NextRequest): string {
    // Check common headers for IP
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const cfConnectingIP = request.headers.get("cf-connecting-ip");

    // Use the first available IP
    const ip =
      forwarded?.split(",")[0]?.trim() || realIP || cfConnectingIP || "unknown";

    return ip;
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of rateLimitStore.entries()) {
      if (
        now > entry.resetTime &&
        (!entry.blockedUntil || now > entry.blockedUntil)
      ) {
        rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Get rate limit status for an IP
   */
  getStatus(ip: string, identifier: string = "global"): RateLimitEntry | null {
    return rateLimitStore.get(`${identifier}:${ip}`) || null;
  }

  /**
   * Manually block an IP
   */
  blockIP(ip: string, durationMs: number = 60 * 60 * 1000): void {
    // 1 hour default
    const key = `global:${ip}`;
    const entry = rateLimitStore.get(key) || {
      count: 0,
      resetTime: Date.now() + this.config.windowMs,
      suspiciousActivity: false,
    };

    entry.blockedUntil = Date.now() + durationMs;
    rateLimitStore.set(key, entry);
  }

  /**
   * Manually unblock an IP
   */
  unblockIP(ip: string): void {
    const key = `global:${ip}`;
    const entry = rateLimitStore.get(key);

    if (entry) {
      entry.blockedUntil = undefined;
      rateLimitStore.set(key, entry);
    }
  }
}

// Pre-configured rate limiters for different endpoints
export const authRateLimiter = new AdvancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
});

export const apiRateLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  blockDurationMs: 15 * 60 * 1000, // 15 minutes block
});

export const configRateLimiter = new AdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 config changes per minute
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
});

// Periodic cleanup (run every 5 minutes)
if (typeof globalThis !== "undefined") {
  setInterval(
    () => {
      authRateLimiter.cleanup();
      apiRateLimiter.cleanup();
      configRateLimiter.cleanup();
    },
    5 * 60 * 1000
  );
}
