/**
 * Monitoring dashboard page for the Sass Store platform
 * Provides real-time metrics and error reporting
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorTracker } from '@sass-store/core/monitoring/error-tracker';
import { MetricsService } from '@sass-store/core/monitoring/metrics-service';

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

// API route to get monitoring data
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin access (this would require proper auth in production)
  // For demo purposes, checking a simple header
  if (!req.headers.authorization || req.headers.authorization !== `Bearer ${process.env.MONITORING_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const errorTracker = ErrorTracker.getInstance();
    const metricsService = MetricsService.getInstance();

    // Get metrics report
    const metricsReport = metricsService.getMetricsReport();

    // Get recent errors
    const recentErrors = errorTracker.getRecentErrors(10).map(error => ({
      id: error.id,
      message: error.message,
      timestamp: error.timestamp,
      type: error.type,
      severity: error.severity
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
        uptime: process.uptime() // In seconds
      },
      recentErrors,
      systemHealth: {
        database: true, // Would check actual database connection
        cache: true,    // Would check actual cache connection
        externalServices: true // Would check external services
      }
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Monitoring dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}