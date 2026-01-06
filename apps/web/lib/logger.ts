type LogLevel = "error" | "warn" | "info" | "debug";

interface LoggerOptions {
  level?: LogLevel;
  context?: string;
}

export class AppLogger {
  private level: LogLevel;
  private context: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || "info";
    this.context = options.context || "App";
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["error", "warn", "info", "debug"];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;

      if (data) {
        console[level](`${prefix} ${message}`, data);
      } else {
        console[level](`${prefix} ${message}`);
      }
    }
  }

  error(message: string, data?: any) {
    this.log("error", message, data);
  }

  warn(message: string, data?: any) {
    this.log("warn", message, data);
  }

  info(message: string, data?: any) {
    this.log("info", message, data);
  }

  debug(message: string, data?: any) {
    this.log("debug", message, data);
  }

  withContext(context: string): AppLogger {
    return new AppLogger({
      level: this.level,
      context,
    });
  }
}

export const logger = new AppLogger();
