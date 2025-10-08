/**
 * PM (Product Manager) Agent
 * Validates business requirements, user stories, and feature scope
 */

import { BaseAgent } from './base-agent';
import { swarmManager } from '../swarm-manager';
import * as fs from 'fs';
import * as path from 'path';

interface Requirement {
  id: string;
  type: 'functional' | 'non-functional' | 'technical';
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  description: string;
  acceptanceCriteria: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
}

interface UserStory {
  id: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria: string[];
  priority: number;
  estimate: string;
}

export class PMAgent extends BaseAgent {
  protected async execute(): Promise<void> {
    const session = swarmManager.loadSession(this.sessionId);
    if (!session) throw new Error('Session not found');

    this.updateProgress(10, 'Analyzing feature request...');

    // Extract feature name and analyze it
    const featureName = session.featureName;

    this.updateProgress(20, 'Generating user stories...');

    // Generate user stories from feature name
    const userStories = this.generateUserStories(featureName);

    this.updateProgress(40, 'Defining requirements...');

    // Define functional and non-functional requirements
    const requirements = this.defineRequirements(featureName);

    this.updateProgress(60, 'Validating business rules...');

    // Validate against business rules
    const businessValidation = this.validateBusinessRules(featureName, requirements);

    this.updateProgress(70, 'Checking for dependencies...');

    // Check for feature dependencies
    const dependencies = await this.checkDependencies(featureName);

    this.updateProgress(80, 'Estimating effort...');

    // Estimate development effort
    const estimate = this.estimateEffort(requirements, dependencies);

    this.updateProgress(90, 'Generating PRD...');

    // Generate Product Requirements Document
    const prd = this.generatePRD(featureName, userStories, requirements, estimate);

    this.updateProgress(100, 'PM validation completed');

    // Update task with results
    this.updateTask('COMPLETED', {
      userStories,
      requirements,
      businessValidation,
      dependencies,
      estimate,
      prd
    });

    // Save PRD to file
    this.savePRD(featureName, prd);
  }

  private generateUserStories(featureName: string): UserStory[] {
    const stories: UserStory[] = [];

    // Analyze feature name and generate relevant user stories
    const lower = featureName.toLowerCase();

    // Example patterns
    if (lower.includes('carrito') || lower.includes('cart')) {
      stories.push({
        id: 'US-001',
        title: 'Agregar producto al carrito',
        asA: 'Cliente',
        iWant: 'agregar productos al carrito',
        soThat: 'pueda comprar múltiples items en una sola transacción',
        acceptanceCriteria: [
          'El botón "Agregar al carrito" es visible',
          'Se puede seleccionar cantidad',
          'El producto se agrega al estado del carrito',
          'Se muestra confirmación visual'
        ],
        priority: 1,
        estimate: '3 pts'
      });

      stories.push({
        id: 'US-002',
        title: 'Ver carrito de compras',
        asA: 'Cliente',
        iWant: 'ver todos los productos en mi carrito',
        soThat: 'pueda revisar mi pedido antes de pagar',
        acceptanceCriteria: [
          'Se muestran todos los productos agregados',
          'Se muestra precio unitario y total',
          'Se puede modificar cantidad',
          'Se puede eliminar productos'
        ],
        priority: 1,
        estimate: '5 pts'
      });
    }

    if (lower.includes('registro') || lower.includes('register') || lower.includes('usuario')) {
      stories.push({
        id: 'US-003',
        title: 'Registro de usuario',
        asA: 'Visitante',
        iWant: 'crear una cuenta',
        soThat: 'pueda guardar mi información y hacer pedidos',
        acceptanceCriteria: [
          'Formulario con nombre, email, contraseña',
          'Validación de campos en tiempo real',
          'Email único',
          'Contraseña segura (mínimo 6 caracteres)',
          'Mensaje de éxito/error'
        ],
        priority: 1,
        estimate: '5 pts'
      });
    }

    if (lower.includes('tenant') || lower.includes('multi')) {
      stories.push({
        id: 'US-004',
        title: 'Aislamiento de datos por tenant',
        asA: 'Administrador de sistema',
        iWant: 'que cada tenant tenga sus datos aislados',
        soThat: 'se garantice la privacidad y seguridad',
        acceptanceCriteria: [
          'RLS policies implementadas',
          'Queries filtran por tenantId',
          'No hay cross-tenant data leakage',
          'Tests de aislamiento pasan'
        ],
        priority: 1,
        estimate: '8 pts'
      });
    }

    // Generic user story if no specific pattern matches
    if (stories.length === 0) {
      stories.push({
        id: 'US-GEN',
        title: featureName,
        asA: 'Usuario',
        iWant: `usar la funcionalidad: ${featureName}`,
        soThat: 'pueda completar mi tarea',
        acceptanceCriteria: [
          'La funcionalidad está implementada',
          'La UI es intuitiva',
          'Los tests pasan',
          'La documentación está actualizada'
        ],
        priority: 2,
        estimate: '5 pts'
      });
    }

    return stories;
  }

