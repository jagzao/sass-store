/**
 * Error tracking service for the Sass Store application
 * Provides centralized error logging and monitoring
 */

import { ILogger, Logger } from './logger';

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    tenantId: string;
  };
  request?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  type: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private logger: ILogger;
  private reports: ErrorReport[] = [];
  private maxReports = 1000; // Keep last 1000 reports in memory

  private constructor() {
    this.logger = new Logger('error-tracker');
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  public async captureError(
    error: Error | string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    const report: ErrorReport = {
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message: typeof error === 'string' ? error : error.message || 'Unknown error',
      stack: typeof error !== 'string' ? error.stack : undefined,
      type: typeof error === 'string' ? 'string_error' : error.constructor.name,
      context,
      severity
    };

    // Store in memory
    this.reports.push(report);
    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }

    // Log the error
    this.logger.error(`[${report.severity.toUpperCase()}] ${report.message}`, {
      errorId: report.id,
      stack: report.stack,
      context: report.context
    });

    // In a real implementation, this would send to an external service like Sentry
    await this.sendToExternalService(report);

    return report.id;
  }

  private async sendToExternalService(report: ErrorReport): Promise<void> {
    // In a production environment, you would send this to an external service
    // like Sentry, LogRocket, Bugsnag, etc.
    // For now, we'll just simulate this behavior

    // Example: Send to external service
    if (process.env.NODE_ENV === 'production' && process.env.ERROR_REPORTING_ENDPOINT) {
      try {
        await fetch(process.env.ERROR_REPORTING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ERROR_REPORTING_TOKEN}`,
          },
          body: JSON.stringify({
            ...report,
            timestamp: report.timestamp.toISOString()
          })
        });
      } catch (sendError) {
        // Don't let error reporting fail the main app
        this.logger.warn('Failed to send error to external service', sendError);
      }
    }
  }

  public getRecentErrors(limit = 10): ErrorReport[] {
    return this.reports
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getErrorById(id: string): ErrorReport | undefined {
    return this.reports.find(report => report.id === id);
  }

  public getErrorCountBySeverity(severity: string): number {
    return this.reports.filter(report => report.severity === severity).length;
  }

  public clearReports(): void {
    this.reports = [];
  }
}

// Helper function for easier error capturing
export const captureError = async (
  error: Error | string,
  context: ErrorContext = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> => {
  const tracker = ErrorTracker.getInstance();
  return await tracker.captureError(error, context, severity);
};