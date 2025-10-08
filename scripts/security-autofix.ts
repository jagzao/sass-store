#!/usr/bin/env node
/**
 * Security Auto-Fix Script
 * Automatically fixes common security issues found by Security Agent 2025
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Fix {
  name: string;
  description: string;
  pattern: RegExp;
  replacement: string | ((match: string, ...args: any[]) => string);
  filePattern: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const fixes: Fix[] = [
  {
    name: 'Replace Math.random() for security-critical values',
    description: 'Replace Math.random() with crypto.randomUUID() for IDs and tokens',
    pattern: /const\s+(\w+)\s*=\s*['"`](\w+)_\$\{Date\.now\(\)\}_\$\{Math\.random\(\)\.toString\(36\)\.slice\(2\)\}['"`]/g,
    replacement: "const $1 = `$2_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`",
    filePattern: '**/*.{ts,tsx,js,jsx}',
    severity: 'high'
  },
  {
    name: 'Redact sensitive data in console.log',
    description: 'Remove or redact console.log statements with passwords, tokens, keys',
    pattern: /console\.(log|error|warn|info)\([^)]*?(password|token|secret|key|apiKey)[^)]*?\)/gi,
    replacement: (match) => {
      return `// SECURITY: Redacted sensitive log - ${match.substring(0, 50)}...`;
    },
    filePattern: '**/*.{ts,tsx,js,jsx}',
    severity: 'medium'
  },
  {
    name: 'Replace http:// with https://',
    description: 'Upgrade insecure HTTP URLs to HTTPS',
    pattern: /(fetch|axios\.get|axios\.post)\(['"]http:\/\//g,
    replacement: "$1('https://",
    filePattern: '**/*.{ts,tsx,js,jsx}',
    severity: 'medium'
  },
  {
    name: 'Add httpOnly to cookie settings',
    description: 'Ensure cookies have httpOnly flag',
    pattern: /cookies\(\)\.set\(([^,]+),\s*([^,]+)\)/g,
    replacement: 'cookies().set($1, $2, { httpOnly: true, sameSite: "strict", secure: true })',
    filePattern: '**/*.{ts,tsx,js,jsx}',
    severity: 'high'
  }
];

interface FixResult {
  file: string;
  fixName: string;
  changes: number;
}

async function runAutoFix(): Promise<void> {
  console.log('🔒 Security Auto-Fix Starting...\n');
  console.log('════════════════════════════════════════════════\n');

  const results: FixResult[] = [];
  const excludePatterns = [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '**/*.d.ts',
    'coverage/**',
    'playwright-report/**',
    'test-results/**'
  ];

  for (const fix of fixes) {
    console.log(`\n🔍 Applying: ${fix.name}`);
    console.log(`   ${fix.description}`);
    console.log(`   Severity: ${fix.severity.toUpperCase()}`);
    console.log('   ─────────────────────────────────────────────');

    try {
      const files = await glob(fix.filePattern, {
        ignore: excludePatterns,
        absolute: true
      });

      let fixedInFix = 0;

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          let newContent = content;
          let changeCount = 0;

          // Apply the fix
          if (typeof fix.replacement === 'function') {
            const matches = content.match(fix.pattern);
            if (matches) {
              newContent = content.replace(fix.pattern, fix.replacement);
              changeCount = matches.length;
            }
          } else {
            const matches = content.match(fix.pattern);
            if (matches) {
              newContent = content.replace(fix.pattern, fix.replacement);
              changeCount = matches.length;
            }
          }

          if (content !== newContent && changeCount > 0) {
            fs.writeFileSync(file, newContent, 'utf-8');
            console.log(`   ✅ Fixed: ${path.relative(process.cwd(), file)} (${changeCount} change(s))`);

            results.push({
              file: path.relative(process.cwd(), file),
              fixName: fix.name,
              changes: changeCount
            });

            fixedInFix += changeCount;
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${file}:`, error);
        }
      }

      if (fixedInFix === 0) {
        console.log(`   ℹ️  No issues found for this fix`);
      } else {
        console.log(`   ✅ Total changes for this fix: ${fixedInFix}`);
      }

    } catch (error) {
      console.error(`   ❌ Error running fix "${fix.name}":`, error);
    }
  }

  // Summary
  console.log('\n════════════════════════════════════════════════');
  console.log('\n📊 Auto-Fix Summary:\n');

  if (results.length === 0) {
    console.log('✅ No security issues found that can be auto-fixed!');
    console.log('   Your code is already following security best practices.\n');
  } else {
    const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);
    const uniqueFiles = new Set(results.map(r => r.file)).size;

    console.log(`✅ Successfully fixed ${totalChanges} issue(s) across ${uniqueFiles} file(s)\n`);

    // Group by file
    const byFile = results.reduce((acc, r) => {
      if (!acc[r.file]) {
        acc[r.file] = [];
      }
      acc[r.file].push(r);
      return acc;
    }, {} as Record<string, FixResult[]>);

    console.log('Files modified:');
    for (const [file, fileResults] of Object.entries(byFile)) {
      const fileChanges = fileResults.reduce((sum, r) => sum + r.changes, 0);
      console.log(`  📄 ${file} (${fileChanges} change(s))`);
      for (const result of fileResults) {
        console.log(`     - ${result.fixName}`);
      }
    }

    console.log('\n⚠️  IMPORTANT: Please review the changes before committing!');
    console.log('   Run: git diff\n');
  }

  console.log('════════════════════════════════════════════════\n');
  console.log('🎯 Next Steps:\n');
  console.log('1. Review changes: git diff');
  console.log('2. Run tests: npm test');
  console.log('3. Run full security scan: npm run swarm:start "security scan"');
  console.log('4. Commit changes: git add . && git commit -m "security: auto-fix security issues"');
  console.log('\n✨ Auto-fix completed!\n');
}

// Execute
runAutoFix().catch(error => {
  console.error('❌ Auto-fix failed:', error);
  process.exit(1);
});
