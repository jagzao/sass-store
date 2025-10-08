/**
 * NEED=HUMAN alerts system
 * Creates red banners, beeps, and instruction files
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { logger } from './logger';

export interface AlertConfig {
  agent: string;
  task: string;
  reason: string;
  action: string;
  details?: string;
  routes?: string[];
  files?: string[];
  urgency?: 'low' | 'medium' | 'high';
}

export class AlertSystem {
  private alertsDir = './agents/alerts';

  constructor() {
    // Ensure alerts directory exists
    if (!existsSync(this.alertsDir)) {
      mkdirSync(this.alertsDir, { recursive: true });
    }
  }

  /**
   * Trigger NEED=HUMAN alert
   */
  needHuman(config: AlertConfig): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NEED-INPUT_${timestamp}_${config.agent}.md`;
    const filepath = join(this.alertsDir, filename);

    // Print red banner with beep
    this.printRedBanner(config);

    // Create instruction file
    this.createInstructionFile(filepath, config);

    // Log the alert
    logger.needHuman(config.agent, config.task, config.reason, config.action, {
      file: filepath,
      urgency: config.urgency || 'medium'
    });

    // Show file path
    console.log(`\n📄 Instructions written to: ${filepath}`);
    console.log(`⚠️  Please address the issue and press ENTER to continue\n`);

    return filepath;
  }

  /**
   * Print red banner with beep
   */
  private printRedBanner(config: AlertConfig): void {
    // ASCII bell character for beep
    process.stdout.write('\x07');

    const redBg = '\x1b[41m\x1b[37m';  // Red background, white text
    const reset = '\x1b[0m';
    const bright = '\x1b[1m';

    console.log(`\n${redBg}${bright}🔴🔴🔴 NEED HUMAN INPUT 🔴🔴🔴${reset}`);
    console.log(`${redBg}${bright}                                                    ${reset}`);
    console.log(`${redBg}${bright} AGENT: ${config.agent.padEnd(10)} TASK: ${config.task.padEnd(15)} ${reset}`);
    console.log(`${redBg}${bright}                                                    ${reset}`);
    console.log(`${redBg}${bright} REASON: ${config.reason.slice(0, 38).padEnd(38)} ${reset}`);
    console.log(`${redBg}${bright}                                                    ${reset}`);
    console.log(`${redBg}${bright} ACTION: ${config.action.slice(0, 38).padEnd(38)} ${reset}`);
    console.log(`${redBg}${bright}                                                    ${reset}`);
    console.log(`${redBg}${bright}🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴${reset}\n`);

    // Additional beep for urgency
    if (config.urgency === 'high') {
      setTimeout(() => process.stdout.write('\x07'), 500);
      setTimeout(() => process.stdout.write('\x07'), 1000);
    }
  }

  /**
   * Create instruction file with all details
   */
  private createInstructionFile(filepath: string, config: AlertConfig): void {
    const content = `# 🚨 NEED HUMAN INPUT

**Agent:** ${config.agent}
**Task:** ${config.task}
**Timestamp:** ${new Date().toISOString()}
**Urgency:** ${config.urgency || 'medium'}

## ❌ What's Wrong

${config.reason}

## ✅ What You Need To Do

${config.action}

${config.details ? `## 📋 Additional Details

${config.details}

` : ''}${config.routes ? `## 🛣️ Affected Routes

${config.routes.map(route => `- \`${route}\``).join('\n')}

` : ''}${config.files ? `## 📁 Files to Check/Modify

${config.files.map(file => `- \`${file}\``).join('\n')}

