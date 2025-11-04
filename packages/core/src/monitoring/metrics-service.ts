/**
 * Application metrics service for the Sass Store platform
 * Provides performance monitoring and business metrics tracking
 */

export interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
}

export interface MetricsReport {
  id: string;
  timestamp: Date;
  metrics: Metric[];
  tenantId?: string;
}

export class MetricsService {
  private static instance: MetricsService;
  private metrics: Metric[] = [];
  private maxMetrics = 5000; // Keep last 5000 metrics in memory
  private reports: MetricsReport[] = [];

  private constructor() {
    // Initialize metrics collection
    this.startMetricsCollection();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private startMetricsCollection(): void {
    // Collect system metrics periodically
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  private collectSystemMetrics(): void {
    // In a real implementation we would collect system metrics
    // like CPU, memory, etc.
    // For now, we'll just add a heartbeat metric
    this.increment('system.heartbeat', 1, { service: 'web' });
  }

  public increment(name: string, value = 1, tags: Record<string, string> = {}): void {
    const metric: Metric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      timestamp: new Date(),
      tags,
      type: 'counter'
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  public setGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    // Remove existing gauge value if it exists
    this.metrics = this.metrics.filter(m => !(m.name === name && m.type === 'gauge' && 
      JSON.stringify(m.tags) === JSON.stringify(tags)));

    const metric: Metric = {
      id: `gauge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      timestamp: new Date(),
      tags,
      type: 'gauge'
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  public recordHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    const metric: Metric = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      timestamp: new Date(),
      tags,
      type: 'histogram'
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  public startTimer(name: string, tags: Record<string, string> = {}): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordHistogram(`${name}.duration`, duration, { ...tags, unit: 'ms' });
      return duration;
    };
  }

  public async reportMetrics(tenantId?: string): Promise<void> {
    const report: MetricsReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      metrics: [...this.metrics],
      tenantId
    };

    this.reports.push(report);
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production' && process.env.METRICS_ENDPOINT) {
      try {
        await fetch(process.env.METRICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.METRICS_TOKEN}`,
          },
          body: JSON.stringify({
            ...report,
            timestamp: report.timestamp.toISOString(),
            metrics: report.metrics.map(m => ({
              ...m,
              timestamp: m.timestamp.toISOString()
            }))
          })
        });
      } catch (error) {
        console.error('Failed to send metrics to external service', error);
      }
    }
  }

  public getMetric(name: string, tags?: Record<string, string>, limit = 100): Metric[] {
    let filtered = this.metrics.filter(m => m.name === name);
    
    if (tags) {
      filtered = filtered.filter(m => 
        Object.keys(tags).every(key => m.tags[key] === tags[key])
      );
    }
    
    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  public getGaugeValue(name: string, tags?: Record<string, string>): number | null {
    const gauges = this.getMetric(name, tags).filter(m => m.type === 'gauge');
    if (gauges.length === 0) return null;
    return gauges[0].value;
  }

  public getMetricsReport(): Record<string, any> {
    // Return aggregated metrics for monitoring dashboard
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    
    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    
    // Calculate some key metrics
    const metrics = {
      totalRequests: recentMetrics.filter(m => m.name === 'request.count').reduce((sum, m) => sum + m.value, 0),
      errorCount: recentMetrics.filter(m => m.name === 'request.error').reduce((sum, m) => sum + m.value, 0),
      avgResponseTime: this.calculateAverage(recentMetrics.filter(m => m.name === 'request.duration')),
      activeUsers: this.getGaugeValue('user.active'),
      dbConnections: this.getGaugeValue('db.connections'),
      cacheHits: recentMetrics.filter(m => m.name === 'cache.hit').reduce((sum, m) => sum + m.value, 0),
      cacheMisses: recentMetrics.filter(m => m.name === 'cache.miss').reduce((sum, m) => sum + m.value, 0),
    };
    
    return metrics;
  }

  private calculateAverage(metrics: Metric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.reports = [];
  }
}

// Helper functions for easier metric tracking
export const incrementMetric = (name: string, value = 1, tags: Record<string, string> = {}): void => {
  const metricsService = MetricsService.getInstance();
  metricsService.increment(name, value, tags);
};

export const setGauge = (name: string, value: number, tags: Record<string, string> = {}): void => {
  const metricsService = MetricsService.getInstance();
  metricsService.setGauge(name, value, tags);
};

export const recordHistogram = (name: string, value: number, tags: Record<string, string> = {}): void => {
  const metricsService = MetricsService.getInstance();
  metricsService.recordHistogram(name, value, tags);
};

export const startTimer = (name: string, tags: Record<string, string> = {}): () => number => {
  const metricsService = MetricsService.getInstance();
  return metricsService.startTimer(name, tags);
};