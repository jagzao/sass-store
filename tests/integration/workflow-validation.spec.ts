import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Workflow Reform Validation', () => {
  const projectRoot = process.cwd();

  describe('1. Lenguaje visual de consola', () => {
    it('should have logger with ANSI colors and logfmt', () => {
      const loggerPath = join(projectRoot, 'tools', 'logger.ts');
      expect(existsSync(loggerPath)).toBe(true);

      const content = readFileSync(loggerPath, 'utf8');

      // Check for ANSI color support
      expect(content).toContain('\\x1b[');
      expect(content).toContain('logfmt');
      expect(content).toContain('roleColors');
      expect(content).toContain('printStartBanner');
      expect(content).toContain('printEndBanner');
    });

    it('should have role-specific color mapping', () => {
      const loggerPath = join(projectRoot, 'tools', 'logger.ts');
      const content = readFileSync(loggerPath, 'utf8');

      // Check for specific role colors
      expect(content).toContain('UI');
      expect(content).toContain('API');
      expect(content).toContain('QA');
      expect(content).toContain('SEO');
      expect(content).toContain('A11Y');
    });
  });

  describe('2. Alertas NEED=HUMAN', () => {
    it('should have alert system with red banner and beep', () => {
      const alertsPath = join(projectRoot, 'tools', 'alerts.ts');
      expect(existsSync(alertsPath)).toBe(true);

      const content = readFileSync(alertsPath, 'utf8');

      // Check for alert features
      expect(content).toContain('NEED HUMAN INPUT');
      expect(content).toContain('\\x07'); // Beep character
      expect(content).toContain('needHuman');
      expect(content).toContain('createInstructionFile');
      expect(content).toContain('printRedBanner');
    });

    it('should have convenience alert functions', () => {
      const alertsPath = join(projectRoot, 'tools', 'alerts.ts');
      const content = readFileSync(alertsPath, 'utf8');

      expect(content).toContain('missingTestId');
      expect(content).toContain('missingConfig');
      expect(content).toContain('apiError');
    });
  });

  describe('3. Auto-continuación (resume)', () => {
    it('should have autoresume system', () => {
      const autoresumePath = join(projectRoot, 'tools', 'autoresume.ts');
      expect(existsSync(autoresumePath)).toBe(true);

      const content = readFileSync(autoresumePath, 'utf8');

      expect(content).toContain('AutoResume');
      expect(content).toContain('isInResumeWindow');
      expect(content).toContain('scheduleResume');
      expect(content).toContain('America/Mexico_City');
    });

    it('should have autoresume configuration', () => {
      const configPath = join(projectRoot, 'config', 'autoresume.json');
      expect(existsSync(configPath)).toBe(true);

      const config = JSON.parse(readFileSync(configPath, 'utf8'));

      expect(config.enabled).toBe(true);
      expect(config.timezone).toBe('America/Mexico_City');
      expect(Array.isArray(config.windows)).toBe(true);
      expect(config.maxRetries).toBe(2);
    });
  });

  describe('4. Estados en bundles/manifest', () => {
    it('should have bundle management system', () => {
      const bundlesPath = join(projectRoot, 'tools', 'bundles.ts');
      expect(existsSync(bundlesPath)).toBe(true);

      const content = readFileSync(bundlesPath, 'utf8');

      expect(content).toContain('BundleState');
      expect(content).toContain('WAITING_FOR_TOKENS');
      expect(content).toContain('RESUME_AT');
      expect(content).toContain('NEXT_CMD');
      expect(content).toContain('retries');
    });
  });

  describe('5. Auto-reparación (autofix)', () => {
    it('should have prime autofix command', () => {
      const primePath = join(projectRoot, 'commands', 'prime-autofix.md');
      expect(existsSync(primePath)).toBe(true);

      const content = readFileSync(primePath, 'utf8');

      expect(content).toContain('Prime Autofix');
      expect(content).toContain('failure-triager');
      expect(content).toContain('Orquestador');
    });

    it('should have failure triager subagent', () => {
      const triagerPath = join(projectRoot, 'agents', 'sub', 'failure-triager.md');
      expect(existsSync(triagerPath)).toBe(true);

      const content = readFileSync(triagerPath, 'utf8');

      expect(content).toContain('Failure Triager');
      expect(content).toContain('P0');
      expect(content).toContain('P1');
      expect(content).toContain('P2');
      expect(content).toContain('P3');
    });

    it('should have patcher subagents', () => {
      const patcherFrontend = join(projectRoot, 'agents', 'sub', 'patcher-frontend.md');
      const patcherBackend = join(projectRoot, 'agents', 'sub', 'patcher-backend.md');
      const patcherInfra = join(projectRoot, 'agents', 'sub', 'patcher-infra.md');

      expect(existsSync(patcherFrontend)).toBe(true);
      expect(existsSync(patcherBackend)).toBe(true);
      expect(existsSync(patcherInfra)).toBe(true);
    });
  });

  describe('6. Lanzamiento de tests automático dirigido por impacto', () => {
    it('should have test scripts in package.json', () => {
      const packagePath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      expect(packageJson.scripts['test:e2e:subset']).toBeDefined();
      expect(packageJson.scripts['test:integration']).toBeDefined();
      expect(packageJson.scripts['test:unit']).toBeDefined();
    });

    it('should have E2E subset tests', () => {
      const e2eSubsetPath = join(projectRoot, 'tests', 'e2e', 'subset', 'need-human.e2e.ts');
      expect(existsSync(e2eSubsetPath)).toBe(true);

      const content = readFileSync(e2eSubsetPath, 'utf8');

      expect(content).toContain('NEED=HUMAN E2E Validation');
      expect(content).toContain('data-testid');
      expect(content).toContain('wondernails');
      expect(content).toContain('fallback selectors');
    });
  });

  describe('7. Gobernanza de diffs/archivos, PRs guiados', () => {
    it('should have PR template', () => {
      const prTemplatePath = join(projectRoot, '.github', 'pull_request_template.md');
      expect(existsSync(prTemplatePath)).toBe(true);

      const content = readFileSync(prTemplatePath, 'utf8');

      expect(content).toContain('PLAN → DIFFS → TESTS → RIESGOS/NEXT');
      expect(content).toContain('Bundle ID');
      expect(content).toContain('Click Budget Compliance');
      expect(content).toContain('Tenant Coverage');
    });

    it('should have specialized prime commands', () => {
      const seoPath = join(projectRoot, 'commands', 'prime-seo.md');
      const a11yPath = join(projectRoot, 'commands', 'prime-a11y.md');
      const perfPath = join(projectRoot, 'commands', 'prime-perf.md');

      expect(existsSync(seoPath)).toBe(true);
      expect(existsSync(a11yPath)).toBe(true);
      expect(existsSync(perfPath)).toBe(true);
    });
  });

  describe('8. Alias de imports @/... en todo', () => {
    it('should have import path linting tests', () => {
      const lintPath = join(projectRoot, 'tests', 'integration', 'lint-paths.int.spec.ts');
      expect(existsSync(lintPath)).toBe(true);

      const content = readFileSync(lintPath, 'utf8');

      expect(content).toContain('Import Path Linting');
      expect(content).toContain('deep relative imports');
      expect(content).toContain('@/ aliases');
      expect(content).toContain('../../..');
    });

    it('should have lint imports script', () => {
      const packagePath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      expect(packageJson.scripts['lint:imports']).toBeDefined();
    });
  });

  describe('MCP Configurations', () => {
    it('should have MCP code-graph configuration', () => {
      const mcpCodeGraphPath = join(projectRoot, 'config', 'mcp-code-graph.json');
      expect(existsSync(mcpCodeGraphPath)).toBe(true);

      const config = JSON.parse(readFileSync(mcpCodeGraphPath, 'utf8'));

      expect(config.mcpServers['code-graph']).toBeDefined();
      expect(config.features.code_analysis.enabled).toBe(true);
      expect(config.agents['failure-triager']).toBeDefined();
    });

    it('should have MCP filesystem configuration', () => {
      const mcpFilesystemPath = join(projectRoot, 'config', 'mcp-filesystem.json');
      expect(existsSync(mcpFilesystemPath)).toBe(true);

      const config = JSON.parse(readFileSync(mcpFilesystemPath, 'utf8'));

      expect(config.mcpServers.filesystem).toBeDefined();
      expect(config.permissions.read.enabled).toBe(true);
      expect(config.workflow_integration.bundle_management.enabled).toBe(true);
    });

    it('should have MCP web-search configuration', () => {
      const mcpWebSearchPath = join(projectRoot, 'config', 'mcp-web-search.json');
      expect(existsSync(mcpWebSearchPath)).toBe(true);

      const config = JSON.parse(readFileSync(mcpWebSearchPath, 'utf8'));

      expect(config.mcpServers['web-search']).toBeDefined();
      expect(config.search_strategies.technical_documentation.enabled).toBe(true);
      expect(config.agents['failure-triager'].use_web_search).toBe(true);
    });
  });

  describe('Workflow Tools Integration', () => {
    it('should have tools index file', () => {
      const toolsIndexPath = join(projectRoot, 'tools', 'index.ts');
      expect(existsSync(toolsIndexPath)).toBe(true);

      const content = readFileSync(toolsIndexPath, 'utf8');

      expect(content).toContain('export');
      expect(content).toContain('Logger');
      expect(content).toContain('AlertSystem');
      expect(content).toContain('BundleManager');
    });

    it('should have workflow scripts in package.json', () => {
      const packagePath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      // Workflow management scripts
      expect(packageJson.scripts.autoresume).toBeDefined();
      expect(packageJson.scripts['workflow:status']).toBeDefined();
      expect(packageJson.scripts['workflow:cleanup']).toBeDefined();

      // Prime command scripts
      expect(packageJson.scripts['seo:analyze']).toBeDefined();
      expect(packageJson.scripts['a11y:audit']).toBeDefined();
      expect(packageJson.scripts['perf:analyze']).toBeDefined();
    });
  });
});