  private defineRequirements(featureName: string): Requirement[] {
    const requirements: Requirement[] = [];

    // Functional requirements
    requirements.push({
      id: 'FR-001',
      type: 'functional',
      priority: 'must-have',
      description: `Implementar ${featureName}`,
      acceptanceCriteria: [
        'Funcionalidad core implementada',
        'UI/UX cumple con estándares',
        'Integración con backend completada'
      ],
      estimatedComplexity: 'medium'
    });

    // Non-functional requirements
    requirements.push({
      id: 'NFR-001',
      type: 'non-functional',
      priority: 'must-have',
      description: 'Performance y optimización',
      acceptanceCriteria: [
        'Tiempo de carga < 2s',
        'Bundle size < 200KB',
        'Lighthouse score > 90'
      ],
      estimatedComplexity: 'low'
    });

    requirements.push({
      id: 'NFR-002',
      type: 'non-functional',
      priority: 'must-have',
      description: 'Seguridad',
      acceptanceCriteria: [
        'Validación de inputs',
        'Sanitización de datos',
        'CSRF protection',
        'No vulnerabilidades OWASP Top 10'
      ],
      estimatedComplexity: 'medium'
    });

    requirements.push({
      id: 'NFR-003',
      type: 'non-functional',
      priority: 'should-have',
      description: 'Accesibilidad',
      acceptanceCriteria: [
        'WCAG 2.1 AA compliance',
        'Keyboard navigation',
        'Screen reader support'
      ],
      estimatedComplexity: 'low'
    });

    // Technical requirements
    requirements.push({
      id: 'TR-001',
      type: 'technical',
      priority: 'must-have',
      description: 'Testing coverage',
      acceptanceCriteria: [
        'Unit tests > 80%',
        'E2E tests for critical paths',
        'Integration tests for APIs'
      ],
      estimatedComplexity: 'medium'
    });

    return requirements;
  }

  private validateBusinessRules(featureName: string, requirements: Requirement[]): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for must-have requirements
    const mustHaves = requirements.filter(r => r.priority === 'must-have');
    if (mustHaves.length === 0) {
      issues.push('No critical requirements defined');
    }

    // Check for security requirements
    const securityReqs = requirements.filter(r =>
      r.description.toLowerCase().includes('seguridad') ||
      r.description.toLowerCase().includes('security')
    );
    if (securityReqs.length === 0) {
      issues.push('Missing security requirements');
      recommendations.push('Add security validation requirements');
    }

    // Check for performance requirements
    const perfReqs = requirements.filter(r =>
      r.description.toLowerCase().includes('performance') ||
      r.description.toLowerCase().includes('optimización')
    );
    if (perfReqs.length === 0) {
      recommendations.push('Consider adding performance requirements');
    }

    // Validate feature name
    if (featureName.length > 100) {
      issues.push('Feature name too long - should be concise');
    }

