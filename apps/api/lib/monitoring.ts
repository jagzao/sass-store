/**
 * Monitoring and Alerting System
 * Provides comprehensive monitoring for the Sass Store platform
 */

import { db } from "@sass-store/database";
import { auditLogs, tenants } from "@sass-store/database";
import { eq, and, gte, sql } from "drizzle-orm";

export interface AlertConfig {
  type: "error" | "warning" | "info";
  threshold: number;
  message: string;
  action?: string;
}

export interface MetricData {
  timestamp: Date;
  name: string;
  value: number;
  tenantId?: string;
  metadata?: Record<string, any>;
}

export class MonitoringService {
  private static instance: MonitoringService;
  private alerts: AlertConfig[] = [];

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record a metric for monitoring
   */
  async recordMetric(metric: MetricData): Promise<void> {
    try {
      // Store metric in database (you might want to create a metrics table)
      console.log(
        `📊 Metric: ${metric.name} = ${metric.value}`,
        metric.metadata || {}
      );

      // Check alerts
      await this.checkAlerts(metric);
    } catch (error) {
      console.error("Failed to record metric:", error);
    }
  }

  /**
   * Record an error event
   */
  async recordError(
    error: Error,
    context?: Record<string, any>
  ): Promise<void> {
    await this.recordMetric({
      timestamp: new Date(),
      name: "error_count",
      value: 1,
      metadata: {
        error: error.message,
        stack: error.stack,
        context,
      },
    });
  }

  /**
   * Record API request metrics
   */
  async recordApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    tenantId?: string
  ): Promise<void> {
    await this.recordMetric({
      timestamp: new Date(),
      name: "api_request",
      value: duration,
      tenantId,
      metadata: {
        method,
        path,
        statusCode,
        duration,
      },
    });
  }

  /**
   * Record database query metrics
   */
  async recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    tenantId?: string
  ): Promise<void> {
    await this.recordMetric({
      timestamp: new Date(),
      name: "db_query",
      value: duration,
      tenantId,
      metadata: {
        operation,
        table,
      },
    });
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<string, boolean>;
    metrics: Record<string, number>;
  }> {
    const checks: Record<string, boolean> = {};
    const metrics: Record<string, number> = {};

    try {
      // Database connectivity check
      const dbStart = Date.now();
      await db.select().from(tenants).limit(1);
      const dbDuration = Date.now() - dbStart;
      checks.database = dbDuration < 1000; // Less than 1 second
      metrics.db_response_time = dbDuration;

      // Recent errors check (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentErrors = await db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.action, "error"),
            gte(auditLogs.createdAt, oneHourAgo)
          )
        );

      const errorCount = recentErrors[0]?.count || 0;
      checks.low_error_rate = errorCount < 10; // Less than 10 errors per hour
      metrics.recent_errors = errorCount;

      // Active tenants check
      const activeTenants = await db
        .select({ count: sql<number>`count(*)` })
        .from(tenants);

      metrics.active_tenants = activeTenants[0]?.count || 0;
      checks.tenants_exist = metrics.active_tenants > 0;

      // Determine overall status
      const allChecksPass = Object.values(checks).every((check) => check);
      const status = allChecksPass
        ? "healthy"
        : errorCount > 50
          ? "unhealthy"
          : "degraded";

      return { status, checks, metrics };
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "unhealthy",
        checks: { ...checks, health_check_error: false },
        metrics,
      };
    }
  }

  /**
   * Configure alerts
   */
  configureAlerts(alerts: AlertConfig[]): void {
    this.alerts = alerts;
  }

  /**
   * Check if any alerts should be triggered
   */
  private async checkAlerts(metric: MetricData): Promise<void> {
    for (const alert of this.alerts) {
      if (metric.name === alert.type && metric.value >= alert.threshold) {
        await this.triggerAlert(alert, metric);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(
    alert: AlertConfig,
    metric: MetricData
  ): Promise<void> {
    const alertMessage = `🚨 ALERT: ${alert.message} (Value: ${metric.value})`;

    console.error(alertMessage);

    // Log alert to audit system
    await db.insert(auditLogs).values({
      tenantId: metric.tenantId || "system",
      action: "alert",
      targetTable: "monitoring",
      data: {
        alert: alert.message,
        metric: metric.name,
        value: metric.value,
        threshold: alert.threshold,
        metadata: metric.metadata,
      },
    });

    // Here you could integrate with external alerting systems
    // like Slack, email, PagerDuty, etc.
  }

  /**
   * Get system metrics summary
   */
  async getMetricsSummary(hours: number = 24): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ path: string; count: number }>;
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // This would require a metrics table - for now return basic audit data
    const auditSummary = await db
      .select({
        action: auditLogs.action,
        count: sql<number>`count(*)`,
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, since))
      .groupBy(auditLogs.action);

    const totalRequests = auditSummary.reduce(
      (sum, item) => sum + item.count,
      0
    );
    const errors =
      auditSummary.find((item) => item.action === "error")?.count || 0;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    return {
      totalRequests,
      averageResponseTime: 0, // Would need metrics table
      errorRate,
      topEndpoints: [], // Would need metrics table
    };
  }
}

// Default alert configurations
const defaultAlerts: AlertConfig[] = [
  {
    type: "error",
    threshold: 10,
    message: "High error rate detected",
    action: "Investigate system issues",
  },
  {
    type: "warning",
    threshold: 1000,
    message: "High response time detected",
    action: "Check system performance",
  },
];

// Initialize monitoring service
export const monitoring = MonitoringService.getInstance();
monitoring.configureAlerts(defaultAlerts);

// Export convenience functions
export const recordMetric = (metric: MetricData) =>
  monitoring.recordMetric(metric);
export const recordError = (error: Error, context?: Record<string, any>) =>
  monitoring.recordError(error, context);
export const recordApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  tenantId?: string
) => monitoring.recordApiRequest(method, path, statusCode, duration, tenantId);
export const recordDatabaseQuery = (
  operation: string,
  table: string,
  duration: number,
  tenantId?: string
) => monitoring.recordDatabaseQuery(operation, table, duration, tenantId);
export const checkHealth = () => monitoring.checkHealth();
export const getMetricsSummary = (hours?: number) =>
  monitoring.getMetricsSummary(hours);
