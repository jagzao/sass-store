# Prime Autofix - Orquestador de Auto-reparación

## Responsabilidad

Orquestador principal que lee reportes de fallas (E2E/Integración/SEO/A11y/Perf), invoca el triager, despacha parches específicos, ejecuta verificación dirigida y genera bundle + PR.

## Flujo de Trabajo

### 1. Análisis de Fallas

```typescript
import { log, bundles, workflow } from "@/tools";

const runId = workflow.generateRunId();
const startTime = Date.now();

workflow.startAgent("AUTOFIX", "triage-and-patch", runId);

// Leer test-report.json
const testReport = await readTestReport();
const failures = extractFailures(testReport);

log.info("AUTOFIX", "analysis", `Found ${failures.length} failures to process`);
```

### 2. Invocación del Triager

```typescript
// Crear bundle para seguimiento
const bundleId = workflow.createBundle(
  "AUTOFIX",
  "autofix-session",
  "npm run test:e2e:subset",
);

// Invocar failure-triager
const triageResult = await invokeSubagent("failure-triager", {
  failures,
  bundleId,
  testReport: "test-report.json",
});

// Guardar resultado de triage
bundles.saveArtifact(
  bundleId,
  "triage.json",
  JSON.stringify(triageResult, null, 2),
);
```

### 3. Despacho a Patchers

```typescript
for (const issue of triageResult.issues) {
  const patcherType = determinePatcherType(issue.category);

  log.info("AUTOFIX", "dispatch", `Dispatching ${issue.id} to ${patcherType}`, {
    severity: issue.severity,
    files: issue.candidateFiles.length,
  });

  const patchResult = await invokeSubagent(patcherType, {
    issue,
    bundleId,
    constraints: {
      maxFiles: 5,
      maxLines: 200,
      respectTokens: true,
    },
  });

  if (patchResult.success) {
    bundles.saveArtifact(bundleId, `patch-${issue.id}.diff`, patchResult.diff);
  }
}
```

### 4. Verificación Dirigida

```typescript
// Ejecutar tests específicos basados en impacto
const impactAnalysis = await invokeSubagent("impact-analyzer", {
  changedFiles: getAllChangedFiles(),
  bundleId,
});

const testSubset = buildTestSubset(
  impactAnalysis.affectedRoutes,
  impactAnalysis.affectedTenants,
);

log.info("AUTOFIX", "verification", `Running directed tests`, {
  routes: impactAnalysis.affectedRoutes.length,
  tenants: impactAnalysis.affectedTenants.length,
  tests: testSubset.length,
});

const verificationResult = await runDirectedTests(testSubset);
```

### 5. Generación de Bundle y PR

```typescript
if (verificationResult.success) {
  // Generar artefactos finales
  const reportResult = await invokeSubagent("report-writer", {
    bundleId,
    triageResult,
    patchResults,
    verificationResult,
  });

  // Crear PR
  const prResult = await createAutofixPR({
    bundleId,
    title: `autofix: ${triageResult.summary.description}`,
    artifacts: bundles.getBundleArtifacts(bundleId),
  });

  workflow.completeBundle(bundleId, [
    "triage.json",
    "plan.md",
    "summary.md",
    "risks.md",
    "diffs.patch",
    "test-report.json",
  ]);

  log.ok("AUTOFIX", "complete", `Autofix completed successfully`, {
    pr: prResult.url,
    duration: workflow.formatDuration(startTime),
  });
} else {
  workflow.failBundle(bundleId, "Verification tests failed");
}

workflow.endAgent(
  "AUTOFIX",
  verificationResult.success ? "OK" : "FAIL",
  workflow.formatDuration(startTime),
  `agents/bundles/${bundleId}`,
);
```

## Reglas de Ejecución

### Límites de Auto-fix

- **Máximo 5 archivos** modificados por sesión
- **Máximo 200 líneas** de cambios
- **Severidad P1+** requerida para tocar middleware/RLS/media

### Tipos de Patcher por Categoría

- **UI/Frontend**: `patcher-frontend`
- **API/Backend**: `patcher-backend`
- **Tests**: `patcher-tests`
- **SEO**: `patcher-seo`
- **A11y**: `patcher-a11y`
- **Performance**: `patcher-perf`

### Gates de Seguridad

- Todo cambio debe pasar tests dirigidos
- Changes en RLS requieren 2 approvals mínimo
- Ningún push directo a `main`
- Siempre crear rama `autofix/<slug>`

### Políticas de Reintentos

- Máximo **2 reintentos** por bundle
- Si excede → generar `NEED=HUMAN`
- Solo reintentar en casos de flakiness detectado
- Nunca reintentar fallas lógicas

## Artefactos Generados

1. `triage.json` - Análisis de fallas clasificado
2. `plan.md` - Plan de reparación
3. `summary.md` - Resumen ejecutivo
4. `risks.md` - Riesgos identificados
5. `diffs.patch` - Cambios propuestos
6. `test-report.json` - Resultados de verificación
7. `seo-audit.md` - Auditoría SEO (si aplica)
8. `a11y-audit.md` - Auditoría A11y (si aplica)
9. `perf-lighthouse.json` - Métricas de performance (si aplica)
