/**
 * Logger utility with ANSI colors and logfmt formatting
 * Implements visual console language for agents/roles
 */

export interface LogConfig {
  colors: boolean;
  emoji: boolean;
}

export interface LogEntry {
  level: 'INFO' | 'OK' | 'WARN' | 'ERROR' | 'DEBUG';
  agent: string;
  task: string;
  case?: string;
  msg?: string;
  duration?: string;
  url?: string;
  need?: 'HUMAN';
  reason?: string;
  action?: string;
  [key: string]: any;
}

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Role colors
  orchestrator: '\x1b[36m',  // Cyan
  frontend: '\x1b[35m',      // Magenta
  backend: '\x1b[32m',       // Green
  qa: '\x1b[33m',            // Yellow
  seo: '\x1b[94m',           // Light blue

  // Status colors
  success: '\x1b[32m',       // Green
  error: '\x1b[31m',         // Red
  warn: '\x1b[33m',          // Yellow
  info: '\x1b[36m',          // Cyan

  // Emergency colors
  needHuman: '\x1b[41m\x1b[37m', // Red background + White text

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// Role color mapping
const roleColors: Record<string, string> = {
  'ORCH': colors.orchestrator,
  'UI': colors.frontend,
  'FRONTEND': colors.frontend,
  'API': colors.backend,
  'BACKEND': colors.backend,
  'DB': colors.backend,
  'QA': colors.qa,
  'TEST': colors.qa,
  'SEO': colors.seo,
  'A11Y': colors.seo,
  'PERF': colors.seo
};

// Emoji mapping
const statusEmoji = {
  'INFO': 'ℹ️',
  'OK': '✅',
  'WARN': '⚠️',
  'ERROR': '❌',
  'DEBUG': '🔍'
};

export class Logger {
  private config: LogConfig;

  constructor() {
    this.config = {
      colors: process.env.CLI_COLORS !== '0',
      emoji: process.env.CLI_EMOJI !== '0'
    };
  }

  /**
   * Format timestamp in HH:MM:SS format
   */
  private formatTime(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  }

  /**
   * Get color for agent/role
   */
  private getRoleColor(agent: string): string {
    if (!this.config.colors) return '';

    const upperAgent = agent.toUpperCase();
    return roleColors[upperAgent] || colors.info;
  }

  /**
   * Get status color
   */
  private getStatusColor(level: string): string {
    if (!this.config.colors) return '';

    switch (level) {
      case 'OK': return colors.success;
      case 'ERROR': return colors.error;
      case 'WARN': return colors.warn;
      default: return colors.info;
    }
  }

  /**
   * Format logfmt string from entry
   */
  private formatLogfmt(entry: LogEntry): string {
    const parts: string[] = [];

    // Required fields
    parts.push(`AGENT=${entry.agent}`);
    parts.push(`TASK=${entry.task}`);

    // Optional fields
    if (entry.case) parts.push(`CASE="${entry.case}"`);
    if (entry.duration) parts.push(`duration=${entry.duration}`);
    if (entry.url) parts.push(`url="${entry.url}"`);
    if (entry.need) parts.push(`NEED=${entry.need}`);
    if (entry.reason) parts.push(`REASON="${entry.reason}"`);
    if (entry.action) parts.push(`ACTION="${entry.action}"`);
    if (entry.msg) parts.push(`msg="${entry.msg}"`);

    // Add any additional fields
    Object.keys(entry).forEach(key => {
      if (!['level', 'agent', 'task', 'case', 'msg', 'duration', 'url', 'need', 'reason', 'action'].includes(key)) {
        parts.push(`${key}=${entry[key]}`);
      }
    });

    return parts.join(' ');
  }

  /**
   * Log a structured entry
   */
  log(entry: LogEntry): void {
    const time = this.formatTime();
    const roleColor = this.getRoleColor(entry.agent);
    const statusColor = this.getStatusColor(entry.level);
    const emoji = this.config.emoji ? statusEmoji[entry.level] || '' : '';
    const reset = this.config.colors ? colors.reset : '';

    // Special handling for NEED=HUMAN
    if (entry.need === 'HUMAN') {
      this.logNeedHuman(entry);
      return;
    }

    // Format: [TIME] LVL AGENT=... TASK=... ...
    const logLine = [
      `[${time}]`,
      emoji ? `${emoji}  ` : '',
      `${statusColor}${entry.level.padEnd(5)}${reset}`,
      `${roleColor}${this.formatLogfmt(entry)}${reset}`
    ].join(' ');

    console.log(logLine);
  }

