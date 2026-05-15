# Protocolo de Loop Autónomo

> **Versión:** 1.0.0  
> **Última actualización:** 2026-03-02  
> **Proyecto:** sass-store

---

## Propósito

Este protocolo define el ciclo completo de desarrollo autónomo: desde la solicitud del usuario hasta la entrega de funcionalidad probada y documentada en video.

---

## Principios de autonomía (aplicar siempre)

| Principio                     | Regla                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| **Persistencia**              | Usar filesystem, shell y browser reales. No simular acciones.                       |
| **Minimalismo**               | Cambiar solo lo estrictamente requerido. Sin refactors adyacentes.                  |
| **Evidencia antes de done**   | La tarea NO está done hasta: build verde + tests pasando + prueba de runtime.       |
| **Iteración obligatoria**     | Si falla cualquier gate → fix + re-run. Nunca reportar done con errores pendientes. |
| **Discovery primero**         | Leer contexto (AGENTS.md, protocols, debug_logs) ANTES de planear.                  |
| **Contratos antes de lógica** | Definir DTOs e interfaces ANTES de escribir implementación.                         |
| **Branch correcto**           | Verificar rama activa antes de editar. Nunca editar en master/main.                 |

## Estilo de comunicación del agente

- Directo y técnico. Sin "Claro", "Perfecto", "Entendido" como respuestas iniciales.
- No hacer preguntas retóricas. Si se necesita info → preguntar específico; si no → actuar.
- Al reportar completado: qué cambió + dónde está la evidencia + riesgos restantes.
- Bloqueos: síntoma exacto + logs + fixes intentados + hipótesis de causa raíz + próxima acción sugerida.

---

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

### 2.0 Fase 0: Discovery — Contexto antes de cualquier código

**GATE OBLIGATORIO. No se puede avanzar a Fase 1 sin completar estos pasos.**

```
DISCOVERY CHECKLIST (marcar antes de planear):

[ ] 1. Leer contexto del proyecto:
       - CLAUDE.md (reglas generales)
       - AGENTS.md (si existe)
       - .agents/protocols/ relevantes para la tarea
       - .agents/history/debug_logs.md (errores conocidos a evitar)
       - .agents/history/test_cases.md (casos borde ya documentados)

[ ] 2. Verificar branch activo:
       git branch --show-current
       → Confirmar que coincide con el scope de la tarea (STRY-XXX o feature)
       → Si la rama es master/main → STOP: crear rama antes de editar

[ ] 3. Verificar puerto libre antes de levantar servicios:
       PowerShell: netstat -ano | findstr :3001
       Bash:       lsof -ti :3001
       → Si ocupado: identificar el proceso antes de iniciar dev server

[ ] 4. Buscar código existente antes de escribir código nuevo:
       - Grep los símbolos clave (nombre del servicio, ruta API, componente)
       - Localizar archivos afectados y sus tests actuales
       - Identificar las capas impactadas:
         DB schema → Servicio de dominio → API route → Componente UI

[ ] 5. Definir contratos ANTES de la lógica (si hay cambios de interfaz):
       - DTOs de entrada/salida (tipos TypeScript o Zod schemas)
       - Firma del servicio (Result<T, DomainError>)
       - Contrato de la API route (método, path, request body, response shape)
       → Solo cuando los contratos estén definidos → pasar a Fase 1
```

**Principio de minimalismo (aplicar durante TODO el ciclo):**

> Cambiar SOLO lo estrictamente requerido por la tarea.  
> No refactorizar código adyacente. No "mejorar de paso".  
> Tres líneas similares son mejores que una abstracción prematura.

---

### 2.1 Fase 1: Pedido y Análisis

**Input del usuario (User Story Template):**

