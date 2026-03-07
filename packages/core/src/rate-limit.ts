import { NextRequest, NextResponse } from "next/server";
import { Result, Ok, Err, isSuccess, isFailure } from "./result";
import { DomainError, ErrorFactories, RateLimitError } from "./errors/types";

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
  keyGenerator?: (request: NextRequest) => string;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blockedUntil?: number;
  firstRequestTime: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
  blocked: boolean;
  retryAfter?: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  result: RateLimitResult;
}

type RateLimiterType = "auth" | "general" | "customers" | "services" | "upload" | "admin";

// ============================================================================
// In-Memory Fallback Store (ALWAYS ACTIVE)
// ============================================================================

class InMemoryRateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (now > entry.resetTime && (!entry.blockedUntil || now > entry.blockedUntil)) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /**
   * Get store size for testing/debugging
   */
  get size(): number {
    return this.store.size;
  }
}

// Global in-memory store instance (singleton)
const inMemoryStore = new InMemoryRateLimitStore();

// ============================================================================
// Redis Client (Optional)
// ============================================================================

let redisClient: any = null;
let redisAvailable = false;

async function initializeRedis(): Promise<boolean> {
  // Check if Redis is configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn("[Rate Limit] Redis not configured, using in-memory fallback");
    redisAvailable = false;
    return false;
  }

  try {
    // Dynamic import to avoid errors when not installed
    const { Redis } = await import("@upstash/redis");
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    // Test connection
    await redisClient.ping();
    redisAvailable = true;
    console.info("[Rate Limit] Redis connected successfully");
    return true;
  } catch (error) {
    console.warn("[Rate Limit] Redis connection failed, using in-memory fallback:", error);
    redisAvailable = false;
    redisClient = null;
    return false;
  }
}

// Initialize Redis on module load
initializeRedis().catch(() => {
  // Silently fail - in-memory fallback will be used
});

// ============================================================================
// Rate Limit Configurations
// ============================================================================

const RATE_LIMIT_CONFIGS: Record<RateLimiterType, RateLimitConfig> = {
  // Auth endpoints - very strict: 5 requests per 15 minutes
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDurationMs: 60 * 60 * 1000, // 1 hour block after limit exceeded
  },
  
  // General API - moderate: 100 requests per minute
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
  },
  
  // Customer endpoints - moderate: 60 requests per minute
  customers: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    blockDurationMs: 15 * 60 * 1000,
  },
  
  // Service endpoints - moderate: 30 requests per minute
  services: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    blockDurationMs: 15 * 60 * 1000,
  },
  
  // Upload endpoints - strict: 10 requests per minute
  upload: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
  },
  
  // Admin endpoints - strict: 20 requests per minute
  admin: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    blockDurationMs: 30 * 60 * 1000,
  },
};

// ============================================================================
// Key Generation
// ============================================================================

function getDefaultKey(request: NextRequest, limiterType: RateLimiterType): string {
  // Get client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  const ip = forwarded?.split(",")[0]?.trim() || realIP || cfConnectingIP || "unknown";
  
  // Get tenant from headers or path
  const tenant = request.headers.get("x-tenant") || 
                 request.headers.get("x-tenant-id") ||
                 extractTenantFromPath(request.nextUrl?.pathname) ||
                 "global";
  
  // Get user ID if available (from headers set by auth middleware)
  const userId = request.headers.get("x-user-id") || "";
  
  // Build key: ip:tenant:user:type
  return `${ip}:${tenant}:${userId}:${limiterType}`;
}

function extractTenantFromPath(pathname: string | undefined): string {
  if (!pathname) return "global";
  const match = pathname.match(/\/t\/([^/]+)/);
  return match ? match[1] : "global";
}

// ============================================================================
// In-Memory Rate Limiting (Fallback - ALWAYS WORKS)
// ============================================================================

function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig
): RateLimitCheckResult {
  const now = Date.now();
  let entry = inMemoryStore.get(key);

  // Initialize or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      firstRequestTime: now,
    };
  }

  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      result: {
        success: false,
        remaining: 0,
        reset: entry.blockedUntil,
        limit: config.maxRequests,
        blocked: true,
        retryAfter,
      },
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    // Block the client
    const blockDuration = config.blockDurationMs || 15 * 60 * 1000;
    entry.blockedUntil = now + blockDuration;
    inMemoryStore.set(key, entry);

    const retryAfter = Math.ceil(blockDuration / 1000);
    return {
      allowed: false,
      result: {
        success: false,
        remaining: 0,
        reset: entry.blockedUntil,
        limit: config.maxRequests,
        blocked: true,
        retryAfter,
      },
    };
  }

  // Allow request - increment counter
  entry.count++;
  inMemoryStore.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  return {
    allowed: true,
    result: {
      success: true,
      remaining,
      reset: entry.resetTime,
      limit: config.maxRequests,
      blocked: false,
    },
  };
}

// ============================================================================
// Redis Rate Limiting (Primary when available)
// ============================================================================

