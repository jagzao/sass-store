# Protocolo de Loop Autónomo

> **Versión:** 1.0.0  
> **Última actualización:** 2026-03-02  
> **Proyecto:** sass-store  

---

## Propósito

Este protocolo define el ciclo completo de desarrollo autónomo: desde la solicitud del usuario hasta la entrega de funcionalidad probada y documentada en video.

---

## 1. Visión General del Ciclo Autónomo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CICLO DE DESARROLLO AUTÓNOMO                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  PEDIDO  │───▶│  PLAN    │───▶│  CÓDIGO  │───▶│  TEST UT │              │
│  │ Usuario  │    │ Arquitec │    │ Develop  │    │  Unit    │              │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘              │
│                                                       │                     │
│       ┌───────────────────────────────────────────────┘                     │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  FIX     │◀───│  E2E     │◀───│ INTEG    │◀───│  PASS?   │              │
│  │ Corregir │    │  Tests   │    │  Tests   │    │  Check   │              │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘              │
│       │                                                       │              │
│       │                       ┌───────────────┐              │              │
│       └──────────────────────▶│  REPETIR     │◀─────────────┘              │
│                               │  hasta PASS  │                             │
│                               └───────┬───────┘                             │
│                                       │                                     │
│                                       ▼                                     │
│                               ┌───────────────┐                             │
│                               │    VIDEO      │                             │
│                               │  Demo + Docs  │                             │
│                               └───────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fases del Ciclo

### 2.1 Fase 1: Pedido y Análisis

**Input del usuario:**
```
"Implementar [funcionalidad] con [requisitos]"
```

**Acciones del agente:**
1. Leer `.agents/history/debug_logs.md` para evitar errores conocidos
2. Leer `.agents/history/test_cases.md` para casos borde relevantes
3. Analizar alcance y complejidad
4. Crear plan en `.agents/session/current_task.md`

**Output:**
- Plan técnico detallado
- Estimación de archivos a modificar/crear
- Lista de tests necesarios

### 2.2 Fase 2: Planificación Arquitectónica

**Acciones:**
1. Identificar capas afectadas:
   - Base de datos (schema, migraciones)
   - Backend (servicios, API routes)
   - Frontend (componentes, páginas)
2. Diseñar contratos (DTOs, interfaces)
3. Definir estructura de tests

**Template de plan:**
```markdown
## Plan: [Feature Name]

### Archivos a Crear
- [ ] `lib/services/[feature]-service.ts`
- [ ] `app/api/[feature]/route.ts`
- [ ] `components/[feature]/[feature].tsx`

### Archivos a Modificar
- [ ] `lib/db/schema.ts` - Agregar tabla
- [ ] `components/sidebar.tsx` - Agregar link

### Tests Necesarios
- [ ] `tests/unit/services/[feature]-service.spec.ts`
- [ ] `tests/integration/api/[feature]-api.spec.ts`
- [ ] `tests/e2e/[feature]-flow.spec.ts`

### Dependencias
- [ ] Nueva migración de DB
- [ ] Ninguna dependencia externa nueva
```

### 2.3 Fase 3: Desarrollo

**Orden de implementación:**
1. **Base de datos** (si aplica)
   - Schema
   - Migración
   - Seed data

2. **Backend**
   - Tipos/DTOs
   - Servicio de dominio
   - API routes

3. **Frontend**
   - Componentes
   - Páginas
   - Integración

**Validaciones en cada paso:**
```bash
# Después de cada archivo
npm run lint
npm run typecheck

# Después de cada módulo
npm run test:unit -- [modulo]
```

### 2.4 Fase 4: Tests Unitarios

**Cobertura obligatoria:**
```typescript
// Template de test unitario
describe('[Feature]Service', () => {
  // Happy path
  it('should [action] successfully', async () => {});
  
  // Validation
  it('should reject invalid [input]', async () => {});
  
  // Business rules
  it('should enforce [rule]', async () => {});
  
  // Edge cases
  it('should handle [edge case]', async () => {});
  
  // Security
  it('should prevent unauthorized access', async () => {});
  it('should isolate tenant data', async () => {});
});
```

**Comando de validación:**
```bash
npm run test:unit -- --coverage --reporter=verbose
```

### 2.5 Fase 5: Tests de Integración

**Validaciones:**
- API endpoints responden correctamente
- Base de datos persiste datos
- Multitenancy funciona

**Comando:**
```bash
npm run test:integration -- --coverage
```

### 2.6 Fase 6: Tests E2E

**Flujo completo:**
```typescript
// tests/e2e/[feature]-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('[Feature] E2E Flow', () => {
  test.use({ storageState: 'tests/e2e/.auth/user.json' });

  test('should complete [feature] flow successfully', async ({ page }) => {
    // 1. Navigate
    await page.goto('/t/test-tenant/[feature]');
    
    // 2. Interact
    await page.click('text=Nuevo');
    await page.fill('[name="field"]', 'value');
    await page.click('button[type="submit"]');
    
    // 3. Verify
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('text=[resultado]')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test de manejo de errores
  });
});
```

**Comando:**
```bash
npm run test:e2e:subset -- --grep "[feature]"
```

### 2.7 Fase 7: Loop de Corrección

**Si algún test falla:**