```markdown
## User Story: [Nombre del Feature]

### Descripción

Como [rol], quiero [acción], para que [beneficio].

### Criterios de Aceptación

- [ ] CA1: [Condición funcional específica y verificable]
- [ ] CA2: [Condición específica y verificable]
- [ ] CA3: [Condición específica y verificable]

### Mockup / Diseño

[URL de Figma, screenshot, o descripción textual]

### Tenant Objetivo

- wondernails | vigistudio | villafuerte | default: wondernails

### Prioridad

P0 | P1 | P2
```

**Output esperado (gate de entrega):**

```markdown
## Gate de Entrega: [Feature Name]

### Código

- [ ] Servicio con Result Pattern (OK/Err)
- [ ] API con withResultHandler()
- [ ] Tests unitarios (≥80% cobertura)
- [ ] Tests de integración (persistencia DB)
- [ ] Tests E2E (flujo completo con auth)
- [ ] Build, lint, typecheck pasan

### Validación

- [ ] `npm run agent:build` ✅
- [ ] `npm run agent:test` ✅ (vitest + playwright)
- [ ] `npm run validate` ✅ (full pipeline)

### Documentación

- [ ] `current_task.md` actualizado
- [ ] `debug_logs.md` actualizado (si hubo errores)
- [ ] Summaries QA/Architect/Dev Leader/PM actualizados
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

**GATE: No escribir código de implementación antes de que el plan esté completo.**

**Acciones:**

1. Identificar capas afectadas:
   - Base de datos (schema, migraciones)
   - Backend (servicios, API routes)
   - Frontend (componentes, páginas)
2. Diseñar contratos (DTOs, interfaces) — ya deben estar del paso 2.0.5
3. Definir estructura de tests
4. Documentar estrategia de validación: qué comandos se correrán y en qué orden

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

### Contratos definidos

- [ ] DTO entrada: `{ field: string; tenantId: string }`
- [ ] DTO salida: `Result<T, DomainError>`
- [ ] API shape: `POST /api/[feature]` → `{ ok: true, data: T } | { ok: false, error: string }`

### Estrategia de validación

- [ ] Build: `npm run build`
- [ ] Unit: `npm run test:unit -- --grep "[feature]"`
- [ ] API proof: curl a endpoint + guardar respuesta en `tests/evidence/`
- [ ] E2E headed: `npm run test:e2e:subset -- --headed --grep "[feature]"`
- [ ] E2E headless: `npm run test:e2e:subset -- --grep "[feature]"`

### Dependencias

- [ ] Nueva migración de DB
- [ ] Ninguna dependencia externa nueva

### Asunciones / defaults

(Si el usuario no respondió preguntas abiertas, documentar defaults adoptados)
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
describe("[Feature]Service", () => {
  // Happy path
  it("should [action] successfully", async () => {});

  // Validation
  it("should reject invalid [input]", async () => {});

  // Business rules
  it("should enforce [rule]", async () => {});

  // Edge cases
  it("should handle [edge case]", async () => {});

  // Security
  it("should prevent unauthorized access", async () => {});
  it("should isolate tenant data", async () => {});
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
import { test, expect } from "@playwright/test";

test.describe("[Feature] E2E Flow", () => {
  test.use({ storageState: "tests/e2e/.auth/user.json" });

  test("should complete [feature] flow successfully", async ({ page }) => {
    // 1. Navigate
    await page.goto("/t/test-tenant/[feature]");

    // 2. Interact
    await page.click("text=Nuevo");
    await page.fill('[name="field"]', "value");
    await page.click('button[type="submit"]');

    // 3. Verify
    await expect(page.locator(".toast-success")).toBeVisible();
    await expect(page.locator("text=[resultado]")).toBeVisible();
  });

  test("should handle errors gracefully", async ({ page }) => {
    // Test de manejo de errores
  });
});
```

**Comando:**

```bash
npm run test:e2e:subset -- --grep "[feature]"
```

### 2.6 Fase 6: User Acceptance Test (UAT) — Validación como Persona

**⚠️ OBLIGATORIO antes de escribir tests E2E formales.**

**Propósito:** Validar que la feature funciona desde la perspectiva de un usuario real, no desde la del desarrollador.

