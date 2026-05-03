# Protocolo del Orquestador de User Stories

> Orquestador: PM → Architect → Dev → QA → Merge Ready
> Versión: 1.0
> Estado: VIGENTE

---

## Trigger

Cuando el usuario dice:
- `Implementa [Feature]`
- `Desarrolla [Feature]`
- `Crea [Feature]`
- `valida todo`
- `kilo run story --id STRY-XXX`

El orquestador lee `docs/stories/BACKLOG.md` y `docs/stories/active/` para determinar la story a ejecutar.

---

## Fase 0: Detección

```
1. ¿Existe story.md en docs/stories/active/ para este feature?
   ├── Sí → Leer, confirmar scope, empezar Fase 1
   └── No  → Crear story desde _template.md (PM auto-llena), guardar en active/
2. Carpeta de sprint operativa:
   .agents/sprint/{STRY-XXX-nombre-corto}/
   ├── plan.md
   ├── implementacion.md
   └── testing-usuario.md
   → Si falta: crear archivos (mínimo esqueleto con secciones del template) al activar la story
```

### Entrada: reunión u observaciones

Si el input es acta de reunión, notas u observaciones sueltas (no solo “Implementa X”):

1. **Preguntar al usuario** si el contenido debe incorporarse a la **User Story en curso** (`docs/stories/active/`).
2. Si sí → actualizar la story (narrativa, AC, contrato) y los tres `.md` bajo `.agents/sprint/{STRY-XXX}/`.
3. Si no → proponer nueva story o backlog; no dejar conclusiones sin `STRY-XXX` asociado.

---

## Fase 1: PM Agent — Análisis

### Responsabilidad
Confirmar entendimiento del requerimiento y que AC están claros.

### Checklist
- [ ] Story.md existe en `docs/stories/active/`
- [ ] Existe `.agents/sprint/{STRY-XXX}/` con `plan.md`, `implementacion.md`, `testing-usuario.md` (alineados con la story)
- [ ] Criterios de aceptación están definidos
- [ ] Tenant de prueba está especificado
- [ ] Prioridad P0/P1/P2/P3 está clara
- [ ] No hay placeholders vacíos en AC, contrato técnico o impacto

### Output
Si AC claros: mover a Fase 2.
Si ambigüedad: hacer preguntas al usuario (máx 3) y esperar respuesta.
Si sin AC: usar template auto-llenable y pedir confirmación final.
- Rellenar o ajustar `plan.md` (alcance, orden de trabajo, dependencias) y `implementacion.md` (trazabilidad AC → entregables).

---

## Fase 2: Architect Agent — Diseño Técnico

### Responsabilidad
Diseñar contrato técnico y verificar impacto.

### Checklist
- [ ] ¿Nuevas tablas necesarias? >→ Agregar tenant_id + RLS
- [ ] ¿Nuevos DomainError? >→ Definir en ErrorFactories
- [ ] ¿Nuevo endpoint? >→ Zod schema + withResultHandler
- [ ] ¿Toque código legacy try/catch? >→ Migrar a Result Pattern
- [ ] ¿Impacto bundle > 50KB? >→ Evaluar lazy-load
- [ ] Riesgo de deuda técnica identificado

### Output
- Actualizar `ARCHITECT_IMPLEMENTATION_SUMMARY.md` con ADR
- Marcar story con checkboxes de diseño completado
- Actualizar `plan.md` y `implementacion.md` con decisiones técnicas y riesgos
- Pasa a Fase 3

---

## Fase 3: Dev Agent — Implementación

### Responsabilidad
Código + tests unitarios + auto-fix.

