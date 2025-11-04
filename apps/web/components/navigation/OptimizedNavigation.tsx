'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { usePerformanceOptimization } from '@/components/performance/PerformanceOptimizer';

/**
 * Hook optimizado para navegación entre páginas
 * 
 * Este hook implementa técnicas de optimización para mejorar
 * el rendimiento durante la navegación:
 * - Prefetch inteligente
 * - Animaciones suaves
 * - Gestión de memoria
 * - Pre-carga de recursos
 */
export const useOptimizedNavigation = () => {
  const router = useRouter();
  const { throttle, debounce, idleWork, preconnectToResources } = usePerformanceOptimization();
  const navigationQueue = useRef<Promise<any>[]>([]);
  
  /**
   * Navegar a una página con animación optimizada
   */
  const navigateWithAnimation = useCallback((
    path: string,
    options?: {
      animationDuration?: number;
      preconnectUrls?: string[];
      prefetch?: boolean;
    }
  ) => {
    const {
      animationDuration = 300,
      preconnectUrls = [],
      prefetch = true
    } = options || {};

    // Preconectar a recursos importantes
    if (preconnectUrls.length > 0) {
      preconnectToResources(preconnectUrls);
    }

    // Prefetch de la página si está habilitado
    if (prefetch) {
      // Usar requestIdleCallback para prefetch no urgente
      idleWork(() => {
        router.prefetch(path);
      }, { timeout: 1000 });
    }

    // Añadir pequeña demora para permitir animaciones
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        router.push(path);
        resolve();
      }, animationDuration);
    });
  }, [router, idleWork, preconnectToResources]);

  /**
   * Navegación optimizada con gestión de cola
   */
  const optimizedNavigate = useCallback((
    path: string,
    options?: {
      priority?: 'high' | 'normal' | 'low';
      queue?: boolean;
    }
  ) => {
    const { priority = 'normal', queue = false } = options || {};

    // Si se debe encolar, añadir a la cola de navegación
    if (queue) {
      const navigationPromise = new Promise<void>((resolve) => {
        // Ejecutar navegación con prioridad
        if (priority === 'high') {
          // Navegación de alta prioridad - ejecutar inmediatamente
          router.push(path);
          resolve();
        } else {
          // Navegación normal o baja prioridad - usar idleWork
          idleWork(() => {
            router.push(path);
            resolve();
          });
        }
      });

      navigationQueue.current.push(navigationPromise);

      // Limitar tamaño de cola
      if (navigationQueue.current.length > 5) {
        navigationQueue.current.shift();
      }

      return navigationPromise;
    }

    // Navegación inmediata sin encolar
    if (priority === 'high') {
      router.push(path);
    } else {
      idleWork(() => {
        router.push(path);
      });
    }
  }, [router, idleWork]);

  /**
   * Prefetch optimizado con throttling
   */
  const optimizedPrefetch = useCallback(throttle((path: string) => {
    // Solo prefetch si el navegador lo soporta
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleWork(() => {
        router.prefetch(path);
      }, { timeout: 2000 });
    }
  }, 100), [router, idleWork]);

  /**
   * Preconectar a dominios importantes
   */
  const preconnectToImportantDomains = useCallback(() => {
    const importantDomains = [
      // Dominios de imágenes
      'https://images.unsplash.com',
      'https://media.sassstore.com',
      // Dominios de APIs
      'https://api.sassstore.com',
      // CDN
      'https://cdn.sassstore.com'
    ];
    
    preconnectToResources(importantDomains);
  }, [preconnectToResources]);

  /**
   * Limpiar cola de navegación
   */
  const clearNavigationQueue = useCallback(() => {
    navigationQueue.current = [];
  }, []);

  return {
    navigateWithAnimation,
    optimizedNavigate,
    optimizedPrefetch,
    preconnectToImportantDomains,
    clearNavigationQueue
  };
};

/**
 * Componente de navegación optimizada
 * 
 * Proporciona una capa de abstracción para navegación
 * con optimizaciones de rendimiento incorporadas
 */
export const OptimizedNavigation = () => {
  const { preconnectToImportantDomains } = useOptimizedNavigation();

  // Preconectar a dominios importantes al montar
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useOptimizedNavigation().preconnectToImportantDomains();

  return null;
};

export default OptimizedNavigation;