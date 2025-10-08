#!/usr/bin/env node
/**
 * Swarm Continue CLI
 * Continue swarm after human completes a task
 */

import { swarmManager } from '../swarm-manager';
import { SwarmUI } from './ui';
import { ArchitectAgentInteractive } from '../agents/architect-agent-interactive';

async function main() {
  const sessionId = process.argv[2];
  const taskId = process.argv[3];

  if (!sessionId) {
    console.error('❌ Error: Debes proporcionar un session ID');
    console.log('\nUso: npm run swarm:continue <session-id> <task-id>');
    process.exit(1);
  }

  try {
    const session = swarmManager.loadSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    console.log(`\n🔄 Continuando swarm: ${session.featureName}\n`);

    // If taskId provided, mark that task as completed
    if (taskId) {
      const task = session.tasks.find(t => t.id === taskId);
      if (task && task.status === 'in_progress') {
        console.log(`✓ Marcando tarea ${task.agent} como completada`);
        swarmManager.updateTask(sessionId, taskId, {
          status: 'completed',
          progress: 100
        });
      }
    }

    // Get next task
    const nextTask = swarmManager.getNextTask(sessionId);

    if (!nextTask) {
      console.log('✅ Todas las tareas completadas!\n');
      swarmManager.updateTask(sessionId, session.tasks[0].id, {
        status: 'completed'
      } as any);

      const finalSession = swarmManager.loadSession(sessionId);
      if (finalSession) {
        console.log(SwarmUI.renderSession(finalSession));
      }
      return;
    }

    console.log(`▶️  Siguiente tarea: ${nextTask.agent}\n`);

    // Execute next agent
    if (nextTask.agent === 'ARCHITECT') {
      const agent = new ArchitectAgentInteractive('ARCHITECT', sessionId, nextTask.id);
      await agent.run();
    }
    // Add more agents here...

    console.log('\n✅ Tarea ejecutada!\n');

  } catch (error) {
    if (error instanceof Error && error.message === 'WAITING_FOR_HUMAN') {
      // This is expected - agent is waiting for human input
      process.exit(0);
    }

    console.error(SwarmUI.renderError(
      error instanceof Error ? error.message : String(error)
    ));
    process.exit(1);
  }
}

main();
