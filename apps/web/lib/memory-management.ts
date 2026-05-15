// GestiÃ³n de memoria y cleanup de event listeners (gratis)
class MemoryManager {
  private eventListeners: Map<Element | Window, Map<string, EventListener[]>> =
    new Map();
  private intervals: Set<NodeJS.Timeout> = new Set();
  private timeouts: Set<NodeJS.Timeout> = new Set();
  private observers: Set<
    IntersectionObserver | MutationObserver | ResizeObserver
  > = new Set();

  // Registrar event listener para cleanup automÃ¡tico
  registerEventListener(
    element: Element | Window,
    event: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (!this.eventListeners.has(element)) {
      this.eventListeners.set(element, new Map());
    }

    const elementListeners = this.eventListeners.get(element)!;
    if (!elementListeners.has(event)) {
      elementListeners.set(event, []);
    }

    elementListeners.get(event)!.push(listener);
    element.addEventListener(event, listener, options);
  }

  // Registrar interval para cleanup automÃ¡tico
  registerInterval(intervalId: NodeJS.Timeout) {
    this.intervals.add(intervalId);
  }

  // Registrar timeout para cleanup automÃ¡tico
  registerTimeout(timeoutId: NodeJS.Timeout) {
    this.timeouts.add(timeoutId);
  }

  // Registrar observer para cleanup automÃ¡tico
  registerObserver(
    observer: IntersectionObserver | MutationObserver | ResizeObserver,
  ) {
    this.observers.add(observer);
  }

  // Cleanup de todos los recursos registrados
  cleanup() {
    // Limpiar event listeners
    for (const [element, events] of this.eventListeners) {
      for (const [event, listeners] of events) {
        listeners.forEach((listener) => {
          element.removeEventListener(event, listener);
        });
      }
    }
    this.eventListeners.clear();

    // Limpiar intervals
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
    this.intervals.clear();

    // Limpiar timeouts
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timeouts.clear();

    // Limpiar observers
    this.observers.forEach((observer) => {
      if ("disconnect" in observer) {
        observer.disconnect();
      }
    });
    this.observers.clear();
  }

  // Cleanup especÃ­fico para un componente
  cleanupForComponent(componentId: string) {
    // Implementar cleanup especÃ­fico si es necesario
    console.warn(`[MemoryManager] Cleanup for component: ${componentId}`);
  }

  // Obtener estadÃ­sticas de memoria
  getMemoryStats() {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const memInfo = (performance as any).memory;
      return {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024),
        eventListeners: this.eventListeners.size,
        intervals: this.intervals.size,
        timeouts: this.timeouts.size,
        observers: this.observers.size,
      };
    }
    return {
      eventListeners: this.eventListeners.size,
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      observers: this.observers.size,
    };
  }
}

// Instancia global del memory manager
export const memoryManager = new MemoryManager();

// Hook de React para gestiÃ³n automÃ¡tica de memoria
export function useMemoryManagement(componentId?: string) {
  // Cleanup automÃ¡tico al desmontar
  React.useEffect(() => {
    return () => {
      if (componentId) {
        memoryManager.cleanupForComponent(componentId);
      }
    };
  }, [componentId]);

  return {
    registerEventListener:
      memoryManager.registerEventListener.bind(memoryManager),
    registerInterval: memoryManager.registerInterval.bind(memoryManager),
    registerTimeout: memoryManager.registerTimeout.bind(memoryManager),
    registerObserver: memoryManager.registerObserver.bind(memoryManager),
    getMemoryStats: memoryManager.getMemoryStats.bind(memoryManager),
  };
}

// FunciÃ³n para forzar garbage collection (solo en desarrollo)
export function forceGarbageCollection() {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    if ("gc" in window) {
      (window as any).gc();
      console.warn("[Memory] Forced garbage collection");
    }
  }
}

// Monitor de memory leaks bÃ¡sico
export function startMemoryLeakDetection() {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development")
    return;

  let lastMemoryUsage = 0;
  const checkInterval = setInterval(() => {
    const stats = memoryManager.getMemoryStats();

    if (typeof stats.used === "number") {
      if (lastMemoryUsage > 0 && stats.used > lastMemoryUsage + 10) {
        // +10MB
        console.warn(
          "[Memory Leak Detected] Memory usage increased significantly:",
          {
            previous: lastMemoryUsage,
            current: stats.used,
            increase: stats.used - lastMemoryUsage,
          },
        );
      }
      lastMemoryUsage = stats.used;
    }

    // Log stats cada 30 segundos
    console.warn("[Memory Stats]", stats);
  }, 30000);

  memoryManager.registerInterval(checkInterval);
}

// Limpiar memoria globalmente cuando la pÃ¡gina se oculta
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Cleanup agresivo cuando la pÃ¡gina no es visible
      memoryManager.cleanup();
      console.warn("[Memory] Aggressive cleanup on page hidden");
    }
  });
}

// DeclaraciÃ³n para TypeScript
declare global {
  interface Window {
    gc?: () => void;
  }
}

// Import React solo cuando sea necesario
let React: any;
try {
  React = require("react");
} catch {
  // Fallback si React no estÃ¡ disponible
}
