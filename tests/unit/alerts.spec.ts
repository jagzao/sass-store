import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { AlertSystem, alerts } from '../../tools/alerts';

describe('Alerts - NEED=HUMAN System', () => {
  let consoleSpy: any;
  let processStdoutSpy: any;
  let testAlertsDir: string;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processStdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Create test alerts directory
    testAlertsDir = './test-alerts';
    if (existsSync(testAlertsDir)) {
      rmSync(testAlertsDir, { recursive: true, force: true });
    }

    // Mock the alerts directory for testing
    const alertSystem = new AlertSystem();
    (alertSystem as any).alertsDir = testAlertsDir;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();

    // Cleanup test directory
    if (existsSync(testAlertsDir)) {
      rmSync(testAlertsDir, { recursive: true, force: true });
    }
  });

  it('should create red banner with beep', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    testAlerts.needHuman({
      agent: 'QA',
      task: 'e2e-testing',
      reason: 'Missing data-testid',
      action: 'Add data-testid attribute'
    });

    // Check beep was sent
    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');

    // Check red banner content
    const calls = consoleSpy.mock.calls.map((call: any[]) => call[0]);
    const bannerCalls = calls.filter(call => call.includes('🔴🔴🔴 NEED HUMAN INPUT 🔴🔴🔴'));

    expect(bannerCalls.length).toBeGreaterThan(0);
    expect(calls.some(call => call.includes('AGENT: QA'))).toBe(true);
    expect(calls.some(call => call.includes('REASON: Missing data-testid'))).toBe(true);
    expect(calls.some(call => call.includes('ACTION: Add data-testid attribute'))).toBe(true);
  });

  it('should create instruction file with correct format', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.needHuman({
      agent: 'QA',
      task: 'e2e-testing',
      reason: 'Missing data-testid on booking button',
      action: 'Add data-testid="book-appointment" to the button element',
      details: 'The E2E test failed because it could not find a stable selector',
      routes: ['/t/wondernails/booking'],
      files: ['apps/web/components/BookingButton.tsx'],
      urgency: 'high'
    });

    expect(existsSync(filepath)).toBe(true);

    const content = readFileSync(filepath, 'utf8');

    expect(content).toContain('# 🚨 NEED HUMAN INPUT');
    expect(content).toContain('**Agent:** QA');
    expect(content).toContain('**Task:** e2e-testing');
    expect(content).toContain('**Urgency:** high');
    expect(content).toContain('## ❌ What\'s Wrong');
    expect(content).toContain('Missing data-testid on booking button');
    expect(content).toContain('## ✅ What You Need To Do');
    expect(content).toContain('Add data-testid="book-appointment"');
    expect(content).toContain('## 📋 Additional Details');
    expect(content).toContain('## 🛣️ Affected Routes');
    expect(content).toContain('- `/t/wondernails/booking`');
    expect(content).toContain('## 📁 Files to Check/Modify');
    expect(content).toContain('- `apps/web/components/BookingButton.tsx`');
  });

  it('should show file path after creating alert', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    testAlerts.needHuman({
      agent: 'TEST',
      task: 'validation',
      reason: 'Test reason',
      action: 'Test action'
    });

    const calls = consoleSpy.mock.calls.map((call: any[]) => call[0]);
    expect(calls.some(call => call.includes('📄 Instructions written to:'))).toBe(true);
    expect(calls.some(call => call.includes('⚠️  Please address the issue and press ENTER'))).toBe(true);
  });

  it('should handle multiple beeps for high urgency', async () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    testAlerts.needHuman({
      agent: 'API',
      task: 'critical-failure',
      reason: 'Database connection lost',
      action: 'Restore database connection',
      urgency: 'high'
    });

    // Initial beep
    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');

    // Wait for additional beeps (they happen with setTimeout)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should have beeps for high urgency (initial + additional beeps)
    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');
    expect(processStdoutSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('should use convenience functions correctly', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    // Test missingTestId convenience function
    const filepath = testAlerts.missingTestId('QA', 'booking button', 'button.booking-btn');

    expect(existsSync(filepath)).toBe(true);

    const content = readFileSync(filepath, 'utf8');
    expect(content).toContain('Missing data-testid attribute on critical element: booking button');
    expect(content).toContain('Add data-testid="booking-button"');
    expect(content).toContain('Current selector attempted: `button.booking-btn`');
  });

  it('should handle missing config alerts', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.missingConfig('BACKEND', 'DATABASE_URL', '.env.local');

    expect(existsSync(filepath)).toBe(true);

    const content = readFileSync(filepath, 'utf8');
    expect(content).toContain('Missing required configuration: DATABASE_URL');
    expect(content).toContain('Add the DATABASE_URL configuration to .env.local');
    expect(content).toContain('**Urgency:** high');
  });

  it('should handle API error alerts', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
    testAlerts.alertsDir = testAlertsDir;

    const filepath = testAlerts.apiError('API', '/api/v1/products', '500 Internal Server Error');

    expect(existsSync(filepath)).toBe(true);

    const content = readFileSync(filepath, 'utf8');
    expect(content).toContain('API error on /api/v1/products: 500 Internal Server Error');
    expect(content).toContain('Check API endpoint implementation');
    expect(content).toContain('- `/api/v1/products`');
  });

  it('should detect pending alerts', () => {
    if (!existsSync(testAlertsDir)) {
      mkdirSync(testAlertsDir, { recursive: true });
    }

    const testAlerts = new (AlertSystem as any)();
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

    const testAlerts = new (AlertSystem as any)();
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