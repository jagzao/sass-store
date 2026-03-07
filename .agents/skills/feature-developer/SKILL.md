# Skill: Feature Developer Autónomo

> **Versión:** 1.0.0  
> **Propósito:** Desarrollo completo de features con ciclo autónomo: código → tests → corrección → video demo

---

## Cuándo Usar Esta Skill

### ✅ Usar cuando:
- Usuario solicita implementar una feature nueva
- Usuario dice "implementa [X]" o "crea [X]"
- Se necesita desarrollo completo con tests y validación
- Se requiere demo en video de la funcionalidad

### ❌ No usar cuando:
- Solo se necesita un cambio menor (usar debug-agent)
- Es una consulta sin código (usar modo Ask)
- Es una refactorización sin nueva funcionalidad

---

## Protocolo de Ejecución

### Paso 1: Lectura Inicial Obligatoria

```
Leer en orden:
1. .agents/history/debug_logs.md    → Errores conocidos
2. .agents/history/test_cases.md    → Casos borde relevantes
3. .agents/memory/context_be.md     → Reglas de backend
4. .agents/session/current_task.md  → Estado actual
```

### Paso 2: Planificación

**Crear plan en `current_task.md`:**

```markdown
## Feature: [Nombre]

### Objetivo
[Descripción clara de qué se va a implementar]

### Archivos a Crear
- [ ] `lib/services/[feature].ts`
- [ ] `app/api/[feature]/route.ts`
- [ ] `components/[feature].tsx`
- [ ] `tests/unit/[feature].spec.ts`
- [ ] `tests/e2e/[feature].spec.ts`

### Archivos a Modificar
- [ ] `lib/db/schema.ts`
- [ ] Otros...

### Criterios de Aceptación
- [ ] [Criterio 1]
- [ ] [Criterio 2]

### Tests Requeridos
- [ ] Unit: [lista]
- [ ] Integration: [lista]
- [ ] E2E: [lista]
```

### Paso 3: Implementación por Capas

**Orden obligatorio:**

```
1. BASE DE DATOS (si aplica)
   └─▶ Schema → Migración → Seed

2. BACKEND
   └─▶ Tipos → Servicio → API Route

3. FRONTEND
   └─▶ Componentes → Páginas → Integración

4. TESTS
   └─▶ Unit → Integration → E2E
```

### Paso 4: Validación Continua

**Después de cada archivo:**
```bash
npm run lint && npm run typecheck
```

**Después de cada módulo:**
```bash
npm run test:unit -- [modulo]
```

### Paso 5: Loop de Corrección

```
SI test falla:
  1. Capturar error
  2. Analizar causa raíz
  3. Corregir código
  4. Re-ejecutar test
  5. Documentar si es error nuevo
  REPETIR hasta PASS (máx 5 intentos)
```

### Paso 6: Validación Final

```bash
npm run lint && \
npm run typecheck && \
npm run build && \
npm run test:unit && \
npm run test:integration && \
npm run test:e2e:subset -- --grep "[feature]"
```

### Paso 7: Video Demo

**Crear test de demo:**
```typescript
// tests/e2e/demo/[feature]-demo.spec.ts
import { test, expect } from '@playwright/test';

test('[Feature] Demo', async ({ page }) => {
  // 1. Setup
  await page.goto('/t/test-tenant/dashboard');
  
  // 2. Navegar a feature
  await page.click('text=[Feature]');
  
  // 3. Demostrar funcionalidad
  await page.click('text=Nuevo');
  await page.fill('[name="campo"]', 'valor demo');
  await page.click('button[type="submit"]');
  
  // 4. Verificar resultado
  await expect(page.locator('.success')).toBeVisible();
});
```

**Ejecutar con video:**
```bash
npx playwright test tests/e2e/demo/[feature]-demo.spec.ts --video=on
```

### Paso 8: Actualizar Memoria

**En `current_task.md`:**
- Marcar como COMPLETADO
- Agregar link al video

**En `debug_logs.md`:**
- Documentar errores encontrados (si hubo)

---

## Templates de Código

### Servicio con Result Pattern

