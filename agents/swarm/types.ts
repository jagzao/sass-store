/**
 * Swarm Agent System Types
 * Multi-agent orchestration for collaborative development
 */

export type AgentRole =
  | 'ORCHESTRATOR'
  | 'ARCHITECT'
  | 'DEVELOPER'
  | 'TESTER'
  | 'QA'
  | 'REVIEWER'
  | 'DEPLOYER';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface AgentTask {
  id: string;
  agent: AgentRole;
  description: string;
  status: TaskStatus;
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  blockedReason?: string;
  output?: string[];
  artifacts?: string[];
  dependencies?: string[]; // task IDs this depends on
}

export interface SwarmSession {
  id: string;
  featureName: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number; // 0-100
  currentAgent?: AgentRole;
  tasks: AgentTask[];
  createdAt: string;
  updatedAt: string;
  bundleId?: string; // Link to bundle system
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  emoji: string;
  description: string;
  capabilities: string[];
  dependencies: AgentRole[];
}

export interface SwarmConfig {
  agents: AgentConfig[];
  workflow: {
    sequential: boolean;
    parallelizable: AgentRole[][];
    criticalPath: AgentRole[];
  };
}
