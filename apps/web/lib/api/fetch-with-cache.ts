/**
 * Fetch utility with intelligent caching strategies
 * Optimized for Next.js App Router
 */

export type CacheStrategy = "static" | "dynamic" | "revalidate" | "no-cache";

interface CacheConfig {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
  cache?:
    | "default"
    | "no-store"
    | "reload"
    | "no-cache"
    | "force-cache"
    | "only-if-cached";
}

const CACHE_STRATEGIES: Record<CacheStrategy, CacheConfig> = {
  // Static data that rarely changes (tenant config, site settings)
  // Cache for 1 hour
  static: {
    next: { revalidate: 3600 },
  },

  // Semi-dynamic data (products, services)
  // Cache for 5 minutes
  revalidate: {
    next: { revalidate: 300 },
  },

  // Dynamic data (cart, user session, live inventory)
  // No cache
  dynamic: {
    cache: "no-store",
  },

  // Explicitly no cache (for testing or debugging)
  "no-cache": {
    cache: "no-cache",
  },
};

interface FetchOptions {
  strategy?: CacheStrategy;
  tags?: string[];
  method?: string;
  headers?: Record<string, string> | string[][];
  body?: string | FormData | Blob | ArrayBuffer;
  signal?: AbortSignal;
}

/**
 * Fetch data with automatic caching based on strategy
 *
 * @example
 * // Static data (tenant info)
 * const tenant = await fetchWithCache<Tenant>('/api/tenants/foo', { strategy: 'static' })
 *
 * // Revalidating data (products)
 * const products = await fetchWithCache<Product[]>('/api/products', { strategy: 'revalidate' })
 *
 * // Dynamic data (cart)
 * const cart = await fetchWithCache<Cart>('/api/cart', { strategy: 'dynamic' })
 */
export async function fetchWithCache<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const { strategy = "revalidate", tags, ...fetchOptions } = options;

  // Get cache configuration for strategy
  const cacheConfig = CACHE_STRATEGIES[strategy];

  // Merge tags if provided
  const finalConfig: Record<string, unknown> = {
    ...fetchOptions,
    ...cacheConfig,
  };

  if (tags && cacheConfig.next) {
    finalConfig.next = {
      ...cacheConfig.next,
      tags: [...(cacheConfig.next.tags || []), ...tags],
    };
  }

  // Determine full URL
  // Server-side: Use internal endpoints from same app
  // Client-side: Use NEXT_PUBLIC_API_URL for external API calls
  let fullUrl: string;

  if (typeof window === "undefined") {
    // SERVER-SIDE: Use same web app endpoints
    // Check if URL is for internal /api routes
    if (
      url.startsWith("/api/tenants") ||
      url.startsWith("/api/v1/public") ||
      url.startsWith("/api/users")
    ) {
      // IMPORTANT: For internal API routes, Next.js needs absolute URLs
      // Priority: Use explicit production URL over VERCEL_URL (which can be preview URL with auth)
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000");

      fullUrl = `${baseUrl}${url}`;
      // eslint-disable-next-line no-console
      console.log(`[fetchWithCache] SERVER - Internal API: ${fullUrl}`);
    } else {
      // External API calls (if ever needed)
      const baseUrl =
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000";
      fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
      // eslint-disable-next-line no-console
      console.log(`[fetchWithCache] SERVER - External API: ${fullUrl}`);
    }
  } else {
    // CLIENT-SIDE: Use public API URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
    // eslint-disable-next-line no-console
    console.log(`[fetchWithCache] CLIENT - API: ${fullUrl}`);
  }

  try {
    const response = await fetch(fullUrl, finalConfig);

    if (!response.ok) {
      throw new Error(
        `Fetch failed: ${response.status} ${response.statusText}`,
        { cause: response },
      );
    }

    return response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[fetchWithCache] Error fetching ${fullUrl}:`, error);
    throw error;
  }
}

/**
 * Convenience functions for specific strategies
 */

export const fetchStatic = <T>(url: string, tags?: string[]) =>
  fetchWithCache<T>(url, { strategy: "static", tags });

export const fetchRevalidating = <T>(url: string, tags?: string[]) =>
  fetchWithCache<T>(url, { strategy: "revalidate", tags });

export const fetchDynamic = <T>(url: string) =>
  fetchWithCache<T>(url, { strategy: "dynamic" });

export const fetchNoCache = <T>(url: string) =>
  fetchWithCache<T>(url, { strategy: "no-cache" });
