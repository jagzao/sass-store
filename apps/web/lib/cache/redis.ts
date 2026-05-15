import { Redis } from "@upstash/redis";

// Initialize Redis client (singleton pattern)
let redisClient: Redis | null = null;

/** Alineado con `.env.vercel.template` y `packages/cache` (REST). Legacy: UPSTASH_REDIS_URL + TOKEN. */
function getUpstashRestCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim() ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_TOKEN?.trim() ||
    "";
  if (!url || !token) {
    return null;
  }
  return { url, token };
}

function getRedisClient(): Redis | null {
  const creds = getUpstashRestCredentials();
  if (!creds) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: creds.url,
      token: creds.token,
    });
  }

  return redisClient;
}

/**
 * Get cached data from Redis
 * @param key Cache key
 * @returns Cached data or null if not found/expired
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null; // Redis not configured, skip caching
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      // SECURITY: Redacted sensitive log;
      return cached as T;
    }
    // SECURITY: Redacted sensitive log;
    return null;
  } catch (error) {
    // SECURITY: Redacted sensitive log;
    return null; // Fail gracefully
  }
}

/**
 * Set data in Redis cache with TTL
 * @param key Cache key
 * @param value Data to cache
 * @param ttlSeconds Time to live in seconds (default: 300 = 5 minutes)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return; // Redis not configured, skip caching
  }

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    // SECURITY: Redacted sensitive log`);
  } catch (error) {
    // SECURITY: Redacted sensitive log;
    // Fail gracefully - don't throw
  }
}

/**
 * Delete cached data from Redis
 * @param key Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
    // SECURITY: Redacted sensitive log;
  } catch (error) {
    // SECURITY: Redacted sensitive log;
  }
}

/**
 * Delete multiple cached keys by pattern
 * @param pattern Pattern to match (e.g., "tenant:*")
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    // Note: Upstash Redis doesn't support SCAN, so we track keys manually
    console.warn(`[Redis] Cache DELETE pattern: ${pattern}`);
    // This is a limitation - you'd need to track keys separately for pattern deletion
  } catch (error) {
    console.error(`[Redis] Error deleting cache pattern ${pattern}:`, error);
  }
}

/**
 * Get or set cached data (cache-aside pattern)
 * @param key Cache key
 * @param fetcher Function to fetch data if not cached
 * @param ttlSeconds Time to live in seconds (default: 300 = 5 minutes)
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300,
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  // SECURITY: Redacted sensitive log;
  const data = await fetcher();

  // Store in cache
  await setCache(key, data, ttlSeconds);

  return data;
}

// Cache key generators for consistency
export const CacheKeys = {
  tenant: (slug: string) => `tenant:${slug}`,
  tenantWithData: (slug: string) => `tenant_with_data:${slug}`,
  products: (tenantSlug: string, limit: number, offset: number) =>
    `products:${tenantSlug}:${limit}:${offset}`,
  services: (tenantId: string) => `services:${tenantId}`,
  staff: (tenantId: string) => `staff:${tenantId}`,
  session: (sessionToken: string) => `session:${sessionToken}`,
  user: (userId: string) => `user:${userId}`,
};

export default {
  getCached,
  setCache,
  deleteCache,
  deleteCachePattern,
  getOrSetCache,
  CacheKeys,
};
