# Repository Guidelines

## Project Structure & Module Organization

- **Monolith Architecture**: `apps/web` is the Next.js App Router application (port 3001) containing both UI and API routes.
- Keep routes under `apps/web/app/**`, shared widgets inside `apps/web/components/**`, API handlers in `apps/web/app/api/**`, and domain services under `apps/web/lib/**`.
- Reusable schema, UI primitives, and configs belong inside `packages/*`; update them first, then propagate changes into individual apps.
- Tests live in `tests/{unit,integration,e2e}` with fixtures at `tests/utils`; migrations, automation, and docs stay in `migrations/`, `commands/`, `tools/`, and `docs/`.

## Result Pattern Implementation

**🔥 MANDATORY: All new code must use Result Pattern for error handling**

### Core Principles

1. **No more try/catch in business logic** - Use Result<T, E> pattern instead
2. **Explicit error types** - All errors must be typed DomainError variants
3. **Composable operations** - Chain Results with map, flatMap, and combinators
4. **Type-safe validation** - Use Zod schemas with Result integration

### Required Imports

```typescript
// Core Result pattern
import { Result, Ok, Err, match } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
```

### Standard Patterns

#### ✅ CORRECT: Result Pattern

```typescript
// API Route
export const GET = withResultHandler(
  async (request): Promise<Result<Product, DomainError>> => {
    return await getProduct(id)
      .flatMap(validateProduct)
      .flatMap(checkPermissions);
  },
);

// Service Layer
export const getProduct = (
  id: string,
): Promise<Result<Product, DomainError>> => {
  return fromPromise(db.products.findUnique({ where: { id } }), (error) =>
    ErrorFactories.database(
      "find_product",
      `Failed to find product ${id}`,
      undefined,
      error,
    ),
  );
};

// Validation
const validateProduct = (
  product: Product,
): Result<Product, ValidationError> => {
  return validateWithZod(ProductSchema, product);
};
```

#### ❌ FORBIDDEN: Old try/catch

```typescript
// DO NOT USE THIS PATTERN
export async function GET(request: NextRequest) {
  try {
    const product = await getProduct(id);
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
```

### Error Handling Rules

1. **Always use typed errors**: Never return raw `Error` objects
2. **Use appropriate error factories**: `ErrorFactories.notFound()`, `ErrorFactories.validation()`, etc.
3. **Match Results explicitly**: Use `match()` for branching logic
4. **Log with context**: Use `logResult()` for consistent logging

## Build, Test, and Development Commands

- `npm run dev` boots the monolith web application (port 3001) with all API routes included.
- `npm run build`, `npm run lint`, and `npm run typecheck` are mandatory before any PR.
- Test with `npm run test[:unit|:integration|:e2e]`; narrow Playwright via `npm run test:e2e:subset -- --grep "booking"`.
- Run `npm run db:generate`, `npm run db:push`, and `npm run db:seed` from the root directory whenever schema changes land.

## Coding Style & Naming Conventions

- TypeScript is strict with 2-space indentation, trailing commas, and formatting enforced by `npx prettier --write`.
- Components use PascalCase filenames, hooks start with `use`, helpers stay camelCase, and constants use UPPER_SNAKE_CASE.
- Keep server-only logic in `app/(...)/route.ts` files, avoid `any`, prefer Result<T, E> pattern, and export types separately for treeshaking.

### Result Pattern Naming

- **Service functions**: Return `Result<T, DomainError>`
- **API handlers**: Use `withResultHandler()` middleware
- **Validation**: Use `validateWithZod()` or `CommonSchemas`
- **Error types**: Import from `ErrorFactories`
- **Combinators**: Use `pipe()`, `map()`, `flatMap()` for chaining

## Testing Guidelines

### Result Pattern Testing

- **Test both success and failure paths**: Always test Result branches
- **Use expectSuccess/expectFailure**: Helper functions for testing Results
- **Mock error scenarios**: Test DomainError variants
- **Use data builders**: Avoid brittle hardcoded test data

```typescript
describe("Product Service", () => {
  it("should return product when found", async () => {
    const result = await getProduct("valid-id");
    expectSuccess(result).toEqual(expectedProduct);
  });

  it("should return NotFoundError when product missing", async () => {
    const result = await getProduct("invalid-id");
    expectFailure(result).toEqual(
      expect.objectContaining({
        type: "NotFoundError",
        resource: "Product",
      }),
    );
  });
});
```

- Vitest specs live in `tests/{unit,integration}` as `*.spec.ts`; Playwright targets port 3001 and writes artifacts to `test-results/`.
- Maintain >=80% logic coverage and log plan changes in `TESTING_IMPLEMENTATION_SUMMARY.md`.
- Use fixtures from `tests/utils`, stub API calls through `apps/web/lib/**`, and favor data builders over brittle IDs.

### Agent-Specific Testing Guides

Each agent role has a dedicated **Implementation Summary** that serves as the operational source of truth for that area. **These documents must be updated after every significant PR.**

- **QA Leader**: `QA_LEADER_IMPLEMENTATION_SUMMARY.md` — Coverage inventory, pass/fail status, test debt, release validation checklist.
- **Architect**: `ARCHITECT_IMPLEMENTATION_SUMMARY.md` — ADRs, pattern adoption status, architectural debt, technology inventory.
- **Dev Leader**: `DEV_LEADER_IMPLEMENTATION_SUMMARY.md` — Coding standards, PR checklist, coverage targets, onboarding guide.
- **Product Manager (PM)**: `PM_IMPLEMENTATION_SUMMARY.md` — Feature inventory, roadmap, active bugs, KPIs, acceptance criteria.

## Migration Strategy

### Phase 1: New Code (Immediate)

- All new features MUST use Result Pattern
- Update AGENTS.md examples as code is written
- Refactor only when touching existing files

### Phase 2: Critical Paths (Next Sprint)

- High-traffic API endpoints
- Authentication and authorization flows
- Payment and billing operations

### Phase 3: Complete Migration (Following Sprints)

- All API routes
- Service layer functions
- Validation logic

### Migration Checklist

