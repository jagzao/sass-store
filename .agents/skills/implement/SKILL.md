---
name: implement
description: Implement production code for a feature from its approved spec and test-spec. Use when the user says "/implement", "implementa el feature", or automatically after /test-spec completes. Follows Result Pattern and project conventions strictly.
metadata:
  version: "1.0"
  language: es
---

# Skill: Implementar Feature

## REGLAS ABSOLUTAS
1. Result Pattern OBLIGATORIO — cero try/catch en código nuevo.
2. No implementar lógica en archivos de test.
3. No cambiar reglas de negocio respecto a la spec aprobada.
4. No crear abstracciones no requeridas por la spec.
5. Si un cambio afecta código existente de otro tenant → DETENER y preguntar.
6. Máximo 3 intentos para resolver un error de tipos. Si persiste → BLOQUEANTE.

## FASE 1 — Leer contexto

Verificar que `workflow-state.json` tenga `testSpecStatus: "done"` antes de continuar.

Leer en orden:
- `.agents/sprint/{STRY-XXX}/plan.md` — spec + Gherkin scenarios (fuente de verdad funcional)
- `.agents/sprint/{STRY-XXX}/test-spec.md` — estrategia de pruebas y restricciones técnicas
- `.agents/sprint/{STRY-XXX}/test-matrix.md` — matriz Gherkin → archivo de test (referencia)

Si alguno falta → DETENER, indicar qué falta y cómo generarlo.

## FASE 2 — Análisis de impacto

Antes de escribir código, declarar:

```
## Plan de implementación
Archivos a CREAR:
- [ruta] — [propósito]

Archivos a MODIFICAR:
- [ruta] — [qué cambia y por qué]

Archivos a NO tocar:
- [ruta] — [razón]

Imports Result Pattern requeridos:
- import { Result, Ok, Err, match } from "@sass-store/core/src/result"
- import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types"
- import { validateWithZod, CommonSchemas } from "@sass-store/validation/src/zod-result"

Rutas de API (si aplica):
- [método] [ruta] — [handler]
```

Mostrar plan y continuar **sin esperar confirmación** (autonomía).

## FASE 3 — Implementación

Implementar en este orden:
1. Tipos y schemas Zod (si aplica)
2. Lógica de dominio / servicios (Result Pattern)
3. API route handlers (Result Pattern)
4. Componentes UI (si aplica)
5. Exports desde index si es package

### Patrón obligatorio para toda función que puede fallar:

```typescript
// ✅ CORRECTO
export const operacion = (input: Input): Promise<Result<Output, DomainError>> =>
  fromPromise(
    db.tabla.accion(input),
    (error) => ErrorFactories.database("operacion", "mensaje", undefined, error),
  );

// ❌ PROHIBIDO
export async function operacion(input: Input) {
  try {
    return await db.tabla.accion(input);
  } catch (error) {
    throw error;
  }
}
```

### Para API routes:

```typescript
export async function GET(request: NextRequest) {
  const result = await operacion(params);
  return match(result, {
    ok: (data) => NextResponse.json({ success: true, data }),
    err: (error) => NextResponse.json({ success: false, error: error.message }, { status: error.statusCode ?? 500 }),
  });
}
```

## FASE 4 — Verificación de tipos

```bash
npm run typecheck
```

- Si falla → leer error completo → corregir → reintentar (máx 3)
- Si falla en código existente no relacionado → documentar en `.agents/memory/errors.md` y continuar
- Si falla en código nuevo al intento 3 → BLOQUEANTE

```bash
npm run lint
```

- Corregir automáticamente todos los warnings de lint en archivos tocados.

## FASE 5 — Commit de implementación

Hacer commit del código implementado antes de avanzar:

```bash
FEATURE=$(node -e "try{const s=require('./.agents/memory/workflow-state.json');console.log(s.currentFeature||'feature')}catch{console.log('feature')}")

git add apps/web/app/ apps/web/components/ packages/ scripts/ 2>/dev/null || true
git diff --cached --quiet || git commit -m "feat(impl): ${FEATURE} — implementacion

Stage: implement
Co-Authored-By: Claude <noreply@anthropic.com>"
```

Si git no está inicializado o no hay cambios staged → continuar sin error.

## FASE 5b — Actualizar memoria y auto-continuar

Actualizar `.agents/memory/workflow-state.json`:
```json
{
  "implementationStatus": "done",
  "currentStage": "test-implementation",
  "lastAgent": "implement"
}
```

Registrar en `.agents/memory/decisions.md` cualquier decisión de diseño no trivial.

**Continuar automáticamente con Skill: test-implementation** — no esperar al usuario.
