# Failure Triager - Clasificador de Fallas

## Responsabilidad

Analiza fallas de tests E2E/Integración/SEO/A11y/Perf y las clasifica por categoría, severidad y archivos candidatos para patches, con soporte de code-graph.

## Proceso de Clasificación

### 1. Análisis de Entrada

```typescript
import { log, bundles } from "@/tools";

interface FailureInput {
  testFile: string;
  testCase: string;
  errorMessage: string;
  stackTrace: string;
  tenant?: string;
  route?: string;
  screenshot?: string;
}

interface TriageResult {
  issues: ClassifiedIssue[];
  summary: {
    totalFailures: number;
    categories: Record<Category, number>;
    severity: Record<Severity, number>;
    description: string;
  };
  recommendations: string[];
}
```

### 2. Clasificación por Categoría

```typescript
enum Category {
  UI = "UI",
  Backend = "Backend",
  SEO = "SEO",
  A11y = "A11y",
  Performance = "Performance",
  Flake = "Flake",
  Multitenant = "Multitenant",
  Security = "Security",
}

function classifyFailure(failure: FailureInput): Category {
  const { testFile, errorMessage, testCase } = failure;

  // UI/Frontend indicators
  if (
    testFile.includes("/e2e/") &&
    (errorMessage.includes("data-testid") ||
      errorMessage.includes("element not found") ||
      errorMessage.includes("click") ||
      errorMessage.includes("visible"))
  ) {
    return Category.UI;
  }

  // Backend/API indicators
  if (
    testFile.includes("/integration/") ||
    errorMessage.includes("API") ||
    errorMessage.includes("status 5") ||
    errorMessage.includes("database") ||
    errorMessage.includes("endpoint")
  ) {
    return Category.Backend;
  }

  // SEO indicators
  if (
    testCase.includes("seo") ||
    errorMessage.includes("canonical") ||
    errorMessage.includes("meta") ||
    errorMessage.includes("sitemap") ||
    errorMessage.includes("robots.txt")
  ) {
    return Category.SEO;
  }

  // A11y indicators
  if (
    testCase.includes("a11y") ||
    testCase.includes("accessibility") ||
    errorMessage.includes("contrast") ||
    errorMessage.includes("aria") ||
    errorMessage.includes("focus")
  ) {
    return Category.A11y;
  }

  // Performance indicators
  if (
    testCase.includes("performance") ||
    errorMessage.includes("LCP") ||
    errorMessage.includes("INP") ||
    errorMessage.includes("CLS") ||
    errorMessage.includes("timeout")
  ) {
    return Category.Performance;
  }

  // Multitenant indicators
  if (
    errorMessage.includes("tenant") ||
    errorMessage.includes("isolation") ||
    errorMessage.includes("x-tenant") ||
    testCase.includes("multitenant")
  ) {
    return Category.Multitenant;
  }

  // Flakiness indicators
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("intermittent") ||
    errorMessage.includes("timing")
  ) {
    return Category.Flake;
  }

  return Category.UI; // Default fallback
}
```

### 3. Determinación de Severidad

```typescript
enum Severity {
  P0 = "P0", // Critical - System down
  P1 = "P1", // High - Core functionality broken
  P2 = "P2", // Medium - Feature broken with workaround
  P3 = "P3", // Low - Minor/cosmetic issue
}

function determineSeverity(
  failure: FailureInput,
  category: Category,
): Severity {
  const { errorMessage, testCase, tenant } = failure;

  // P0 - Critical system failures
  if (
    errorMessage.includes("database") ||
    errorMessage.includes("500") ||
    errorMessage.includes("tenant isolation") ||
    errorMessage.includes("security") ||
    (testCase.includes("fallback") && errorMessage.includes("failed"))
  ) {
    return Severity.P0;
  }

  // P1 - Core functionality
  if (
    category === Category.Multitenant ||
    testCase.includes("purchase") ||
    testCase.includes("booking") ||
    testCase.includes("payment") ||
    errorMessage.includes("checkout") ||
    errorMessage.includes("reservation")
  ) {
    return Severity.P1;
  }

  // P2 - Feature with workaround
  if (
    category === Category.SEO ||
    category === Category.A11y ||
    testCase.includes("social-planner") ||
    testCase.includes("media")
  ) {
    return Severity.P2;
  }

  // P3 - Minor issues
  if (
    category === Category.Flake ||
    errorMessage.includes("cosmetic") ||
    errorMessage.includes("styling")
  ) {
    return Severity.P3;
  }

  return Severity.P2; // Default medium
}
```