For each file migrated:

- [ ] Replace try/catch with Result<T, E>
- [ ] Import required Result pattern utilities
- [ ] Use typed error factories
- [ ] Update tests to use expectSuccess/expectFailure
- [ ] Verify middleware integration
- [ ] Update documentation

## Commit & Pull Request Guidelines

- Follow Conventional Commits (example: `feat(auth): add OAuth2 flow with Result pattern`) and mention the primary test command executed.
- PRs must satisfy `.github/pull_request_template.md`: declare type, severity, scope, link any plan artifacts, attach `agents/bundles/{id}` bundles, list risks, and include UI screenshots when relevant.
- **Result Pattern compliance is mandatory** - PRs with old try/catch patterns will be rejected
- Never push directly to `main`; open PRs only after `npm run build`, `npm run lint`, and targeted suites pass.

## Security & Agent Workflow Tips

- Keep secrets out of git, copy `.env.example` into `.env.local`, enforce tenant isolation with RLS filters, and sanitize rendered HTML.
- Run `npm run security:autofix` before releases and avoid storing credentials in fixtures or docs.
- Start automation with `npm run swarm:start "<feature name>"` so PM -> Architect -> QA -> Security agents ship assets in `docs/prd/` and `agents/bundles/`.

### Result Pattern Security Benefits

- **Explicit error boundaries**: No exception leaks
- **Sanitized error messages**: User-safe error responses
- **Audit-friendly**: All errors are logged with context
- **Type-safe validation**: Prevents injection attacks

## Performance Guidelines

### Result Pattern Performance

- **Use combinators efficiently**: Chain operations to avoid nested matches
- **Lazy error creation**: Use ErrorFactories for error construction
- **Cache Results**: Use `ResultCache` for expensive operations
- **Async chaining**: Use `asyncFlatMap()` for async operations

```typescript
// Efficient chaining
const result = await pipe(getUser(id))
  .flatMap(validateUser)
  .flatMap(checkPermissions)
  .flatMap(loadUserData);

// With caching
const userCache = new ResultCache<string, User, DomainError>(300000); // 5 minutes
const cachedUser = await userCache.getOrCompute(id, () => getUser(id));
```

## Debugging & Monitoring

### Result Pattern Debugging

- **Use structured logging**: All Result operations support logging
- **Track error chains**: Use tap/tapError for debugging
- **Monitor performance**: Use withPerformanceTracking wrapper
- **Error aggregation**: Use combineAll for batch operations

```typescript
// Debugging Result chain
const result = await pipe(getProduct(id))
  .tap((product) => console.log("Product loaded:", product.id))
  .tapError((error) => console.error("Product load failed:", error.type))
  .flatMap(validateProduct);

// Performance monitoring
const trackedOperation = withPerformanceTracking(expensiveOperation, {
  name: "product-load",
  threshold: 1000,
});
```

## Agent-Specific Guidelines

### Product Manager (PM)

- **Ensure Result Pattern compliance** in feature requirements
- **Plan migration capacity** for Result Pattern adoption
- **Validate error handling UX** in mockups

### Architect Agent

- **Design Result Pattern flows** for all new features
- **Create DomainError variants** for business logic
- **Validate Result chain compositions**

### Developer Agent

- **Implement Result Pattern strictly** - no exceptions
- **Use proper error factories** and combinators
- **Write comprehensive Result tests**

### QA Agent

- **Test both success/failure paths** thoroughly
- **Verify error messages** are user-friendly
- **Test error boundaries** and edge cases

### Security Agent

- **Validate no exception leaks** in error responses
- **Check error sanitization** in API responses
- **Audit DomainError types** for information disclosure

---

---

## 🎭 Regla Obligatoria: Validación E2E con Playwright CLI

**Proceso obligatorio en 4 pasos — NUNCA reportar como terminado sin completarlos todos.**

### Paso 1 — Playwright CLI headed (**lo ejecuta el agente**, como haría una persona)

El **agente** corre Playwright en modo headed para inspeccionar flujos, cazar errores visuales o de UX y corregirlos **antes** de pedirte nada. El **dueño no** sustituye este paso: tú solo das **visto bueno** al final sobre trabajo **ya** probado, corregido y verde por CLI (ver § 1.4).

```bash
# Feature específico, headed
npm run test:e2e:subset -- --headed --grep "nombre-del-feature"

# Tenant específico, headed
npm run test:e2e:subset -- --headed --grep "wondernails|centro-tenistico"

# Validación visual completa
npm run test:e2e -- --headed
```

### Paso 2 — Fix & iterate si hay errores

Si se detecta cualquier error o comportamiento no deseado:

1. Corregir el código
2. Volver al paso 1
3. Repetir hasta que el flujo se vea y funcione correctamente

**No avanzar al paso 3 si algo está roto o incorrecto visualmente.**

### Paso 3 — Crear o actualizar tests E2E

Con la app validada y funcionando:

- Crear tests en `tests/e2e/` que cubran el flujo validado (`.spec.ts`)
- Actualizar tests existentes si el comportamiento cambió
- Cubrir: happy path + validaciones + casos de error

### Paso 4 — Ejecutar los tests (deben pasar)

```bash
# Headless — deben pasar limpios
npm run test:e2e:subset -- --grep "nombre-del-feature"
```

Si algún test falla → corregir test o código → re-ejecutar → debe pasar limpio.

### Aplica a

- Nuevos componentes, páginas o rutas
- Cambios en autenticación (login, registro, OAuth)
- Cambios en estilos globales o layouts de tenant
- Cualquier fix de UI, lógica de negocio o flujo de usuario

**🚨 NUNCA reportar una implementación como "lista" sin completar los 4 pasos.**

**Dueño de producto:** no se te debe pedir “probar la app” como QA. Lo que recibes es un paquete **ya validado** por el agente (headed + headless + UT); tu acción es **visto bueno** o rechazo con motivo concreto, no repetir toda la batería.

---

## Plan robusto de testing (trigger explícito del dueño)

