#!/usr/bin/env node
/**
 * Simple workflow cleanup script
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

interface ManifestState {
  version: string;
  last_session: string;
  bundles: Record<string, any>;
  global_config: any;
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

function writeManifest(manifest: ManifestState): void {
  const manifestPath = './manifest.json';
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

function main() {
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  const manifest = readManifest();

  if (!manifest) {
    console.log('No manifest found - nothing to cleanup');
    return;
  }

  const cutoff = new Date(Date.now() - maxAge);
  let cleanedCount = 0;
  const bundlesDir = './agents/bundles';

  for (const [bundleId, bundle] of Object.entries(manifest.bundles)) {
    const createdAt = new Date(bundle.created_at);

    if (createdAt < cutoff && ['completed', 'failed'].includes(bundle.status)) {
      // Remove bundle directory
      const bundleDir = join(bundlesDir, `${bundle.id}_${bundle.session}`);
      if (existsSync(bundleDir)) {
        try {
          rmSync(bundleDir, { recursive: true, force: true });
          console.log(`✓ Removed bundle directory: ${bundleDir}`);
        } catch (error) {
          console.error(`✗ Failed to remove ${bundleDir}: ${error}`);
        }
      }

      // Remove from manifest
      delete manifest.bundles[bundleId];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    writeManifest(manifest);
    console.log(`\n✓ Cleaned ${cleanedCount} old bundles`);
  } else {
    console.log('No old bundles to cleanup');
  }
}

main();
