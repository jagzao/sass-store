// In-memory cache para servicios gratuitos (sin Redis)
interface CacheEntry<T> {
  data: T;
  expires: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpiar entradas expiradas periódicamente
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Instancia global del cache
export const memoryCache = new MemoryCache();

// Limpiar cache cada 10 minutos
if (typeof globalThis !== 'undefined') {
  setInterval(() => memoryCache.cleanup(), 10 * 60 * 1000);
}

// Funciones de cache específicas para la aplicación
export const tenantCache = {
  get: (slug: string) => memoryCache.get(`tenant:${slug}`),
  set: (slug: string, data: any) => memoryCache.set(`tenant:${slug}`, data, 5 * 60 * 1000), // 5 min
  delete: (slug: string) => memoryCache.delete(`tenant:${slug}`)
};

export const productsCache = {
  get: (tenantId: string, filters: any) => {
    const key = `products:${tenantId}:${JSON.stringify(filters)}`;
    return memoryCache.get(key);
  },
  set: (tenantId: string, filters: any, data: any) => {
    const key = `products:${tenantId}:${JSON.stringify(filters)}`;
    memoryCache.set(key, data, 2 * 60 * 1000); // 2 min para productos
  },
  delete: (tenantId: string) => {
    // Limpiar todas las entradas de productos para este tenant
    const keysToDelete: string[] = [];
    for (const key of memoryCache['cache'].keys()) {
      if (key.startsWith(`products:${tenantId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => memoryCache.delete(key));
  }
};
