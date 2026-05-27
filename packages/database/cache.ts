import { Redis } from "@upstash/redis";

// Initialize Upstash Redis client only if environment variables are set
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "your-upstash-redis-url" &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== "your-upstash-redis-token";

const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// In-memory cache fallback for development
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

/**
 * Cache wrapper with automatic TTL management
 * Reduces database load by caching frequently accessed data
 */
export class CacheManager {
  private static instance: CacheManager;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Get cached value or fetch from database
   * @param key Cache key
   * @param fetcher Function to fetch data if not cached
   * @param ttl Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> {
    try {
      if (redis) {
        // Try to get from Redis cache
        const cached = await redis.get<T>(key);

        if (cached !== null) {
          // SECURITY: Redacted sensitive log;
          return cached;
        }

        // Cache miss - fetch from database
        // SECURITY: Redacted sensitive log;
        const data = await fetcher();

        // Store in Redis cache
        await redis.setex(key, ttl, JSON.stringify(data));

        return data;
      } else {
        // Use in-memory cache
        const cached = memoryCache.get(key);
        const now = Date.now();

        if (cached && cached.expiresAt > now) {
          return cached.data;
        }

        // Cache miss or expired - fetch from database
        const data = await fetcher();

        // Store in memory cache
        memoryCache.set(key, {
          data,
          expiresAt: now + ttl * 1000,
        });

        return data;
      }
    } catch (error) {
      // SECURITY: Redacted sensitive log;
      // Fallback to direct fetch if cache fails
      return fetcher();
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  async invalidate(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
      // SECURITY: Redacted sensitive log;
    } catch (error) {
      // SECURITY: Redacted sensitive log;
    }
  }

  // Track keys in memory for basic pattern invalidation support
  private _keyIndex: Set<string> = new Set();

  trackKey(key: string): void {
    this._keyIndex.add(key);
  }

  static keys = {
    tenant: (slug: string) => `tenant:${slug}`,
    tenantById: (id: string) => `tenant:id:${id}`,
    products: (tenantId: string) => `products:${tenantId}`,
    product: (id: string) => `product:${id}`,
    mediaAsset: (id: string) => `media:${id}`,
  };

  /**
   * Invalidate all keys matching a pattern string (simple prefix match).
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (redis) {
        const keysToDelete: string[] = [];
        for (const key of this._keyIndex) {
          if (key.startsWith(pattern)) {
            keysToDelete.push(key);
          }
        }
        if (keysToDelete.length) {
          await redis.del(...keysToDelete);
          for (const k of keysToDelete) this._keyIndex.delete(k);
        }
      } else {
        const keysToDelete: string[] = [];
        for (const key of memoryCache.keys()) {
          if (key.startsWith(pattern)) {
            keysToDelete.push(key);
          }
        }
        for (const k of keysToDelete) memoryCache.delete(k);
      }
      console.log(
        `[Cache INVALIDATE PATTERN] ${pattern} — ${this._keyIndex.size} keys tracked`,
      );
    } catch (error) {
      console.error(`[Cache INVALIDATE PATTERN ERROR] ${pattern}:`, error);
    }
  }
}

export const cache = CacheManager.getInstance();

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  TENANT: 7200, // 2 hours (slugs rarely change)
  PRODUCT: 1800, // 30 minutes
  MEDIA: 86400, // 24 hours
  SESSION: 1800, // 30 minutes
} as const;

/**
 * Helper to wrap a server-only fetcher with CacheManager.
 * Ensures the key is tracked for pattern invalidation.
 */
export async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSec: number = CACHE_TTL.PRODUCT,
): Promise<T> {
  const instance = CacheManager.getInstance();
  instance.trackKey(key);
  return instance.getOrSet<T>(key, fetcher, ttlSec);
}
