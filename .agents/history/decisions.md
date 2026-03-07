# Architecture Decisions - sass-store

> **Referencia principal:** [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md)
> **Protocolo relacionado:** [validation.md](../protocols/validation.md)

---

## Purpose

Registrar decisiones de arquitectura y producto tecnico que cambian el rumbo del proyecto.

Cada decision debe ser:

- trazable
- justificable
- validable
- reversible (cuando aplique)

---

## Decision Index

| ADR     | Date       | Status   | Area          | Title                                                              |
| ------- | ---------- | -------- | ------------- | ------------------------------------------------------------------ |
| ADR-001 | 2026-03-02 | accepted | backend       | Result Pattern mandatory in new business code                      |
| ADR-002 | 2026-03-02 | accepted | security      | Tenant isolation and RLS baseline                                  |
| ADR-003 | 2026-03-06 | accepted | agent-runtime | Persistent active context in `.agents/session/active_context.json` |

---

## ADR-001 - Result Pattern mandatory in new business code

| Field  | Value        |
| ------ | ------------ |
| Status | accepted     |
| Date   | 2026-03-02   |
| Area   | backend      |
| Owners | backend-core |

### Context

El manejo de errores con `try/catch` disperso generaba respuestas inconsistentes y baja trazabilidad de errores de dominio.

### Decision

Todo codigo nuevo de negocio usa `Result<T, DomainError>` con `ErrorFactories`, `match`, `map`, `flatMap` y validacion tipada con Zod.

### Consequences

- Positivas: flujo de error explicito, pruebas mas simples, respuestas consistentes.
- Negativas: migracion gradual de codigo legacy y curva inicial de adopcion.

### Validation

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`

---

## ADR-002 - Tenant isolation and RLS baseline

| Field  | Value                  |
| ------ | ---------------------- |
| Status | accepted               |
| Date   | 2026-03-02             |
| Area   | security               |
| Owners | backend-core, security |

### Context

El proyecto es multitenant. Cualquier fuga entre tenants es incidente de seguridad critico.

### Decision

Aplicar filtro por `tenantId` en queries tenant-scoped, habilitar RLS en tablas publicas tenantizadas y validar con pruebas de aislamiento.

### Consequences

- Positivas: reduce riesgo de data leakage entre tenants.
- Negativas: mayor disciplina al definir queries y migraciones.

### Validation

- `npm run test:security`
- `npm run rls:test`

---

## ADR-003 - Persistent active context for sessions

| Field  | Value          |
| ------ | -------------- |
| Status | accepted       |
| Date   | 2026-03-06     |
| Area   | agent-runtime  |
| Owners | dev-experience |

### Context

El estado de sesion se guardaba solo en markdown libre. Faltaba un formato serializable para herramientas y automatizaciones.

### Decision

Agregar `.agents/session/active_context.json` como snapshot de estado operativo con campos estables.

### Consequences

- Positivas: mejor interoperabilidad con tooling, mejor continuidad de sesiones.
- Negativas: se debe mantener sincronia minima con `current_task.md`.

### Validation

- JSON valido
- Campos minimos presentes
- `updatedAt` actualizado al cambiar estado de sesion

---

## ADR Template

```markdown
## ADR-XXX - [Short title]

| Field  | Value                                               |
| ------ | --------------------------------------------------- |
| Status | proposed \| accepted \| superseded \| deprecated    |
| Date   | YYYY-MM-DD                                          |
| Area   | backend \| frontend \| security \| infra \| testing |
| Owners | team or role                                        |

### Context

[What problem are we solving?]

### Decision

[What exactly was decided?]

### Consequences

- Positivas:
- Negativas:

### Alternatives considered

1. [Option A] - [Why rejected]
2. [Option B] - [Why rejected]

### Validation

- [Command or measurable check]

### References

- [PR / file / doc]
```