**Pasos:**

1. **Generar documento UAT**
   - Usar template: `.agents/templates/USER_ACCEPTANCE_TEST_STEPS.md`
   - Rellenar: pasos del usuario, datos de prueba, resultado esperado por paso.
   - Guardar en: `docs/UAT/[feature]-uat-[fecha].md`

2. **Enviar a Product Owner**
   - Comando: `node scripts/send-uat-email.js [feature]-uat-[fecha].md`
   - Destinatario: `contacto@zostudio.com.mx` (configurable en `.env`)
   - Asunto: `UAT Pendiente: [Feature] — Favor validar`
   - Cuerpo: Resumen + link al documento + fecha límite sugerida.

3. **Ejecutar validación "como humano" con Playwright CLI**
   - Comando: `npm run agent:uat-test [feature]`
   - Este comando:
     - Lee el documento UAT.
     - Lanza Playwright en modo **headed** (ventana visible).
     - Velocidad: **lenta** (`--slow-mo 500`).
     - El agente (o un humano) sigue los pasos del UAT manualmente.
     - Captura screenshot en cada paso.
   - **Si un paso falla:** documentar en `debug_logs.md`, corregir código, regenerar UAT si es necesario.

4. **Checklist de UAT**
   - [ ] Todos los pasos del Happy Path pasan.
   - [ ] Los errores muestran mensajes amigables.
   - [ ] La UI responde en < 3s por paso.
   - [ ] Datos persisten tras recarga de página.
   - [ ] Screenshots de cada paso guardados en `test-results/uat/[feature]/`.

**Output:**

- Documento UAT validado.
- Screenshots de validación.
- Lista de selectores/textos que funcionan (se usarán para E2E automatizado).

---

### 2.7 Fase 7: Tests E2E Automatizados (basados en UAT validado)

**⚠️ Solo se ejecuta DESPUÉS de que UAT pase.**

**Propósito:** Convertir los pasos validados en UAT en tests E2E automatizados.

**Template de generación:**

```typescript
// tests/e2e/[feature]/[feature]-user-acceptance.spec.ts
// GENERADO AUTOMÁTICAMENTE DESDE docs/UAT/[feature]-uat-[fecha].md
import { test, expect } from "@playwright/test";

test.describe("[Feature] — User Acceptance (basado en UAT validado)", () => {
  test("Happy Path", async ({ page }) => {
    // Paso 1: [del UAT]
    await page.goto("/t/[tenant]/login");
    // ... etc
  });
});
```

**Comando:**

```bash
npm run test:e2e:subset -- tests/e2e/[feature]/
```

---

### 2.8 Fase 8: Loop de Corrección

**Si algún paso de validación falla — taxonomía por tipo de error:**

```
TIPO A: Error de compilación (TypeScript / build)
  → STOP INMEDIATO. No continuar con ningún otro paso.
  → Leer error completo. Localizar archivo + línea.
  → Fix. Re-correr SOLO: npm run typecheck -- --noEmit
  → Cuando compile → retomar el paso de validación que falló.

TIPO B: Fallo en tests unitarios
  → Leer stack trace completo. Localizar source + línea.
  → Fix en la capa rota (no parchear el test para que pase).
  → Re-correr SOLO el test que falló: npm run test:unit -- --grep "[test name]"
  → Solo cuando pase → continuar con los demás tests.

TIPO C: Error en runtime / API (servidor corriendo)
  → Revisar logs del servidor (terminal donde corre npm run dev).
  → Inspeccionar configuración: variables de entorno, puerto, .env.local.
  → Fix. Reiniciar servidor si el fix afecta config.
  → Re-verificar con curl / fetch solo el endpoint afectado.

TIPO D: Error en UI / browser (Playwright)
  → **Antes del fix** (e2e-validation.md §3.0): diagnosticar, informar qué está mal y el plan de corrección, reproducir con Playwright CLI headed (`--trace on`, screenshots).
  → Capturar screenshot del estado de error:
    await page.screenshot({ path: "test-results/error-[paso].png", fullPage: true })
  → Revisar consola del navegador (page.on('console')) y Network tab.
  → Fix en la capa rota (componente / hook / query).
  → **Post-fix:** re-validar Playwright CLI headed → headless del subset (§3.0.4); luego UT del módulo si aplica.
  → NUNCA deshabilitar el test para que "pase".
```