async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitCheckResult> {
  if (!redisClient || !redisAvailable) {
    // Fall back to in-memory
    return checkRateLimitInMemory(key, config);
  }

  try {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const redisKey = `ratelimit:${key}`;

    // Use Redis transaction for atomicity
    const multi = redisClient.multi();
    
    // Remove old entries outside the window
    multi.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count requests in current window
    multi.zcard(redisKey);
    
    // Get the oldest request time for reset calculation
    multi.zrange(redisKey, 0, 0, "WITHSCORES");
    
    const results = await multi.exec();
    const count = results[1] as number;
    const oldestEntry = results[2] as [string, string] | [];

    // Check if limit exceeded
    if (count >= config.maxRequests) {
      const oldestTime = oldestEntry && oldestEntry[1] ? parseInt(oldestEntry[1], 10) : now;
      const resetTime = oldestTime + config.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        result: {
          success: false,
          remaining: 0,
          reset: resetTime,
          limit: config.maxRequests,
          blocked: true,
          retryAfter,
        },
      };
    }

    // Add current request
    await redisClient.zadd(redisKey, now, `${now}-${Math.random().toString(36).slice(2)}`);
    
    // Set expiry on the key
    await redisClient.expire(redisKey, Math.ceil(config.windowMs / 1000));

    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetTime = (oldestEntry && oldestEntry[1] ? parseInt(oldestEntry[1], 10) : now) + config.windowMs;

    return {
      allowed: true,
      result: {
        success: true,
        remaining,
        reset: resetTime,
        limit: config.maxRequests,
        blocked: false,
      },
    };
  } catch (error) {
    console.error("[Rate Limit] Redis error, falling back to in-memory:", error);
    // CRITICAL: Always fall back to in-memory, never bypass
    return checkRateLimitInMemory(key, config);
  }
}

// ============================================================================
// Main Rate Limit Functions
// ============================================================================

/**
 * Check rate limit for a request
 * This function NEVER bypasses rate limiting - it always uses in-memory fallback if Redis fails
 */
export async function checkRateLimit(
  request: NextRequest,
  limiterType: RateLimiterType = "general",
  customKey?: string
): Promise<Result<RateLimitResult, DomainError>> {
  // Skip rate limiting ONLY in development with explicit flag (for testing)
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DISABLE_RATE_LIMIT === "true"
  ) {
    const config = RATE_LIMIT_CONFIGS[limiterType];
    return Ok({
      success: true,
      remaining: config.maxRequests,
      reset: Date.now() + config.windowMs,
      limit: config.maxRequests,
      blocked: false,
    });
  }

  const config = RATE_LIMIT_CONFIGS[limiterType];
  const key = customKey || getDefaultKey(request, limiterType);

  // Try Redis first, fall back to in-memory
  const checkResult = redisAvailable
    ? await checkRateLimitRedis(key, config)
    : checkRateLimitInMemory(key, config);

  if (!checkResult.allowed) {
    return Err(
      ErrorFactories.rateLimit(
        checkResult.result.limit,
        limiterType,
        checkResult.result.retryAfter || 60
      )
    );
  }

  return Ok(checkResult.result);
}

/**
 * Apply rate limiting to API requests
 * Returns null if allowed, or NextResponse with 429 if rate limited
 */
export async function applyRateLimit(
  request: NextRequest,
  limiterType: RateLimiterType = "general",
  customKey?: string
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, limiterType, customKey);

  if (isSuccess(result)) {
    // Add rate limit headers to track usage
    const headers = createRateLimitHeaders(result.data);
    // Return null to indicate request is allowed
    // Headers will be added by the response wrapper
    return null;
  }

  // Rate limit exceeded
  const error = result.error as RateLimitError;
  
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: {
        type: error.type,
        message: "Too many requests. Please try again later.",
        retryAfter: error.retryAfter || 60,
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(error.retryAfter || 60),
        "X-RateLimit-Limit": String(error.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Date.now() + (error.retryAfter || 60) * 1000),
      },
    }
  );
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

/**
 * Middleware function to apply rate limiting
 * Returns NextResponse with 429 if rate limited, null if allowed
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  limiterType: RateLimiterType = "general"
): Promise<NextResponse | null> {
  return applyRateLimit(request, limiterType);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current rate limit status for a key (useful for debugging/testing)
 */
export function getRateLimitStatus(
  request: NextRequest,
  limiterType: RateLimiterType = "general"
): RateLimitEntry | null {
  const key = getDefaultKey(request, limiterType);
  return inMemoryStore.get(key) || null;
}

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(
  request: NextRequest,
  limiterType: RateLimiterType = "general"
): void {
  const key = getDefaultKey(request, limiterType);
  inMemoryStore.delete(key);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  inMemoryStore.clear();
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

/**
 * Get in-memory store size (for testing)
 */
export function getInMemoryStoreSize(): number {
  return inMemoryStore.size;
}

// ============================================================================
// Pre-configured Rate Limiters for Common Use Cases
// ============================================================================

export const rateLimiters = {
  auth: (request: NextRequest) => applyRateLimit(request, "auth"),
  general: (request: NextRequest) => applyRateLimit(request, "general"),
  customers: (request: NextRequest) => applyRateLimit(request, "customers"),
  services: (request: NextRequest) => applyRateLimit(request, "services"),
  upload: (request: NextRequest) => applyRateLimit(request, "upload"),
  admin: (request: NextRequest) => applyRateLimit(request, "admin"),
};

// ============================================================================
// Higher-Order Function for Wrapping API Handlers
// ============================================================================

type APIHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an API handler with rate limiting
 */
export function withRateLimit(
  handler: APIHandler,
  limiterType: RateLimiterType = "general"
): APIHandler {
  return async (request: NextRequest, context?: any) => {
    const rateLimitResponse = await applyRateLimit(request, limiterType);
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    return handler(request, context);
  };
}

// ============================================================================
// Export types and configurations
// ============================================================================

export { RATE_LIMIT_CONFIGS };
export type { RateLimiterType };