### 4. Code-Graph Analysis

```typescript
interface CodeGraphNode {
  file: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
  dependents: string[];
}

class CodeGraphAnalyzer {
  private graph: Map<string, CodeGraphNode> = new Map();

  async analyzeDependencies(testFile: string): Promise<string[]> {
    const candidateFiles: string[] = [];

    // Extract route from test file
    const route = this.extractRouteFromTest(testFile);
    if (route) {
      candidateFiles.push(...this.findRouteFiles(route));
    }

    // Find component dependencies
    const components = this.findComponentsInTest(testFile);
    for (const component of components) {
      candidateFiles.push(...this.findComponentDependencies(component));
    }

    // Find API dependencies
    const apis = this.findApiCallsInTest(testFile);
    for (const api of apis) {
      candidateFiles.push(...this.findApiImplementation(api));
    }

    // Limit to top 5 most relevant files
    return this.rankByRelevance(candidateFiles).slice(0, 5);
  }

  private extractRouteFromTest(testFile: string): string | null {
    // Parse test file for route patterns
    const content = fs.readFileSync(testFile, "utf8");
    const routeMatch = content.match(/page\.goto\(['"`]([^'"`]+)['"`]\)/);
    return routeMatch ? routeMatch[1] : null;
  }

  private findRouteFiles(route: string): string[] {
    // Map route to Next.js file structure
    if (route.startsWith("/t/[tenant]")) {
      const subRoute = route.replace("/t/[tenant]", "");
      return [
        `apps/web/app/t/[tenant]${subRoute}/page.tsx`,
        `apps/web/app/t/[tenant]${subRoute}/layout.tsx`,
      ];
    }
    return [];
  }

  private findComponentsInTest(testFile: string): string[] {
    const content = fs.readFileSync(testFile, "utf8");
    const testIdMatches = content.match(/data-testid="([^"]+)"/g) || [];

    return testIdMatches.map((match) =>
      match.replace(/data-testid="([^"]+)"/, "$1"),
    );
  }

  private findComponentDependencies(componentTestId: string): string[] {
    // Search for components that contain this test ID
    const candidates: string[] = [];

    // Map common test IDs to likely component locations
    const componentMap: Record<string, string[]> = {
      "add-to-cart": [
        "apps/web/components/AddToCartButton.tsx",
        "apps/web/components/ProductCard.tsx",
      ],
      "book-appointment": [
        "apps/web/components/BookingButton.tsx",
        "apps/web/components/ServiceCard.tsx",
      ],
      "social-planner": [
        "apps/web/components/SocialPlanner.tsx",
        "apps/web/app/admin/social/page.tsx",
      ],
      "cart-button": [
        "apps/web/components/Cart.tsx",
        "apps/web/components/Navigation.tsx",
      ],
    };

    return componentMap[componentTestId] || [];
  }

  private findApiCallsInTest(testFile: string): string[] {
    const content = fs.readFileSync(testFile, "utf8");
    const apiMatches = content.match(/\/api\/[^'"`\s]+/g) || [];
    return [...new Set(apiMatches)]; // Remove duplicates
  }

  private findApiImplementation(apiPath: string): string[] {
    // Map API paths to implementation files
    const pathParts = apiPath.split("/");
    const resource = pathParts[2]; // /api/v1/resource

    return [
      `apps/api/app/api/v1/${resource}/route.ts`,
      `apps/api/lib/${resource}.ts`,
      `apps/api/services/${resource}Service.ts`,
    ];
  }

  private rankByRelevance(files: string[]): string[] {
    // Simple ranking by frequency and file type priority
    const frequency = new Map<string, number>();
    files.forEach((file) => {
      frequency.set(file, (frequency.get(file) || 0) + 1);
    });

    return [...frequency.entries()]
      .sort((a, b) => {
        // Prioritize by frequency, then by file type
        if (a[1] !== b[1]) return b[1] - a[1];

        // Prioritize page components over generic components
        if (a[0].includes("/page.tsx")) return -1;
        if (b[0].includes("/page.tsx")) return 1;

        return 0;
      })
      .map(([file]) => file);
  }
}
```

### 5. Generación de Triage

```typescript
async function triageFailures(
  failures: FailureInput[],
  bundleId: string,
): Promise<TriageResult> {
  const analyzer = new CodeGraphAnalyzer();
  const issues: ClassifiedIssue[] = [];

  log.info("TRIAGER", "analysis", `Processing ${failures.length} failures`);

  for (const failure of failures) {
    const category = classifyFailure(failure);
    const severity = determineSeverity(failure, category);
    const candidateFiles = await analyzer.analyzeDependencies(failure.testFile);

    const issue: ClassifiedIssue = {
      id: generateIssueId(failure),
      category,
      severity,
      description: failure.errorMessage,
      testFile: failure.testFile,
      testCase: failure.testCase,
      tenant: failure.tenant,
      route: failure.route,
      candidateFiles,
      errorPattern: extractErrorPattern(failure.errorMessage),
      suggestedPatcher: determinePatcher(category),
      estimatedEffort: estimateEffort(severity, candidateFiles.length),
      metadata: {
        stackTrace: failure.stackTrace,
        screenshot: failure.screenshot,
      },
    };

    issues.push(issue);

    log.debug("TRIAGER", "classify", `Classified ${issue.id}`, {
      category,
      severity,
      files: candidateFiles.length,
    });
  }

  // Generate summary
  const summary = {
    totalFailures: failures.length,
    categories: countByCategory(issues),
    severity: countBySeverity(issues),
    description: generateSummaryDescription(issues),
  };

  const recommendations = generateRecommendations(issues);

  const result: TriageResult = {
    issues,
    summary,
    recommendations,
  };

  // Save triage result
  bundles.saveArtifact(
    bundleId,
    "triage.json",
    JSON.stringify(result, null, 2),
  );

  log.ok("TRIAGER", "complete", `Triage completed`, {
    issues: issues.length,
    p0_issues: issues.filter((i) => i.severity === Severity.P0).length,
    categories: Object.keys(summary.categories).length,
  });

  return result;
}

function determinePatcher(category: Category): string {
  const patcherMap: Record<Category, string> = {
    [Category.UI]: "patcher-frontend",
    [Category.Backend]: "patcher-backend",
    [Category.SEO]: "patcher-seo",
    [Category.A11y]: "patcher-a11y",
    [Category.Performance]: "patcher-perf",
    [Category.Multitenant]: "patcher-backend",
    [Category.Flake]: "patcher-tests",
    [Category.Security]: "patcher-backend",
  };

  return patcherMap[category];
}

function generateRecommendations(issues: ClassifiedIssue[]): string[] {
  const recommendations: string[] = [];

  // Check for patterns
  const p0Count = issues.filter((i) => i.severity === Severity.P0).length;
  if (p0Count > 0) {
    recommendations.push(`🚨 ${p0Count} P0 issues require immediate attention`);
  }

  const tenantIssues = issues.filter(
    (i) => i.category === Category.Multitenant,
  ).length;
  if (tenantIssues > 2) {
    recommendations.push(
      `⚠️ Multiple tenant isolation issues detected - review RLS implementation`,
    );
  }

  const flakeIssues = issues.filter(
    (i) => i.category === Category.Flake,
  ).length;
  if (flakeIssues > 3) {
    recommendations.push(`🔄 High flakiness detected - review test stability`);
  }

  return recommendations;
}
```

## Output Format

```json
{
  "issues": [
    {
      "id": "ui_001_missing_testid",
      "category": "UI",
      "severity": "P2",
      "description": "Missing data-testid on booking button",
      "testFile": "tests/e2e/booking.spec.ts",
      "testCase": "should book appointment in 2 clicks",
      "tenant": "wondernails",
      "route": "/t/wondernails/booking",
      "candidateFiles": [
        "apps/web/components/BookingButton.tsx",
        "apps/web/app/t/[tenant]/booking/page.tsx"
      ],
      "errorPattern": "element_not_found",
      "suggestedPatcher": "patcher-frontend",
      "estimatedEffort": "low"
    }
  ],
  "summary": {
    "totalFailures": 5,
    "categories": {
      "UI": 3,
      "SEO": 1,
      "Performance": 1
    },
    "severity": {
      "P0": 0,
      "P1": 1,
      "P2": 3,
      "P3": 1
    },
    "description": "Mixed UI and optimization issues across multiple tenants"
  },
  "recommendations": [
    "Add missing data-testid attributes to critical elements",
    "Review SEO fallback implementation for unknown tenants"
  ]
}
```