**Regla de iteración:** Re-ejecutar el PASO EXACTO que falló, no toda la suite.  
Esto evita perder tiempo y contexto corriendo validaciones ya verdes.

```
┌─────────────────────────────────────────────────────────────┐
│                    LOOP DE CORRECCIÓN                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CAPTURAR error completo                                 │
│     npm run test:xxx 2>&1 | tee .agents/session/error.log   │
│                                                              │
│  2. CLASIFICAR tipo (A/B/C/D según taxonomía arriba)        │
│                                                              │
│  3. ANALIZAR causa raíz                                     │
│     - Comparar con debug_logs.md                            │
│     - Identificar patrón                                    │
│     - Comunicar al dueño: qué falla + plan de fix           │
│                                                              │
│  4. REPRODUCIR (Tipo D / fallos E2E post-implementación)    │
│     - Playwright CLI headed --trace on (e2e-validation §3.0)│
│     - Evidencia en test-results/ + MANUAL_REPRODUCTION_STEPS│
│                                                              │
│  5. CORREGIR código — un cambio a la vez                    │
│     - Documentar en current_task.md / implementacion.md     │
│                                                              │
│  6. RE-EJECUTAR el paso EXACTO que falló (no toda la suite) │
│     - Tipo A → typecheck, Tipo B → test:unit --grep "X"     │
│     - Tipo C → curl al endpoint                             │
│     - Tipo D → headed subset → headless subset (§3.0.4)   │
│                                                              │
│  7. DOCUMENTAR si es nuevo error                            │
│     - Agregar a debug_logs.md                               │
│     - Agregar caso borde a test_cases.md                    │
│                                                              │
│  8. REPETIR hasta PASS (máx 5 intentos)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.9 Fase 9: Validación de Sitio Completo + Auto-Correct + Deploy

**⚠️ OBLIGATORIA. No se puede reportar ninguna tarea como completa sin esta fase.**

**Ver protocolo completo en:** `.agents/protocols/e2e-validation.md` §8

#### Resumen ejecutivo del pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│              PIPELINE OBLIGATORIO — CIERRE DE TODA TAREA            │
├──────┬──────────────────────────────────────────────────────────────┤
│  1   │ LEVANTAR servidor si no está activo                          │
│      │ → npm run dev (background)                                   │
│      │ → Esperar health check /api/health (máx 90s)                 │
├──────┼──────────────────────────────────────────────────────────────┤
│  2   │ TOUR DE SITIO COMPLETO — Playwright headed --slow-mo 300     │
│      │ → Landing, Auth, Admin global, Tenant admin, Finance,        │
│      │   Inventory, Bookings, POS (rutas del §8.2)                  │
│      │ → Simular usuario real: cargar, interactuar, verificar       │
├──────┼──────────────────────────────────────────────────────────────┤
│  3   │ CORREGIR AUTOMÁTICAMENTE cada error detectado               │
│      │ → No reportar al usuario: corregir y seguir                  │
│      │ → Árbol de diagnóstico: §3 de e2e-validation.md             │
├──────┼──────────────────────────────────────────────────────────────┤
│  4   │ REINICIAR y RE-VALIDAR (máx 5 ciclos)                       │
│      │ → Volver al paso 2 hasta tour completo sin errores           │
│      │ → Si ciclo > 5: BLOQUEO documentado, reportar al usuario     │
├──────┼──────────────────────────────────────────────────────────────┤
│  5   │ GATE FINAL headless                                          │
│      │ → npm run test:e2e (suite completa, no solo subset)          │
│      │ → npm run build                                              │
│      │ → npm run lint && npm run typecheck                          │
│      │ → 0 errores en los tres comandos → continuar                 │
├──────┼──────────────────────────────────────────────────────────────┤
│  6   │ APAGAR servicios levantados por el agente                    │
│      │ → Stop-Process node (PowerShell) o kill %1 (Bash)           │
├──────┼──────────────────────────────────────────────────────────────┤
│  7   │ DEPLOY de todo lo corregido                                  │
│      │ → git add (archivos específicos, no -A ciego)                │
│      │ → git commit (Conventional Commits, body con bullets)        │
│      │ → git push origin HEAD                                       │
│      │ → gh pr create / actualizar PR existente                     │
└──────┴──────────────────────────────────────────────────────────────┘
```

