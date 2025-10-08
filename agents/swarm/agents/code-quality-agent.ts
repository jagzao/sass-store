/**
 * Code Quality Agent
 * Validates code standards and best practices
 */

import { BaseAgent } from './base-agent';
import { swarmManager } from '../swarm-manager';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface CodeStandard {
  name: string;
  rule: string;
  severity: 'error' | 'warning' | 'info';
  autoFix?: boolean;
}

interface QualityIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
}

export class CodeQualityAgent extends BaseAgent {
  private standards: CodeStandard[] = [
    {
      name: 'TypeScript Strict Mode',
      rule: 'typescript-strict',
      severity: 'error',
      autoFix: false
    },
    {
      name: 'No Console Logs',
      rule: 'no-console',
      severity: 'warning',
      autoFix: true
    },
    {
      name: 'Proper Error Handling',
      rule: 'error-handling',
      severity: 'error',
      autoFix: false
    },
    {
      name: 'Naming Conventions',
      rule: 'naming-convention',
      severity: 'warning',
      autoFix: false
    },
    {
      name: 'Code Complexity',
      rule: 'complexity',
      severity: 'warning',
      autoFix: false
    },
    {
      name: 'Documentation Required',
      rule: 'require-jsdoc',
      severity: 'info',
      autoFix: false
    }
  ];

  protected async execute(): Promise<void> {
    const session = swarmManager.loadSession(this.sessionId);
    if (!session) throw new Error('Session not found');

    this.updateProgress(10, 'Loading code standards...');

    // Load standards from AGENTS.md
    await this.loadStandards();

    this.updateProgress(30, 'Analyzing code quality...');

    // Get modified files from session
    const modifiedFiles = await this.getModifiedFiles(session);

    this.updateProgress(50, 'Running quality checks...');

    const issues: QualityIssue[] = [];

    // Run ESLint
    const eslintIssues = await this.runESLint(modifiedFiles);
    issues.push(...eslintIssues);

    // Run TypeScript compiler
    const tsIssues = await this.runTypeCheck(modifiedFiles);
    issues.push(...tsIssues);

    // Run custom quality checks
    const customIssues = await this.runCustomChecks(modifiedFiles);
    issues.push(...customIssues);

    this.updateProgress(70, 'Fixing auto-fixable issues...');

    // Auto-fix issues
    const fixedCount = await this.autoFixIssues(issues.filter(i => i.fixable));

    this.updateProgress(90, 'Generating quality report...');

    // Generate report
    const report = this.generateQualityReport(issues, fixedCount);

    this.updateProgress(100, 'Code quality validation completed');

    // Update task with results
    this.updateTask('COMPLETED', {
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      fixed: fixedCount,
      report
    });
  }

  private async loadStandards(): Promise<void> {
    const agentsFile = path.join(process.cwd(), 'AGENTS.md');

    if (fs.existsSync(agentsFile)) {
      const content = fs.readFileSync(agentsFile, 'utf-8');
      // Parse standards from AGENTS.md
      // TODO: Implement parsing logic
      this.log('Loaded code standards from AGENTS.md');
    }
  }

  private async getModifiedFiles(session: any): Promise<string[]> {
    // Get files from developer task output
    const devTask = session.tasks.find((t: any) => t.agent === 'DEVELOPER');

    if (devTask?.output?.files) {
      return devTask.output.files;
    }

    // Fallback: get all modified files from git
    try {
      const { stdout } = await execAsync('git diff --name-only HEAD');
      return stdout.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    } catch {
      return [];
    }
  }

  private async runESLint(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    try {
      const filesArg = files.join(' ');
      const { stdout } = await execAsync(`npx eslint ${filesArg} --format json`, {
        timeout: 60000
      });

      const results = JSON.parse(stdout);

      for (const result of results) {
        for (const message of result.messages) {
          issues.push({
            file: result.filePath,
            line: message.line,
            column: message.column,
            rule: message.ruleId,
            message: message.message,
            severity: message.severity === 2 ? 'error' : 'warning',
            fixable: message.fix !== undefined
          });
        }
      }
    } catch (error) {
      this.log(`ESLint error: ${error}`);
    }

    return issues;
  }

