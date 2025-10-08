/**
 * Swarm Manager
 * Manages swarm sessions and agent coordination
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { SwarmSession, AgentTask, AgentRole, TaskStatus } from './types';
import { SWARM_CONFIG, getAgentConfig } from './agents-config';

export class SwarmManager {
  private sessionsDir = './agents/swarm/sessions';
  private activeSessionPath = './agents/swarm/active-session.json';

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  private generateId(): string {
    return `swarm_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
  }

  /**
   * Create new swarm session
   */
  createSession(featureName: string): SwarmSession {
    const sessionId = this.generateId();
    const now = new Date().toISOString();

    // Create tasks for each agent in workflow
    const tasks: AgentTask[] = [];
    let taskOrder = 0;

    for (const stage of SWARM_CONFIG.workflow.parallelizable) {
      for (const agentRole of stage) {
        const agentConfig = getAgentConfig(agentRole);
        if (!agentConfig) continue;

        tasks.push({
          id: `task_${taskOrder++}`,
          agent: agentRole,
          description: agentConfig.description,
          status: taskOrder === 1 ? 'pending' : 'pending',
          progress: 0,
          dependencies: taskOrder > 1 ? [`task_${taskOrder - 2}`] : []
        });
      }
    }

    const session: SwarmSession = {
      id: sessionId,
      featureName,
      status: 'active',
      progress: 0,
      currentAgent: 'ORCHESTRATOR',
      tasks,
      createdAt: now,
      updatedAt: now
    };

    this.saveSession(session);
    this.setActiveSession(sessionId);

    return session;
  }

  /**
   * Save session to disk
   */
  private saveSession(session: SwarmSession): void {
    const sessionPath = join(this.sessionsDir, `${session.id}.json`);
    session.updatedAt = new Date().toISOString();
    writeFileSync(sessionPath, JSON.stringify(session, null, 2), 'utf8');
  }

  /**
   * Load session from disk
   */
  loadSession(sessionId: string): SwarmSession | null {
    const sessionPath = join(this.sessionsDir, `${sessionId}.json`);
    if (!existsSync(sessionPath)) return null;

    try {
      const content = readFileSync(sessionPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Set active session
   */
  private setActiveSession(sessionId: string): void {
    writeFileSync(this.activeSessionPath, JSON.stringify({ sessionId }, null, 2), 'utf8');
  }

  /**
   * Get active session
   */
  getActiveSession(): SwarmSession | null {
    if (!existsSync(this.activeSessionPath)) return null;

    try {
      const content = readFileSync(this.activeSessionPath, 'utf8');
      const { sessionId } = JSON.parse(content);
      return this.loadSession(sessionId);
    } catch {
      return null;
    }
  }

  /**
   * Update task status
   */
  updateTask(
    sessionId: string,
    taskId: string,
    updates: Partial<AgentTask>
  ): void {
    const session = this.loadSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const task = session.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    Object.assign(task, updates);

    if (updates.status === 'in_progress' && !task.startedAt) {
      task.startedAt = new Date().toISOString();
      session.currentAgent = task.agent;
    }

    if (updates.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date().toISOString();
      task.progress = 100;
    }

    // Update overall progress
    const completedTasks = session.tasks.filter(t => t.status === 'completed').length;
    session.progress = Math.round((completedTasks / session.tasks.length) * 100);

    // Check if all tasks are done
    if (completedTasks === session.tasks.length) {
      session.status = 'completed';
    }

    this.saveSession(session);
  }

  /**
   * Add output to task
   */
  addTaskOutput(sessionId: string, taskId: string, output: string): void {
    const session = this.loadSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const task = session.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);

    if (!task.output) task.output = [];
    task.output.push(output);

    this.saveSession(session);
  }

  /**
   * Get next pending task
   */
  getNextTask(sessionId: string): AgentTask | null {
    const session = this.loadSession(sessionId);
    if (!session) return null;

    // Find first pending task whose dependencies are met
    for (const task of session.tasks) {
      if (task.status !== 'pending') continue;

      // Check if all dependencies are completed
      const dependenciesMet = task.dependencies?.every(depId => {
        const depTask = session.tasks.find(t => t.id === depId);
        return depTask?.status === 'completed';
      }) ?? true;

      if (dependenciesMet) return task;
    }

    return null;
  }

  /**
   * Pause session
   */
  pauseSession(sessionId: string, reason?: string): void {
    const session = this.loadSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'paused';

    // Mark current task as blocked
    const currentTask = session.tasks.find(t => t.status === 'in_progress');
    if (currentTask) {
      currentTask.status = 'blocked';
      currentTask.blockedReason = reason || 'Session paused';
    }

    this.saveSession(session);
  }

  /**
   * Resume session
   */
  resumeSession(sessionId: string): void {
    const session = this.loadSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    session.status = 'active';

    // Unblock tasks
    session.tasks
      .filter(t => t.status === 'blocked')
      .forEach(t => {
        t.status = 'pending';
        delete t.blockedReason;
      });

    this.saveSession(session);
  }
}

export const swarmManager = new SwarmManager();
