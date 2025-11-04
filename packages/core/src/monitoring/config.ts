/**
 * Monitoring configuration for the Sass Store application
 * Sets up monitoring services and configurations
 */

import { ErrorTracker } from './error-tracker';
import { MetricsService } from './metrics-service';
import { Logger } from './logger';

export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  errorReporting: {
    enabled: boolean;
    endpoint?: string;
    sampleRate?: number; // 0.0 to 1.0
  };
  metrics: {
    enabled: boolean;
    endpoint?: string;
    collectionInterval: number; // in milliseconds
    reportInterval: number; // in milliseconds
  };
  performance: {
    enabled: boolean;
    requestThreshold: number; // in ms, requests slower than this will be logged
  };
}

class MonitoringConfiguration {
  private static instance: MonitoringConfiguration;
  public config: MonitoringConfig;

  private constructor() {
    this.config = {
      enabled: process.env.MONITORING_ENABLED !== 'false',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      errorReporting: {
        enabled: process.env.ERROR_REPORTING_ENABLED === 'true',
        endpoint: process.env.ERROR_REPORTING_ENDPOINT,
        sampleRate: parseFloat(process.env.ERROR_SAMPLE_RATE || '1.0')
      },
      metrics: {
        enabled: process.env.METRICS_ENABLED === 'true',
        endpoint: process.env.METRICS_ENDPOINT,
        collectionInterval: parseInt(process.env.METRICS_COLLECTION_INTERVAL || '30000'),
        reportInterval: parseInt(process.env.METRICS_REPORT_INTERVAL || '300000') // 5 minutes
      },
      performance: {
        enabled: process.env.PERFORMANCE_MONITORING_ENABLED !== 'false',
        requestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD || '1000') // 1 second
      }
    };
  }

  public static getInstance(): MonitoringConfiguration {
    if (!MonitoringConfiguration.instance) {
      MonitoringConfiguration.instance = new MonitoringConfiguration();
    }
    return MonitoringConfiguration.instance;
  }

  public async initialize(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    console.log('Initializing monitoring services...');
    
    // Initialize error tracker singleton
    ErrorTracker.getInstance();
    
    // Initialize metrics service singleton
    MetricsService.getInstance();
    
    // Set up periodic metrics reporting
    if (this.config.metrics.enabled && this.config.metrics.reportInterval > 0) {
      setInterval(async () => {
        try {
          const metricsService = MetricsService.getInstance();
          await metricsService.reportMetrics();
        } catch (error) {
          console.error('Error reporting metrics:', error);
        }
      }, this.config.metrics.reportInterval);
    }
    
    console.log('Monitoring services initialized successfully');
  }

  public getErrorSampleRate(): number {
    return this.config.errorReporting.sampleRate || 1.0;
  }

  public shouldReportError(): boolean {
    if (!this.config.errorReporting.enabled) {
      return false;
    }
    
    const rate = this.getErrorSampleRate();
    return Math.random() < rate;
  }
}

// Initialize monitoring when this module is loaded
const monitoringConfig = MonitoringConfiguration.getInstance();
export { monitoringConfig };

// Initialize monitoring services
monitoringConfig.initialize()
  .catch(error => {
    console.error('Failed to initialize monitoring:', error);
  });

// Export monitoring utilities
export { ErrorTracker } from './error-tracker';
export { MetricsService } from './metrics-service';
export { Logger } from './logger';