Cuando el usuario pida explícitamente un **plan robusto**, **testing robusto**, **QA exhaustivo** o frases equivalentes sobre una feature, story o la app completa, el agente **debe** ir más allá del happy path E2E y documentar/ejecutar (en `plan.md`, `testing-usuario.md` y alineado con `docs/TESTING_MASTER_PLAN.md`):

1. **Crawler / smoke de grafo de rutas** — Recorrido que **descubre o recorre enlaces internos** (navegación, footers, CTAs) desde puntos de entrada por tenant; objetivo: **sin 404**, **sin errores de consola no capturados**, **sin pantallas en blanco**. Puede implementarse con Playwright (visitar URLs seed + extraer `a[href]` del mismo origen y cola acotada), script de link-check contra lista de rutas, o herramienta equivalente; dejar **lista de URLs** y **límite de profundidad** en el plan.
2. **Negative testing** — Matriz explícita de fallos esperados: credenciales inválidas, sesión expirada, **cross-tenant** (IDs de otro tenant), permisos insuficientes (rol staff vs admin), payloads inválidos / límites Zod, recursos inexistentes (404/NotFound), **429** / quotas, timeouts y red degradada (abort, offline simulado donde aplique), doble envío / idempotencia, estados ilegales en UI (botón sin permiso, formulario incompleto).
3. **Contrato API negativo** — Donde haya API: mismos casos que (2) vía integración o E2E interceptando respuestas; verificar **ProblemDetails** / códigos HTTP y que **no** se filtre stack ni datos de otro tenant.
4. **Regresión multitenant** — Repetir escenarios críticos y negativos en **cada slug** listado para la entrega (ver barrera del agente en User Stories § 1.3).
5. **Seguridad y privacidad (smoke)** — Headers/CSP donde existan, sanitización de HTML, cookies/sesión en rutas protegidas, CSRF en formularios que lo requieran (según stack).
6. **Resiliencia ligera** — Recarga a mitad de flujo, navegación atrás/adelante, cancelar diálogos, pérdida breve de red en pasos críticos (si el entorno lo permite).
7. **A11y y viewport** — Al menos un recorrido **solo teclado** y una variante **viewport móvil** en los flujos de la story.
8. **Observabilidad** — Tras acciones críticas, comprobar que existen logs/auditoría acordados (ver plan maestro), sin exigir producción si no aplica al entorno.

**Fuente de verdad ampliada:** `docs/TESTING_MASTER_PLAN.md` (§13 crawler, §14 negativos, §15 dimensiones adicionales, §16 anexos). Los pasos (1)–(8) deben reflejarse en tablas de `testing-usuario.md` cuando el trigger sea de **app completa** o US de plataforma; para US acotadas, incluir al menos **crawler acotado al módulo**, **negativos del dominio** y **multitenant** si aplica.

---

---

## 🏢 Nuevo Workflow: User Stories + Autonomía Total

A partir de 2026-04-28, el proyecto opera con **User Stories** como unidad de trabajo y un **orquestador de agentes** para autonomía completa.

---

### 1. Estructura de User Stories

Las historias se gestionan en `docs/stories/`:

```
docs/stories/
├── BACKLOG.md              # Inventario de todas las stories
├── _template.md            # Template para nuevas stories
├── inbox/                  # Cola móvil/async: QUEUE.md + README (ver .agents/protocols/mobile-remote-async.md)
│   ├── README.md
│   └── QUEUE.md
├── active/                 # Stories en progreso
│   └── STRY-XXX-*.md
└── completed/              # Stories terminadas
    └── STRY-XXX-*.md
```

#### 1.1 Carpeta de sprint por User Story (`.agents/sprint/`)

Cada entrega al cliente está **ligada a una User Story**. Además del markdown canónico en `docs/stories/`, cada story activa tiene una carpeta operativa para la **fábrica de desarrollo autónoma**:

```
.agents/sprint/{STRY-XXX-nombre-corto}/
├── plan.md                 # Plan de ejecución (orden de tareas, archivos, APIs, riesgos) — guía para implementar la US de punta a punta sin ambigüedad
├── implementacion.md       # Alcance de implementación enlazado a los CA de la US: desarrollo, testing exhaustivo de inicio a fin, implementación final y trazabilidad AC → código → tests
└── testing-usuario.md      # Pasos reproducibles que el **agente / QA automatizado** ejecuta (no el PO manual); mismo documento es la **fuente de verdad** para escribir y mantener pruebas Playwright CLI (`test:e2e:subset`, `grep` por story o tag)
```

**Credencial de prueba estándar (multitenant):** `jagzao@gmail.com` / `admin` — usar por defecto en `testing-usuario.md` y en Playwright salvo que la US exija otro rol documentado.

**Reglas obligatorias para el agente**

1. **Análisis de reuniones u observaciones**: Si el usuario pide analizar una reunión, notas, o un conjunto de observaciones, el agente debe **preguntar explícitamente** si ese contenido debe incorporarse a la **User Story en curso** (`docs/stories/active/`) y, en caso afirmativo, actualizar la story y los tres artefactos bajo `.agents/sprint/{id}/` (no dejar hallazgos sueltos).
2. **Planes y cambios**: Todo plan de trabajo, diff conceptual o lista de cambios debe **nombrar y enlazar** el ID de la story (`STRY-XXX`) y, cuando exista, la ruta `.agents/sprint/{STRY-XXX-…}/`.
3. **Orden de creación**: Al mover o crear una story en `active/`, crear o completar de inmediato la carpeta `.agents/sprint/{mismo-id-slug}/` y mantener `plan.md` → `implementacion.md` → `testing-usuario.md` alineados con el estado de la story.

El protocolo detallado del orquestador (fases y checklists) vive en `.agents/protocols/story-orchestrator.md`.

**Comunicación desde el celular / async:** dejar pedidos en `docs/stories/inbox/QUEUE.md` (GitHub móvil) y en Cursor pedir **“procesá inbox”**; respuestas y estado en el mismo archivo o en PR. Detalle: `.agents/protocols/mobile-remote-async.md`.

#### 1.2 Definición de Hecho (DoD) — cuándo marcar la US completa y publicar

