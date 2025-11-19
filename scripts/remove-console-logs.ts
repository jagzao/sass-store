/**
 * Script to remove or replace console.log statements with proper logging
 * This ensures production code doesn't have console.log statements
 */

import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

const DIRECTORIES_TO_SCAN = [
  "apps/web/app",
  "apps/web/lib",
  "apps/web/components",
  "apps/api/app",
  "apps/api/lib",
  "packages/*/src",
];

const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/*.test.ts",
  "**/*.spec.ts",
];

interface ConsoleLogMatch {
  file: string;
  line: number;
  content: string;
}

async function findConsoleLogs(): Promise<ConsoleLogMatch[]> {
  const matches: ConsoleLogMatch[] = [];

  for (const dir of DIRECTORIES_TO_SCAN) {
    const pattern = path.join(process.cwd(), dir, "**/*.{ts,tsx,js,jsx}");
    const files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS,
    });

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Match console.log, console.warn, console.error, console.debug
        if (/console\.(log|warn|error|debug|info)/.test(line)) {
          matches.push({
            file: path.relative(process.cwd(), file),
            line: index + 1,
            content: line.trim(),
          });
        }
      });
    }
  }

  return matches;
}

async function removeConsoleLogs(dryRun: boolean = true): Promise<void> {
  console.log("🔍 Scanning for console.log statements...\n");

  const matches = await findConsoleLogs();

  if (matches.length === 0) {
    console.log("✅ No console.log statements found!");
    return;
  }

  console.log(`Found ${matches.length} console statements:\n`);

  // Group by file
  const byFile = matches.reduce(
    (acc, match) => {
      if (!acc[match.file]) {
        acc[match.file] = [];
      }
      acc[match.file].push(match);
      return acc;
    },
    {} as Record<string, ConsoleLogMatch[]>,
  );

  // Display results
  Object.entries(byFile).forEach(([file, fileMatches]) => {
    console.log(`\n📄 ${file} (${fileMatches.length} occurrences)`);
    fileMatches.forEach((match) => {
      console.log(`   Line ${match.line}: ${match.content}`);
    });
  });

  if (dryRun) {
    console.log("\n\n⚠️  DRY RUN MODE - No changes made");
    console.log("Run with --fix to remove console statements");
  } else {
    console.log("\n\n🔧 Removing console statements...");

    for (const [file, fileMatches] of Object.entries(byFile)) {
      const fullPath = path.join(process.cwd(), file);
      const content = fs.readFileSync(fullPath, "utf-8");

      // Remove console statements (entire line)
      const lines = content.split("\n");
      const linesToRemove = new Set(fileMatches.map((m) => m.line - 1));

      const newLines = lines.filter((_, index) => !linesToRemove.has(index));
      const newContent = newLines.join("\n");

      fs.writeFileSync(fullPath, newContent, "utf-8");
    }

    console.log(
      `✅ Removed ${matches.length} console statements from ${Object.keys(byFile).length} files`,
    );
  }
}

// Run the script
const shouldFix = process.argv.includes("--fix");
removeConsoleLogs(!shouldFix).catch(console.error);
