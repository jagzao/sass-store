/**
 * Bundle state management for workflow automation
 * Handles WAITING_FOR_TOKENS, RESUME_AT, NEXT_CMD, RETRIES
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { logger } from './logger';

export interface BundleState {
  id: string;
  session: string;
  agent: string;
  task: string;
  status: 'running' | 'waiting_for_tokens' | 'completed' | 'failed' | 'paused';
  created_at: string;
  updated_at: string;
  resume_at?: string;
  next_cmd?: string;
  retries: number;
  max_retries: number;
  artifacts: string[];
  metadata: Record<string, any>;
}

export interface ManifestState {
  version: string;
  last_session: string;
  bundles: Record<string, BundleState>;
  global_config: {
    timezone: string;
    max_retries: number;
    auto_resume: boolean;
  };
}

export class BundleManager {
  private bundlesDir = './agents/bundles';
  private manifestPath = './manifest.json';
  private lockFile = './agents/.bundle-lock';

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    if (!existsSync(this.bundlesDir)) {
      mkdirSync(this.bundlesDir, { recursive: true });
    }
    if (!existsSync(dirname(this.manifestPath))) {
      mkdirSync(dirname(this.manifestPath), { recursive: true });
    }
  }

  /**
   * Generate bundle ID
   */
  private generateBundleId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace(/[T:-]/g, '');
    const randomStr = crypto.randomUUID().replace(/-/g, '').substring(0, 9);
    return `${dateStr}_${randomStr}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return new Date().toISOString().slice(0, 19).replace(/[T:-]/g, '');
  }

  /**
   * Get bundle directory path
   */
  private getBundleDir(bundleId: string, session: string): string {
    return join(this.bundlesDir, `${bundleId}_${session}`);
  }

  /**
   * Read manifest with fallback to default
   */
  readManifest(): ManifestState {
    try {
      if (existsSync(this.manifestPath)) {
        const content = readFileSync(this.manifestPath, 'utf8');
        const manifest = JSON.parse(content);

        // Ensure manifest has required structure
        return {
          version: manifest.version || '1.0.0',
          last_session: manifest.last_session || this.generateSessionId(),
          bundles: manifest.bundles || {},
          global_config: {
            timezone: manifest.global_config?.timezone || 'America/Mexico_City',
            max_retries: manifest.global_config?.max_retries || 2,
            auto_resume: manifest.global_config?.auto_resume !== false,
            ...manifest.global_config
          }
        };
      }
    } catch (error) {
      logger.warn('BUNDLE', 'read-manifest', `Failed to read manifest: ${error}`);
    }

    // Return default manifest
    return {
      version: '1.0.0',
      last_session: this.generateSessionId(),
      bundles: {},
      global_config: {
        timezone: 'America/Mexico_City',
        max_retries: 2,
        auto_resume: true
      }
    };
  }

  /**
   * Write manifest atomically
   */
  writeManifest(manifest: ManifestState): void {
    try {
      const tempPath = `${this.manifestPath}.tmp`;
      manifest.updated_at = new Date().toISOString();

      writeFileSync(tempPath, JSON.stringify(manifest, null, 2), 'utf8');

      // Atomic move
      const fs = require('fs');
      fs.renameSync(tempPath, this.manifestPath);

      logger.debug('BUNDLE', 'write-manifest', 'Manifest updated successfully');
    } catch (error) {
      logger.error('BUNDLE', 'write-manifest', `Failed to write manifest: ${error}`);
      throw error;
    }
  }

  /**
   * Create new bundle
   */
  createBundle(agent: string, task: string, nextCmd?: string): BundleState {
    const bundleId = this.generateBundleId();
    const session = this.generateSessionId();
    const now = new Date().toISOString();

    const bundle: BundleState = {
      id: bundleId,
      session,
      agent,
      task,
      status: 'running',
      created_at: now,
      updated_at: now,
      next_cmd: nextCmd,
      retries: 0,
      max_retries: 2,
      artifacts: [],
      metadata: {}
    };

    // Create bundle directory
    const bundleDir = this.getBundleDir(bundleId, session);
    mkdirSync(bundleDir, { recursive: true });

    // Update manifest
    const manifest = this.readManifest();
    manifest.bundles[bundleId] = bundle;
    manifest.last_session = session;
    this.writeManifest(manifest);

    logger.info('BUNDLE', 'create', `Created bundle ${bundleId}`, { session, agent, task });

    return bundle;
  }

  /**
   * Update bundle state
   */
  updateBundle(bundleId: string, updates: Partial<BundleState>): void {
    const manifest = this.readManifest();
    const bundle = manifest.bundles[bundleId];

    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    // Apply updates
    Object.assign(bundle, updates, {
      updated_at: new Date().toISOString()
    });

    manifest.bundles[bundleId] = bundle;
    this.writeManifest(manifest);

    logger.debug('BUNDLE', 'update', `Updated bundle ${bundleId}`, updates);
  }

  /**
   * Set bundle to wait for tokens
   */
  waitForTokens(bundleId: string, resumeAt: Date, nextCmd: string): void {
    this.updateBundle(bundleId, {
      status: 'waiting_for_tokens',
      resume_at: resumeAt.toISOString(),
      next_cmd: nextCmd
    });

    logger.info('BUNDLE', 'wait-tokens', `Bundle ${bundleId} waiting for tokens`, {
      resume_at: resumeAt.toISOString(),
      next_cmd: nextCmd
    });
  }

  /**
   * Increment bundle retries
   */
  incrementRetries(bundleId: string): boolean {
    const manifest = this.readManifest();
    const bundle = manifest.bundles[bundleId];

    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    bundle.retries++;
    bundle.updated_at = new Date().toISOString();

    const maxRetries = bundle.max_retries || manifest.global_config.max_retries;
    const canRetry = bundle.retries < maxRetries;

    if (!canRetry) {
      bundle.status = 'failed';
      logger.error('BUNDLE', 'max-retries', `Bundle ${bundleId} exceeded max retries`, {
        retries: bundle.retries,
        max_retries: maxRetries
      });
    }

    manifest.bundles[bundleId] = bundle;
    this.writeManifest(manifest);

    return canRetry;
  }

  /**
   * Mark bundle as completed
   */
  completeBundle(bundleId: string, artifacts: string[] = []): void {
    this.updateBundle(bundleId, {
      status: 'completed',
      artifacts
    });

    logger.ok('BUNDLE', 'complete', `Bundle ${bundleId} completed`, {
      artifacts: artifacts.length
    });
  }

  /**
   * Mark bundle as failed
   */
  failBundle(bundleId: string, reason: string): void {
    this.updateBundle(bundleId, {
      status: 'failed',
      metadata: { failure_reason: reason }
    });

    logger.error('BUNDLE', 'fail', `Bundle ${bundleId} failed: ${reason}`);
  }

  /**
   * Get bundles ready for resume
   */
  getBundlesReadyForResume(): BundleState[] {
    const manifest = this.readManifest();
    const now = new Date();

    return Object.values(manifest.bundles).filter(bundle => {
      if (bundle.status !== 'waiting_for_tokens') return false;
      if (!bundle.resume_at) return false;

      const resumeAt = new Date(bundle.resume_at);
      return resumeAt <= now;
    });
  }

  /**
   * Save artifact to bundle
   */
  saveArtifact(bundleId: string, filename: string, content: string): string {
    const manifest = this.readManifest();
    const bundle = manifest.bundles[bundleId];

    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    const bundleDir = this.getBundleDir(bundle.id, bundle.session);
    const filepath = join(bundleDir, filename);

    writeFileSync(filepath, content, 'utf8');

    // Update bundle artifacts
    if (!bundle.artifacts.includes(filename)) {
      bundle.artifacts.push(filename);
      this.updateBundle(bundleId, { artifacts: bundle.artifacts });
    }

    logger.debug('BUNDLE', 'save-artifact', `Saved ${filename} to bundle ${bundleId}`);

    return filepath;
  }

  /**
   * Get artifact content from bundle
   */
  getArtifact(bundleId: string, filename: string): string | null {
    const manifest = this.readManifest();
    const bundle = manifest.bundles[bundleId];

    if (!bundle) {
      throw new Error(`Bundle ${bundleId} not found`);
    }

    const bundleDir = this.getBundleDir(bundle.id, bundle.session);
    const filepath = join(bundleDir, filename);

    if (!existsSync(filepath)) {
      return null;
    }

    return readFileSync(filepath, 'utf8');
  }

  /**
   * Acquire lock for atomic operations
   */
  async acquireLock(timeout: number = 30000): Promise<boolean> {
    const lockTimeout = Date.now() + timeout;

    while (Date.now() < lockTimeout) {
      try {
        if (!existsSync(this.lockFile)) {
          writeFileSync(this.lockFile, process.pid.toString(), 'utf8');
          return true;
        }

        // Check if lock is stale
        const lockPid = readFileSync(this.lockFile, 'utf8').trim();
        try {
          process.kill(parseInt(lockPid), 0); // Check if process exists
        } catch {
          // Process doesn't exist, remove stale lock
          this.releaseLock();
          continue;
        }

        // Wait a bit before retrying
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        await sleep(100);
      } catch (error) {
        logger.warn('BUNDLE', 'acquire-lock', `Lock acquisition failed: ${error}`);
      }
    }

    return false;
  }

  /**
   * Release lock
   */
  releaseLock(): void {
    try {
      if (existsSync(this.lockFile)) {
        const fs = require('fs');
        fs.unlinkSync(this.lockFile);
      }
    } catch (error) {
      logger.warn('BUNDLE', 'release-lock', `Lock release failed: ${error}`);
    }
  }

  /**
   * Clean up old bundles
   */
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void { // 7 days default
    const manifest = this.readManifest();
    const cutoff = new Date(Date.now() - maxAge);
    let cleanedCount = 0;

    for (const [bundleId, bundle] of Object.entries(manifest.bundles)) {
      const createdAt = new Date(bundle.created_at);

      if (createdAt < cutoff && ['completed', 'failed'].includes(bundle.status)) {
        // Remove bundle directory
        const bundleDir = this.getBundleDir(bundle.id, bundle.session);
        if (existsSync(bundleDir)) {
          const fs = require('fs');
          fs.rmSync(bundleDir, { recursive: true, force: true });
        }

        // Remove from manifest
        delete manifest.bundles[bundleId];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.writeManifest(manifest);
      logger.info('BUNDLE', 'cleanup', `Cleaned ${cleanedCount} old bundles`);
    }
  }
}

// Global bundle manager instance
export const bundles = new BundleManager();