#!/usr/bin/env node
/**
 * Simple workflow status checker
 */

import { readFileSync, existsSync } from 'fs';

interface ManifestState {
  version: string;
  last_session: string;
  bundles: Record<string, any>;
  global_config: {
    timezone: string;
    max_retries: number;
    auto_resume: boolean;
  };
}

interface ResumeConfig {
  timezone: string;
  windows: string[];
  maxRetries: number;
  enabled: boolean;
}

function readManifest(): ManifestState | null {
  const manifestPath = './manifest.json';

  if (!existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = readFileSync(manifestPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function readResumeConfig(): ResumeConfig | null {
  const configPath = './config/autoresume.json';

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getNextResumeWindow(config: ResumeConfig): Date {
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

function main() {
  const manifest = readManifest();
  const config = readResumeConfig();

  if (!manifest && !config) {
    console.log(JSON.stringify({
      status: 'not_initialized',
      message: 'Workflow orchestrator not initialized yet',
      enabled: false,
      pendingBundles: 0
    }, null, 2));
    return;
  }

  const bundles = manifest?.bundles || {};
  const bundleList = Object.values(bundles);

  const pending = bundleList.filter((b: any) => b.status === 'waiting_for_tokens');
  const running = bundleList.filter((b: any) => b.status === 'running');
  const completed = bundleList.filter((b: any) => b.status === 'completed');
  const failed = bundleList.filter((b: any) => b.status === 'failed');

  const status = {
    enabled: config?.enabled ?? false,
    nextWindow: config ? getNextResumeWindow(config).toISOString() : null,
    bundles: {
      total: bundleList.length,
      pending: pending.length,
      running: running.length,
      completed: completed.length,
      failed: failed.length
    },
    pendingDetails: pending.map((b: any) => ({
      id: b.id,
      agent: b.agent,
      task: b.task,
      resume_at: b.resume_at,
      retries: b.retries
    })),
    config: config || null
  };

  console.log(JSON.stringify(status, null, 2));
}

main();
