#!/usr/bin/env node

/**
 * Automated Test Setup Script
 *
 * This script ensures all dependencies for E2E tests are properly configured:
 * - Playwright browsers installed
 * - .env.test file exists
 * - Test credentials configured
 *
 * Usage: node scripts/setup-tests.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(`  ${message}`, colors.bright);
  log(`${'='.repeat(60)}\n`, colors.bright);
}

async function checkPlaywrightBrowsers() {
  header('Checking Playwright Browsers');

  try {
    // Check if Chromium is installed
    const playwrightPath = path.join(process.env.USERPROFILE || process.env.HOME, 'AppData', 'Local', 'ms-playwright');

    if (!fs.existsSync(playwrightPath)) {
      warning('Playwright browsers not found');
      info('Installing Playwright browsers (Chromium only for performance)...');

      try {
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        success('Playwright browsers installed successfully');
      } catch (err) {
        error('Failed to install Playwright browsers');
        error('Please run manually: npx playwright install chromium');
        return false;
      }
    } else {
      success('Playwright browsers are installed');
    }

    return true;
  } catch (err) {
    warning('Could not verify Playwright installation');
    info('Run: npx playwright install chromium');
    return false;
  }
}

function checkEnvTestFile() {
  header('Checking Test Environment Configuration');

  const envTestPath = path.join(process.cwd(), '.env.test');
  const envTestExamplePath = path.join(process.cwd(), '.env.test.example');

  if (!fs.existsSync(envTestPath)) {
    warning('.env.test file not found');

    if (fs.existsSync(envTestExamplePath)) {
      info('Creating .env.test from .env.test.example...');
      fs.copyFileSync(envTestExamplePath, envTestPath);
      success('.env.test file created');
      warning('⚠️  IMPORTANT: Edit .env.test with your test database credentials!');
      warning('   DO NOT use production database for tests!');
      return false;
    } else {
      error('.env.test.example not found');
      return false;
    }
  } else {
    success('.env.test file exists');

    // Verify it has required variables
    const envContent = fs.readFileSync(envTestPath, 'utf-8');
    const requiredVars = ['TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD', 'TEST_TENANT_SLUG'];
    const missingVars = requiredVars.filter(v => !envContent.includes(v));

    if (missingVars.length > 0) {
      warning(`Missing variables in .env.test: ${missingVars.join(', ')}`);
      return false;
    }

    success('All required test environment variables are configured');
    return true;
  }
}

function checkGitignore() {
  header('Checking .gitignore Configuration');

  const gitignorePath = path.join(process.cwd(), '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    warning('.gitignore not found');
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');

  if (!gitignoreContent.includes('.env.test')) {
    warning('.env.test is NOT in .gitignore');
    error('⚠️  SECURITY RISK: .env.test should be in .gitignore!');
    info('Add this line to .gitignore: .env.test');
    return false;
  }

  success('.env.test is properly ignored by git');
  return true;
}

function printNextSteps(allChecksPassed) {
  header('Next Steps');

  if (!allChecksPassed) {
    log('\n⚠️  Some checks failed. Please fix the issues above.\n', colors.yellow);
  } else {
    success('All checks passed! You\'re ready to run tests.\n');
  }

  info('To run tests:');
  log('  npm run test:e2e              # Run all E2E tests', colors.cyan);
  log('  npm run test:e2e:ui           # Run with Playwright UI', colors.cyan);
  log('  npx playwright test --headed  # Run in headed mode', colors.cyan);
  log('  npx playwright test --debug   # Run with debugger\n', colors.cyan);

  info('Important reminders:');
  log('  1. Use a SEPARATE test database (never use production!)', colors.yellow);
  log('  2. Ensure test user exists: admin@wondernails.com', colors.yellow);
  log('  3. Keep .env.test in .gitignore (never commit credentials)', colors.yellow);
  log('  4. Run dev server before tests: npm run dev\n', colors.yellow);
}

async function main() {
  log('\n🚀 E2E Test Setup Script\n', colors.bright + colors.blue);

  const checks = [
    checkPlaywrightBrowsers(),
    checkEnvTestFile(),
    checkGitignore(),
  ];

  const results = await Promise.all(checks);
  const allChecksPassed = results.every(r => r === true);

  printNextSteps(allChecksPassed);

  process.exit(allChecksPassed ? 0 : 1);
}

main().catch((err) => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
