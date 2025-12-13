import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Initialize Redis connection
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Create rate limiter instances for different endpoints
const createRateLimiter = (requests: number, window: string) => {
  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, window as any),
  });
};

// Rate limiters for different API endpoints
export const apiRateLimiters = {
  // General API rate limiter - 100 requests per minute
  general: createRateLimiter(100, "1 m"),

  // Auth endpoints - 5 requests per minute
  auth: createRateLimiter(5, "1 m"),

  // Customer endpoints - 60 requests per minute
  customers: createRateLimiter(60, "1 m"),

  // Service endpoints - 30 requests per minute
  services: createRateLimiter(30, "1 m"),

  // Upload endpoints - 10 requests per minute
  upload: createRateLimiter(10, "1 m"),
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Apply rate limiting to API requests
 * @param request NextRequest object
 * @param limiterType Type of rate limiter to apply
 * @param identifier Unique identifier for rate limiting (defaults to IP + tenant)
 * @returns RateLimitResult or null if rate limiting is disabled
 */
export async function applyRateLimit(
  request: NextRequest,
  limiterType: keyof typeof apiRateLimiters = "general",
  identifier?: string,
): Promise<RateLimitResult | null> {
  // Skip rate limiting in development if disabled
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DISABLE_RATE_LIMIT === "true"
  ) {
    return null;
  }

  // Check if Redis is configured
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    console.warn("[Rate Limit] Redis not configured, skipping rate limiting");
    return null;
  }

  try {
    // Get client IP for rate limiting
    const ip =
      (request as any).ip ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Get tenant from headers
    const tenant = request.headers.get("x-tenant") || "unknown";

    // Create unique identifier
    const rateLimitId = identifier || `${ip}:${tenant}:${limiterType}`;

    // Apply rate limiting
    const rateLimiter = apiRateLimiters[limiterType];
    const result = await rateLimiter.limit(rateLimitId);

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: result.limit,
    };
  } catch (error) {
    console.error("[Rate Limit] Error applying rate limit:", error);
    // In case of error, allow the request but log the issue
    return null;
  }
}

/**
 * Create rate limit response headers
 * @param result RateLimitResult
 * @returns Headers object with rate limit information
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

/**
 * Middleware function to apply rate limiting
 * @param request NextRequest object
 * @param limiterType Type of rate limiter to apply
 * @returns NextResponse if rate limited, null if allowed
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  limiterType: keyof typeof apiRateLimiters = "general",
): Promise<NextResponse | null> {
  const result = await applyRateLimit(request, limiterType);

  if (result === null) {
    // Rate limiting disabled or error occurred
    return null;
  }

  if (!result.success) {
    // Rate limit exceeded
    const headers = createRateLimitHeaders(result);
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: result.reset,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...headers,
          "Retry-After": result.reset.toString(),
        },
      },
    );
  }

  // Add rate limit headers to the response
  const headers = createRateLimitHeaders(result);
  const response = NextResponse.next();

  // Add headers to response
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return null;
}