Una User Story **solo** pasa a estado **completa** (`done`) y al flujo **subir cambios + publicar** cuando se cumplen **todas** las condiciones siguientes, en orden:

1. **Implementación completa** según los CA de la story y `implementacion.md`.
2. **Testeada** por el agente (flujos principales y errores previstos).
3. **Corregida (fix)** — bugs encontrados en QA resueltos en código o en tests.
4. **Retesteada con tests unitarios** — `npm run test:unit` (o subset acordado del alcance de la US) **verde** después de los fixes.
5. **Barrera del agente (§ 1.3)** — `testing-usuario.md` basado en la US/CA, proyecto levantado, acceso con `jagzao@gmail.com`/`admin` **en cada slug** listado como tenant activo (o resuelto con seed/usuario por tenant), **todos** los escenarios del documento ejecutados con éxito **en cada uno de esos tenants**; fallos corregidos y re-ejecutado hasta verde.
6. **Playwright CLI — flujo E2E completo de la US** — `npm run test:e2e:subset` (o suite acordada) con **grep/tag alineado a la story** (p. ej. `STRY-001`), **headless**, sin skips obligatorios del alcance.
7. **Visto bueno del dueño de producto** (tú) — **no** es una segunda ronda de QA: es la **aprobación explícita** sobre entrega **ya** probada, corregida y validada por el agente (§ 1.3 + Playwright CLI § 1.2.6). Registrada en story, PR o chat. El agente **no** marca `done` ni mueve a `completed/` sin este paso.
8. **Solo después del punto 7:** actualizar estado a `done`, mover `docs/stories/active/` → `docs/stories/completed/`, `BACKLOG.md`, summaries; **commit**; **push** (rama/PR); **publicar** según el pipeline del equipo (p. ej. merge a main, deploy Vercel/staging/prod).

Si falta cualquier punto anterior al 7, la story permanece en `dev` o `qa`, no en `done`.

#### 1.3 Barrera del agente (QA exhaustivo antes del visto bueno)

Antes de decir “lista para tu **visto bueno**”, el agente **debe** haber hecho lo siguiente. Objetivo: **encontrar errores como haría un usuario** (flujos, bordes, tenants), **corregirlos al momento** y dejar **Playwright CLI + UT** en verde. **Tú no re-ejecutas** esta fase; solo confirmas sobre trabajo ya cerrado técnicamente.

1. **Plan en `testing-usuario.md`** — El documento debe estar **derivado de la US y los CA** (tablas de pasos por escenario, precondiciones, resultados esperados). No basta un esqueleto vacío: debe reflejar lo que se va a ejecutar. **Multitenancy:** si la funcionalidad aplica por tenant, el doc debe listar los **tenants activos** del entorno y repetir los escenarios relevantes **por cada slug** (salvo que la US limite explícitamente el alcance a un solo tenant).
2. **Levantar el proyecto** — Si `npm run dev`, el servidor E2E (`scripts/start-e2e-server.js` o el que use el repo), DB o env fallan, el agente **diagnostica y corrige** (config, `.env`, puerto 3001, seeds, etc.) hasta que el entorno permita ejecutar los casos.
3. **Acceso y usuarios** — Por defecto: **`jagzao@gmail.com`** / **`admin`** en **cada slug** listado en `testing-usuario.md`. Si login, rol o datos faltan en un tenant, el agente **ajusta seed, crea usuario o corrige permisos** hasta completar los escenarios en **todos** los slugs del doc.
4. **Ejecución exitosa de todos los casos del documento** — Recorrer **cada** escenario/fila y **cada tenant** que el doc liste. Orden: **Playwright CLI `--headed`** (como persona) sobre esos pasos → fixes → **Playwright `headless`** (grep/tag de la US). **Todos en verde**. Si algo falla en un tenant: arreglar código, datos o tests; **re-ejecutar** los escenarios afectados en **todos** los tenants que el doc exija hasta cero fallos. El punto 6 del § 1.2 cierra con headless en regresión.
5. **Solo entonces** solicitar al dueño el **visto bueno** (punto 7 del § 1.2), con evidencia de comandos Playwright/UT y resumen por tenant si aplica.

#### 1.4 Rol del dueño: visto bueno (no sustituto de Playwright)

- **Agente:** validación exhaustiva con **Playwright CLI** (headed para inspección “como persona”, headless para regresión), más `testing-usuario.md` y UT; iterar **find bug → fix → re-run** hasta cero fallos en el alcance de la US (incl. **cada tenant** listado en el doc).
- **Dueño:** solo **prueba o revisa lo que ya está validado y corregido**; tu interacción es **visto bueno final** (o rechazo motivado), **no** sustituir la batería E2E del agente ni “descubrir” lo que Playwright debió cubrir antes.

### 2. Estándar de Story

Cada story debe contener:

1. **Narrativa** — rol, acción, beneficio
2. **Criterios de aceptación Gherkin** — mínimo 3 (happy path, validación, error)
3. **Contrato técnico** — Zod schema + DomainError variants
4. **Impacto multitenancy** — tablas, RLS, tenant de prueba
5. **Plan de implementación** — servicio → API → UI → UAT → E2E
6. **Checklist de calidad** — build, lint, typecheck, tests, cobertura

### 3. Orquestador de Agentes (Ciclo Autónomo)

Cuando el usuario dice `Implementa [Nombre de Story]` (o `Implementa STRY-XXX`), el orquestador ejecuta **fases en orden estricto, una tras otra**, **sin pedir autorización intermedia** al dueño para pasar de fase (no “¿continúo?”). Detalle: `.agents/protocols/story-orchestrator.md`.

```
Fase 0 — Amarrar alcance (preguntas + plan completo)
  → Fase 1 PM → Fase 2 Architect → Fase 3 Dev ⟲ Fase 4 QA (Playwright CLI headed+headless, UT)
       ↑__________________________|   bucle autónomo Dev↔QA hasta verde o tope de intentos
  → Notificación al usuario (implementación + validación agente listas)
  → Reviewer / dueño (visto bueno sobre evidencia; no segunda QA manual completa)
  → Publicación / `done` solo tras visto bueno (DoD § 1.2)
```

