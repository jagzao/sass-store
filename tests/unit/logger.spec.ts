import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, log } from '../../tools/logger';

describe('Logger - Formatting and Colors', () => {
  let consoleSpy: any;
  let processStdoutSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processStdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Set environment for testing
    process.env.CLI_COLORS = '1';
    process.env.CLI_EMOJI = '1';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();
    delete process.env.CLI_COLORS;
    delete process.env.CLI_EMOJI;
  });

  it('should format logfmt correctly', () => {
    log.info('UI', 'planner', 'Iniciando composición', { case: 'compose' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('AGENT=UI TASK=planner CASE="compose" msg="Iniciando composición"')
    );
  });

  it('should include timestamp in HH:MM:SS format', () => {
    log.ok('QA', 'e2e', 'Test completed', { case: 'compra-rapida', duration: '8.1s' });

    const call = consoleSpy.mock.calls[0][0];
    expect(call).toMatch(/^\[\d{2}:\d{2}:\d{2}\]/);
  });

  it('should use role-specific colors', () => {
    log.info('UI', 'test', 'Frontend message');
    log.info('API', 'test', 'Backend message');
    log.info('QA', 'test', 'QA message');

    expect(consoleSpy).toHaveBeenCalledTimes(3);

    // Check that different ANSI color codes are used
    const calls = consoleSpy.mock.calls.map((call: any[]) => call[0]);
    expect(calls[0]).toContain('\x1b[35m'); // Magenta for UI
    expect(calls[1]).toContain('\x1b[32m'); // Green for API
    expect(calls[2]).toContain('\x1b[33m'); // Yellow for QA
  });

  it('should show emoji when enabled', () => {
    log.ok('QA', 'e2e', 'Success message');
    log.error('API', 'endpoint', 'Error message');

    const calls = consoleSpy.mock.calls.map((call: any[]) => call[0]);
    expect(calls[0]).toContain('✅');
    expect(calls[1]).toContain('❌');
  });

  it('should disable colors when CLI_COLORS=0', () => {
    process.env.CLI_COLORS = '0';
    const logger = new Logger();

    logger.info('UI', 'test', 'No colors message');

    const call = consoleSpy.mock.calls[0][0];
    expect(call).not.toContain('\x1b[');
  });

  it('should disable emoji when CLI_EMOJI=0', () => {
    process.env.CLI_EMOJI = '0';
    const logger = new Logger();

    logger.ok('QA', 'test', 'No emoji message');

    const call = consoleSpy.mock.calls[0][0];
    expect(call).not.toContain('✅');
  });

  it('should handle NEED=HUMAN alerts with beep', () => {
    log.needHuman('QA', 'e2e', 'Selector ambiguo', 'Add data-testid');

    // Check beep was sent
    expect(processStdoutSpy).toHaveBeenCalledWith('\x07');

    // Check red background color
    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain('NEED=HUMAN');
    expect(call).toContain('\x1b[41m'); // Red background
  });

  it('should print start banner correctly', () => {
    log.startBanner('UI', 'planner', 'abc123');

    const calls = consoleSpy.mock.calls.map((call: any[]) => call[0]);

    expect(calls).toEqual(
      expect.arrayContaining([
        expect.stringContaining('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'),
        expect.stringContaining('AGENT: UI TASK: planner RUN: #abc123'),
        expect.stringContaining('START:'),
        expect.stringContaining('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      ])
    );
  });

  it('should print end banner with artifacts path', () => {
    log.endBanner('UI', 'OK', '2:30', 'agents/outputs/20241001_ui/');

    const calls = consoleSpy.mock.calls.map((call: any[]) => call[0]);

    expect(calls).toEqual(
      expect.arrayContaining([
        expect.stringContaining('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'),
        expect.stringContaining('AGENT DONE: UI'),
        expect.stringContaining('STATUS: OK'),
        expect.stringContaining('DURATION: 2:30'),
        expect.stringContaining('ARTIFACTS: agents/outputs/20241001_ui/'),
        expect.stringContaining('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      ])
    );
  });

  it('should handle special characters in messages', () => {
    log.info('SEO', 'canonical', 'Falta rel=canonical', { url: '/t/zo-system' });

    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain('url="/t/zo-system"');
    expect(call).toContain('msg="Falta rel=canonical"');
  });

  it('should format duration fields consistently', () => {
    log.ok('QA', 'e2e', 'Test completed', { duration: '8.1s' });

    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain('duration=8.1s');
  });

  it('should handle multiple extra fields', () => {
    log.warn('API', 'database', 'Connection timeout', {
      host: 'localhost',
      port: 5432,
      timeout: '30s',
      retries: 3
    });

    const call = consoleSpy.mock.calls[0][0];
    expect(call).toContain('host=localhost');
    expect(call).toContain('port=5432');
    expect(call).toContain('timeout=30s');
    expect(call).toContain('retries=3');
  });
});