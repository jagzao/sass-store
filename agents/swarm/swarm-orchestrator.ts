/**
 * Swarm Orchestrator
 * Integrates swarm with bundle system for token management
 */

import { swarmManager } from './swarm-manager';
import { bundles } from '../../tools/bundles';
import { autoResume } from '../../tools/autoresume';

export class SwarmOrchestrator {
  /**
   * Execute swarm with automatic pause/resume on rate limits
   */
  async executeWithResilience(
    featureName: string,
    executionFunction: (sessionId: string) => Promise<void>
  ): Promise<void> {
    // Create session
    const session = swarmManager.createSession(featureName);

    try {
      // Execute
      await executionFunction(session.id);

    } catch (error) {
      // Check if it's a rate limit error
      if (this.isRateLimitError(error)) {
        console.log('⚠️  Rate limit alcanzado, pausando sesión...');

        // Create bundle for continuation
        const bundle = bundles.createBundle(
          'SWARM',
          featureName,
          `npm run swarm:resume ${session.id}`
        );

        // Link bundle to session
        swarmManager.updateTask(session.id, session.tasks[0].id, {
          metadata: { bundleId: bundle.id }
        } as any);

        // Pause session
        swarmManager.pauseSession(session.id, 'Rate limit - waiting for tokens');

        // Schedule resume
        autoResume.scheduleResume(bundle.id, `npm run swarm:resume ${session.id}`);

        console.log(`✓ Sesión pausada y programada para continuar`);
        console.log(`  Bundle ID: ${bundle.id}`);
        console.log(`  Usa 'npm run workflow:status' para ver el estado`);

      } else {
        // Other error - fail the session
        throw error;
      }
    }
  }

  /**
   * Resume a paused swarm session
   */
  async resumeSession(sessionId: string): Promise<void> {
    const session = swarmManager.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'paused') {
      console.log(`⚠️  Sesión ${sessionId} no está pausada (estado: ${session.status})`);
      return;
    }

    console.log(`🔄 Reanudando sesión: ${session.featureName}`);

    // Resume session
    swarmManager.resumeSession(sessionId);

    // Get next task
    const nextTask = swarmManager.getNextTask(sessionId);
    if (!nextTask) {
      console.log('✓ No hay tareas pendientes');
      return;
    }

    console.log(`▶️  Continuando con: ${nextTask.agent}`);

    // Continue execution
    // This would call the appropriate agent based on nextTask
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('too many requests') ||
        message.includes('quota exceeded')
      );
    }
    return false;
  }

  /**
   * Get swarm status with bundle info
   */
  getStatusWithBundles() {
    const session = swarmManager.getActiveSession();
    if (!session) return null;

    // Get related bundles
    const manifest = bundles.readManifest();
    const relatedBundles = Object.values(manifest.bundles).filter(
      b => b.agent === 'SWARM'
    );

    return {
      session,
      bundles: relatedBundles,
      isPaused: session.status === 'paused',
      canResume: relatedBundles.some(b => b.status === 'waiting_for_tokens')
    };
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
