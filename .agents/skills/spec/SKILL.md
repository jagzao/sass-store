---
name: spec
description: Define a feature specification from a user story through an interactive assumption-refinement session. Use when the user says "/spec", "quiero definir una spec", "ayudame con una especificacion", or provides a user story to elaborate.
metadata:
  version: "1.2"
  language: es
---

# Skill: Definir Especificacion

Guia al usuario a traves de un proceso interactivo para convertir una historia de usuario en una especificacion completa.

## FASE 1 — Leer la historia y rellenar espacios en blanco

1. Si no se proporciono historia de usuario, pedirla antes de continuar.
2. Elabora una especificacion inicial rellenando: actores, flujos, reglas de negocio, criterios de aceptacion, casos borde.
3. Extrae todas las asunciones no tecnicas/funcionales (comportamiento, reglas implicitas, scope, UX — NO tecnologia).

## FASE 2 — Mostrar lista de asunciones

Muestra la lista numerada:

```
## Asunciones realizadas
Dime los **numeros** de las que no te gustan para refinarlas:
1. [asuncion]
2. [asuncion]
```

Espera que el usuario diga los numeros.

## FASE 3 — Refinamiento interactivo

Por cada asuncion rechazada, preguntar UNA A LA VEZ con este formato:

```
---
**Progreso:** [████████░░] N de M preguntas

**Asuncion #X:** [texto original]

¿Como deberia ser esto?
  1. [opcion A]
  2. [opcion B]
  3. [opcion C]
  4. [opcion D]
  5. Otra (especifícame tu respuesta)
---
```

## FASE 4 — Confirmar y generar spec

Cuando todas las asunciones esten resueltas, generar la especificacion final con:

1. **Descripcion general**
2. **Actores**
3. **Flujos principales**
4. **Reglas de negocio**
5. **Criterios de aceptacion — formato Gherkin obligatorio**

   Cada criterio de aceptacion debe expresarse como un `Scenario` Gherkin:

   ```gherkin
   Feature: [nombre de la funcionalidad]

     Scenario: [caso feliz principal]
       Given [estado inicial / contexto]
       When  [accion del usuario o sistema]
       Then  [resultado observable y verificable]
       And   [condicion adicional si aplica]

     Scenario: [caso de error o borde]
       Given [contexto]
       When  [accion que provoca el error]
       Then  [mensaje o comportamiento esperado]
   ```

   Reglas para escribir los Scenarios:
   - `Then` siempre debe ser verificable en UI o en respuesta de API — nunca vago ("el sistema funciona").
   - Un Scenario = un comportamiento. Si necesitas `And` mas de 2 veces, dividir en dos Scenarios.
   - Usar `Scenario Outline` + tabla `Examples` cuando el mismo flujo aplica para multiples valores.
   - No mencionar tecnologia (no "hace fetch a /api/...", no "llama a la funcion X").

6. **Casos borde** — tambien en Gherkin si son verificables, en prosa si son restricciones de negocio puras.

Guardar en `.agents/sprint/{STRY-XXX}/plan.md` y actualizar `docs/stories/active/` si aplica.

## FASE 5 — Commit de etapa

Hacer commit de la spec antes de avanzar:

```bash
FEATURE=$(node -e "try{const s=require('./.agents/memory/workflow-state.json');console.log(s.currentFeature||'feature')}catch{console.log('feature')}")

git add .agents/sprint/ docs/stories/ 2>/dev/null || true
git diff --cached --quiet || git commit -m "docs(spec): ${FEATURE} — especificacion funcional

Stage: spec
Co-Authored-By: Claude <noreply@anthropic.com>"
```

Si git no está inicializado o no hay cambios → continuar sin error.

## FASE 6 — Handoff y auto-continuacion

**Regla absoluta: NO preguntar al usuario si continuar.** El usuario ya confirmó las
asunciones en FASE 2 y refinó las que no le gustaron en FASE 3. La spec está completa y
validada. Preguntar de nuevo es fricción innecesaria.

**Acción default: disparar `/test-spec` automáticamente** con la spec recién generada como
entrada. `/test-spec` a su vez encadena con `/implement` (línea 109 de su SKILL.md), así que
el pipeline continúa solo hasta PR o blocker.

Mostrar UN solo bloque al terminar y disparar en el mismo turno:

```
✅ Especificacion funcional lista.
Artefactos en .agents/sprint/{STRY-XXX}/plan.md

Disparando /test-spec automaticamente...
```

**Excepción — parar sin preguntar** (mostrar mensaje y no continuar):
- Si git no estaba inicializado (no se pudo hacer FASE 5 commit) → parar, informar al usuario.
- Si el usuario dijo explícitamente "no continúes" o "espera" en algún turno previo → respetar.
- Si una asunción quedó marcada como "decision de negocio pendiente" en FASE 3 → parar con
  esa única pregunta explícita.

**No son excepciones** (siempre continuar automáticamente):
- "No estoy seguro si el plan es bueno" → no es blocker, el pipeline tiene Fase 6 review.
- "Esto puede fallar en implementación" → es responsabilidad del pipeline, no del usuario.
- "El usuario quizás quiera revisar" → puede interrumpir con ESC si quiere.

Actualizar `.agents/memory/workflow-state.json`: `specStatus: "done"`, `currentStage: "test-spec"`.

## Notas
- Solo asunciones de negocio, no tecnicas.
- Una pregunta por turno.
- Opciones siempre concretas, nunca genericas.
- En este proyecto: enlazar con `docs/stories/active/` y `.agents/sprint/{id}/plan.md`.
- Los Scenarios Gherkin de la FASE 4 son la entrada directa para `/test-spec` y `/test-implementation` — cada Scenario se convierte en un test de Playwright o Vitest.
