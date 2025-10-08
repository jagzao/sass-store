/**
 * Developer Agent
 * Implements features and generates code
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { BaseAgent } from './base-agent';
import { swarmManager } from '../swarm-manager';

export class DeveloperAgent extends BaseAgent {
  async execute(): Promise<void> {
    this.log('💻 Iniciando implementación...');
    this.updateProgress(10);

    const session = swarmManager.loadSession(this.sessionId);
    if (!session) throw new Error('Session not found');

    // Get feature name from session
    const featureName = session.featureName;

    this.log(`📋 Feature: ${featureName}`);
    this.updateProgress(20);

    // Create directories
    await this.createDirectories(featureName);
    this.updateProgress(50);

    // Generate files
    await this.generateFiles(featureName);
    this.updateProgress(80);

    this.log('✓ Implementación completada');
    this.complete(['feature-implementation.md']);
  }

  private async createDirectories(featureName: string): Promise<void> {
    this.log('📁 Creando estructura de archivos...');

    const dirs = [
      `apps/web/features/${featureName}`,
      `packages/core/${featureName}-service`
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        this.log(`   ✓ Creado: ${dir}`);
      }
    }
  }

  private async generateFiles(featureName: string): Promise<void> {
    this.log('📝 Generando archivos...');

    // Example file generation
    const files = [
      {
        path: `apps/web/features/${featureName}/index.tsx`,
        content: `// ${featureName} Feature Component\nexport default function ${featureName}() {\n  return <div>${featureName}</div>;\n}\n`
      },
      {
        path: `packages/core/${featureName}-service/index.ts`,
        content: `// ${featureName} Service\nexport class ${featureName}Service {\n  // Implementation\n}\n`
      }
    ];

    for (const file of files) {
      try {
        writeFileSync(file.path, file.content, 'utf8');
        this.log(`   ✓ ${file.path}`);
      } catch (error) {
        this.log(`   ✗ Error: ${file.path}`);
      }
    }

    this.log(`✓ ${files.length} archivos generados`);
  }
}