#### 3.0 Reglas de autonomía (obligatorias)

1. **Orden secuencial:** no iniciar **Fase 3 (código de negocio)** hasta que **Fase 2** esté cerrada en `plan.md` / story; no iniciar **Fase 4 (QA Playwright)** hasta que el tramo de **Fase 3** del plan para esa entrega esté implementado; **no saltar fases**.
2. **Preguntas al inicio (bloque único):** antes de codificar, el agente debe **agotar ambigüedades** en un **solo** mensaje con **todas** las preguntas necesarias al dueño **o** declarar explícitamente “cero preguntas abiertas”. **Solo si el dueño no responde en ese turno**, el agente **documenta defaults comentados** en `plan.md` (sección **Asunciones / defaults**) y **sigue**; si el dueño **sí** respondió, **no** sustituir sus respuestas por asunciones. No bloquear el pipeline salvo **decisión técnica irresoluble** (dos caminos incompatibles sin criterio en US/plan).
3. **Plan completo para el codificador:** `plan.md` debe incluir orden de trabajo **numerado**, archivos/rutas o capas a tocar, criterios de “hecho” por paso y riesgos — suficiente para que otro agente implemente **de inicio a fin** sin adivinar.
4. **Bucle Dev ↔ QA sin dueño:** si Fase 4 falla (Playwright, UT, build), el agente **vuelve a Fase 3**, corrige y **re-ejecuta Fase 4** automáticamente hasta verde o hasta el **tope de intentos** del protocolo (p. ej. 5 ciclos); **no** requiere permiso del dueño para cada iteración.
5. **Notificación final (agente):** cuando build + lint + typecheck + UT + Playwright (headed + headless según § 1.3) estén **verdes** en el alcance de la US, el agente **avisa al usuario** con resumen y evidencia (“implementado y validado por el agente; pendiente **reviewer**/visto bueno para merge/`done`”). El dueño **no** sustituye Playwright; el **reviewer** valida PR/diff según política del equipo (puede ser la misma persona que el dueño, pero el rol es distinto: revisión sobre trabajo ya verde). Skill del repo: **`.agents/skills/pr-reviewer/SKILL.md`** (`pr-reviewer` en `.agents/skills/definition.json`).

#### Fase 1: PM Agent (Análisis)

- Leer `docs/stories/active/` y `BACKLOG.md`
- Identificar si existe story para el feature solicitado
- Si no existe: crear desde `_template.md`
- **Bloque único de aclaraciones** (ver § 3.0): todas las preguntas al inicio, o cero + asunciones en `plan.md`
- Asegurar carpeta `.agents/sprint/{STRY-XXX-slug}/` con `plan.md`, `implementacion.md`, `testing-usuario.md` (crear o actualizar según la story) y que **`plan.md` esté completo** antes de pasar a Architect

#### Fase 2: Architect Agent (Diseño)

- Evaluar impacto en esquema existente
- Definir API contract (Zod + DomainError)
- Verificar necesidad de nuevas tablas/columnas
- Revisar deuda técnica relacionada
- Estimar tiempo y riesgos
- Guardar ADR en `ARCHITECT_IMPLEMENTATION_SUMMARY.md`

#### Fase 3: Dev Agent (Implementación)

- Branch: `feature/STRY-XXX-{nombre}`
- Seguir y actualizar `.agents/sprint/{STRY-XXX-slug}/plan.md` y `implementacion.md` conforme avance el código
- Implementar servicio con Result Pattern
- Implementar API con `withResultHandler()`
- Implementar UI (si aplica)
- Tests unitarios por cada servicio (expectSuccess/expectFailure)
- Documentar en `current_task.md`
- **No considerar la codificación “cerrada”** hasta encomendar la Fase 4 siguiente (el dueño no sustituye esto).

#### Transición obligatoria: tras la codificación (plan / story en implementación)

Cuando un **plan** (`plan.md` / US) está en ejecución y **ya hay código** entregado o tocado para ese alcance:

1. **Inmediatamente después de la codificación** (antes del visto bueno del dueño), el agente debe ejecutar pruebas **como las haría una persona**: navegación real, flujos completos documentados en `testing-usuario.md`, búsqueda activa de fallos de UI/UX y de regresión.
2. **Herramienta obligatoria:** **Playwright CLI** — en este orden: **`--headed`** primero (validación “humana” por el agente con ventana visible), corrección de bugs, luego fijar o ampliar `tests/e2e/*.spec.ts`, y por último **`headless`** en regresión (`grep`/`tag` de la US). Ver también `CLAUDE.md` (4 pasos E2E).
3. **Si falta escenario en el doc o en el spec**, ampliar `testing-usuario.md` y el código de prueba hasta que el comportamiento acordado en la US quede cubierto; no declarar listo por “solo UT”.

**Qué no es excusa:** no hay bloqueo técnico para esto en el repo; si algo no se “completó” antes fue por **alcance del spec** o por **no haber ejecutado aún el paso headed / no haber ampliado escenarios** — el agente debe cerrar esos huecos, no el dueño.

#### Fase 4: QA Agent (Validación — **toda** la ejecución Playwright la hace el agente)

- **Fuente de pasos**: `.agents/sprint/{STRY-XXX-slug}/testing-usuario.md` (derivado de la US y CA; ver **§ 1.3**)
- **Entorno**: Levantar app y dependencias; si falla el arranque, corregir hasta poder ejecutar pruebas
- **Acceso**: Por **cada** tenant listado en `testing-usuario.md`, probar `jagzao@gmail.com` / `admin` (salvo otra credencial en la US); si falla en un slug, seed/usuario/permisos hasta acceso OK **en todos** los listados
- **Paso 1**: Completar/ajustar `testing-usuario.md` y ejecutar **todos** los escenarios con éxito (**Playwright headed** donde aplique — ver `CLAUDE.md` — como exploración humana)
- **Paso 2**: Si hay errores → **volver a Fase 3** (fix código/datos/tests) → **re-entrar Fase 4** sin preguntar al dueño (**bucle Dev↔QA**, máx. intentos según `.agents/protocols/story-orchestrator.md`) hasta **todos** los casos del doc en verde o bloqueo documentado
- **Paso 3**: Crear/actualizar tests E2E basados en `testing-usuario.md` ya validado por ejecución
- **Paso 4**: **Playwright CLI headless** — deben pasar limpios (`grep`/`tag` de la US)
- Verificar cobertura >=80%
- Si pasa **§ 1.3 y DoD hasta el punto 6** (incl. Playwright headless): **avisar al usuario** (§ 3.0) que la entrega técnica está verde y **listo para reviewer / visto bueno del dueño** (no es `done` todavía). Si falla tras el tope de ciclos: reportar bloqueo con síntoma y siguiente paso sugerido.

