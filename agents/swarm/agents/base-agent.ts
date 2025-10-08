/**
 * Base Agent Class
 * All specialized agents extend from this
 */

import { AgentRole, AgentTask } from '../types';
import { swarmManager } from '../swarm-manager';

export abstract class BaseAgent {
  protected role: AgentRole;
  protected sessionId: string;
  protected taskId: string;

  constructor(role: AgentRole, sessionId: string, taskId: string) {
    this.role = role;
    this.sessionId = sessionId;
    this.taskId = taskId;
  }

  /**
   * Main execution method - must be implemented by child classes
   */
  abstract execute(): Promise<void>;

  /**
   * Log output to task
   */
  protected log(message: string): void {
    console.log(`[${this.role}] ${message}`);
    swarmManager.addTaskOutput(this.sessionId, this.taskId, message);
  }

  /**
   * Update task progress
   */
  protected updateProgress(progress: number, message?: string): void {
    if (message) {
      this.log(message);
    }
    swarmManager.updateTask(this.sessionId, this.taskId, { progress });
  }

  /**
   * Update task with custom data
   */
  protected updateTask(status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS', output?: any): void {
    const statusMap = {
      'COMPLETED': 'completed' as const,
      'FAILED': 'failed' as const,
      'IN_PROGRESS': 'in_progress' as const
    };

    swarmManager.updateTask(this.sessionId, this.taskId, {
      status: statusMap[status],
      output
    });
  }

  /**
   * Mark task as completed
   */
  protected complete(artifacts: string[] = []): void {
    swarmManager.updateTask(this.sessionId, this.taskId, {
      status: 'completed',
      artifacts
    });
  }

  /**
   * Mark task as failed
   */
  protected fail(reason: string): void {
    swarmManager.updateTask(this.sessionId, this.taskId, {
      status: 'failed',
      blockedReason: reason
    });
  }

  /**
   * Execute with error handling
   */
  async run(): Promise<void> {
    try {
      swarmManager.updateTask(this.sessionId, this.taskId, {
        status: 'in_progress'
      });

      await this.execute();
    } catch (error) {
      this.fail(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
