/**
 * Cached Tenant Service
 * Uses Redis for caching tenant data to reduce database load
 */

import { tenantCache } from "@/../../packages/cache/redis";
import { TenantService } from "./tenant-service";

export const CachedTenantService = {
  /**
   * Get tenant with data (cached)
   * Cache TTL: 1 hour
   */
  async getTenantWithData(slug: string) {
    // Try cache first
    const cached = await tenantCache.getTenant(slug);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const data = await TenantService.getTenantWithData(slug);
    if (data) {
      await tenantCache.setTenant(slug, data);
    }

    return data;
  },

  /**
   * Get tenant products (cached)
   * Cache TTL: 30 minutes
   */
  async getProducts(tenantSlug: string) {
    const cached = await tenantCache.getProducts(tenantSlug);
    if (cached) {
      return cached;
    }

    const data = await TenantService.getTenantWithData(tenantSlug);
    if (data?.products) {
      await tenantCache.setProducts(tenantSlug, data.products);
      return data.products;
    }

    return [];
  },

  /**
   * Get tenant services (cached)
   * Cache TTL: 30 minutes
   */
  async getServices(tenantSlug: string) {
    const cached = await tenantCache.getServices(tenantSlug);
    if (cached) {
      return cached;
    }

    const data = await TenantService.getTenantWithData(tenantSlug);
    if (data?.services) {
      await tenantCache.setServices(tenantSlug, data.services);
      return data.services;
    }

    return [];
  },

  /**
   * Invalidate tenant cache
   * Call this after updating tenant data
   */
  async invalidateCache(tenantSlug: string) {
    await tenantCache.invalidate(tenantSlug);
  },
};

/**
 * Cached version of getTenantDataForPage
 */
export async function getCachedTenantDataForPage(slug: string) {
  const tenantData = await CachedTenantService.getTenantWithData(slug);

  if (!tenantData) {
    throw new Error(`Tenant not found: ${slug}`);
  }

  return tenantData;
}
