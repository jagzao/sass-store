/**
 * Swarm Agents Configuration
 * Defines each agent's role, capabilities and workflow
 */

import { AgentConfig, SwarmConfig } from './types';

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    role: 'ORCHESTRATOR',
    name: 'Orchestrator',
    emoji: '🎯',
    description: 'Coordina el flujo de trabajo entre agentes',
    capabilities: [
      'Task delegation',
      'Progress tracking',
      'Conflict resolution',
      'Resource management'
    ],
    dependencies: []
  },
  {
    role: 'PM',
    name: 'Product Manager',
    emoji: '📋',
    description: 'Valida requisitos de negocio y genera PRD',
    capabilities: [
      'User story generation',
      'Requirements definition',
      'Business rules validation',
      'Effort estimation',
      'PRD generation'
    ],
    dependencies: ['ORCHESTRATOR']
  },
  {
    role: 'ARCHITECT',
    name: 'Architect',
    emoji: '🏗️',
    description: 'Valida arquitectura y estructura del proyecto',
    capabilities: [
      'Code structure validation',
      'Dependency analysis',
      'Pattern enforcement',
      'Best practices review'
    ],
    dependencies: ['PM']
  },
  {
    role: 'DEVELOPER',
    name: 'Developer',
    emoji: '💻',
    description: 'Implementa código y features',
    capabilities: [
      'Code generation',
      'API implementation',
      'Component creation',
      'Database migrations'
    ],
    dependencies: ['ARCHITECT']
  },
  {
    role: 'QA',
    name: 'QA Agent',
    emoji: '🧪',
    description: 'Crea y actualiza tests automáticamente',
    capabilities: [
      'Test generation',
      'Test execution',
      'Coverage validation',
      'Test report generation'
    ],
    dependencies: ['DEVELOPER']
  },
  {
    role: 'CODE_QUALITY',
    name: 'Code Quality Agent',
    emoji: '📋',
    description: 'Valida estándares de código',
    capabilities: [
      'ESLint validation',
      'TypeScript checking',
      'Complexity analysis',
      'Auto-fix issues'
    ],
    dependencies: ['QA']
  },
  {
    role: 'SECURITY',
    name: 'Security Agent',
    emoji: '🔒',
    description: 'Escanea vulnerabilidades de seguridad',
    capabilities: [
      'OWASP Top 10 scan',
      'Dependency audit',
      'RLS validation',
      'Secrets detection'
    ],
    dependencies: ['CODE_QUALITY']
  },
  {
    role: 'TESTER',
    name: 'Tester',
    emoji: '✅',
    description: 'Validación final e integración',
    capabilities: [
      'Final validation',
      'Integration testing',
      'Smoke tests',
      'Approval'
    ],
    dependencies: ['SECURITY']
  },
  {
    role: 'REVIEWER',
    name: 'Reviewer',
    emoji: '👀',
    description: 'Code review y mejoras',
    capabilities: [
      'Code review',
      'Documentation check',
      'Standards compliance',
      'Refactoring suggestions'
    ],
    dependencies: ['TESTER']
  },
  {
    role: 'DEPLOYER',
    name: 'Deployer',
    emoji: '🚀',
    description: 'Preparación y deployment',
    capabilities: [
      'Build verification',
      'Bundle optimization',
      'Deployment preparation',
      'Rollback strategy'
    ],
    dependencies: ['REVIEWER']
  }
];

export const SWARM_CONFIG: SwarmConfig = {
  agents: AGENT_CONFIGS,
  workflow: {
    sequential: false, // Allow parallel execution where possible
    parallelizable: [
      // Stage 1: Product Management (DISABLED for now)
      // ['PM'],
      // Stage 1: Architecture
      ['ARCHITECT'],
      // Stage 2: Development
      ['DEVELOPER'],
      // Stage 3: QA - Test creation
      ['QA'],
      // Stage 4: Code Quality
      ['CODE_QUALITY'],
      // Stage 5: Security
      ['SECURITY'],
      // Stage 6: Final Testing
      ['TESTER'],
      // Stage 7: Review
      ['REVIEWER'],
      // Stage 8: Deploy
      ['DEPLOYER']
    ],
    criticalPath: [
      'ORCHESTRATOR',
      // 'PM', // DISABLED
      'ARCHITECT',
      'DEVELOPER',
      'QA',
      'CODE_QUALITY',
      'SECURITY',
      'TESTER',
      'REVIEWER',
      'DEPLOYER'
    ]
  }
};

export function getAgentConfig(role: string): AgentConfig | undefined {
  return AGENT_CONFIGS.find(a => a.role === role);
}
