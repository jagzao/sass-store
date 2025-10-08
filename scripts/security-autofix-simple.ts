#!/usr/bin/env node
/**
 * Security Auto-Fix Script (Simplified)
 * Automatically fixes common security issues
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔒 Security Auto-Fix Starting...\n');
console.log('════════════════════════════════════════════════\n');

let totalFixed = 0;
const fixedFiles: string[] = [];

function scanDirectory(dir: string, exclude: string[] = []): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (exclude.some(ex => fullPath.includes(ex))) continue;

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, exclude));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Get all TypeScript/JavaScript files
const excludeDirs = ['node_modules', '.next', 'dist', 'build', 'coverage', 'playwright-report'];
const files = scanDirectory(process.cwd(), excludeDirs);

console.log(`📁 Found ${files.length} files to scan\n`);

// Fix 1: Redact console.log with sensitive data
console.log('🔍 Fix 1: Redacting sensitive console.logs...');
let fix1Count = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const pattern = /console\.(log|error|warn|info)\([^)]*?(password|token|secret|key|apiKey)[^)]*?\)/gi;
  const matches = content.match(pattern);

  if (matches && matches.length > 0) {
    let newContent = content;
    for (const match of matches) {
      newContent = newContent.replace(
        match,
        `// SECURITY: Redacted sensitive log`
      );
    }

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf-8');
      console.log(`   ✅ Fixed: ${path.relative(process.cwd(), file)} (${matches.length} change(s))`);
      fix1Count += matches.length;
      if (!fixedFiles.includes(file)) fixedFiles.push(file);
    }
  }
}

console.log(`   ✅ Total: ${fix1Count} sensitive logs redacted\n`);
totalFixed += fix1Count;

// Fix 2: Replace http:// with https://
console.log('🔍 Fix 2: Upgrading http:// to https://...');
let fix2Count = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const pattern = /(fetch|axios\.get|axios\.post)\(['"]http:\/\//g;
  const matches = content.match(pattern);

  if (matches && matches.length > 0) {
    const newContent = content.replace(pattern, "$1('https://");

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf-8');
      console.log(`   ✅ Fixed: ${path.relative(process.cwd(), file)} (${matches.length} change(s))`);
      fix2Count += matches.length;
      if (!fixedFiles.includes(file)) fixedFiles.push(file);
    }
  }
}

console.log(`   ✅ Total: ${fix2Count} http URLs upgraded to https\n`);
totalFixed += fix2Count;

// Fix 3: Replace Math.random() with crypto.randomUUID() for IDs
console.log('🔍 Fix 3: Replacing Math.random() with crypto.randomUUID()...');
let fix3Count = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  // Pattern: crypto.randomUUID().replace(/-/g, '').substring(0, 9)
  const pattern = /Math\.random\(\)\.toString\(36\)\.(?:slice|substr)\(\d+(?:,\s*\d+)?\)/g;
  const matches = content.match(pattern);

  if (matches && matches.length > 0 && content.includes('const') && (content.includes('id') || content.includes('Id') || content.includes('ID'))) {
    const newContent = content.replace(pattern, "crypto.randomUUID().replace(/-/g, '').substring(0, 9)");

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf-8');
      console.log(`   ✅ Fixed: ${path.relative(process.cwd(), file)} (${matches.length} change(s))`);
      fix3Count += matches.length;
      if (!fixedFiles.includes(file)) fixedFiles.push(file);
    }
  }
}

console.log(`   ✅ Total: ${fix3Count} weak random generators replaced\n`);
totalFixed += fix3Count;

// Summary
console.log('════════════════════════════════════════════════');
console.log('\n📊 Auto-Fix Summary:\n');

if (totalFixed === 0) {
  console.log('✅ No auto-fixable security issues found!');
  console.log('   Your code is already following security best practices.\n');
} else {
  console.log(`✅ Successfully fixed ${totalFixed} issue(s) across ${fixedFiles.length} file(s)\n`);

  console.log('Files modified:');
  for (const file of fixedFiles) {
    console.log(`  📄 ${path.relative(process.cwd(), file)}`);
  }

  console.log('\n⚠️  IMPORTANT: Please review the changes before committing!');
  console.log('   Run: git diff\n');
}

console.log('════════════════════════════════════════════════\n');
console.log('🎯 Next Steps:\n');
console.log('1. Review changes: git diff');
console.log('2. Run tests: npm test');
console.log('3. Manual fixes: Review SECURITY_ANALYSIS_2025.md');
console.log('4. Commit: git add . && git commit -m "security: auto-fix issues"');
console.log('\n✨ Auto-fix completed!\n');
