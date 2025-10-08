/**
 * Centralized exports for workflow tools
 */

// Logger utilities
export { Logger, logger, log, type LogEntry, type LogConfig } from './logger';

// Alert system
export { AlertSystem, alerts, needHuman, missingTestId, missingConfig, apiError, dependencyIssue, type AlertConfig } from './alerts';

// Bundle management
export { BundleManager, bundles, type BundleState, type ManifestState } from './bundles';

// Auto-resume utilities
export { AutoResume, autoResume, type ResumeConfig, type TimeWindow } from './autoresume';

// Import for workflow object
import { needHuman, missingTestId } from './alerts';

// Re-export commonly used functions
export const workflow = {
  // Logging
  startAgent: (agent: string, task: string, runId: string) => log.startBanner(agent, task, runId),
  endAgent: (agent: string, status: 'OK' | 'FAIL', duration: string, artifacts?: string) =>
    log.endBanner(agent, status, duration, artifacts),

  // Bundle management
  createBundle: (agent: string, task: string, nextCmd?: string) => bundles.createBundle(agent, task, nextCmd),
  waitForTokens: (bundleId: string, resumeAt: Date, nextCmd: string) => bundles.waitForTokens(bundleId, resumeAt, nextCmd),
  completeBundle: (bundleId: string, artifacts?: string[]) => bundles.completeBundle(bundleId, artifacts),
  failBundle: (bundleId: string, reason: string) => bundles.failBundle(bundleId, reason),

  // Alerts
  needHuman,
  missingTestId,

  // Utilities
  generateRunId: () => crypto.randomUUID().replace(/-/g, '').substring(0, 9),
  formatDuration: (startTime: number) => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};