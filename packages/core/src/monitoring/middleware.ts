/**
 * Monitoring middleware for Next.js application
 * Tracks request metrics, errors, and performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { captureError } from './error-tracker';
import { incrementMetric, recordHistogram, setGauge, startTimer } from './metrics-service';
import { Logger } from './logger';

export interface MonitoringContext {
  requestId: string;
  startTime: number;
  tenantId?: string;
  userId?: string;
}

export class MonitoringMiddleware {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('monitoring-middleware');
  }

  public async handleRequest(
    request: NextRequest,
    next: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const context: MonitoringContext = {
      requestId: this.generateRequestId(),
      startTime: Date.now(),
      tenantId: request.headers.get('x-tenant') || undefined,
      userId: request.headers.get('x-user-id') || undefined,
    };

    // Add request ID to headers for tracing
    request.headers.set('x-request-id', context.requestId);

    // Increment request counter
    incrementMetric('request.count', 1, {
      method: request.method,
      tenant: context.tenantId || 'unknown',
      path: this.getPathPattern(request.nextUrl.pathname)
    });

    // Start timing the request
    const stopTimer = startTimer('request.duration', {
      method: request.method,
      tenant: context.tenantId || 'unknown'
    });

    try {
      // Execute the next middleware/route handler
      const response = await next(request);

      // Calculate response time
      const responseTime = Date.now() - context.startTime;
      
      // Record response time metric
      recordHistogram('request.duration', responseTime, {
        method: request.method,
        tenant: context.tenantId || 'unknown',
        status: response.status.toString(),
        path: this.getPathPattern(request.nextUrl.pathname)
      });

      // Track response metrics
      incrementMetric('response.count', 1, {
        status: response.status >= 400 ? 'error' : 
                response.status >= 300 ? 'redirect' : 
                response.status >= 200 ? 'success' : 'other',
        tenant: context.tenantId || 'unknown'
      });

      // Add response time header in development
      if (process.env.NODE_ENV !== 'production') {
        response.headers.set('X-Response-Time', `${responseTime}ms`);
      }

      // Add request ID to response for tracing
      response.headers.set('X-Request-ID', context.requestId);

      return response;
    } catch (error) {
      // Capture any errors that occur during request processing
      const errorId = await captureError(error as Error, {
        request: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
          body: null // Don't include body in error context for security
        },
        user: context.userId ? { id: context.userId, tenantId: context.tenantId || '' } : undefined,
        metadata: {
          requestId: context.requestId,
          path: request.nextUrl.pathname
        }
      }, error instanceof Error && error.message.includes('500') ? 'high' : 'medium');

      // Record error metric
      incrementMetric('request.error', 1, {
        method: request.method,
        tenant: context.tenantId || 'unknown',
        path: this.getPathPattern(request.nextUrl.pathname),
        errorId
      });

      // Log the error
      this.logger.error(`Request failed: ${error}`, {
        requestId: context.requestId,
        path: request.nextUrl.pathname,
        userId: context.userId,
        tenantId: context.tenantId,
        errorId
      });

      // Re-throw the error so it can be properly handled
      throw error;
    } finally {
      // Stop the timer
      const duration = stopTimer();
      
      // Update active requests gauge
      setGauge('request.active', this.getActiveRequestCount(), {
        tenant: context.tenantId || 'unknown'
      });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPathPattern(pathname: string): string {
    // Convert dynamic routes to patterns (e.g., /t/wondernails/123 -> /t/[tenant]/[id])
    return pathname
      .replace(/\/\d+/g, '/[id]')  // Replace numeric IDs
      .replace(/\/[\w-]+(?=\/|$)/g, '/[slug]')  // Replace slugs (could be improved)
      .replace(/\/wondernails|\/vigistudio|\/zo-system|\/nom-nom|\/delirios|\/centro-tenistico|\/vainilla-vargas/g, '/[tenant]');  // Replace tenant names
  }

  private activeRequests = new Map<string, number>();
  
  private getActiveRequestCount(): number {
    // In a real implementation, this would track actual active requests
    // For now, we'll just return a placeholder value
    return Array.from(this.activeRequests.values()).reduce((sum, count) => sum + count, 0);
  }
}

// Export a singleton instance
export const monitoringMiddleware = new MonitoringMiddleware();

// For use in Next.js middleware
export const withMonitoring = async (
  request: NextRequest,
  next: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> => {
  return await monitoringMiddleware.handleRequest(request, next);
};