    // Check for tenant isolation (multitenant platform)
    const lower = featureName.toLowerCase();
    if (!lower.includes('tenant') && !lower.includes('isolation')) {
      recommendations.push('Consider tenant isolation requirements for multitenant features');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  private async checkDependencies(featureName: string): Promise<string[]> {
    const dependencies: string[] = [];

    // Check for database dependencies
    if (featureName.toLowerCase().includes('carrito') ||
        featureName.toLowerCase().includes('cart')) {
      dependencies.push('localStorage or session storage');
      dependencies.push('Product API');
      dependencies.push('Checkout flow');
    }

    // Check for authentication dependencies
    if (featureName.toLowerCase().includes('usuario') ||
        featureName.toLowerCase().includes('registro')) {
      dependencies.push('Authentication system');
      dependencies.push('Database users table');
      dependencies.push('Email service (verification)');
    }

    // Check for UI dependencies
    dependencies.push('UI component library');
    dependencies.push('Design system');

    return dependencies;
  }

  private estimateEffort(requirements: Requirement[], dependencies: string[]): {
    storyPoints: number;
    hours: number;
    complexity: string;
    risks: string[];
  } {
    let points = 0;

    // Calculate based on requirements complexity
    requirements.forEach(req => {
      switch (req.estimatedComplexity) {
        case 'low': points += 2; break;
        case 'medium': points += 5; break;
        case 'high': points += 8; break;
      }
    });

    // Add points for dependencies
    points += dependencies.length * 1;

    // Calculate hours (1 point = 2-3 hours average)
    const hours = points * 2.5;

    // Determine complexity
    let complexity = 'low';
    if (points > 20) complexity = 'high';
    else if (points > 10) complexity = 'medium';

    // Identify risks
    const risks: string[] = [];
    if (dependencies.length > 5) {
      risks.push('High number of dependencies may cause delays');
    }
    if (points > 30) {
      risks.push('Large scope - consider breaking into smaller features');
    }

    return { storyPoints: points, hours, complexity, risks };
  }

  private generatePRD(
    featureName: string,
    userStories: UserStory[],
    requirements: Requirement[],
    estimate: any
  ): string {
    let prd = `# Product Requirements Document\n\n`;
    prd += `## Feature: ${featureName}\n\n`;
    prd += `**Date:** ${new Date().toLocaleDateString()}\n`;
    prd += `**Status:** Planning\n`;
    prd += `**Complexity:** ${estimate.complexity}\n`;
    prd += `**Estimate:** ${estimate.storyPoints} points (~${estimate.hours} hours)\n\n`;

    prd += `## Executive Summary\n\n`;
    prd += `This document outlines the requirements and specifications for: ${featureName}\n\n`;

    prd += `## User Stories\n\n`;
    userStories.forEach(story => {
      prd += `### ${story.id}: ${story.title}\n`;
      prd += `**As a** ${story.asA}\n`;
      prd += `**I want** ${story.iWant}\n`;
      prd += `**So that** ${story.soThat}\n\n`;
      prd += `**Acceptance Criteria:**\n`;
      story.acceptanceCriteria.forEach(criteria => {
        prd += `- ${criteria}\n`;
      });
      prd += `\n**Priority:** ${story.priority} | **Estimate:** ${story.estimate}\n\n`;
    });

    prd += `## Requirements\n\n`;

    const functionalReqs = requirements.filter(r => r.type === 'functional');
    if (functionalReqs.length > 0) {
      prd += `### Functional Requirements\n\n`;
      functionalReqs.forEach(req => {
        prd += `**${req.id}** [${req.priority}] - ${req.description}\n`;
        req.acceptanceCriteria.forEach(criteria => {
          prd += `  - ${criteria}\n`;
        });
        prd += `\n`;
      });
    }

    const nonFunctionalReqs = requirements.filter(r => r.type === 'non-functional');
    if (nonFunctionalReqs.length > 0) {
      prd += `### Non-Functional Requirements\n\n`;
      nonFunctionalReqs.forEach(req => {
        prd += `**${req.id}** [${req.priority}] - ${req.description}\n`;
        req.acceptanceCriteria.forEach(criteria => {
          prd += `  - ${criteria}\n`;
        });
        prd += `\n`;
      });
    }

    const technicalReqs = requirements.filter(r => r.type === 'technical');
    if (technicalReqs.length > 0) {
      prd += `### Technical Requirements\n\n`;
      technicalReqs.forEach(req => {
        prd += `**${req.id}** [${req.priority}] - ${req.description}\n`;
        req.acceptanceCriteria.forEach(criteria => {
          prd += `  - ${criteria}\n`;
        });
        prd += `\n`;
      });
    }

    if (estimate.risks.length > 0) {
      prd += `## Risks & Mitigation\n\n`;
      estimate.risks.forEach(risk => {
        prd += `- ⚠️ ${risk}\n`;
      });
      prd += `\n`;
    }

    prd += `## Success Metrics\n\n`;
    prd += `- All acceptance criteria met\n`;
    prd += `- Code quality checks pass\n`;
    prd += `- Security scan passes\n`;
    prd += `- Test coverage > 80%\n`;
    prd += `- User feedback positive\n\n`;

    prd += `---\n`;
    prd += `*Auto-generated by PM Agent*\n`;

    return prd;
  }

  private savePRD(featureName: string, prd: string): void {
    const outputDir = path.join(process.cwd(), 'docs', 'prd');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const slug = featureName.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
    const filename = `${slug}-${Date.now()}.md`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, prd);
    this.log(`PRD saved to: ${filepath}`);
  }
}
