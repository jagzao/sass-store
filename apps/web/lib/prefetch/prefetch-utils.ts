'use client';

import { useEffect, useRef } from 'react';

// Interfaz para las opciones de prefetch
interface PrefetchOptions {
  ttl?: number; // Time to live en milisegundos
  staleWhileRevalidate?: number; // Tiempo para usar datos antiguos mientras se renueva
}

// Interfaz para el caché de datos
interface CacheEntry {
  data: any;
  timestamp: number;
  isValid: boolean;
}

// Mapa para almacenar los datos cacheados
const dataCache = new Map<string, CacheEntry>();

/**
 * Hook personalizado para prefetching y caching de datos
 * @param url - URL del endpoint a prefetchear
 * @param options - Opciones de cache
 * @returns Datos prefetcheados
 */
export function usePrefetch<T = any>(url: string, options: PrefetchOptions = {}): T | null {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = 30 * 1000 } = options; // 5 min default TTL
  const urlRef = useRef(url);
  
  useEffect(() => {
    const fetchAndCache = async () => {
      // Verificar si hay datos cacheados válidos
      const cached = dataCache.get(urlRef.current);
      const now = Date.now();
      
      if (cached) {
        const age = now - cached.timestamp;
        
        // Si los datos aún son frescos, no necesitamos actualizar
        if (age < ttl) {
          return;
        }
        
        // Si los datos están fuera de TTL pero aún dentro del stale window, 
        // continuar con la actualización en segundo plano
        if (age < ttl + staleWhileRevalidate) {
          // Actualizar en segundo plano
          try {
            const response = await fetch(urlRef.current);
            if (response.ok) {
              const data = await response.json();
              dataCache.set(urlRef.current, {
                data,
                timestamp: now,
                isValid: true
              });
            }
          } catch (error) {
            console.error(`Error prefetching ${urlRef.current}:`, error);
          }
          return;
        }
      }
      
      // Fetch de datos nuevos
      try {
        const response = await fetch(urlRef.current);
        if (response.ok) {
          const data = await response.json();
          dataCache.set(urlRef.current, {
            data,
            timestamp: now,
            isValid: true
          });
        }
      } catch (error) {
        console.error(`Error prefetching ${urlRef.current}:`, error);
      }
    };

    // Solo hacer prefetch si no hay datos cacheados o si han expirado
    if (!dataCache.has(urlRef.current) || 
        Date.now() - (dataCache.get(urlRef.current)?.timestamp || 0) > ttl) {
      fetchAndCache();
    }
  }, [url]);

  // Devolver datos cacheados si existen
  const cached = dataCache.get(urlRef.current);
  return cached?.isValid ? cached.data : null;
}

/**
 * Limpiar el caché
 */
export function clearCache(url?: string) {
  if (url) {
    dataCache.delete(url);
  } else {
    dataCache.clear();
  }
}

/**
 * Función para pre-cargar múltiples endpoints
 */
export async function prefetchUrls(urls: string[]) {
  return Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          dataCache.set(url, {
            data,
            timestamp: Date.now(),
            isValid: true
          });
          return data;
        }
      } catch (error) {
        console.error(`Error prefetching ${url}:`, error);
        return null;
      }
    })
  );
}