```typescript
// lib/services/[feature]-service.ts
import { Result, Err, Ok } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import { db } from "@/lib/db";
import { z } from "zod";
import { validateWithZod } from "@sass-store/validation/src/zod-result";

// Schema de validación
const CreateFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  // ... más campos
});

type CreateFeatureInput = z.infer<typeof CreateFeatureSchema>;

// Servicio
export const createFeature = async (
  data: CreateFeatureInput,
  context: { tenantId: string; userId: string }
): Promise<Result<Feature, DomainError>> => {
  // 1. Validar input
  const validationResult = validateWithZod(CreateFeatureSchema, data);
  if (validationResult.isErr()) {
    return validationResult;
  }
  
  // 2. Crear en DB
  const result = await fromPromise(
    db.features.create({
      data: {
        ...validationResult.value,
        tenantId: context.tenantId,
        createdBy: context.userId,
      },
    }),
    (error) => ErrorFactories.database("create_feature", "Failed to create feature", undefined, error)
  );
  
  return result;
};
```

### API Route

```typescript
// app/api/[feature]/route.ts
import { NextRequest } from "next/server";
import { withResultHandler } from "@/lib/api/result-handler";
import { createFeature } from "@/lib/services/[feature]-service";

export const POST = withResultHandler(async (request: NextRequest) => {
  const body = await request.json();
  const context = getTenantContext(request);
  
  return createFeature(body, context);
});
```

### Test Unitario

```typescript
// tests/unit/services/[feature]-service.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createFeature } from "@/lib/services/[feature]-service";
import { expectSuccess, expectFailure } from "../../utils/helpers";

describe("FeatureService", () => {
  const context = { tenantId: "test-tenant", userId: "test-user" };

  describe("createFeature", () => {
    it("should create feature with valid data", async () => {
      const data = { name: "Test Feature" };
      const result = await createFeature(data, context);
      
      expectSuccess(result);
      expect(result.value.name).toBe("Test Feature");
      expect(result.value.tenantId).toBe("test-tenant");
    });

    it("should reject empty name", async () => {
      const data = { name: "" };
      const result = await createFeature(data, context);
      
      expectFailure(result);
      expect(result.error.type).toBe("ValidationError");
    });

    it("should isolate tenant data", async () => {
      const data = { name: "Test" };
      const contextA = { tenantId: "tenant-a", userId: "user" };
      const contextB = { tenantId: "tenant-b", userId: "user" };
      
      const resultA = await createFeature(data, contextA);
      const resultB = await createFeature(data, contextB);
      
      expectSuccess(resultA);
      expectSuccess(resultB);
      expect(resultA.value.tenantId).not.toBe(resultB.value.tenantId);
    });
  });
});
```

### Test E2E

```typescript
// tests/e2e/[feature]-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Feature Flow", () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" });

  test("should create and display feature", async ({ page }) => {
    // Navigate
    await page.goto("/t/test-tenant/features");
    
    // Create
    await page.click("text=Nueva Feature");
    await page.fill('[name="name"]', "Mi Feature");
    await page.click('button[type="submit"]');
    
    // Verify
    await expect(page.locator(".toast-success")).toBeVisible();
    await expect(page.locator("text=Mi Feature")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/t/test-tenant/features");
    await page.click("text=Nueva Feature");
    await page.click('button[type="submit"]');
    
    await expect(page.locator("text=El nombre es requerido")).toBeVisible();
  });
});
```

---

## Comandos de Referencia

```bash
# Desarrollo
npm run dev

# Validación
npm run lint
npm run typecheck
npm run build

# Tests
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e
npm run test:e2e:subset -- --grep "[feature]"

# DB
npm run db:generate
npm run db:push
npm run db:seed

# Video Demo
npx playwright test tests/e2e/demo --video=on
```

---

## Checklist Final

```markdown
## Feature: [Nombre] - Finalización

### Código
- [ ] Implementado con Result Pattern
- [ ] Multitenancy validado
- [ ] Sin errores de lint/typecheck
- [ ] Build exitoso

### Tests Unitarios
- [ ] Happy path
- [ ] Validaciones
- [ ] Edge cases
- [ ] Seguridad
- [ ] Cobertura >= 80%

### Tests E2E
- [ ] Flujo completo
- [ ] Manejo de errores

### Documentación
- [ ] current_task.md actualizado
- [ ] debug_logs.md actualizado (si hubo errores)

### Video
- [ ] Demo grabado
- [ ] Video en test-results/
```

---

*Esta skill ejecuta el ciclo completo de desarrollo autónomo.*
