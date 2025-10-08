/**
 * Interactive Agent Base
 * Uses Claude Code session (you!) instead of API calls
 */

import { BaseAgent } from './base-agent';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export abstract class InteractiveAgent extends BaseAgent {
  protected promptsDir = './agents/swarm/prompts';

  /**
   * Generate prompt file for human/Claude to execute
   */
  protected async requestHumanExecution(
    promptFile: string,
    instructions: string,
    context: any
  ): Promise<void> {
    const promptPath = join(this.promptsDir, promptFile);

    const prompt = {
      agent: this.role,
      sessionId: this.sessionId,
      taskId: this.taskId,
      instructions,
      context,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    writeFileSync(promptPath, JSON.stringify(prompt, null, 2), 'utf8');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🤖 ${this.role} necesita tu ayuda!`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📄 Archivo de prompt creado: ${promptPath}`);
    console.log(`\n📋 Instrucciones:`);
    console.log(instructions);
    console.log(`\n💡 Contexto:`);
    console.log(JSON.stringify(context, null, 2));
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n⏸️  Swarm pausado. Ejecuta las instrucciones y luego:`);
    console.log(`   npm run swarm:continue ${this.sessionId} ${this.taskId}`);
    console.log(`${'='.repeat(80)}\n`);

    // Pause execution - will be resumed manually
    throw new Error('WAITING_FOR_HUMAN');
  }

  /**
   * Check if task was completed by human
   */
  protected checkHumanCompletion(promptFile: string): boolean {
    const promptPath = join(this.promptsDir, promptFile);

    if (!existsSync(promptPath)) return false;

    const prompt = JSON.parse(readFileSync(promptPath, 'utf8'));
    return prompt.status === 'completed';
  }
}
