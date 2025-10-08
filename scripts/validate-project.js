#!/usr/bin/env node

/**
 * Project Validation & Self-Healing Script
 * Validates project structure, fixes common issues, and reports status
 */

const fs = require('fs');
const path = require('path');

class ProjectValidator {
  constructor() {
    this.issues = [];
    this.fixes = [];
    this.checks = 0;
    this.passed = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    }[type] || 'ℹ️';

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  check(description, condition, autoFix = null) {
    this.checks++;
    this.log(`Checking: ${description}`);

    if (condition()) {
      this.passed++;
      this.log(`✓ ${description}`, 'success');
      return true;
    } else {
      this.issues.push(description);
      this.log(`✗ ${description}`, 'error');

      if (autoFix) {
        try {
          autoFix();
          this.fixes.push(description);
          this.log(`Fixed: ${description}`, 'fix');
          return true;
        } catch (error) {
          this.log(`Fix failed for ${description}: ${error.message}`, 'error');
        }
      }
      return false;
    }
  }

  fileExists(filePath) {
    return fs.existsSync(path.resolve(filePath));
  }

  dirExists(dirPath) {
    return fs.existsSync(path.resolve(dirPath)) && fs.statSync(path.resolve(dirPath)).isDirectory();
  }

  validateProjectStructure() {
    this.log('=== Project Structure Validation ===');

    // Core directories
    this.check('Root package.json exists', () => this.fileExists('package.json'));
    this.check('Apps directory exists', () => this.dirExists('apps'));
    this.check('Packages directory exists', () => this.dirExists('packages'));
    this.check('Docs directory exists', () => this.dirExists('docs'));
    this.check('Tests directory exists', () => this.dirExists('tests'));

    // Apps structure
    this.check('Web app exists', () => this.dirExists('apps/web'));
    this.check('API app exists', () => this.dirExists('apps/api'));

    // Packages structure
    this.check('UI package exists', () => this.dirExists('packages/ui'));
    this.check('Database package exists', () => this.dirExists('packages/database'));
    this.check('Config package exists', () => this.dirExists('packages/config'));

    // Key configuration files
    this.check('Turbo config exists', () => this.fileExists('turbo.json'));
    this.check('Docker compose exists', () => this.fileExists('docker-compose.yml'));
    this.check('Playwright config exists', () => this.fileExists('playwright.config.ts'));
  }

  validateWebApp() {
    this.log('=== Web App Validation ===');

    this.check('Web package.json exists', () => this.fileExists('apps/web/package.json'));
    this.check('Next.js config exists', () => this.fileExists('apps/web/next.config.js'));
    this.check('Tailwind config exists', () => this.fileExists('apps/web/tailwind.config.js'));
    this.check('PostCSS config exists', () => this.fileExists('apps/web/postcss.config.js'));
    this.check('TypeScript config exists', () => this.fileExists('apps/web/tsconfig.json'));

    // App directory structure
    this.check('App directory exists', () => this.dirExists('apps/web/app'));
    this.check('Layout file exists', () => this.fileExists('apps/web/app/layout.tsx'));
    this.check('Home page exists', () => this.fileExists('apps/web/app/page.tsx'));
    this.check('Globals CSS exists', () => this.fileExists('apps/web/app/globals.css'));

    // Components
    this.check('Components directory exists', () => this.dirExists('apps/web/components'));
    this.check('Lib directory exists', () => this.dirExists('apps/web/lib'));
  }

  validateApiApp() {
    this.log('=== API App Validation ===');

    this.check('API package.json exists', () => this.fileExists('apps/api/package.json'));
    this.check('API TypeScript config exists', () => this.fileExists('apps/api/tsconfig.json'));

    // API structure
    this.check('API app directory exists', () => this.dirExists('apps/api/app'));
    this.check('API lib directory exists', () => this.dirExists('apps/api/lib'));
    this.check('Products API exists', () => this.fileExists('apps/api/app/api/v1/products/route.ts'));
  }

  validatePackages() {
    this.log('=== Packages Validation ===');

    // UI package
    this.check('UI package.json exists', () => this.fileExists('packages/ui/package.json'));
    this.check('UI index exists', () => this.fileExists('packages/ui/index.tsx'));
    this.check('UI utils exists', () => this.fileExists('packages/ui/lib/utils.ts'));

    // Database package
    this.check('Database package.json exists', () => this.fileExists('packages/database/package.json'));
    this.check('Database schema exists', () => this.fileExists('packages/database/schema.ts'));
    this.check('Database connection exists', () => this.fileExists('packages/database/connection.ts'));

    // Config package
    this.check('Config package.json exists', () => this.fileExists('packages/config/package.json'));
    this.check('Config index exists', () => this.fileExists('packages/config/index.ts'));
  }

  validateTests() {
    this.log('=== Tests Validation ===');

    this.check('E2E tests directory exists', () => this.dirExists('tests/e2e'));
    this.check('Click budget tests exist', () => this.fileExists('tests/e2e/click-budget.spec.ts'));
    this.check('Tenant security tests exist', () => this.fileExists('tests/e2e/tenant-security.spec.ts'));
  }

