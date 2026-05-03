# Story Execution Template

> Este archivo se copia a `docs/stories/active/` cuando se inicia una nueva story.

## Story ID
{STRY-XXX}

## Trigger
```
Implementa {Nombre de la historia}
```
O:
```
kilo run story --id {STRY-XXX}
```

## Orquestador: PM → Architect → Dev → QA

### Fase 1: PM — Definición y Alcance (automático)
- Leer `docs/stories/active/{STRY-XXX}.md`
- Validar criterios de aceptación
- Si faltan AC o hay ambigüedad: hacer preguntas de clarificación
- Confirmar entendimiento antes de pasar a Architect

### Fase 2: Architect — Diseño Técnico (automático)
- Evaluar impacto técnico
- Definir contrato API con Zod + DomainError variants
- Verificar necesidad de nuevas tablas/columnas/RLS
- Proponer migración de legacy si aplica
- Guardar ADR en `ARCHITECT_IMPLEMENTATION_SUMMARY.md`

### Fase 3: Dev — Implementación (autocorrección vía `valida todo`)
- Servicios → APIs → UI (si aplica)
- Después de cada módulo: `npm run agent:build`
- Tests unitarios por cada servicio
- UAT con Playwright headed después de UI

### Fase 4: QA — Validación E2E (autocorrección)
- Generar tests E2E basados en UAT
- Ejecutar `valida todo` completo
- Verificar cobertura
- Si pasa: PR listo; si falla: loop corrección

### Fase 5: Documentación (automático)
- Actualizar `AGENTS.md` si hay nuevo patrón
- Actualizar summary del agente correspondiente
- Generar video demo (si aplica)
- Mover story a `docs/stories/completed/`

---

## Variables de Contexto

| Variable | Fuente |
|----------|--------|
| `STORY_ID` | Argumento del comando |
| `TENANT_TEST` | Story template, sección 5 |
| `PRIORITY` | Story template, header |
| `FEATURE_NAME` | Story template, sección 1 |

## Comandos de Pipeline por Story

```bash
# Iniciar story
kilo run story --id STRY-XXX

# Ver estado de story activa
cat docs/stories/active/*.md | grep "Estado:"

# Ejecutar validación completa de story actual
kilo run valida-todo

# Marcar como completada y mover
cp docs/stories/active/STRY-XXX.md docs/stories/completed/
rm docs/stories/active/STRY-XXX.md
```

---

## Notas para Orquestador

- Si no hay `docs/stories/active/*.md`, el orquestador debe crear uno a partir del template
- Si hay más de 1 archivo activo, procesar el de mayor prioridad (P0 > P1 > P2 > P3)
- Si story está BLOCKED por más de 24h, notificar al usuario
