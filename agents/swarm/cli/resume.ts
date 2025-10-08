#!/usr/bin/env node
/**
 * Swarm Resume CLI
 * Resume a paused swarm session
 */

import { swarmOrchestrator } from '../swarm-orchestrator';
import { SwarmUI } from './ui';

async function main() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.error('❌ Error: Debes proporcionar un ID de sesión');
    console.log('\nUso: npm run swarm:resume <session-id>');
    process.exit(1);
  }

  try {
    console.log(`\n🔄 Reanudando sesión: ${sessionId}\n`);

    await swarmOrchestrator.resumeSession(sessionId);

    console.log('\n✅ Sesión reanudada exitosamente!\n');

  } catch (error) {
    console.error(SwarmUI.renderError(
      error instanceof Error ? error.message : String(error)
    ));
    process.exit(1);
  }
}

main();
