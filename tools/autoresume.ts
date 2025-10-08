/**
 * Auto-resume system for workflow automation
 * Handles scheduled token regeneration and workflow continuation
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { BundleManager, bundles } from './bundles';
import { logger } from './logger';
import { alerts } from './alerts';

export interface TimeWindow {
  hour: string; // "HH:MM" format
  timezone: string;
}

export interface ResumeConfig {
  timezone: string;
  windows: string[]; // ["02:00", "07:00", "13:00", "19:00"]
  maxRetries: number;
  enabled: boolean;
}

export class AutoResume {
  private configPath = './config/autoresume.json';
  private bundleManager: BundleManager;

  constructor() {
    this.bundleManager = bundles;
    this.ensureConfig();
  }

  /**
   * Ensure configuration file exists
   */
  private ensureConfig(): void {
    const configDir = './config';
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    if (!existsSync(this.configPath)) {
      const defaultConfig: ResumeConfig = {
        timezone: 'America/Mexico_City',
        windows: ['02:00', '07:00', '13:00', '19:00'],
        maxRetries: 2,
        enabled: true
      };

      writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      logger.info('ORCH', 'autoresume', 'Created default autoresume config');
    }
  }

  /**
   * Read autoresume configuration
   */
  readConfig(): ResumeConfig {
    try {
      const content = readFileSync(this.configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      logger.error('ORCH', 'autoresume', `Failed to read config: ${error}`);
      throw error;
    }
  }

  /**
   * Check if current time is within a resume window
   * MEJORADO: Acepta cualquier momento después de 5 horas del límite
   */
  isInResumeWindow(config: ResumeConfig): boolean {
    const now = new Date();

    // Convert to target timezone
    const timeInTz = new Intl.DateTimeFormat('en-US', {
      timeZone: config.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    }).format(now);

    // Check if current time matches any window (±30 minutes for flexibility)
    return config.windows.some(window => {
      const [targetHour, targetMinute] = window.split(':').map(Number);
      const [currentHour, currentMinute] = timeInTz.split(':').map(Number);

      const targetMinutes = targetHour * 60 + targetMinute;
      const currentMinutes = currentHour * 60 + currentMinute;

      // Allow ±30 minute window (más flexible)
      return Math.abs(currentMinutes - targetMinutes) <= 30;
    });
  }

  /**
   * Get next resume window
   */
  getNextResumeWindow(config: ResumeConfig): Date {
    const now = new Date();
    const today = new Date(now);

    // Find next window today
    for (const window of config.windows) {
      const [hour, minute] = window.split(':').map(Number);
      const windowTime = new Date(today);
      windowTime.setHours(hour, minute, 0, 0);

      if (windowTime > now) {
        return windowTime;
      }
    }

    // No windows left today, use first window tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hour, minute] = config.windows[0].split(':').map(Number);
    tomorrow.setHours(hour, minute, 0, 0);

    return tomorrow;
  }

  /**
   * Execute command with logging
   */
  private async executeCommand(cmd: string, bundleId: string): Promise<boolean> {
    return new Promise((resolve) => {
      logger.info('ORCH', 'autoresume', `Executing: ${cmd}`, { bundle: bundleId });

      const child = spawn('sh', ['-c', cmd], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, BUNDLE_ID: bundleId }
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          logger.ok('ORCH', 'autoresume', `Command completed successfully`, { bundle: bundleId });
          if (stdout) logger.debug('ORCH', 'autoresume', 'Command output', { stdout: stdout.slice(0, 500) });
          resolve(true);
        } else {
          logger.error('ORCH', 'autoresume', `Command failed with code ${code}`, { bundle: bundleId, stderr });
          resolve(false);
        }
      });

      child.on('error', (error) => {
        logger.error('ORCH', 'autoresume', `Command execution error: ${error}`, { bundle: bundleId });
        resolve(false);
      });
    });
  }

  /**
   * Process a single bundle for resume
   */
  private async processBundle(bundle: any): Promise<boolean> {
    const bundleId = bundle.id;

    logger.info('ORCH', 'autoresume', `Processing bundle ${bundleId}`, {
      agent: bundle.agent,
      task: bundle.task,
      retries: bundle.retries
    });

    // Check if bundle can be retried
    if (!this.bundleManager.incrementRetries(bundleId)) {
      // Max retries exceeded - need human intervention
      alerts.needHuman({
        agent: 'ORCH',
        task: 'autoresume',
        reason: `Bundle ${bundleId} exceeded maximum retries (${bundle.retries}/${bundle.max_retries})`,
        action: `Review bundle status and manually resolve the issue, or reset retry count`,
        details: `Bundle details:
- Agent: ${bundle.agent}
- Task: ${bundle.task}
- Created: ${bundle.created_at}
- Next command: ${bundle.next_cmd}

The bundle has failed to complete after multiple attempts. This may indicate:
1. A persistent infrastructure issue
2. Invalid command or configuration
3. Dependencies that need manual setup`,
        files: [`./agents/bundles/${bundle.id}_${bundle.session}/`],
        urgency: 'high'
      });

      return false;
    }

    // Execute the next command
    if (bundle.next_cmd) {
      const success = await this.executeCommand(bundle.next_cmd, bundleId);

      if (success) {
        // Mark as completed
        this.bundleManager.completeBundle(bundleId);
        logger.ok('ORCH', 'autoresume', `Bundle ${bundleId} completed successfully`);
        return true;
      } else {
        // Command failed, bundle will retry on next window
        this.bundleManager.updateBundle(bundleId, {
          status: 'waiting_for_tokens',
          resume_at: this.getNextResumeWindow(this.readConfig()).toISOString()
        });

        logger.warn('ORCH', 'autoresume', `Bundle ${bundleId} failed, scheduled for retry`, {
          next_retry: this.getNextResumeWindow(this.readConfig()).toISOString()
        });

        return false;
      }
    } else {
      logger.warn('ORCH', 'autoresume', `Bundle ${bundleId} has no next_cmd to execute`);
      this.bundleManager.failBundle(bundleId, 'No next_cmd specified');
      return false;
    }
  }

  /**
   * Run autoresume check
   * MEJORADO: Reanuda automáticamente después de 5 horas sin ventanas
   */
  async run(): Promise<void> {
    const config = this.readConfig();

    if (!config.enabled) {
      logger.debug('ORCH', 'autoresume', 'Autoresume is disabled');
      return;
    }

    // Acquire lock to prevent concurrent execution
    if (!this.bundleManager.acquireLock()) {
      logger.warn('ORCH', 'autoresume', 'Could not acquire lock, another instance may be running');
      return;
    }

    try {
      logger.info('ORCH', 'autoresume', 'Starting autoresume check');

      // Get bundles ready for resume (revisa si pasaron 5 horas)
      const readyBundles = this.bundleManager.getBundlesReadyForResume();

      if (readyBundles.length === 0) {
        logger.debug('ORCH', 'autoresume', 'No bundles ready for resume');
        return;
      }

      // NUEVO: Filtrar bundles que están esperando hace más de 5 horas
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const urgentBundles = readyBundles.filter(bundle => {
        if (!bundle.updated_at) return true;
        const updatedAt = new Date(bundle.updated_at);
        return updatedAt <= fiveHoursAgo;
      });

      // Si hay bundles urgentes (>5h), procesarlos sin importar la ventana
      let bundlesToProcess = urgentBundles.length > 0 ? urgentBundles : [];

      // Si no hay urgentes, revisar si estamos en ventana
      if (bundlesToProcess.length === 0 && this.isInResumeWindow(config)) {
        bundlesToProcess = readyBundles;
      }

      if (bundlesToProcess.length === 0) {
        const nextWindow = this.getNextResumeWindow(config);
        logger.debug('ORCH', 'autoresume', 'No urgent bundles and not in resume window', {
          next_window: nextWindow.toISOString(),
          waiting_bundles: readyBundles.length
        });
        return;
      }

      logger.info('ORCH', 'autoresume', `Found ${bundlesToProcess.length} bundles ready for resume`, {
        urgent: urgentBundles.length,
        in_window: bundlesToProcess.length - urgentBundles.length
      });

      // Process each bundle
      let successCount = 0;
      let failCount = 0;

      for (const bundle of bundlesToProcess) {
        try {
          const success = await this.processBundle(bundle);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          logger.error('ORCH', 'autoresume', `Error processing bundle ${bundle.id}: ${error}`);
          failCount++;
        }
      }

      logger.info('ORCH', 'autoresume', 'Autoresume completed', {
        total: bundlesToProcess.length,
        success: successCount,
        failed: failCount
      });

    } finally {
      this.bundleManager.releaseLock();
    }
  }

  /**
   * Schedule a bundle for later resume
   */
  scheduleResume(bundleId: string, nextCmd: string, delayHours: number = 0): void {
    const config = this.readConfig();
    let resumeAt: Date;

    if (delayHours > 0) {
      // Schedule for specific delay
      resumeAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);
    } else {
      // Schedule for next window
      resumeAt = this.getNextResumeWindow(config);
    }

    this.bundleManager.waitForTokens(bundleId, resumeAt, nextCmd);

    logger.info('ORCH', 'autoresume', `Bundle ${bundleId} scheduled for resume`, {
      resume_at: resumeAt.toISOString(),
      next_cmd: nextCmd
    });
  }

  /**
   * Get status of autoresume system
   */
  getStatus(): {
    enabled: boolean;
    nextWindow: string;
    pendingBundles: number;
    config: ResumeConfig;
  } {
    const config = this.readConfig();
    const nextWindow = this.getNextResumeWindow(config);
    const pendingBundles = this.bundleManager.getBundlesReadyForResume().length;

    return {
      enabled: config.enabled,
      nextWindow: nextWindow.toISOString(),
      pendingBundles,
      config
    };
  }
}

// Global autoresume instance
export const autoResume = new AutoResume();

// CLI entry point
if (require.main === module) {
  autoResume.run().catch(error => {
    logger.error('ORCH', 'autoresume', `Autoresume failed: ${error}`);
    process.exit(1);
  });
}