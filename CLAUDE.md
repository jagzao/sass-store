# CLAUDE.md — Instrucciones para Claude Code

## Regla Obligatoria: Validación E2E al terminar implementaciones

**Proceso obligatorio en 4 pasos — no reportar como terminado sin completarlos todos.**

### Workflow con plan / story en curso (tras codificar)

En cuanto hay **codificación** aplicada al plan (`plan.md`) o a la US activa, **antes** de pedir visto bueno al dueño el agente debe correr **Playwright CLI** como haría una persona: **headed** primero (inspección visual y flujos de `testing-usuario.md`), iterar fixes, materializar en `tests/e2e/`, y cerrar en **headless**. No es opcional ni sustituible por “solo unit tests”. Detalle: `AGENTS.md` (transición tras codificación + Fase 4).

### Paso 1 — Playwright CLI headed (**agente**, como lo haría una persona)

El **agente** corre Playwright con browser visible para cazar errores de UI/UX y corregirlos. **No** es tarea del dueño reemplazar este paso; el dueño solo da **visto bueno** al final sobre lo ya verde (ver `AGENTS.md` § 1.4).

```bash
# Feature específico, headed
npm run test:e2e:subset -- --headed --grep "nombre del feature o tenant"

# Tenant específico, headed
npm run test:e2e:subset -- --headed --grep "centro-tenistico|nombre-tenant"

# Validación visual completa
npm run test:e2e -- --headed
```

### Paso 2 — Fix & iterate si hay errores

Si se detecta cualquier error o comportamiento no deseado durante la validación visual:

1. Corregir el código
2. Volver a correr el paso 1
3. Repetir hasta que el flujo se vea y funcione correctamente

**No avanzar al paso 3 si hay algo roto o incorrecto visualmente.**

### Paso 3 — Crear o actualizar tests E2E

Con la app validada y funcionando:

- Crear tests en `tests/e2e/` que cubran el flujo validado (`.spec.ts`)
- Actualizar tests existentes si el comportamiento cambió
- Cubrir: happy path + validaciones + casos de error

### Paso 4 — Ejecutar los tests (deben pasar)

```bash
# Headless — deben pasar limpios
npm run test:e2e:subset -- --grep "nombre del feature o tenant"
```

Si algún test falla → corregir test o código → re-ejecutar → debe pasar limpio.

---

**Aplica a:**
- Nuevos componentes o páginas (landing, hero, sections)
- Cambios en estilos globales (globals.css, TenantStyles)
- Cambios en rutas o layouts de tenant
- Cambios en autenticación, lógica de negocio o flujos de usuario
- Cualquier fix de UI o diseño

**🚨 No reportar implementación como "lista" hasta que los 4 pasos estén completos.**

---

## User Stories, sprint y reuniones

- Toda entrega y plan de cambios va **ligada a una User Story** (`docs/stories/…`) y a la carpeta operativa `.agents/sprint/{STRY-XXX-slug}/` con `plan.md`, `implementacion.md`, `testing-usuario.md` (detalle en `AGENTS.md` § User Stories).
- Si el usuario pide **analizar una reunión u observaciones**, preguntar si deben incorporarse a la **story en curso** y actualizar esos artefactos; no cerrar el análisis sin esa decisión explícita.
- **DoD:** una US solo es `done` y solo entonces **push/publicar** después de: implementación completa, test + fix + **retest UT** verde, **Playwright CLI** (headed + headless) del flujo E2E completo de la US ejecutado por el **agente**, cumplimiento de **`AGENTS.md` § 1.3**, y **tu visto bueno** (no segunda ronda de QA: tú apruebas lo **ya** probado y corregido). Ver `AGENTS.md` § 1.2, § 1.3 y § 1.4.

## Stack Principal

Ver `AGENTS.md` para reglas de arquitectura, Result Pattern (MANDATORIO), y estructura del monorepo.

## Tests

- Unit: `npm run test:unit`
- E2E: `npm run test:e2e`
- E2E subset: `npm run test:e2e:subset -- --grep "X"`
- Usuario de testing estándar (admin): `jagzao@gmail.com/admin`
- Coverage targets: rutas críticas >80%, lógica de negocio >70%

## Tenants

Cada tenant debe tener su propio look & feel con landing propia en:
`apps/web/components/tenant/[slug]/`

Registrar en `apps/web/app/t/[tenant]/page.tsx`.