  /**
   * Log NEED=HUMAN with special formatting
   */
  private logNeedHuman(entry: LogEntry): void {
    const time = this.formatTime();
    const needColor = this.config.colors ? colors.needHuman : '';
    const reset = this.config.colors ? colors.reset : '';

    // Beep sound
    process.stdout.write('\x07'); // ASCII bell character

    console.log(`[${time}] ${needColor}⚠    NEED=HUMAN${reset} ${this.formatLogfmt(entry)}`);
  }

  /**
   * Print agent start banner
   */
  printStartBanner(agent: string, task: string, runId: string): void {
    const roleColor = this.getRoleColor(agent);
    const reset = this.config.colors ? colors.reset : '';
    const bright = this.config.colors ? colors.bright : '';

    const border = '━'.repeat(42);
    const startTime = new Date().toISOString();

    console.log(`${roleColor}${border}${reset}`);
    console.log(`${bright}AGENT: ${agent} TASK: ${task} RUN: #${runId}${reset}`);
    console.log(`${bright}START: ${startTime}${reset}`);
    console.log(`${roleColor}${border}${reset}`);
  }

  /**
   * Print agent completion banner
   */
  printEndBanner(agent: string, status: 'OK' | 'FAIL', duration: string, artifactsPath?: string): void {
    const roleColor = this.getRoleColor(agent);
    const statusColor = status === 'OK' ? colors.success : colors.error;
    const reset = this.config.colors ? colors.reset : '';
    const bright = this.config.colors ? colors.bright : '';

    const border = '━'.repeat(42);

    console.log(`${roleColor}${border}${reset}`);
    console.log(`${bright}AGENT DONE: ${agent} ${statusColor}STATUS: ${status}${reset} ${bright}DURATION: ${duration}${reset}`);
    if (artifactsPath) {
      console.log(`${bright}ARTIFACTS: ${artifactsPath}${reset}`);
    }
    console.log(`${roleColor}${border}${reset}`);
  }

  /**
   * Convenience methods for common log levels
   */
  info(agent: string, task: string, msg: string, extra?: Partial<LogEntry>): void {
    this.log({ level: 'INFO', agent, task, msg, ...extra });
  }

  ok(agent: string, task: string, msg: string, extra?: Partial<LogEntry>): void {
    this.log({ level: 'OK', agent, task, msg, ...extra });
  }

  warn(agent: string, task: string, msg: string, extra?: Partial<LogEntry>): void {
    this.log({ level: 'WARN', agent, task, msg, ...extra });
  }

  error(agent: string, task: string, msg: string, extra?: Partial<LogEntry>): void {
    this.log({ level: 'ERROR', agent, task, msg, ...extra });
  }

  debug(agent: string, task: string, msg: string, extra?: Partial<LogEntry>): void {
    this.log({ level: 'DEBUG', agent, task, msg, ...extra });
  }

  /**
   * Log NEED=HUMAN with structured data
   */
  needHuman(agent: string, task: string, reason: string, action: string, extra?: Partial<LogEntry>): void {
    this.log({
      level: 'WARN',
      agent,
      task,
      need: 'HUMAN',
      reason,
      action,
      msg: 'Human intervention required',
      ...extra
    });
  }
}

// Global logger instance
export const logger = new Logger();

// Convenience exports
export const log = {
  info: (agent: string, task: string, msg: string, extra?: Partial<LogEntry>) => logger.info(agent, task, msg, extra),
  ok: (agent: string, task: string, msg: string, extra?: Partial<LogEntry>) => logger.ok(agent, task, msg, extra),
  warn: (agent: string, task: string, msg: string, extra?: Partial<LogEntry>) => logger.warn(agent, task, msg, extra),
  error: (agent: string, task: string, msg: string, extra?: Partial<LogEntry>) => logger.error(agent, task, msg, extra),
  debug: (agent: string, task: string, msg: string, extra?: Partial<LogEntry>) => logger.debug(agent, task, msg, extra),
  needHuman: (agent: string, task: string, reason: string, action: string, extra?: Partial<LogEntry>) =>
    logger.needHuman(agent, task, reason, action, extra),

  startBanner: (agent: string, task: string, runId: string) => logger.printStartBanner(agent, task, runId),
  endBanner: (agent: string, status: 'OK' | 'FAIL', duration: string, artifactsPath?: string) =>
    logger.printEndBanner(agent, status, duration, artifactsPath)
};