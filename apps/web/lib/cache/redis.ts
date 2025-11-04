import { Redis } from '@upstash/redis';

// Initialize Redis client (singleton pattern)
let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  // Skip Redis if not configured
  if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Redis] UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN not configured, caching disabled');
    }
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
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
      console.log(`[Redis] Cache HIT: ${key}`);
      return cached as T;
    }
    console.log(`[Redis] Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.error(`[Redis] Error getting cache for ${key}:`, error);
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
  ttlSeconds: number = 300
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return; // Redis not configured, skip caching
  }

  try {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    console.log(`[Redis] Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[Redis] Error setting cache for ${key}:`, error);
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
    console.log(`[Redis] Cache DELETE: ${key}`);
  } catch (error) {
    console.error(`[Redis] Error deleting cache for ${key}:`, error);
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
    console.log(`[Redis] Cache DELETE pattern: ${pattern}`);
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
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  console.log(`[Redis] Fetching data for: ${key}`);
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
