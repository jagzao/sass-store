/**
 * Performance Monitoring with Result Pattern
 *
 * Provides performance tracking and monitoring for Result operations
 * Helps identify bottlenecks and optimize application performance
 */

import { Result, Ok, Err } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

// Performance metrics interface
export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  memoryDelta?: number;
  errorType?: string;
  success: boolean;
  cached?: boolean;
}

// Performance monitoring options
export interface PerformanceOptions {
  threshold?: number; // ms
  enableMemoryTracking?: boolean;
  enableCacheTracking?: boolean;
  sampleRate?: number; // percentage
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private config: PerformanceOptions;
  private isClient = typeof window !== "undefined";

  constructor(config: PerformanceOptions = {}) {
    this.config = {
      threshold: 1000, // 1 second default
      enableMemoryTracking: true,
      enableCacheTracking: true,
      sampleRate: 1,
      ...config,
    };
  }

  // Start tracking an operation
  startTracking(operationName: string): string {
    const trackingId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metrics: PerformanceMetrics = {
      operationName,
      startTime: performance.now(),
      memoryUsage: this.config.enableMemoryTracking
        ? this.getMemoryUsage()
        : undefined,
      success: false,
      cached: false,
    };

    this.metrics.set(trackingId, metrics);

    if (
      this.config.sampleRate > 0 &&
      Math.random() * 100 < this.config.sampleRate
    ) {
      console.log(`[PERF] Started tracking: ${operationName} (${trackingId})`);
    }

    return trackingId;
  }

  // End tracking and record metrics
  endTracking(trackingId: string, result: Result<any, DomainError>): void {
    const metrics = this.metrics.get(trackingId);
    if (!metrics) return;

    metrics.endTime = performance.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = result.success;
    if (!result.success) {
      const failure = result as { error: DomainError };
      metrics.errorType = failure.error.type;
    }

    if (this.config.enableMemoryTracking && metrics.memoryUsage) {
      const currentMemory = this.getMemoryUsage();
      metrics.memoryDelta = currentMemory - metrics.memoryUsage;
    }

    // Log performance data
    this.logPerformanceData(metrics);

    // Clean up old metrics (older than 5 minutes)
    this.cleanupOldMetrics();

    // Update metrics
    this.metrics.set(trackingId, metrics);
  }

  // Get current memory usage
  private getMemoryUsage(): number {
    if (!this.isClient) return 0;

    try {
      const memory = (performance as any).memory as
        | { usedJSHeapSize?: number }
        | undefined;
      return typeof memory?.usedJSHeapSize === "number"
        ? memory.usedJSHeapSize
        : 0;
    } catch {
      return 0;
    }
  }

  // Log performance data
  private logPerformanceData(metrics: PerformanceMetrics): void {
    const { threshold = 1000 } = this.config;
    const { operationName, duration, errorType, memoryDelta, cached } = metrics;

    // Check for performance issues
    const isSlow = duration && duration > threshold;
    const hasMemoryIssue = memoryDelta && memoryDelta > 50 * 1024 * 1024; // 50MB

    // Log warnings
    if (isSlow) {
      console.warn(
        `[PERF] SLOW OPERATION: ${operationName} took ${duration}ms (threshold: ${threshold}ms)`,
      );
    }

    if (hasMemoryIssue) {
      console.warn(
        `[PERF] MEMORY LEAK: ${operationName} increased memory by ${memoryDelta} bytes`,
      );
    }

    if (cached) {
      console.log(`[PERF] CACHE HIT: ${operationName} (avoided API call)`);
    }

    if (errorType) {
      console.warn(`[PERF] ERROR TYPE: ${operationName} - ${errorType}`);
    }

    // Log performance data
    console.log(`[PERF] ${operationName}:`, {
      duration: `${duration}ms`,
      success: metrics.success,
      cached: metrics.cached,
      memoryDelta: memoryDelta || 0,
    });
  }

  // Clean up old metrics
  private cleanupOldMetrics(): void {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const toDelete: string[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (metrics.startTime < fiveMinutesAgo) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.metrics.delete(key));
  }

  // Get performance summary
  getSummary(): {
    totalOperations: number;
    successfulOperations: number;
    slowOperations: Array<{
      operation: string;
      duration: string;
      errorType?: string;
    }>;
    averageDuration: string;
    successRate: string;
  } {
    const allMetrics = Array.from(this.metrics.values());
    const totalOperations = allMetrics.length;
    const successfulOperations = allMetrics.filter((m) => m.success).length;
    const slowOperations = allMetrics.filter(
      (m) => m.duration && m.duration > (this.config.threshold ?? 0),
    );
    const averageDuration =
      totalOperations > 0
        ? allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) /
          totalOperations
        : 0;

