/**
 * Logging service for the Sass Store application
 * Provides structured logging with different log levels
 */

export interface ILogger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  meta?: any;
  loggerName: string;
}

export class Logger implements ILogger {
  private static loggers = new Map<string, Logger>();
  private logEntries: LogEntry[] = [];
  private maxEntries = 2000; // Keep last 2000 logs in memory

  constructor(private loggerName: string) {}

  public static getLogger(name: string): Logger {
    if (!Logger.loggers.has(name)) {
      Logger.loggers.set(name, new Logger(name));
    }
    return Logger.loggers.get(name)!;
  }

  private addLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      meta,
      loggerName: this.loggerName
    };

    this.logEntries.push(entry);
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries = this.logEntries.slice(-this.maxEntries);
    }

    // Also output to console in development
    if (process.env.NODE_ENV !== 'production') {
      const logMessage = `[${entry.level.toUpperCase()}] ${this.loggerName}: ${message}`;
      const args: any[] = [logMessage];
      if (meta) {
        args.push(meta);
      }

      switch (level) {
        case 'debug':
          console.debug(...args);
          break;
        case 'info':
          console.info(...args);
          break;
        case 'warn':
          console.warn(...args);
          break;
        case 'error':
          console.error(...args);
          break;
      }
    }

    // In production, send logs to external service
    this.sendToExternalService(entry);
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // In a production environment, you would send this to an external service
    // like Datadog, LogRocket, etc.
    if (process.env.NODE_ENV === 'production' && process.env.LOGGING_ENDPOINT) {
      try {
        await fetch(process.env.LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOGGING_TOKEN}`,
          },
          body: JSON.stringify({
            ...entry,
            timestamp: entry.timestamp.toISOString()
          })
        });
      } catch (sendError) {
        // Don't let logging fail the main app
        console.error('Failed to send log to external service', sendError);
      }
    }
  }

  debug(message: string, meta?: any): void {
    this.addLog('debug', message, meta);
  }

  info(message: string, meta?: any): void {
    this.addLog('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.addLog('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.addLog('error', message, meta);
  }

  getLogs(level?: string, limit = 50): LogEntry[] {
    let logs = this.logEntries;
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    return logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}