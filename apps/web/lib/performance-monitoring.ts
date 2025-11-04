// Monitoreo de performance y alertas para tiempos de carga lentos (gratis)
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Mantener solo las últimas 100 métricas

  constructor() {
    this.initObservers();
  }

  private initObservers() {
    if (typeof window === 'undefined') return;

    // Observar navegación (carga de página)
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric({
          name: 'navigation',
          value: entry.duration,
          timestamp: Date.now(),
          url: window.location.href
        });

        // Alertar si la navegación es muy lenta (> 3s)
        if (entry.duration > 3000) {
          console.warn(`[Performance Alert] Navegación lenta: ${entry.duration}ms en ${window.location.href}`);
          this.alertSlowLoad('navigation', entry.duration);
        }
      }
    });

    // Observar recursos (imágenes, scripts, etc.)
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Solo alertar para recursos críticos
        if (entry.duration > 2000 && this.isCriticalResource(entry.name)) {
          console.warn(`[Performance Alert] Recurso lento: ${entry.name} tomó ${entry.duration}ms`);
          this.recordMetric({
            name: 'resource',
            value: entry.duration,
            timestamp: Date.now(),
            url: entry.name
          });
        }
      }
    });

    try {
      navObserver.observe({ entryTypes: ['navigation'] });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('[Performance Monitor] Error initializing observers:', error);
    }
  }

  private isCriticalResource(url: string): boolean {
    // Considerar críticos: APIs, imágenes grandes, scripts principales
    return url.includes('/api/') ||
           url.includes('.jpg') ||
           url.includes('.png') ||
           url.includes('main.') ||
           url.includes('app.');
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Mantener solo las métricas más recientes
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private alertSlowLoad(type: string, duration: number) {
    // En desarrollo, mostrar alerta en consola
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 PERFORMANCE ISSUE: ${type} took ${duration}ms`);
    }

    // En producción, se podría enviar a un servicio de monitoreo
    // Por ejemplo: Sentry, DataDog, o un endpoint personalizado
  }

  // Método público para registrar métricas manualmente
  public recordCustomMetric(name: string, value: number) {
    this.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : ''
    });
  }

  // Obtener métricas recientes
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Obtener promedio de una métrica específica
  public getAverageMetric(name: string, timeWindowMs: number = 60000): number {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => m.name === name && (now - m.timestamp) < timeWindowMs
    );

    if (recentMetrics.length === 0) return 0;

    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / recentMetrics.length;
  }
}

// Instancia global del monitor
export const performanceMonitor = new PerformanceMonitor();

// Función para medir tiempo de ejecución de funciones
export function measureExecutionTime<T>(
  fn: () => T | Promise<T>,
  name: string
): T | Promise<T> {
  const start = performance.now();

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        performanceMonitor.recordCustomMetric(name, duration);

        if (duration > 1000) { // > 1s
          console.warn(`[Performance] ${name} tomó ${duration}ms`);
        }
      });
    } else {
      const duration = performance.now() - start;
      performanceMonitor.recordCustomMetric(name, duration);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordCustomMetric(`${name}_error`, duration);
    throw error;
  }
}