#### Criterio de "tarea completa"

Solo cuando:

- Tour de sitio completo: 0 errores visuales ni de red en todas las rutas críticas
- `npm run test:e2e`: 0 tests fallidos
- `npm run build`: exitoso
- Commit + push realizados

**Si alguno de los puntos anteriores falla, la tarea NO está completa.**

---

### 2.8 Fase 8: Video Demo

**Grabación automática con Playwright:**

```typescript
// tests/e2e/demo/[feature]-demo.spec.ts
import { test } from "@playwright/test";

test("[Feature] Demo Video", async ({ page, context }) => {
  // Configurar grabación
  await context.tracing.start({ screenshots: true, snapshots: true });

  // Ejecutar flujo completo
  await page.goto("/t/test-tenant/dashboard");
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

### Validación de Sitio Completo (OBLIGATORIA)

- [ ] Tour de sitio completo ejecutado (headed, Playwright CLI)
- [ ] 0 regresiones en todas las rutas críticas (landing, auth, admin, finance, inventory, bookings, POS)
- [ ] `npm run test:e2e` headless completo: 0 fallidos
- [ ] `npm run build`: exitoso
- [ ] `npm run lint && npm run typecheck`: sin errores

### Artefactos de evidencia (guardar en `tests/evidence/[STRY-XXX]/`)

- [ ] `build.log` — snippet del output de `npm run build` exitoso
- [ ] `unit-tests.log` — output de `npm run test:unit` con resultados
- [ ] `api-proof.json` — si hay cambios en API: request + response HTTP real capturado con curl/fetch
- [ ] `screenshots/` — pantallazos de los estados clave del flujo UI validado
- [ ] `MANUAL_REPRODUCTION_STEPS.md` — pasos numerados para que un humano replique el escenario sin contexto adicional

### Deploy

- [ ] Servicios dev detenidos limpiamente
- [ ] Commit creado (Conventional Commits)
- [ ] Push a rama activa realizado
- [ ] PR creado / actualizado

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
1. Ejecutar validación completa del feature (headless subset)
2. Ejecutar tour de sitio completo headed (§8.2 e2e-validation.md)
3. Corregir automáticamente cualquier regresión encontrada
4. Re-validar hasta 0 errores en sitio completo
5. Gate final: npm run test:e2e + npm run build
6. Apagar servidor dev levantado por el agente
7. Deploy: commit + push + PR
8. Generar video demo
9. Actualizar memoria histórica
10. Marcar current_task.md como COMPLETADO
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

| Fase              | Tiempo         | Automatizable |
| ----------------- | -------------- | ------------- |
| Planificación     | 5-10 min       | ✅ 100%       |
| Desarrollo        | 30-60 min      | ✅ 90%        |
| Tests UT          | 10-15 min      | ✅ 100%       |
| Tests Integración | 10-15 min      | ✅ 100%       |
| Tests E2E         | 15-20 min      | ✅ 100%       |
| Correcciones      | 15-30 min      | ✅ 80%        |
| Video Demo        | 5-10 min       | ✅ 90%        |
| **Total**         | **90-160 min** | **✅ 90%**    |

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
          node-version: "20"

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

_Este protocolo permite desarrollo autónomo de principio a fin._
