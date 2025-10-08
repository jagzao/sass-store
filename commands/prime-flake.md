# Prime Flake - Política de Flakiness

## Responsabilidad

Define y aplica políticas estrictas de manejo de flakiness en tests E2E e integración, priorizando estabilidad sobre falsos positivos.

## Política de Reintentos

### Permitido (1 reintento máximo)

```typescript
import { log, alerts } from "@/tools";

// Patrones de render/espera que pueden ser flakey
const RETRYABLE_PATTERNS = [
  "ElementNotVisible",
  "NetworkTimeout",
  "FirstRenderDelay",
  "AsyncComponentLoading",
];

async function handleFlakiness(
  error: Error,
  testCase: string,
): Promise<boolean> {
  const isRetryable = RETRYABLE_PATTERNS.some((pattern) =>
    error.message.includes(pattern),
  );

  if (isRetryable && getRetryCount(testCase) === 0) {
    log.warn("QA", "flake-retry", `Retrying flaky test: ${testCase}`, {
      error: error.message,
      pattern: "render-timing",
    });

    return true; // Allow 1 retry
  }

  return false; // No retry
}
```

### Prohibido (fallas inmediatas)

```typescript
const NON_RETRYABLE_PATTERNS = [
  "AssertionError", // Lógica de negocio
  "ElementNotFound", // Selector issue
  "StatusCodeError", // API contract
  "ValidationError", // Data integrity
  "PermissionDenied", // Security/access
];

// Estas fallas indican problemas reales, no flakiness
```

## Selectors Estables

### Data-testid Obligatorio

```typescript
// ✅ CORRECTO - Usar data-testid siempre
await page.click('[data-testid="add-to-cart"]');
await page.click('[data-testid="book-appointment"]');
await page.click('[data-testid="confirm-order"]');

// ❌ PROHIBIDO - Selectors frágiles
await page.click(".btn-primary:nth-child(2)");
await page.click("div > div > button");
await page.click('button:contains("Buy")');
```

### Detección de Selectors Faltantes

```typescript
async function validateCriticalSelectors(page: Page): Promise<void> {
  const criticalElements = [
    "add-to-cart",
    "book-appointment",
    "confirm-order",
    "view-cart",
    "checkout-button",
  ];

  const missingSelectors: string[] = [];

  for (const testId of criticalElements) {
    const element = page.locator(`[data-testid="${testId}"]`);
    const exists = (await element.count()) > 0;

    if (!exists) {
      missingSelectors.push(testId);
    }
  }

  if (missingSelectors.length > 0) {
    alerts.needHuman({
      agent: "QA",
      task: "selector-validation",
      reason: `Missing critical data-testid selectors: ${missingSelectors.join(", ")}`,
      action: `Add data-testid attributes to these elements in the UI components`,
      details: `Critical user flow elements need stable data-testid selectors for reliable testing.

Without these selectors, tests become brittle and unreliable.`,
      files: ["Check component files for these elements"],
      urgency: "high",
    });
  }
}
```

## Esperas por Estado vs Sleeps

### ✅ Permitido - Estado-based waits

```typescript
// Wait for element to be visible
await page.locator('[data-testid="modal"]').waitFor({ state: "visible" });

// Wait for network to be idle
await page.waitForLoadState("networkidle");

// Wait for specific condition
await page.waitForFunction(() => {
  const cart = document.querySelector('[data-testid="cart-count"]');
  return cart && cart.textContent !== "0";
});

// Wait for element to be enabled
await page.locator('[data-testid="submit-btn"]').waitFor({
  state: "visible",
});
await expect(page.locator('[data-testid="submit-btn"]')).toBeEnabled();
```

### ❌ Prohibido - Arbitrary sleeps

```typescript
// ❌ NUNCA hacer esto
await page.waitForTimeout(3000);
await new Promise((resolve) => setTimeout(resolve, 2000));

// ❌ Sleeps mágicos
await page.click('[data-testid="submit"]');
await page.waitForTimeout(1000); // ¿Por qué 1000ms?
```

## Auto-sanación Responsable

### Configuración de Self-healing

