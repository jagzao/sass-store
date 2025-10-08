/**
 * Redis Cache Implementation using Upstash
 *
 * Features:
 * - Multi-tenant data caching
 * - Automatic TTL management
 * - Cache invalidation helpers
 *
 * Setup:
 * 1. Sign up at https://upstash.com (Free tier: 10k commands/day)
 * 2. Create a Redis database
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=your_token
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Fallback to in-memory cache if Redis not configured
const memoryCache = new Map<string, { value: any; expiry: number }>();

/**
 * Cache wrapper with automatic fallback
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (redis) {
      return await redis.get<T>(key);
    }

    // Memory cache fallback
    const cached = memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }
    memoryCache.delete(key);
    return null;
  },

  /**
   * Set value in cache with TTL (seconds)
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (redis) {
      await redis.set(key, value, { ex: ttl });
      return;
    }

    // Memory cache fallback
    memoryCache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  },

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    if (redis) {
      await redis.del(key);
      return;
    }
    memoryCache.delete(key);
  },

  /**
   * Delete multiple keys
   */
  async delMany(keys: string[]): Promise<void> {
    if (redis) {
      await redis.del(...keys);
      return;
    }
    keys.forEach(key => memoryCache.delete(key));
  },

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    if (redis) {
      await redis.flushdb();
      return;
    }
    memoryCache.clear();
  },
};

/**
 * Tenant-specific cache helpers
 */
export const tenantCache = {
  /**
   * Get cached tenant data
   */
  async getTenant(slug: string) {
    return cache.get(`tenant:${slug}`);
  },

  /**
   * Cache tenant data (1 hour TTL)
   */
  async setTenant(slug: string, data: any) {
    await cache.set(`tenant:${slug}`, data, 3600);
  },

  /**
   * Get cached tenant products
   */
  async getProducts(tenantSlug: string) {
    return cache.get(`tenant:${tenantSlug}:products`);
  },

  /**
   * Cache tenant products (30 minutes TTL)
   */
  async setProducts(tenantSlug: string, products: any[]) {
    await cache.set(`tenant:${tenantSlug}:products`, products, 1800);
  },

  /**
   * Get cached tenant services
   */
  async getServices(tenantSlug: string) {
    return cache.get(`tenant:${tenantSlug}:services`);
  },

  /**
   * Cache tenant services (30 minutes TTL)
   */
  async setServices(tenantSlug: string, services: any[]) {
    await cache.set(`tenant:${tenantSlug}:services`, services, 1800);
  },

  /**
   * Invalidate all cache for a tenant
   */
  async invalidate(tenantSlug: string) {
    await cache.delMany([
      `tenant:${tenantSlug}`,
      `tenant:${tenantSlug}:products`,
      `tenant:${tenantSlug}:services`,
    ]);
  },
};

/**
 * Session cache helpers
 */
export const sessionCache = {
  /**
   * Get user session
   */
  async getSession(sessionId: string) {
    return cache.get(`session:${sessionId}`);
  },

  /**
   * Set user session (24 hours TTL)
   */
  async setSession(sessionId: string, data: any) {
    await cache.set(`session:${sessionId}`, data, 86400);
  },

  /**
   * Delete session
   */
  async deleteSession(sessionId: string) {
    await cache.del(`session:${sessionId}`);
  },
};

/**
 * Rate limiting helper
 */
export const rateLimit = {
  /**
   * Check if request should be rate limited
   * @param key - Unique identifier (e.g., IP, user ID)
   * @param limit - Max requests
   * @param window - Time window in seconds
   * @returns true if rate limited
   */
  async check(key: string, limit: number = 100, window: number = 60): Promise<boolean> {
    const cacheKey = `ratelimit:${key}`;
    const current = await cache.get<number>(cacheKey);

    if (current === null) {
      await cache.set(cacheKey, 1, window);
      return false;
    }

    if (current >= limit) {
      return true; // Rate limited
    }

    await cache.set(cacheKey, current + 1, window);
    return false;
  },
};

export default cache;
