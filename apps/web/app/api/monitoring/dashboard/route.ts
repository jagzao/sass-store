/**
 * Monitoring dashboard page for the Sass Store platform
 * Provides real-time metrics and error reporting
 */

import { NextRequest, NextResponse } from "next/server";
import { ErrorTracker, MetricsService } from "@sass-store/core";

export interface MonitoringDashboardData {
  timestamp: Date;
  metrics: {
    totalRequests: number;
    errorCount: number;
    avgResponseTime: number;
    activeUsers: number | null;
    dbConnections: number | null;
    cacheHits: number;
    cacheMisses: number;
    uptime: number;
  };
  recentErrors: {
    id: string;
    message: string;
    timestamp: Date;
    type: string;
    severity: string;
  }[];
  systemHealth: {
    database: boolean;
    cache: boolean;
    externalServices: boolean;
  };
}

/**
 * GET /api/monitoring/dashboard
 * Get monitoring dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access (this would require proper auth in production)
    // For demo purposes, checking a simple header
    const authorization = request.headers.get("authorization");

    if (
      !authorization ||
      authorization !== `Bearer ${process.env.MONITORING_TOKEN}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const errorTracker = ErrorTracker.getInstance();
    const metricsService = MetricsService.getInstance();

    // Get metrics report
    const metricsReport = metricsService.getMetricsReport();

    // Get recent errors
    const recentErrors = errorTracker.getRecentErrors(10).map((error) => ({
      id: error.id,
      message: error.message,
      timestamp: error.timestamp,
      type: error.type,
      severity: error.severity,
    }));

    // Construct dashboard data
    const dashboardData: MonitoringDashboardData = {
      timestamp: new Date(),
      metrics: {
        totalRequests: metricsReport.totalRequests || 0,
        errorCount: metricsReport.errorCount || 0,
        avgResponseTime: metricsReport.avgResponseTime || 0,
        activeUsers: metricsReport.activeUsers,
        dbConnections: metricsReport.dbConnections,
        cacheHits: metricsReport.cacheHits || 0,
        cacheMisses: metricsReport.cacheMisses || 0,
        uptime: process.uptime(), // In seconds
      },
      recentErrors,
      systemHealth: {
        database: true, // Would check actual database connection
        cache: true, // Would check actual cache connection
        externalServices: true, // Would check external services
      },
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Monitoring dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
