/**
 * CLI UI Components
 * Beautiful terminal output for swarm status
 */

import { SwarmSession, AgentTask } from '../types';
import { getAgentConfig } from '../agents-config';

export class SwarmUI {
  /**
   * Draw box border
   */
  static box(content: string, width: number = 80): string {
    const top = '┌' + '─'.repeat(width - 2) + '┐';
    const bottom = '└' + '─'.repeat(width - 2) + '┘';
    const padding = ' '.repeat(Math.max(0, (width - content.length - 2) / 2));
    const line = '│' + padding + content + padding + ' '.repeat(width - content.length - padding.length * 2 - 2) + '│';
    return `${top}\n${line}\n${bottom}`;
  }

  /**
   * Draw progress bar
   */
  static progressBar(progress: number, width: number = 20, label?: string): string {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentage = `${progress}%`;

    if (label) {
      return `[${label}] ${bar} ${percentage}`;
    }
    return `${bar} ${percentage}`;
  }

  /**
   * Status icon
   */
  static statusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      in_progress: '⚡',
      completed: '✓',
      failed: '✗',
      blocked: '🚫',
      skipped: '⊘'
    };
    return icons[status] || '?';
  }

  /**
   * Render full session status
   */
  static renderSession(session: SwarmSession): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(this.box(session.featureName.toUpperCase(), 80));
    lines.push('');

    // Overall progress
    const overallProgress = this.progressBar(session.progress, 40, 'ORCHESTRATOR');
    lines.push(`🎯 ${overallProgress}`);
    lines.push('');

    // Each agent task
    for (const task of session.tasks) {
      const agentConfig = getAgentConfig(task.agent);
      if (!agentConfig) continue;

      const emoji = agentConfig.emoji;
      const status = this.statusIcon(task.status);
      const progress = this.progressBar(task.progress, 20);

      lines.push(`${emoji} [${task.agent}] ${task.description}`);

      // Show output if in progress or completed
      if (task.output && task.output.length > 0) {
        const recentOutput = task.output.slice(-3); // Last 3 lines
        recentOutput.forEach(line => {
          lines.push(`   ${line}`);
        });
      }

      if (task.status === 'in_progress') {
        lines.push(`   ${progress}`);
      } else if (task.status === 'completed') {
        lines.push(`${status} Completado`);
      } else if (task.status === 'failed') {
        lines.push(`${status} Falló: ${task.blockedReason || 'Error desconocido'}`);
      } else if (task.status === 'blocked') {
        lines.push(`${status} Bloqueado: ${task.blockedReason || 'Esperando'}`);
      }

      lines.push('');
    }

    // Summary
    const completed = session.tasks.filter(t => t.status === 'completed').length;
    const total = session.tasks.length;
    const failed = session.tasks.filter(t => t.status === 'failed').length;

    lines.push('─'.repeat(80));
    lines.push(`📊 Progreso: ${completed}/${total} tareas completadas`);
    if (failed > 0) {
      lines.push(`⚠️  ${failed} tareas fallidas`);
    }
    lines.push(`⏱️  Iniciado: ${new Date(session.createdAt).toLocaleString()}`);
    lines.push(`🔄 Actualizado: ${new Date(session.updatedAt).toLocaleString()}`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Render compact status
   */
  static renderCompact(session: SwarmSession): string {
    const lines: string[] = [];

    lines.push(`\n📦 ${session.featureName} (${session.status})`);
    lines.push(`   ${this.progressBar(session.progress, 30)} ${session.progress}%`);

    const current = session.tasks.find(t => t.status === 'in_progress');
    if (current) {
      const config = getAgentConfig(current.agent);
      lines.push(`   ${config?.emoji || '⚡'} Ejecutando: ${current.agent}`);
    }

    return lines.join('\n');
  }

  /**
   * Render no active session message
   */
  static renderNoSession(): string {
    return `
┌────────────────────────────────────────────────────────────────┐
│                    Sin sesión activa                           │
└────────────────────────────────────────────────────────────────┘

Para iniciar una nueva sesión:
  npm run swarm:start "Nombre de la feature"

Para ver sesiones anteriores:
  npm run swarm:list
`;
  }

  /**
   * Render error
   */
  static renderError(error: string): string {
    return `
❌ Error: ${error}

Usa 'npm run swarm:status' para ver el estado actual.
`;
  }
}