```
┌─────────────────────────────────────────────────────────────┐
│                    LOOP DE CORRECCIÓN                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CAPTURAR error completo                                 │
│     npm run test:xxx 2>&1 | tee .agents/session/error.log   │
│                                                              │
│  2. ANALIZAR causa raíz                                     │
│     - Comparar con debug_logs.md                            │
│     - Identificar patrón                                    │
│                                                              │
│  3. CORREGIR código                                         │
│     - Un cambio a la vez                                    │
│     - Documentar en current_task.md                         │
│                                                              │
│  4. RE-EJECUTAR tests                                       │
│     - Validar fix                                           │
│     - Verificar no regresión                                │
│                                                              │
│  5. DOCUMENTAR si es nuevo error                            │
│     - Agregar a debug_logs.md                               │
│     - Agregar caso borde a test_cases.md                    │
│                                                              │
│  6. REPETIR hasta PASS (máx 5 intentos)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.8 Fase 8: Video Demo

**Grabación automática con Playwright:**

```typescript
// tests/e2e/demo/[feature]-demo.spec.ts
import { test } from '@playwright/test';

test('[Feature] Demo Video', async ({ page, context }) => {
  // Configurar grabación
  await context.tracing.start({ screenshots: true, snapshots: true });

  // Ejecutar flujo completo
  await page.goto('/t/test-tenant/dashboard');
  await page.pause(); // Pausa para narración si es necesario
  
  // ... flujo completo de la feature

  // Guardar trace
  await context.tracing.stop({ path: `test-results/[feature]-demo.zip` });
});
```

**Script de grabación:**
```bash
# Crear video de demo
npx playwright test tests/e2e/demo/[feature]-demo.spec.ts --video=on

# El video se guarda en:
# test-results/[feature]-demo.webm
```

---

## 3. Comandos de Validación Completa

### 3.1 Validación Rápida (durante desarrollo)
```bash
npm run lint && npm run typecheck && npm run test:unit
```

### 3.2 Validación Completa (antes de video)
```bash
# Full validation pipeline
npm run lint && \
npm run typecheck && \
npm run build && \
npm run test:unit && \
npm run test:integration && \
npm run test:security && \
npm run test:e2e:subset -- --grep "[feature]" && \
echo "✅ All validations passed!"
```

### 3.3 Generación de Video
```bash
# Generar video demo
npm run test:e2e:subset -- tests/e2e/demo/[feature]-demo.spec.ts --video=on --project=chromium
```

---

## 4. Checklist de Finalización

### Antes de considerar feature completa:

```markdown
## Checklist: [Feature Name]

### Código
- [ ] Código implementado siguiendo Result Pattern
- [ ] Multitenancy validado en todas las queries
- [ ] Sin errores de lint ni typecheck
- [ ] Build exitoso

### Tests Unitarios
- [ ] Happy path cubierto
- [ ] Casos de validación cubiertos
- [ ] Edge cases cubiertos
- [ ] Tests de seguridad cubiertos
- [ ] Cobertura >= 80%

### Tests de Integración
- [ ] API endpoints funcionan
- [ ] Persistencia en DB correcta
- [ ] Aislamiento multitenant verificado

### Tests E2E
- [ ] Flujo completo funciona
- [ ] Errores se manejan gracefully
- [ ] UI responde correctamente

### Documentación
- [ ] current_task.md actualizado
- [ ] debug_logs.md actualizado (si hubo errores)
- [ ] test_cases.md actualizado (si hay nuevos casos)

### Video
- [ ] Demo grabado
- [ ] Video guardado en test-results/
```

---

## 5. Flujo de Trabajo Recomendado

### Para el Agente

```
AL INICIAR:
1. Leer .agents/SYSTEM_PROMPT.md
2. Leer .agents/session/current_task.md
3. Leer .agents/history/debug_logs.md

DURANTE DESARROLLO:
1. Actualizar current_task.md con progreso
2. Ejecutar validaciones frecuentes
3. Documentar bloqueos inmediatamente

AL FINALIZAR:
1. Ejecutar validación completa
2. Generar video demo
3. Actualizar memoria histórica
4. Marcar current_task.md como COMPLETADO
```

### Para el Usuario

**Comando simple:**
```
"Implementa [feature] siguiendo el protocolo autonomous-loop"
```

**El agente ejecutará:**
1. Planificación automática
2. Desarrollo iterativo
3. Tests automáticos
4. Corrección de errores
5. Video demo

---

## 6. Tiempos Estimados

| Fase | Tiempo | Automatizable |
|------|--------|---------------|
| Planificación | 5-10 min | ✅ 100% |
| Desarrollo | 30-60 min | ✅ 90% |
| Tests UT | 10-15 min | ✅ 100% |
| Tests Integración | 10-15 min | ✅ 100% |
| Tests E2E | 15-20 min | ✅ 100% |
| Correcciones | 15-30 min | ✅ 80% |
| Video Demo | 5-10 min | ✅ 90% |
| **Total** | **90-160 min** | **✅ 90%** |

---

## 7. Integración con CI/CD

### Pipeline Automatizado

```yaml
# .github/workflows/feature-validation.yml
name: Feature Validation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install
        run: npm ci
        
      - name: Lint & TypeCheck
        run: npm run lint && npm run typecheck
        
      - name: Unit Tests
        run: npm run test:unit -- --coverage
        
      - name: Integration Tests
        run: npm run test:integration
        env:
          TEST_DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          
      - name: E2E Tests
        run: npm run test:e2e:subset -- --grep="${{ github.event.pull_request.title }}"
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        
      - name: Generate Demo Video
        run: npm run test:e2e:subset -- tests/e2e/demo --video=on
        
      - name: Upload Video
        uses: actions/upload-artifact@v4
        with:
          name: demo-video
          path: test-results/
```

---

*Este protocolo permite desarrollo autónomo de principio a fin.*
