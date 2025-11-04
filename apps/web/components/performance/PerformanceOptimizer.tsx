'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para optimizar el rendimiento de animaciones y transiciones
 * 
 * Este hook implementa varias técnicas de optimización:
 * - Intersection Observer para lazy loading
 * - RequestIdleCallback para trabajo no urgente
 * - Passive event listeners
 * - Throttling y debouncing
 */
export const usePerformanceOptimization = () => {
  const rafId = useRef<number | null>(null);
  const idleCallbackId = useRef<number | null>(null);

  // Cancelar todas las animaciones pendientes al desmontar
  useEffect(() => {
    return () => {
      // Cancelar requestAnimationFrame
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      
      // Cancelar requestIdleCallback si está disponible
      if (idleCallbackId.current !== null && typeof window !== 'undefined' && (window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleCallbackId.current);
        idleCallbackId.current = null;
      }
    };
  }, []);

  /**
   * Ejecutar animación optimizada con requestAnimationFrame
   */
  const optimizedAnimation = (callback: FrameRequestCallback) => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
    }
    rafId.current = requestAnimationFrame(callback);
    return rafId.current;
  };

  /**
   * Ejecutar trabajo en tiempo libre con requestIdleCallback
   */
  const idleWork = (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
    if (typeof window !== 'undefined' && (window as any).requestIdleCallback) {
      if (idleCallbackId.current !== null) {
        (window as any).cancelIdleCallback(idleCallbackId.current);
      }
      idleCallbackId.current = (window as any).requestIdleCallback(callback, options);
      return idleCallbackId.current;
    }
    // Fallback: ejecutar inmediatamente si no está disponible
    callback({ timeRemaining: () => 1, didTimeout: false } as IdleDeadline);
    return null;
  };

  /**
   * Throttle - Limitar la frecuencia de ejecución de una función
   */
  const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle = false;
    let lastFunc: number;
    let lastRan: number;

    return function (this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        lastRan = Date.now();
        inThrottle = true;
      } else {
        clearTimeout(lastFunc);
        lastFunc = window.setTimeout(() => {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    } as T;
  };

  /**
   * Debounce - Retrasar la ejecución de una función
   */
  const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
    let timeoutId: number;

    return function (this: any, ...args: Parameters<T>) {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    } as T;
  };

  /**
   * Crear Intersection Observer optimizado
   */
  const createIntersectionObserver = (
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver | null => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    const defaultOptions: IntersectionObserverInit = {
      rootMargin: '100px', // Precargar antes de que esté visible
      threshold: 0.1,
      ...options
    };

    return new IntersectionObserver(callback, defaultOptions);
  };

  /**
   * Optimizar carga de imágenes
   */
  const optimizeImageLoading = (img: HTMLImageElement) => {
    if (!img) return;

    // Usar Intersection Observer para lazy loading
    const observer = createIntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement;
          if (image.dataset.src) {
            image.src = image.dataset.src;
            image.removeAttribute('data-src');
          }
          observer?.unobserve(image);
        }
      });
    });

    if (observer) {
      observer.observe(img);
      return () => observer.disconnect();
    }

    return () => {};
  };

  /**
   * Preconectar a recursos importantes
   */
  const preconnectToResources = (urls: string[]) => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
      
      // Remover después de un tiempo para evitar acumulación
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }, 10000);
    });
  };

  return {
    optimizedAnimation,
    idleWork,
    throttle,
    debounce,
    createIntersectionObserver,
    optimizeImageLoading,
    preconnectToResources
  };
};

/**
 * Componente para manejar el rendimiento general de la aplicación
 */
export const PerformanceOptimizer = () => {
  useEffect(() => {
    // Detectar capacidad del dispositivo
    const isLowEndDevice = () => {
      // Verificar memoria disponible
      if (typeof navigator !== 'undefined' && (navigator as any).deviceMemory) {
        return (navigator as any).deviceMemory < 2; // Menos de 2GB RAM
      }
      
      // Verificar número de núcleos de CPU
      if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency <= 4; // 4 o menos núcleos
      }
      
      return false;
    };

    // Reducir calidad de animaciones en dispositivos de gama baja
    if (isLowEndDevice()) {
      // Reducir la frecuencia de actualización
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--animation-duration-multiplier', '0.5');
      }
    }

    // Manejar eventos de bajo consumo energético
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar animaciones cuando la pestaña no está visible
        document.querySelectorAll('[data-animate]').forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'paused';
        });
      } else {
        // Reanudar animaciones cuando la pestaña vuelve a ser visible
        document.querySelectorAll('[data-animate]').forEach(el => {
          (el as HTMLElement).style.animationPlayState = 'running';
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};