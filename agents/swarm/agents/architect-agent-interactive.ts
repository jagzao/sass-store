/**
 * Interactive Architect Agent
 * Delegates to Claude Code user for architecture validation
 */

import { InteractiveAgent } from './interactive-agent';
import { swarmManager } from '../swarm-manager';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export class ArchitectAgentInteractive extends InteractiveAgent {
  async execute(): Promise<void> {
    this.log('🏗️  Iniciando validación de arquitectura...');
    this.updateProgress(10);

    const session = swarmManager.loadSession(this.sessionId);
    if (!session) throw new Error('Session not found');

    const outputPath = `agents/swarm/outputs/architect-report-${this.sessionId}.md`;

    // Check if already completed
    if (existsSync(outputPath)) {
      this.log('✓ Reporte de arquitectura encontrado');
      await this.processReport(outputPath);
      return;
    }

    // Request human execution
    const instructions = `
🏗️ ARCHITECT AGENT - Validación de Arquitectura

Feature: ${session.featureName}

TAREAS:
1. Revisar estructura de carpetas de apps/web y apps/api
2. Validar que no haya imports circulares
3. Verificar naming conventions
4. Crear reporte en: ${outputPath}

TEMPLATE del reporte:
- ✅ Validaciones exitosas
- ⚠️ Warnings encontrados
- 💡 Sugerencias de mejora
- 📊 Métricas básicas

Cuando termines, ejecuta:
npm run swarm:continue ${this.sessionId} ${this.taskId}
`;

    await this.requestHumanExecution(
      `architect-${this.sessionId}.json`,
      instructions,
      {
        featureName: session.featureName,
        outputPath,
        requiredDirs: ['apps/web', 'apps/api', 'packages', 'tests']
      }
    );
  }

  private async processReport(reportPath: string): Promise<void> {
    this.log('📄 Procesando reporte de arquitectura...');

    const report = readFileSync(reportPath, 'utf8');

    // Extract key metrics from report
    const hasWarnings = report.includes('⚠️');
    const hasCriticalIssues = report.toLowerCase().includes('crítico');

    if (hasCriticalIssues) {
      this.log('❌ Violaciones críticas encontradas');
      this.fail('Critical architecture violations found');
      return;
    }

    if (hasWarnings) {
      this.log('⚠️  Warnings encontrados (revisar reporte)');
    }

    this.log('✓ Arquitectura validada exitosamente');
    this.updateProgress(100);
    this.complete([reportPath]);
  }
}
