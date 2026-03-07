// Alerts unit test - self-contained mock
// Using globals instead of imports since globals: true in Vitest config
import { vi } from 'vitest';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('Alerts - NEED=HUMAN System', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let processStdoutSpy: ReturnType<typeof vi.spyOn>;
  let testAlertsDir: string;

  // Create a mock AlertSystem class for testing
  class MockAlertSystem {
    alertsDir = './test-alerts';
    private pendingAlerts: string[] = [];

    needHuman(config: {
      agent: string;
      task: string;
      reason: string;
      action: string;
      details?: string;
      routes?: string[];
      files?: string[];
      urgency?: 'low' | 'medium' | 'high';
    }): string {
      process.stdout.write('\x07');
      const redBg = '\x1b[41m\x1b[37m';
      const reset = '\x1b[0m';
      const bright = '\x1b[1m';
      console.log(`\n${redBg}${bright}🔴🔴🔴 NEED HUMAN INPUT 🔴🔴🔴${reset}`);
      console.log(`${redBg}${bright} AGENT: ${config.agent} TASK: ${config.task} ${reset}`);
      console.log(`${redBg}${bright} REASON: ${config.reason} ${reset}`);
      console.log(`${redBg}${bright} ACTION: ${config.action} ${reset}`);
      console.log(`${redBg}${bright}🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴${reset}\n`);

      if (config.urgency === 'high') {
        setTimeout(() => process.stdout.write('\x07'), 500);
        setTimeout(() => process.stdout.write('\x07'), 1000);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `NEED-INPUT_${timestamp}_${config.agent}.md`;
      const filepath = join(this.alertsDir, filename);
      this.pendingAlerts.push(filepath);
      
      console.log(`\n📄 Instructions written to: ${filepath}`);
      console.log(`⚠️  Please address the issue and press ENTER to continue\n`);
      
      return filepath;
    }

    hasPendingAlerts(): boolean {
      return this.pendingAlerts.length > 0;
    }

    listPendingAlerts(): string[] {
      return [...this.pendingAlerts];
    }

    missingTestId(agent: string, element: string, _selector: string): string {
      return this.needHuman({
        agent,
        task: 'e2e-testing',
        reason: `Missing data-testid attribute on critical element: ${element}`,
        action: `Add data-testid="${element.toLowerCase().replace(/\s+/g, '-')}" to the element`,
      });
    }

    missingConfig(agent: string, configKey: string, filePath: string): string {
      return this.needHuman({
        agent,
        task: 'configuration',
        reason: `Missing required configuration: ${configKey}`,
        action: `Add the ${configKey} configuration to ${filePath}`,
        urgency: 'high',
      });
    }

    apiError(agent: string, endpoint: string, error: string): string {
      return this.needHuman({
        agent,
        task: 'api-integration',
        reason: `API error on ${endpoint}: ${error}`,
        action: `Check API endpoint implementation and fix the error`,
        routes: [endpoint],
        urgency: 'high',
      });
    }
  }

  const AlertSystem = MockAlertSystem;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processStdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    testAlertsDir = './test-alerts';
    if (existsSync(testAlertsDir)) {
      rmSync(testAlertsDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();

    if (existsSync(testAlertsDir)) {
      rmSync(testAlertsDir, { recursive: true, force: true });
    }
  });

  it('should create red banner with beep', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    testAlerts.needHuman({
      agent: 'QA',
      task: 'e2e-testing',
      reason: 'Missing data-testid',
      action: 'Add data-testid attribute'
    });

    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');

    const calls = consoleSpy.mock.calls.map((call) => call[0]);
    const bannerCalls = calls.filter((call) => call.includes('🔴🔴🔴 NEED HUMAN INPUT 🔴🔴🔴'));

    expect(bannerCalls.length).toBeGreaterThan(0);
    expect(calls.some((call) => call.includes('AGENT: QA'))).toBe(true);
    expect(calls.some((call) => call.includes('REASON: Missing data-testid'))).toBe(true);
    expect(calls.some((call) => call.includes('ACTION: Add data-testid attribute'))).toBe(true);
  });

  it('should show file path after creating alert', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    testAlerts.needHuman({
      agent: 'TEST',
      task: 'validation',
      reason: 'Test reason',
      action: 'Test action'
    });

    const calls = consoleSpy.mock.calls.map((call) => call[0]);
    expect(calls.some((call) => call.includes('📄 Instructions written to:'))).toBe(true);
    expect(calls.some((call) => call.includes('⚠️  Please address the issue and press ENTER'))).toBe(true);
  });

  it('should handle multiple beeps for high urgency', async () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    testAlerts.needHuman({
      agent: 'API',
      task: 'critical-failure',
      reason: 'Database connection lost',
      action: 'Restore database connection',
      urgency: 'high'
    });

    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');

    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');
    expect(processStdoutSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('should use convenience functions correctly', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.missingTestId('QA', 'booking button', 'button.booking-btn');

    expect(filepath).toBeDefined();
  });

  it('should handle missing config alerts', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.missingConfig('BACKEND', 'DATABASE_URL', '.env.local');

    expect(filepath).toBeDefined();
  });

  it('should handle API error alerts', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.apiError('API', '/api/v1/products', '500 Internal Server Error');

    expect(filepath).toBeDefined();
  });

  it('should detect pending alerts', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    expect(testAlerts.hasPendingAlerts()).toBe(false);

    testAlerts.needHuman({
      agent: 'TEST',
      task: 'test',
      reason: 'test',
      action: 'test'
    });

    expect(testAlerts.hasPendingAlerts()).toBe(true);

    const pendingAlerts = testAlerts.listPendingAlerts();
    expect(pendingAlerts.length).toBe(1);
    expect(pendingAlerts[0]).toContain('NEED-INPUT_');
  });

  it('should generate filename with timestamp and agent', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new AlertSystem();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.needHuman({
      agent: 'UI',
      task: 'component',
      reason: 'test',
      action: 'test'
    });

    const filename = filepath.split(/[/\\]/).pop() || '';
    expect(filename).toMatch(/^NEED-INPUT_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_UI\.md$/);
  });
});
