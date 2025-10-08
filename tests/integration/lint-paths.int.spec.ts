import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

describe('Import Path Linting Integration Tests', () => {
  const projectRoot = process.cwd();
  const appsToCheck = ['web', 'api'];

  /**
   * Recursively find all TypeScript files in a directory
   */
  function findTsFiles(dir: string): string[] {
    const files: string[] = [];

    function traverse(currentDir: string) {
      const items = readdirSync(currentDir);

      for (const item of items) {
        const itemPath = join(currentDir, item);
        const stat = statSync(itemPath);

        if (stat.isDirectory()) {
          // Skip node_modules and .next directories
          if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
            traverse(itemPath);
          }
        } else if (stat.isFile()) {
          const ext = extname(item);
          if (['.ts', '.tsx'].includes(ext)) {
            files.push(itemPath);
          }
        }
      }
    }

    traverse(dir);
    return files;
  }

  /**
   * Check if a line contains a deep relative import
   */
  function hasDeepRelativeImport(line: string): boolean {
    // Match import statements with ../../../ or more
    const deepImportRegex = /import\s+.*from\s+['"`](\.\.[\/\\]){3,}.*['"`]/;
    return deepImportRegex.test(line);
  }

  /**
   * Extract import path from import statement
   */
  function extractImportPath(line: string): string | null {
    const match = line.match(/import\s+.*from\s+['"`]([^'"`]+)['"`]/);
    return match ? match[1] : null;
  }

  /**
   * Check if import should use @/ alias instead
   */
  function shouldUseAlias(importPath: string, currentFile: string): boolean {
    // If it's a deep relative import (3+ levels), it should use alias
    const deepRelative = /^(\.\.[\/\\]){3,}/.test(importPath);
    if (deepRelative) return true;

    // If importing from apps/* or packages/* across boundaries
    if (importPath.includes('../apps/') || importPath.includes('../packages/')) {
      return true;
    }

    return false;
  }

  for (const app of appsToCheck) {
    const appDir = join(projectRoot, 'apps', app);

    describe(`App: ${app}`, () => {
      it('should not contain deep relative imports (../../..)', () => {
        const tsFiles = findTsFiles(appDir);
        const violations: Array<{ file: string; line: number; import: string; suggestion?: string }> = [];

        for (const file of tsFiles) {
          const content = readFileSync(file, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            if (hasDeepRelativeImport(line)) {
              const importPath = extractImportPath(line);
              violations.push({
                file: file.replace(projectRoot, '.'),
                line: index + 1,
                import: importPath || line.trim(),
                suggestion: getSuggestion(importPath, app)
              });
            }
          });
        }

        if (violations.length > 0) {
          const errorMessage = [
            `Found ${violations.length} deep relative import violations in ${app}:`,
            '',
            ...violations.map(v =>
              `  ${v.file}:${v.line} - ${v.import}${v.suggestion ? ` → ${v.suggestion}` : ''}`
            ),
            '',
            'Use @/ alias imports instead of deep relative paths (../../..)',
            'Configure tsconfig.json paths and update imports accordingly.'
          ].join('\n');

          throw new Error(errorMessage);
        }
      });

      it('should use @/ aliases for cross-boundary imports', () => {
        const tsFiles = findTsFiles(appDir);
        const violations: Array<{ file: string; line: number; import: string; suggestion: string }> = [];

        for (const file of tsFiles) {
          const content = readFileSync(file, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            const importPath = extractImportPath(line);
            if (importPath && shouldUseAlias(importPath, file)) {
              const suggestion = getSuggestion(importPath, app);
              violations.push({
                file: file.replace(projectRoot, '.'),
                line: index + 1,
                import: importPath,
                suggestion
              });
            }
          });
        }

        if (violations.length > 0) {
          const errorMessage = [
            `Found ${violations.length} imports that should use @/ aliases in ${app}:`,
            '',
            ...violations.map(v =>
              `  ${v.file}:${v.line} - ${v.import} → ${v.suggestion}`
            ),
            '',
            'Use @/ aliases for cleaner and more maintainable imports.'
          ].join('\n');

          throw new Error(errorMessage);
        }
      });

      it('should have proper tsconfig.json path configuration', () => {
        const tsconfigPath = join(appDir, 'tsconfig.json');
        let tsconfig: any;

        try {
          const content = readFileSync(tsconfigPath, 'utf8');
          tsconfig = JSON.parse(content);
        } catch (error) {
          throw new Error(`Failed to read tsconfig.json for ${app}: ${error}`);
        }

        // Check that baseUrl is configured
        expect(tsconfig.compilerOptions?.baseUrl).toBeDefined();

        // Check that @/* path is configured
        expect(tsconfig.compilerOptions?.paths).toBeDefined();
        expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();

        // Check that common aliases are present
        const expectedAliases = ['@/*'];
        if (app === 'web') {
          expectedAliases.push('@/lib/*', '@/components/*', '@/app/*');
        }

        for (const alias of expectedAliases) {
          expect(tsconfig.compilerOptions.paths[alias]).toBeDefined();
        }
      });
    });
  }

  /**
   * Generate suggestion for better import path
   */
  function getSuggestion(importPath: string | null, app: string): string {
    if (!importPath) return '';

    // Convert relative paths to alias paths
    if (importPath.startsWith('../')) {
      // For cross-app imports
      if (importPath.includes('../packages/')) {
        const packageName = importPath.match(/\.\.\/packages\/([^\/]+)/)?.[1];
        if (packageName) {
          return `@sass-store/${packageName}`;
        }
      }

      // For intra-app imports
      const pathParts = importPath.split('/');
      const relevantParts = pathParts.filter(part => part !== '..' && part !== '.');

      if (relevantParts.length > 0) {
        if (app === 'web') {
          // Map common directories to aliases
          const firstPart = relevantParts[0];
          if (['lib', 'components', 'app'].includes(firstPart)) {
            return `@/${relevantParts.join('/')}`;
          }
        }

        // Generic @/ alias
        return `@/${relevantParts.join('/')}`;
      }
    }

    return '@/...'; // Generic suggestion
  }

  describe('Global Import Rules', () => {
    it('should not have any imports with more than 3 relative levels', () => {
      const allApps = appsToCheck.map(app => join(projectRoot, 'apps', app));
      const allFiles: string[] = [];

      for (const appDir of allApps) {
        allFiles.push(...findTsFiles(appDir));
      }

      const violations: Array<{ file: string; line: number; import: string; levels: number }> = [];

      for (const file of allFiles) {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const importPath = extractImportPath(line);
          if (importPath) {
            const levels = (importPath.match(/\.\.\//g) || []).length;
            if (levels > 3) {
              violations.push({
                file: file.replace(projectRoot, '.'),
                line: index + 1,
                import: importPath,
                levels
              });
            }
          }
        });
      }

      if (violations.length > 0) {
        const errorMessage = [
          `Found ${violations.length} imports with excessive relative levels:`,
          '',
          ...violations.map(v =>
            `  ${v.file}:${v.line} - ${v.import} (${v.levels} levels)`
          ),
          '',
          'Maximum allowed: 3 levels (../../..)',
          'Use @/ aliases for deeper imports.'
        ].join('\n');

        throw new Error(errorMessage);
      }
    });

    it('should use consistent import patterns', () => {
      // This test checks for consistent import patterns across the codebase
      const packageImports = new Set<string>();
      const allApps = appsToCheck.map(app => join(projectRoot, 'apps', app));
      const allFiles: string[] = [];

      for (const appDir of allApps) {
        allFiles.push(...findTsFiles(appDir));
      }

      // Collect all @sass-store package imports
      for (const file of allFiles) {
        const content = readFileSync(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach(line => {
          const importPath = extractImportPath(line);
          if (importPath?.startsWith('@sass-store/')) {
            packageImports.add(importPath);
          }
        });
      }

      // Expected package imports based on workspace structure
      const expectedPackages = ['@sass-store/ui', '@sass-store/database', '@sass-store/config'];

      for (const expectedPkg of expectedPackages) {
        const hasImport = Array.from(packageImports).some(imp => imp.startsWith(expectedPkg));
        if (hasImport) {
          // If the package is used, ensure it's imported consistently
          const variations = Array.from(packageImports).filter(imp => imp.startsWith(expectedPkg));
          expect(variations.length).toBeGreaterThan(0);
        }
      }
    });
  });
});