  private async runTypeCheck(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
        timeout: 60000
      });

      // Parse TypeScript errors
      const errorPattern = /(.+?)\((\d+),(\d+)\): error (.+?): (.+)/g;
      const output = stdout + stderr;
      let match;

      while ((match = errorPattern.exec(output)) !== null) {
        const [, file, line, column, code, message] = match;

        if (files.some(f => file.includes(f))) {
          issues.push({
            file,
            line: parseInt(line),
            column: parseInt(column),
            rule: code,
            message,
            severity: 'error',
            fixable: false
          });
        }
      }
    } catch (error) {
      this.log(`TypeScript check error: ${error}`);
    }

    return issues;
  }

  private async runCustomChecks(files: string[]): Promise<QualityIssue[]> {
    const issues: QualityIssue[] = [];

    for (const file of files) {
      if (!fs.existsSync(file)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // Check for console.log
      lines.forEach((line, index) => {
        if (line.includes('console.log') && !line.trim().startsWith('//')) {
          issues.push({
            file,
            line: index + 1,
            column: line.indexOf('console.log'),
            rule: 'no-console',
            message: 'Console.log found in production code',
            severity: 'warning',
            fixable: true
          });
        }
      });

      // Check for TODO comments
      lines.forEach((line, index) => {
        if (line.includes('TODO:')) {
          issues.push({
            file,
            line: index + 1,
            column: line.indexOf('TODO:'),
            rule: 'no-todo',
            message: 'TODO comment found',
            severity: 'info',
            fixable: false
          });
        }
      });

      // Check for proper JSDoc
      const functionPattern = /(export\s+)?(async\s+)?function\s+(\w+)/g;
      let match;

      while ((match = functionPattern.exec(content)) !== null) {
        const functionName = match[3];
        const lineIndex = content.substring(0, match.index).split('\n').length - 1;
        const previousLines = lines.slice(Math.max(0, lineIndex - 3), lineIndex);
        const hasJSDoc = previousLines.some(l => l.includes('/**'));

        if (!hasJSDoc && !functionName.startsWith('_')) {
          issues.push({
            file,
            line: lineIndex + 1,
            column: 0,
            rule: 'require-jsdoc',
            message: `Function '${functionName}' missing JSDoc documentation`,
            severity: 'info',
            fixable: false
          });
        }
      }
    }

    return issues;
  }

  private async autoFixIssues(issues: QualityIssue[]): Promise<number> {
    let fixedCount = 0;

    for (const issue of issues) {
      if (issue.rule === 'no-console') {
        await this.removeConsoleLogs(issue.file);
        fixedCount++;
      }
    }

    return fixedCount;
  }

  private async removeConsoleLogs(file: string): Promise<void> {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    const filteredLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('console.log') && !trimmed.includes('console.log(');
    });

    fs.writeFileSync(file, filteredLines.join('\n'));
    this.log(`Removed console.logs from ${path.basename(file)}`);
  }

  private generateQualityReport(issues: QualityIssue[], fixedCount: number): string {
    const errors = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    const info = issues.filter(i => i.severity === 'info');

    let report = `## Code Quality Report\n\n`;
    report += `**Total Issues:** ${issues.length}\n`;
    report += `- Errors: ${errors.length}\n`;
    report += `- Warnings: ${warnings.length}\n`;
    report += `- Info: ${info.length}\n`;
    report += `- Auto-fixed: ${fixedCount}\n\n`;

    if (errors.length > 0) {
      report += `### Errors\n`;
      errors.slice(0, 10).forEach(e => {
        report += `- ${path.basename(e.file)}:${e.line} - ${e.message}\n`;
      });
      report += '\n';
    }

    if (warnings.length > 0) {
      report += `### Warnings\n`;
      warnings.slice(0, 10).forEach(w => {
        report += `- ${path.basename(w.file)}:${w.line} - ${w.message}\n`;
      });
      report += '\n';
    }

    return report;
  }
}