` : ''}## 🔧 Steps to Resolve

1. **Understand the issue:** Review the reason and details above
2. **Take action:** Follow the specific instructions in "What You Need To Do"
3. **Verify the fix:** Test the affected functionality
4. **Continue workflow:** Press ENTER in the terminal to resume

## 🆘 Need More Help?

If you're unsure how to proceed:

1. Check the project documentation in \`/docs/\`
2. Review similar implementations in the codebase
3. Look for related issues in \`/agents/alerts/\` directory
4. Consider asking for technical guidance

---

*This alert was generated automatically by the ${config.agent} agent during ${config.task} task.*
*File: \`${filepath}\`*
`;

    writeFileSync(filepath, content, 'utf8');
  }

  /**
   * Check if there are pending alerts
   */
  hasPendingAlerts(): boolean {
    if (!existsSync(this.alertsDir)) return false;

    const fs = require('fs');
    const files = fs.readdirSync(this.alertsDir);
    return files.some((file: string) => file.startsWith('NEED-INPUT_'));
  }

  /**
   * List all pending alerts
   */
  listPendingAlerts(): string[] {
    if (!existsSync(this.alertsDir)) return [];

    const fs = require('fs');
    const files = fs.readdirSync(this.alertsDir);
    return files
      .filter((file: string) => file.startsWith('NEED-INPUT_'))
      .map((file: string) => join(this.alertsDir, file));
  }

  /**
   * Clear resolved alerts
   */
  clearAlert(filename: string): void {
    const filepath = join(this.alertsDir, filename);
    if (existsSync(filepath)) {
      const fs = require('fs');
      fs.unlinkSync(filepath);
      console.log(`✅ Cleared alert: ${filename}`);
    }
  }

  /**
   * Wait for human input (blocking)
   */
  async waitForHuman(): Promise<void> {
    return new Promise((resolve) => {
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }

  /**
   * Quick alert for missing data-testid
   */
  missingTestId(agent: string, element: string, selector: string): string {
    return this.needHuman({
      agent,
      task: 'e2e-testing',
      reason: `Missing data-testid attribute on critical element: ${element}`,
      action: `Add data-testid="${element.toLowerCase().replace(/\s+/g, '-')}" to the element`,
      details: `The E2E test failed because it couldn't find a stable selector for "${element}".

Current selector attempted: \`${selector}\`

This element needs a data-testid attribute for reliable testing.`,
      files: ['Check the component file where this element is rendered'],
      urgency: 'medium'
    });
  }

  /**
   * Quick alert for missing configuration
   */
  missingConfig(agent: string, configKey: string, filePath: string): string {
    return this.needHuman({
      agent,
      task: 'configuration',
      reason: `Missing required configuration: ${configKey}`,
      action: `Add the ${configKey} configuration to ${filePath}`,
      details: `The system requires this configuration to function properly. Please add it according to the project standards.`,
      files: [filePath],
      urgency: 'high'
    });
  }

  /**
   * Quick alert for API errors
   */
  apiError(agent: string, endpoint: string, error: string): string {
    return this.needHuman({
      agent,
      task: 'api-integration',
      reason: `API error on ${endpoint}: ${error}`,
      action: `Check API endpoint implementation and fix the error`,
      details: `The API request failed. This could be due to:
- Missing endpoint implementation
- Incorrect request format
- Server configuration issues
- Database connectivity problems`,
      routes: [endpoint],
      urgency: 'high'
    });
  }

  /**
   * Quick alert for dependency issues
   */
  dependencyIssue(agent: string, dependency: string, issue: string): string {
    return this.needHuman({
      agent,
      task: 'dependency-management',
      reason: `Dependency issue with ${dependency}: ${issue}`,
      action: `Install or fix the dependency: npm install ${dependency}`,
      details: `The required dependency is missing or misconfigured. Please install and configure it properly.`,
      files: ['package.json', 'package-lock.json'],
      urgency: 'medium'
    });
  }
}

// Global alert system instance
export const alerts = new AlertSystem();

// Convenience functions
export const needHuman = (config: AlertConfig) => alerts.needHuman(config);
export const missingTestId = (agent: string, element: string, selector: string) =>
  alerts.missingTestId(agent, element, selector);
export const missingConfig = (agent: string, configKey: string, filePath: string) =>
  alerts.missingConfig(agent, configKey, filePath);
export const apiError = (agent: string, endpoint: string, error: string) =>
  alerts.apiError(agent, endpoint, error);
export const dependencyIssue = (agent: string, dependency: string, issue: string) =>
  alerts.dependencyIssue(agent, dependency, issue);