### Secuencia
```
1. Branch: feature/STRY-XXX-nombre
2. Servicio con Result Pattern
3. Tests unitarios (expectSuccess/expectFailure)
4. API con withResultHandler
5. Tests integración
6. UI (si aplica)
7. npm run agent:build (lint + typecheck + build)
   → Si falla: corregir → reintentar (max 5)
8. Actualizar .agents/session/current_task.md
9. Mantener `implementacion.md` al día (estado por CA, ramas de tests, definición de “hecho”)
10. Tras codificación sustancial del plan: **no** dar por terminado el trabajo de dev sin disparar **Fase 4** — pruebas “como persona” con **Playwright CLI** (`--headed` luego headless), según `AGENTS.md` (transición tras codificación).
```

### Output
- Archivos creados/modificados
- Cobertura >= 80% en nuevos archivos
- Build, lint, typecheck limpio

---

## Fase 4: QA Agent — Validación E2E

### Responsabilidad
UAT + E2E + cobertura: **toda** la validación exhaustiva la ejecuta el **agente** con **Playwright CLI** (headed + headless), buscando errores y corrigiendo al vuelo. Cumplir **`AGENTS.md` § 1.3** antes de pedir **visto bueno** al dueño (el dueño **no** sustituye esta fase; ver § 1.4).

### Secuencia
```
0. Entorno: levantar app (npm run dev / script E2E del repo). Si no arranca → diagnosticar .env, puerto 3001, DB, seeds → corregir hasta OK
1. Redactar o completar testing-usuario.md a partir de la US + CA (no dejar escenarios vacíos “por definir”)
2. Acceso: **por cada** tenant listado en `testing-usuario.md` (p. ej. todos los activos: wondernails, centro-tenistico), login con `jagzao@gmail.com` / `admin`. Si falla en uno → seed, usuario o permisos **por ese slug** hasta login y flujos OK en **todos** los listados
3. **Playwright CLI `--headed`:** ejecutar **todos** los escenarios del `testing-usuario.md` como los haría una persona (ventana visible, mismos pasos); si falla → fix → re-ejecutar hasta verde
4. (Opcional) `--headed` con slow-mo si el repo lo usa para depuración visual
5. Validar AC uno por uno (cotejar con implementacion.md)
   → Si falla: documentar en debug_logs.md → corregir código/datos → volver a paso 3
6. Generar tests E2E en tests/e2e/ derivados 1:1 de testing-usuario.md (tags/grep alineados al STRY-XXX)
7. npm run agent:e2e (o test:e2e:subset con grep STRY-XXX) → headless verde
   → Si falla: corregir UI/test → reintentar (max 5)
8. npx vitest run --coverage
   → Cobertura >= 80%
```

### UAT obligatorio antes de E2E
Sin `testing-usuario.md` **rellenado según la US**, **ejecutado con todos los casos en verde** por el agente → no escribir tests E2E ni pedir **visto bueno** al dueño.

**Nota:** `docs/UAT/STRY-XXX-uat.md` es opcional y legacy; la fuente canónica para autonomía es `.agents/sprint/{STRY-XXX}/testing-usuario.md`.

### Output
- Todos los AC pasan
- Tests E2E pasando
- Cobertura >= 80%

---

## Fase 5: Listo para visto bueno del dueño (pre-done)

### Responsabilidad
Cerrar el trabajo **técnico** de la US con **Playwright CLI + UT** en verde; **no** marcar `done` ni publicar aún. El dueño **no** debe repetir toda la batería E2E.

### Checklist (obligatorio antes de pedir visto bueno)
- [ ] `testing-usuario.md` alineado a la US/CA y **cada escenario ejecutado con éxito** por el agente (§ 1.3)
- [ ] Proyecto y entorno E2E levantados sin bloqueo; acceso con `jagzao@gmail.com`/`admin` verificado **en cada tenant** que el doc liste (activos del producto)
- [ ] Implementación completa según AC e `implementacion.md`
- [ ] Bugs encontrados en QA corregidos y **retesteada** con `npm run test:unit` (alcance US) en verde
- [ ] Playwright CLI: **flujo E2E completo de la US** (`test:e2e:subset` + grep/tag `STRY-XXX`) en verde headless
- [ ] Build, lint, typecheck verdes
- [ ] Actualizar `QA_LEADER_IMPLEMENTATION_SUMMARY.md` (borrador / inventario de tests)