#### Fase 5: Cierre solo tras visto bueno del dueño (DoD § 1.2)

- El agente entrega evidencia: `testing-usuario.md` ejecutado al 100 % en verde, UT verdes, **Playwright CLI** (headed + headless) de la US en verde, enlaces a PR/diff. **No** pedir al dueño que repita QA.
- **Esperar** **visto bueno explícito** del dueño (sí/no con motivo); no confundir con “ir a probar desde cero”.
- **Solo entonces:** `Estado: done`, mover story a `docs/stories/completed/`, actualizar `BACKLOG.md` y summaries, commit, push y publicar según proceso del equipo.
- Generar video demo (si aplica) antes o después del deploy, según convención.
- Reportar al usuario con métricas finales.

### 4. Comando `valida todo`

Cuando el agente recibe `valida todo`, ejecuta este pipeline iterativo:

```bash
# Paso 1: Formato
npx prettier --write "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"

# Paso 2: Lint
npm run lint
# → Si falla: --fix + revisión manual

# Paso 3: Type Check
npm run typecheck
# → Si falla: corregir tipos

# Paso 4: Tests Unitarios
npm run test:unit
# → Si timeout DB: migrar a MockDatabase o usar Docker Postgres
# → Si falla lógica: corregir servicio → re-ejecutar

# Paso 5: Tests E2E
npm run test:e2e:subset -- --grep "[feature-name]"
# → Si falla por timeout: aumentar timeout
# → Si falla por selector: corregir test o UI

# Paso 6: Seguridad
npm run security:autofix

# Paso 7: Cobertura
npx vitest run --coverage
# → Verificar >=80% en archivos nuevos/modificados

# Paso 8: Build Final
npm run build
```

**Regla de oro:** Si cualquier paso falla, corregir y re-ejecutar. Máximo 5 intentos por paso. Si persiste → reportar bloqueo.

### 5. Instrucciones para Usuario

Para iniciar una nueva story:

```
Implementa POS completo con flujo de caja y cierre de turno
```

Para validar el estado actual:

```
valida todo
```

Para ver backlog:

```
Estado del proyecto
```

### 6. Autonomía: ¿Qué puede hacer solo?

| Tarea                                              | Autonomía | Notas                                                                                                       |
| -------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| Analizar requerimiento                             | ✅ 100%   | Template de story auto-llenable                                                                             |
| Diseñar API contract                               | ✅ 100%   | Zod + DomainError auto-generable                                                                            |
| Implementar servicios                              | ✅ 100%   | Result Pattern + tests unitarios                                                                            |
| Corregir build/lint/typecheck                      | ✅ 100%   | Auto-fix + iteración                                                                                        |
| Ejecutar Playwright E2E                            | ✅ 100%   | Con auto-retry; bucle **Dev↔QA** hasta verde (§ 3.0)                                                        |
| Ejecutar fases PM→Architect→Dev→QA en orden        | ✅ 100%   | Sin “¿continúo?”; ver § 3                                                                                   |
| Bloque de preguntas + `plan.md` completo al inicio | ✅ 100%   | Asunciones documentadas si no hay respuesta                                                                 |
| Migrar legacy `.test.ts`                           | ⚠️ 80%    | Necesita confirmación de mocks                                                                              |
| Diseñar mockups complejos                          | ❌ 20%    | Requiere visión del diseñador/PO                                                                            |
| Decidir prioridad P0 vs P1                         | ❌ 10%    | Requiere contexto de negocio                                                                                |
| Merge a main                                       | ❌ 0%     | Siempre requiere aprobación humana                                                                          |
| Marcar US `done` + push/publicar                   | ❌ 0%     | Solo tras **visto bueno** explícito del dueño sobre trabajo ya verde por Playwright CLI (DoD § 1.2 / § 1.4) |

### 7. Roadmap hacia Autonomía Total

| Meta                                                                                         | Estado          | Bloqueador                                                                                                  |
| -------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| Pipeline `valida todo` auto-corregible                                                       | ✅ Implementado | —                                                                                                           |
| Estructura de stories + orquestador                                                          | ✅ Implementado | —                                                                                                           |
| Artefactos por story en `.agents/sprint/{STRY-XXX}/` (plan, implementación, testing-usuario) | ✅ Definido     | Mantener sincronía con `docs/stories/active/`                                                               |
| Docker Postgres para tests locales                                                           | ⏳ Pendiente    | Tiempo de setup                                                                                             |
| Migración `.test.ts` legacy a `.spec.ts`                                                     | 🔄 En progreso  | 12 archivos legacy                                                                                          |
| 100% Result Pattern en `lib/db/`                                                             | ⏳ Pendiente    | ~40 archivos legacy                                                                                         |
| Orquestador: fases secuenciales + bucle Dev↔QA autónomo                                      | ✅ Definido     | `AGENTS.md` § 3 + `story-orchestrator.md`; pausa: decisión técnica no resuelta en plan + visto bueno `done` |
| Auto-deploy a staging tras validación                                                        | ⏳ Pendiente    | CI/CD pipeline                                                                                              |

---

## 🎭 Feature Analysis Workflow ("analiza lo siguiente")

### Trigger Command

Cuando el usuario inicie con **"analiza lo siguiente {}"**, se activa el flujo de análisis exhaustivo para generar un prompt de implementación estructurado.