```typescript
const SELF_HEALING_CONFIG = {
  maxRetries: 1,
  retryDelay: 100, // mínimo delay
  stableSelectors: true,
  logAllRetries: true,
  enableTracing: true,
};

class ResponsibleSelfHealing {
  async clickWithFallback(
    page: Page,
    primarySelector: string,
    fallbackSelectors: string[],
  ): Promise<boolean> {
    // Intentar selector primario
    try {
      await page.click(primarySelector);
      return true;
    } catch (error) {
      log.warn(
        "QA",
        "self-healing",
        `Primary selector failed: ${primarySelector}`,
        {
          error: error.message,
        },
      );

      // UN fallback máximo
      if (fallbackSelectors.length > 0) {
        try {
          await page.click(fallbackSelectors[0]);
          log.info(
            "QA",
            "self-healing",
            `Fallback selector worked: ${fallbackSelectors[0]}`,
          );
          return true;
        } catch (fallbackError) {
          log.error("QA", "self-healing", "All selectors failed", {
            primary: primarySelector,
            fallback: fallbackSelectors[0],
            error: fallbackError.message,
          });
        }
      }

      return false;
    }
  }
}
```

### Trazabilidad de Auto-sanación

```typescript
// Log EVERY self-healing action
function logSelfHealingAction(action: string, details: any): void {
  log.info("QA", "self-healing", action, {
    ...details,
    timestamp: new Date().toISOString(),
    trace: "auto-recovery",
  });
}

// Nunca ocultar que se usó self-healing
// Siempre reportar en test results
```

## Detección de Regresiones

### Assertions no deben relajarse

```typescript
// ❌ PROHIBIDO - Relajar assertions por flakiness
// Era: expect(response.status).toBe(200);
// NO cambiar a: expect([200, 201, 202]).toContain(response.status);

// ❌ PROHIBIDO - Ocultar errores reales
// try {
//   expect(critical_business_logic).toBe(expected);
// } catch {
//   console.log("Ignoring flaky assertion");
// }

// ✅ CORRECTO - Investigar y fix la causa root
// Si el test es flaky, el problema está en el código, no en el test
```

### Metrics de Flakiness

```typescript
interface FlakinessMetrics {
  testName: string;
  totalRuns: number;
  failures: number;
  retries: number;
  flakinessRate: number; // failures/totalRuns
  lastFlakeDate: string;
}

// Reportar automáticamente tests con > 5% flakiness rate
function reportFlakyTests(metrics: FlakinessMetrics[]): void {
  const flakyTests = metrics.filter((m) => m.flakinessRate > 0.05);

  if (flakyTests.length > 0) {
    alerts.needHuman({
      agent: "QA",
      task: "flakiness-analysis",
      reason: `${flakyTests.length} tests have high flakiness rate (>5%)`,
      action: "Investigate and fix the root cause of test instability",
      details: `Flaky tests found:\n${flakyTests
        .map(
          (t) =>
            `- ${t.testName}: ${(t.flakinessRate * 100).toFixed(1)}% flaky`,
        )
        .join("\n")}`,
      urgency: "medium",
    });
  }
}
```

## Auto-relogin Policy

```typescript
// Permitido: 1 auto-relogin por test session
let hasAutoRelogged = false;

async function handleAuthError(page: Page): Promise<boolean> {
  if (!hasAutoRelogged) {
    log.info("QA", "auto-relogin", "Token expired, attempting auto-relogin");

    const success = await performRelogin(page);
    hasAutoRelogged = true;

    if (success) {
      log.ok("QA", "auto-relogin", "Auto-relogin successful");
      return true;
    }
  }

  return false; // No second attempts
}
```

## Tracing para Debug

```typescript
// SIEMPRE activar tracing en failures
test("flaky test with full tracing", async ({ page }) => {
  await page.context().tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });

  try {
    // Test logic...
  } catch (error) {
    await page.context().tracing.stop({
      path: `traces/flaky-${Date.now()}.zip`,
    });
    throw error;
  }
});
```

## Gates de Calidad

- **Zero tolerance** para sleeps arbitrarios
- **Mandatory data-testid** para elementos críticos
- **1 retry maximum** y solo para patrones conocidos
- **Full tracing** en todas las fallas
- **Weekly flakiness report** automatico