### Salida
Pedir al **dueño** el **visto bueno** (sí apruebo / no + motivo) sobre la **evidencia** ya verde — mensaje en chat, PR o story. **No** pedirle que haga de tester desde cero. Sin respuesta afirmativa → la story **no** avanza a Fase 6.

---

## Fase 6: Done + push + publicar (solo tras visto bueno)

### Responsabilidad
Ejecutar **solo** cuando el dueño dio **visto bueno explícito** (aprobación sobre trabajo ya validado por el agente).

### Checklist
- [ ] Marcar story `Estado: done`
- [ ] Mover `docs/stories/active/STRY-XXX-*.md` → `docs/stories/completed/`
- [ ] Actualizar `BACKLOG.md` (marcar como done)
- [ ] Actualizar `ARCHITECT_IMPLEMENTATION_SUMMARY.md` / `DEV_LEADER_IMPLEMENTATION_SUMMARY.md` / `PM_IMPLEMENTATION_SUMMARY.md` si aplica
- [ ] Commit con Conventional Commits
- [ ] **Push** (rama o merge de PR según política del repo)
- [ ] **Publicar** (deploy staging/prod según pipeline del equipo: Vercel, CI, etc.)
- [ ] Generar video demo (opcional, si hay UI)

### Salida al usuario

**Fase 5 (listo para visto bueno):**
```markdown
## Story lista para tu visto bueno: [STRY-XXX] [Nombre]
- El agente ya ejecutó QA exhaustivo (Playwright headed+headless, UT, tenants del doc) — todo verde.
- Evidencia: comandos/resumen, PR/enlace al diff.
- Tu rol: **visto bueno** (o rechazo motivado); no se espera que repitas toda la batería E2E. Ver `AGENTS.md` § 1.2 y § 1.4.
- Confirma explícitamente para Fase 6 (done, push, publicar).
```

**Fase 6 (tras tu OK):**
```markdown
## ✅ Story completada y publicada: [STRY-XXX] [Nombre]
### Métricas
- Tests unitarios / cobertura / E2E / tiempo
### Archivos tocados + comandos de verificación (build, lint, typecheck, unit, e2e subset)
```

---

## Reglas de Oro del Orquestador

1. **Nunca omitir una fase.** Si faltan AC, no pasa a Architect. Si falta diseño, no pasa a Dev.
2. **Si un paso falla más de 5 veces, reportar bloqueo.**
3. **Si no hay tests E2E pasando, no reportar feature como completada.**
4. **No marcar `done`, no mover a `completed/`, no push ni deploy sin visto bueno explícito del dueño** sobre trabajo **ya** verde por Playwright CLI + § 1.3 (`AGENTS.md` § 1.2 / § 1.4).
5. **Si no hay tests unitarios con cobertura >= 80%, no pasar a QA.**
6. **Si hay `.test.ts` legacy en archivos tocados, migrarlos antes de decir "listo".**
7. **Si se usa `console.error` o `console.log`, reemplazar con `logResult()` antes de merge.**
8. **Todos los commits deben pasar `npm run validate`.**

---

## Comandos Rápidos del Orquestador

| Comando | Qué hace |
|---------|----------|
| `Implementa X` | Crea story si no existe → ejecuta pipeline completo |
| `valida todo` | Ejecuta pipeline de validación completo |
| `corrige {feature}` | Loop de corrección con tests |
| `analiza lo siguiente {X}` | Análisis PM → generar story template; si es reunión/observaciones, preguntar si va a la story en curso |
| `Estado del proyecto` | Lee active/ + BACKLOG + summaries |

---

*Versión 1.5 | 2026-05-01 — Tras codificación: PW-CLI headed (como persona) obligatorio antes de visto bueno (`AGENTS.md` transición)*