    return {
      totalOperations,
      successfulOperations,
      slowOperations: slowOperations.map((m) => ({
        operation: m.operationName,
        duration: `${m.duration}ms`,
        errorType: m.errorType,
      })),
      averageDuration: `${averageDuration.toFixed(2)}ms`,
      successRate:
        totalOperations > 0
          ? `${((successfulOperations / totalOperations) * 100).toFixed(1)}%`
          : "0.0%",
    };
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor({
  threshold: 500, // 0.5 seconds
  enableMemoryTracking: true,
  enableCacheTracking: true,
  sampleRate: 0.1, // 10%
});

// Performance decorator for functions
export function withPerformanceTracking<T, E extends DomainError>(
  options: PerformanceOptions = {},
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = target[propertyKey];
    const operationName = String(propertyKey);

    const wrappedMethod = async function (this: any, ...args: any[]) {
      const trackingId = performanceMonitor.startTracking(operationName);

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTracking(trackingId, result);
        return result;
      } catch (error) {
        const errorResult = Err(
          ErrorFactories.database(
            "operation_failed",
            `Failed in ${operationName}`,
            undefined,
            error instanceof Error ? error : undefined,
          ),
        );
        performanceMonitor.endTracking(trackingId, errorResult);
        throw error;
      }
    };

    wrappedMethod.startTracking =
      originalMethod.startTracking?.bind(wrappedMethod);

    return {
      ...descriptor,
      value: wrappedMethod,
      configurable: true,
      writable: originalMethod.writable || true,
    };
  };
}

// Performance monitoring middleware
export const createPerformanceMiddleware = (
  options: PerformanceOptions = {},
) => {
  const monitor = new PerformanceMonitor(options);

  return (req: { method: string; url: string }, res: any, next: () => void) => {
    const startTime = Date.now();
    const trackingId = monitor.startTracking("http_request");

    // Log request start
    console.log(
      `[PERF] Request started: ${req.method} ${req.url} (${trackingId})`,
    );

    const originalSend = res.send;
    const originalJson = res.json;

    // Override response methods
    res.send = function (data: any) {
      monitor.endTracking(trackingId, Ok(data));
      return originalSend.call(this, data);
    };

    res.json = function (data: any) {
      monitor.endTracking(trackingId, Ok(data));
      return originalJson.call(this, data);
    };

    // Continue to next middleware
    return next();
  };
};

// Performance monitoring for React hooks
export const usePerformanceMonitoring = (operationName: string) => {
  const trackingId = performanceMonitor.startTracking(operationName);

  return () => {
    return trackingId;
  };
};

// Cache performance monitoring
export class ResultCache<T, E> {
  private cache = new Map<
    string,
    { data: T; timestamp: number; hitCount: number }
  >();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) {
    // 5 minutes
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const { data, timestamp, hitCount } = entry;
    const now = Date.now();

    if (now - timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    const updatedEntry = {
      data,
      timestamp,
      hitCount: hitCount + 1,
    };

    this.cache.set(key, updatedEntry);
    return data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hitCount: 0,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const totalHits = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.hitCount,
      0,
    );
    const hitRate = this.cache.size > 0 ? totalHits / this.cache.size : 0;

    return {
      size: this.cache.size,
      hitRate: hitRate.toFixed(2),
    };
  }
}

// Batch operation performance monitoring
export const batchOperations = async <T, E extends DomainError>(
  operations: Array<() => Promise<Result<T, E>>>,
  options: { parallel?: boolean } = { parallel: true },
): Promise<Result<T[], DomainError>> => {
  const startTime = performance.now();

  try {
    const results = options.parallel
      ? await Promise.all(operations.map((op) => op()))
      : await (async () => {
          const sequentialResults: Result<T, E>[] = [];
          for (const op of operations) {
            sequentialResults.push(await op());
          }
          return sequentialResults;
        })();

    const endTime = performance.now();
    console.log(
      `[PERF] Batch completed: ${results.length} operations in ${endTime - startTime}ms`,
    );

    const firstFailure = results.find((r) => !r.success);
    if (firstFailure && !firstFailure.success) {
      const failure = firstFailure as { error: DomainError };
      return Err(failure.error);
    }

    return Ok(results.map((r) => (r as { data: T }).data));
  } catch (error) {
    return Err(
      ErrorFactories.database(
        "batch_operation_failed",
        "Failed to execute batch operations",
        undefined,
        error instanceof Error ? error : undefined,
      ),
    );
  }
};

// Memory leak detection
export const detectMemoryLeaks = (): (() => void) | void => {
  if (typeof window !== "undefined") {
    const initialMemory =
      ((performance as any).memory as { usedJSHeapSize?: number } | undefined)
        ?.usedJSHeapSize || 0;

    const checkInterval = setInterval(() => {
      const currentMemory =
        ((performance as any).memory as { usedJSHeapSize?: number } | undefined)
          ?.usedJSHeapSize || 0;

      if (currentMemory > initialMemory) {
        console.warn(
          `[PERF] Potential memory leak detected: ${currentMemory - initialMemory} bytes increase`,
        );
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }
};

// Auto performance alerts
export const setupAutoPerformanceAlerts = (): void => {
  const checkPerformance = () => {
    const summary = performanceMonitor.getSummary();

    // Alert if success rate drops below 90%
    if (parseFloat(summary.successRate) < 90) {
      console.warn(
        `[PERF] Low success rate: ${summary.successRate}% (${summary.successfulOperations}/${summary.totalOperations})`,
      );
    }

    // Alert if slow operations are increasing
    const slowOpsCount = summary.slowOperations.length;
    if (slowOpsCount > 5) {
      console.warn(`[PERF] High number of slow operations: ${slowOpsCount}`);
    }
  };

  // Check every 30 seconds
  setInterval(checkPerformance, 30000);
};

// Export default monitor instance
export default performanceMonitor;