Lo mismo aplica cuando el usuario pida **analizar una reunión, acta, notas o un conjunto de observaciones** (con o sin el trigger literal): antes de consolidar conclusiones, el agente debe **preguntar** si el material debe incorporarse a la **User Story en proceso** y reflejarse en `.agents/sprint/{STRY-XXX}/` (`plan.md`, `implementacion.md`, `testing-usuario.md`). Ningún plan de entrega queda huérfano de un `STRY-XXX`.

### Analysis Process

1. **Recepción del requerimiento**: Leer y analizar el contenido proporcionado entre llaves `{}` o en el mensaje completo.

2. **Análisis exhaustivo**:
   - Identificar el tipo de feature (nuevo módulo, mejora, bug fix, refactor)
   - Determinar componentes afectados (UI, API, base de datos, servicios)
   - Evaluar impacto en código existente
   - Identificar dependencias y riesgos potenciales
   - Considerar edge cases y escenarios de error

3. **Diálogo de clarificación**:
   - Si hay ambigüedades, hacer preguntas específicas usando `ask_followup_question`
   - Preguntar sobre:
     - Alcance exacto de la funcionalidad
     - Comportamiento esperado en edge cases
     - Preferencias de UX/UI
     - Restricciones técnicas o de negocio
     - Prioridad de requisitos

4. **Confirmación de entendimiento**:
   - Resumir el entendimiento del requerimiento
   - Listar los requisitos identificados
   - Esperar confirmación del usuario antes de generar el prompt

### Prompt Output Structure

Una vez completado el análisis y confirmado con el usuario, generar un prompt con la siguiente estructura:

```markdown
Implementa [NOMBRE_DEL_FEATURE]

Requisitos:

- [Requisito funcional 1]
- [Requisito funcional 2]
- [Requisito técnico 1]
- [Requisito técnico 2]
- [Consideración de seguridad/rendimiento]

Con:

- Tests unitarios (Vitest en tests/unit/)
- Tests E2E (Playwright en tests/e2e/)
- Video demo (grabar flujo principal)
```

### Example Interaction

**Usuario**: "analiza lo siguiente {quiero un sistema de notificaciones en tiempo real para cuando un cliente hace una reserva}"

**Agente**:

1. Analiza: Sistema de notificaciones → WebSockets/SSE/Suscripción DB
2. Pregunta: "¿Las notificaciones deben ser en tiempo real (WebSocket) o pueden ser polling cada X segundos? ¿Quiénes reciben las notificaciones: solo admin, todos los staff, o configurable?"
3. Espera respuesta
4. Genera prompt estructurado

### Checklist para el Análisis

Antes de generar el prompt final, verificar:

- [ ] Entendimiento completo del feature
- [ ] Requisitos funcionales identificados
- [ ] Requisitos técnicos definidos
- [ ] Impacto en código existente evaluado
- [ ] Dependencias identificadas
- [ ] Riesgos documentados
- [ ] Tests necesarios planificados
- [ ] Confirmación del usuario recibida

### Output Format Requirements

El prompt generado SIEMPRE debe incluir:

1. **Título claro**: "Implementa [FEATURE_NAME]"
2. **Lista de requisitos**: Funcionales y técnicos
3. **Sección "Con:"**: Especificando tests unitarios, E2E y video demo
4. **Sin placeholders vagos**: Cada requisito debe ser específico y accionable

---

## Screen/Feature Correction Workflow ("corrige {X}")

### Trigger Command

Cuando el usuario inicie con **"corrige {X}"** donde X es una pantalla, página o funcionalidad específica, se activa el flujo de corrección exhaustiva con validación completa mediante tests.

### Correction Process

1. **Identificación del alcance**:
   - Determinar la ruta/URL de la pantalla [X]
   - Identificar todos los componentes involucrados
   - Listar todas las funcionalidades y botones presentes
   - Mapear las APIs y servicios utilizados

2. **Análisis de funcionalidades**:
   - Navegar/inspeccionar la pantalla para identificar:
     - Todos los botones y sus acciones
     - Formularios y validaciones
     - Llamadas a API
     - Estados de carga y error
     - Interacciones de usuario

3. **Crear/Actualizar tests unitarios**:
   - Ubicación: `tests/unit/` con extensión `.spec.ts`
   - Cubrir todos los servicios y funciones involucradas
   - Usar helpers `expectSuccess/expectFailure` para Result Pattern
   - Mock de dependencias externas

4. **Crear/Actualizar tests E2E**:
   - Ubicación: `tests/e2e/` con extensión `.spec.ts`
   - Testear flujos completos de usuario
   - Verificar navegación e interacciones
   - Validar respuestas de API

5. **Ejecutar tests iterativamente**:

   ```bash
   # Tests unitarios
   npm run test:unit -- --grep "[X]"

   # Tests E2E
   npm run test:e2e:subset -- --grep "[X]"
   ```

6. **Ciclo de corrección**:
   - Ejecutar tests
   - Identificar fallos
   - Corregir código
   - Re-ejecutar tests
   - Repetir hasta que todos pasen

7. **Validación final**:
   - Todos los tests unitarios pasando
   - Todos los tests E2E pasando
   - `npm run build` sin errores
   - `npm run lint` sin errores
   - `npm run typecheck` sin errores

### Correction Checklist

Para cada pantalla/funcionalidad [X]:

- [ ] Identificar ruta URL de la pantalla
- [ ] Listar todos los componentes UI involucrados
- [ ] Mapear todos los botones y sus handlers
- [ ] Identificar todas las llamadas API
- [ ] Crear/actualizar tests unitarios para servicios
- [ ] Crear/actualizar tests unitarios para componentes
- [ ] Crear/actualizar tests E2E para flujos principales
- [ ] Crear/actualizar tests E2E para edge cases
- [ ] Ejecutar tests y corregir fallos
- [ ] Iterar hasta 100% de tests pasando
- [ ] Verificar build, lint y typecheck

### Example Interaction

**Usuario**: "corrige {página de calendario del admin}"

**Agente**:

