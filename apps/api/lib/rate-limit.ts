import { Redis } from '@upstash/redis';

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
});

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests in the window
}

// Rate limit configurations per endpoint type
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  'products:list': { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  'products:create': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 creates per minute
  'products:update': { windowMs: 60 * 1000, maxRequests: 20 }, // 20 updates per minute
  'bookings:list': { windowMs: 60 * 1000, maxRequests: 50 },
  'bookings:create': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 bookings per minute
  'media:upload': { windowMs: 60 * 1000, maxRequests: 5 }, // 5 uploads per minute
  'default': { windowMs: 60 * 1000, maxRequests: 60 }
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  tenantId: string,
  endpoint: string,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  const config = customConfig || rateLimitConfigs[endpoint] || rateLimitConfigs.default;
  const key = `rate_limit:${tenantId}:${endpoint}`;
  const window = Math.floor(Date.now() / config.windowMs);
  const windowKey = `${key}:${window}`;

  try {
    // Get current count for this window
    const current = await redis.get(windowKey) as number || 0;

    if (current >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: (window + 1) * config.windowMs
      };
    }

    // Increment counter and set expiration
    const newCount = await redis.incr(windowKey);
    if (newCount === 1) {
      // Set expiration only on first increment
      await redis.expire(windowKey, Math.ceil(config.windowMs / 1000));
    }

    return {
      success: true,
      remaining: Math.max(0, config.maxRequests - newCount),
      resetTime: (window + 1) * config.windowMs
    };

  } catch (error) {
    console.error('Rate limit check failed:', error);
    // In case of Redis failure, allow the request but log the error
    return {
      success: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    };
  }
}

// Advanced rate limiting with burst allowance
export async function checkBurstRateLimit(
  tenantId: string,
  endpoint: string,
  burstConfig: { burstLimit: number; refillRate: number }
): Promise<RateLimitResult> {
  const key = `burst_rate_limit:${tenantId}:${endpoint}`;

  try {
    const now = Date.now();
    const bucket = await redis.hmget(key, 'tokens', 'lastRefill') as unknown as [string | null, string | null];

    let tokens = bucket[0] ? parseInt(bucket[0], 10) : burstConfig.burstLimit;
    let lastRefill = bucket[1] ? parseInt(bucket[1], 10) : now;

    // Calculate tokens to add based on time elapsed
    const timeDelta = now - lastRefill;
    const tokensToAdd = Math.floor(timeDelta / 1000 * burstConfig.refillRate);

    tokens = Math.min(burstConfig.burstLimit, tokens + tokensToAdd);

    if (tokens < 1) {
      return {
        success: false,
        remaining: 0,
        resetTime: now + (1000 / burstConfig.refillRate)
      };
    }

    // Consume a token
    tokens -= 1;

    // Update bucket
    await redis.hmset(key, {
      tokens: tokens.toString(),
      lastRefill: now.toString()
    });
    await redis.expire(key, 3600); // 1 hour expiration

    return {
      success: true,
      remaining: tokens,
      resetTime: now + ((burstConfig.burstLimit - tokens) * 1000 / burstConfig.refillRate)
    };

  } catch (error) {
    console.error('Burst rate limit check failed:', error);
    return {
      success: true,
      remaining: burstConfig.burstLimit,
      resetTime: Date.now() + 1000
    };
  }
}

// Per-tenant quota enforcement
export interface QuotaResult {
  allowed: boolean;
  usage: number;
  limit: number;
  resetDate: string;
}

export async function checkTenantQuota(
  tenantId: string,
  quotaType: 'api_calls' | 'storage' | 'bandwidth',
  amount: number = 1
): Promise<QuotaResult> {
  const key = `quota:${tenantId}:${quotaType}`;
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM format

  try {
    const quotaKey = `${key}:${monthKey}`;
    const usage = await redis.get(quotaKey) as number || 0;

    // Get tenant limits (these would normally come from database)
    const limits = {
      api_calls: 10000, // per month
      storage: 5 * 1024 * 1024 * 1024, // 5GB
      bandwidth: 50 * 1024 * 1024 * 1024 // 50GB
    };

    const limit = limits[quotaType];
    const newUsage = usage + amount;

    if (newUsage > limit) {
      return {
        allowed: false,
        usage,
        limit,
        resetDate: getNextMonthStart()
      };
    }

    // Increment usage
    await redis.incr(quotaKey);
    // Set expiration to end of month
    const secondsUntilEndOfMonth = getSecondsUntilEndOfMonth();
    await redis.expire(quotaKey, secondsUntilEndOfMonth);

    return {
      allowed: true,
      usage: newUsage,
      limit,
      resetDate: getNextMonthStart()
    };

  } catch (error) {
    console.error('Quota check failed:', error);
    return {
      allowed: true,
      usage: 0,
      limit: 10000,
      resetDate: getNextMonthStart()
    };
  }
}

function getNextMonthStart(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}

function getSecondsUntilEndOfMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
}