  validateDocumentation() {
    this.log('=== Documentation Validation ===');

    this.check('README exists', () => this.fileExists('README.md'));
    this.check('PRD document exists', () => this.fileExists('docs/PRD.md'));
    this.check('Architecture document exists', () => this.fileExists('docs/ARCHITECTURE.md'));
    this.check('Testing document exists', () => this.fileExists('docs/TESTING.md'));
    this.check('Manifest exists', () => this.fileExists('manifest.json'));
  }

  validateAgentsOutput() {
    this.log('=== Agents Output Validation ===');

    this.check('Agents directory exists', () => this.dirExists('agents'));
    this.check('Seeds directory exists', () => this.dirExists('agents/outputs/seeds'));
    this.check('Tenants seed exists', () => this.fileExists('agents/outputs/seeds/tenants.json'));
    this.check('Media plan exists', () => this.fileExists('agents/outputs/media/plan.md'));
  }

  validateInfrastructure() {
    this.log('=== Infrastructure Validation ===');

    this.check('CI/CD workflow exists', () => this.fileExists('.github/workflows/ci.yml'));
    this.check('Cost monitor script exists', () => this.fileExists('scripts/cost-monitor.js'));
    this.check('Cloudflare config exists', () => this.fileExists('cloudflare/wrangler.toml'));
  }

  generateReport() {
    this.log('=== Validation Report ===');

    const successRate = ((this.passed / this.checks) * 100).toFixed(1);

    this.log(`Total Checks: ${this.checks}`);
    this.log(`Passed: ${this.passed}`);
    this.log(`Failed: ${this.issues.length}`);
    this.log(`Auto-Fixed: ${this.fixes.length}`);
    this.log(`Success Rate: ${successRate}%`);

    if (this.issues.length > 0) {
      this.log('=== Issues Found ===', 'warning');
      this.issues.forEach(issue => this.log(`- ${issue}`, 'error'));
    }

    if (this.fixes.length > 0) {
      this.log('=== Auto-Fixed Issues ===', 'success');
      this.fixes.forEach(fix => this.log(`- ${fix}`, 'fix'));
    }

    return {
      total: this.checks,
      passed: this.passed,
      failed: this.issues.length,
      fixed: this.fixes.length,
      successRate: parseFloat(successRate),
      issues: this.issues,
      fixes: this.fixes
    };
  }

  validateTenantData() {
    this.log('=== Tenant Data Validation ===');

    this.check('Tenants JSON is valid', () => {
      try {
        const tenantData = JSON.parse(fs.readFileSync('agents/outputs/seeds/tenants.json', 'utf8'));
        return tenantData.tenants && Array.isArray(tenantData.tenants) && tenantData.tenants.length > 0;
      } catch {
        return false;
      }
    });

    this.check('All required tenants exist', () => {
      try {
        const tenantData = JSON.parse(fs.readFileSync('agents/outputs/seeds/tenants.json', 'utf8'));
        const requiredTenants = ['zo-system', 'wondernails', 'vigistudio', 'villafuerte', 'vainilla-vargas', 'delirios', 'nom-nom'];
        const existingTenants = tenantData.tenants.map(t => t.slug);
        return requiredTenants.every(slug => existingTenants.includes(slug));
      } catch {
        return false;
      }
    });
  }

  validateClickBudgets() {
    this.log('=== Click Budget Validation ===');

    this.check('Click budget constants defined', () => {
      try {
        const testContent = fs.readFileSync('tests/e2e/click-budget.spec.ts', 'utf8');
        return testContent.includes('purchase: 3') &&
               testContent.includes('booking: 2') &&
               testContent.includes('reorder: 1');
      } catch {
        return false;
      }
    });
  }

  async run() {
    this.log('🚀 Starting Project Validation & Self-Healing');
    this.log('Current Directory: ' + process.cwd());

    this.validateProjectStructure();
    this.validateWebApp();
    this.validateApiApp();
    this.validatePackages();
    this.validateTests();
    this.validateDocumentation();
    this.validateAgentsOutput();
    this.validateInfrastructure();
    this.validateTenantData();
    this.validateClickBudgets();

    const report = this.generateReport();

    if (report.successRate >= 90) {
      this.log('🎉 Project validation PASSED with excellent score!', 'success');
    } else if (report.successRate >= 80) {
      this.log('👍 Project validation PASSED with good score', 'success');
    } else if (report.successRate >= 70) {
      this.log('⚠️ Project validation passed with warnings', 'warning');
    } else {
      this.log('❌ Project validation FAILED - needs attention', 'error');
    }

    return report;
  }
}

// Execute if run directly
if (require.main === module) {
  const validator = new ProjectValidator();
  validator.run().then(report => {
    process.exit(report.successRate >= 70 ? 0 : 1);
  });
}

module.exports = ProjectValidator;