1. Identifica ruta: `/t/[tenant]/admin/calendar`
2. Lista componentes: CalendarView, BookingModal, StaffSelector, etc.
3. Identifica botones: Nueva reserva, Editar, Cancelar, Filtros, etc.
4. Crea tests unitarios para servicios de booking
5. Crea tests E2E para flujos de calendario
6. Ejecuta tests, corrige fallos, itera
7. Confirma todo funcionando

### Test Structure Template

```typescript
// tests/unit/services/booking-service.spec.ts
describe("BookingService", () => {
  it("should create booking successfully", async () => {
    const result = await createBooking(validData);
    expectSuccess(result);
  });

  it("should return validation error for invalid data", async () => {
    const result = await createBooking(invalidData);
    expectFailure(result).toMatchObject({ type: "ValidationError" });
  });
});

// tests/e2e/admin-calendar.spec.ts
describe("Admin Calendar Page", () => {
  it("should display calendar view", async () => {
    await page.goto("/t/wondernails/admin/calendar");
    await expect(page.locator("[data-testid='calendar-grid']")).toBeVisible();
  });

  it("should create new booking when clicking create button", async () => {
    await page.goto("/t/wondernails/admin/calendar");
    await page.click("[data-testid='btn-new-booking']");
    // ... complete flow
  });
});
```

### Mandatory Verification Commands

Antes de considerar la corrección completa:

```bash
# 1. Tests unitarios específicos
npm run test:unit -- --grep "[pantalla/funcionalidad]"

# 2. Tests E2E específicos
npm run test:e2e:subset -- --grep "[pantalla/funcionalidad]"

# 3. Verificaciones de código
npm run build
npm run lint
npm run typecheck
```

### Output Format

Al completar la corrección, proporcionar:

```markdown
✅ Corrección completada: [X]

## Funcionalidades verificadas:

- [ ] Botón/Función 1: [estado]
- [ ] Botón/Función 2: [estado]
- [ ] API Endpoint 1: [estado]

## Tests ejecutados:

- Tests unitarios: X/Y pasando
- Tests E2E: X/Y pasando

## Comandos de verificación:

- npm run build: ✅
- npm run lint: ✅
- npm run typecheck: ✅
```

---

## 🚨 Regla Obligatoria: Validación Exhaustiva Post-Implementación

**Después de CUALQUIER implementación, fix, refactor o cambio de código — sin excepción — el agente DEBE ejecutar validación exhaustiva ANTES de reportar la tarea como completa.**

### Pipeline obligatorio (orden fijo)

1. **Formato**: `npx prettier --write` sobre archivos modificados.
2. **Lint**: `npm run lint` → si hay errores, corregir y repetir.
3. **Typecheck**: `npm run typecheck` (`tsc --noEmit --incremental false`) → corregir tipos si falla.
4. **Build**: `npm run build` → no debe haber errores de compilación.
5. **Tests Unitarios**: `npm run test:unit` (o subset por grep) → todos los tests deben pasar.
6. **Tests E2E**:
   - Primero **headed** (`--headed --grep "story-name"`) para inspección visual como haría una persona.
   - Luego **headless** (`--grep "story-name"`) para regresión automatizada.
   - Si falla cualquier test → fix → re-ejecutar hasta cero fallos.
7. **Seguridad**: `npm run security:autofix` (si aplica).

**Regla de oro:** Si un paso falla, arreglar y repetir. Máximo 5 intentos por paso. Si persiste, reportar bloqueo. **NUNCA reportar "listo" sin haber pasado todo el pipeline.**

### Servidor E2E / Testing local

Cuando ejecutes tests E2E contra `localhost` (puerto 3001 o 3002):

1. **Asegura que NO haya conflictos de puerto**:

   ```powershell
   Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

2. **Limpia build anterior si hay dudas de cache**:

   ```powershell
   Remove-Item -Recurse -Force apps/web/.next
   npm run build
   ```

3. **Levanta el servidor explícitamente** (no depender solo del `webServer` de Playwright si hay problemas):

   ```powershell
   # Desde la raíz del repo:
   node scripts/start-e2e-server.js
   # o manualmente:
   cd apps/web && npx next start -p 3002
   ```

4. **Verifica que el endpoint de ping responde** antes de lanzar Playwright:

   ```powershell
   node -e "fetch('http://127.0.0.1:3002/api/debug/ping').then(r=>console.log(r.status)).catch(e=>console.error(e))"
   ```

5. **Si el health check falla**, aumenta el timeout en `tests/e2e/global-setup.ts` o ejecuta los tests subset (`--grep`) directamente.

### Propósito

- Evitar que el dueño de producto se topé con errores.
- Detectar regresiones, typos y fallos de UI/UX en el momento.
- Asegurar que todo código entregado esté verificado por el agente antes del visto bueno del dueño.

---

## 🏁 Regla Obligatoria: Análisis de `.agent-reports` / Quality OS

El directorio `C:\Dev\Zo\sass-store\.agent-reports` es el **indicador de calidad** del proyecto.

- Cuando el usuario solicite analizar `.agent-reports` (o Quality OS), el agente **debe**:
  1. Leer los archivos del directorio (`quality-report.json`, `quality-report.md`, `suggested-fixes.md`, etc.).
  2. **Actualizar o crear** la User Story `STRY-022-quality-os` en `docs/stories/active/` y `.agents/sprint/STRY-022-quality-os/`.
  3. Documentar hallazgos, score y diferencias respecto al estado anterior en `implementacion.md`.
  4. Si hay brechas nuevas: planificar su corrección; si no, confirmar estado.
- **No** reportar análisis suelto: todo resultado de calidad queda trazado a `STRY-022`.

---

**🚨 CRITICAL: Compliance with the Result Pattern is mandatory for all new code. PRs violating these guidelines will be automatically rejected.**

The Result Pattern provides:

- ✅ Type-safe error handling
- ✅ Explicit control flow
- ✅ Composable operations
- ✅ Better testing capabilities
- ✅ Improved debugging
- ✅ Security benefits
- ✅ Performance optimization opportunities
