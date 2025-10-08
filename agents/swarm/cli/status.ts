#!/usr/bin/env node
/**
 * Swarm Status CLI
 * Display current swarm session status
 */

import { swarmManager } from '../swarm-manager';
import { SwarmUI } from './ui';

function main() {
  try {
    // Get active session
    const session = swarmManager.getActiveSession();

    if (!session) {
      console.log(SwarmUI.renderNoSession());
      return;
    }

    // Render full status
    console.log(SwarmUI.renderSession(session));

  } catch (error) {
    console.error(SwarmUI.renderError(
      error instanceof Error ? error.message : String(error)
    ));
    process.exit(1);
  }
}

main();
