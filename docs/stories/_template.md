# Story: Template

> **ID:** {id}  
> **Estado:** backlog | analysis | dev | qa | done | blocked  
> **Prioridad:** P0 | P1 | P2 | P3  
> **Sprint:** {sprint}  
> **Asignado:** {agent_role}  
> **Creado:** {YYYY-MM-DD}  
> **Actualizado:** {YYYY-MM-DD}  

**Artefactos de sprint (agente / entrega):** `.agents/sprint/{STRY-XXX-nombre-corto}/` con `plan.md`, `implementacion.md`, `testing-usuario.md` — ver `AGENTS.md` (User Stories § 1.1).

---

## 1. Narrativa

Como **[rol]**, quiero **[acción]**, para que **[beneficio]**.

### Contexto
{Breve contexto del negocio y por qué se necesita esta historia}

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: {Título del criterio}
```gherkin
Dado que {precondición}
Cuando {acción}
Entonces {resultado esperado}
Y {resultado adicional}
```

### CA-2: {Título del criterio}
```gherkin
Dado que {precondición}
Cuando {acción}
Entonces {resultado esperado}
```

### CA-3: Manejo de errores
```gherkin
Dado que {precondición de error}
Cuando {acción que genera error}
Entonces se muestra el error {DomainError.type}
Y el mensaje es amigable para el usuario
```

---

## 3. Mockups / Wireframes

- [ ] URL de Figma: {link}
- [ ] Wireframe local: `design/wireframes/{id}.md`
- [ ] No aplica

---

## 4. Contrato Técnico (API)

### Endpoint
```
{METHOD} /api/{domain}/{action}
```

### Request (Zod Schema)
```typescript
const RequestSchema = z.object({
  // campos requeridos
});
```

### Response
```typescript
type Response = Result<{ /* dominio */ }, DomainError>;
```

### DomainError Variants
- `ValidationError` — input inválido
- `NotFoundError` — recurso no existe
- `AuthorizationError` — sin permisos
- `DatabaseError` — fallo de persistencia

---

## 5. Impacto Multitenancy

- [ ] Nueva tabla con `tenant_id`
- [ ] Nueva RLS policy
- [ ] Modifica queries existentes
- [ ] Sin impacto en DB
- [ ] **Tenant de prueba E2E:** {wondernails | vigistudio | nom-nom | delirios | ...}

---

## 6. Plan de Implementación

### Fase 1: Servicio + Tests Unitarios
- [ ] `lib/services/{feature}Service.ts` — Result<T, DomainError>
- [ ] `tests/unit/services/{feature}Service.spec.ts` — expectSuccess/expectFailure

### Fase 2: API Route
- [ ] `app/api/{domain}/route.ts` — withResultHandler
- [ ] `tests/integration/api/{domain}.spec.ts`

### Fase 3: UI (si aplica)
- [ ] Componente(s) React
- [ ] Hook(s) personalizado(s)
- [ ] Tests de componente (opcional)

### Fase 4: UAT + E2E
- [ ] `.agents/sprint/{id}/testing-usuario.md` — Pasos reproducibles (agente / Playwright); canónico
- [ ] `docs/UAT/{id}-uat.md` — Opcional (legacy / envío a PO)
- [ ] `tests/e2e/{feature}.spec.ts` — Playwright alineado a `testing-usuario.md`
- [ ] Video demo (opcional)

---

## 7. Checklist de Calidad

- [ ] Tests unitarios ≥80% cobertura
- [ ] Tests E2E pasando (sin skips)
- [ ] Result Pattern en lógica nueva
- [ ] `tenant_id` filtrado en todas las queries
- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores
- [ ] `npm run typecheck` sin errores
- [ ] Documentación actualizada (`AGENTS.md`, summaries)
- [ ] **§ 1.3:** `testing-usuario.md` derivado de la US, entorno levantado, `jagzao@gmail.com`/`admin` (o acceso resuelto), todos los escenarios ejecutados con éxito por el agente (`AGENTS.md`)
- [ ] **Visto bueno del dueño** (aprobación explícita sobre trabajo **ya** validado por el agente con Playwright CLI + § 1.3; **no** segunda ronda de QA) antes de `Estado: done` y push/publicar (`AGENTS.md` § 1.2 y § 1.4)

---

## 8. Métricas de Éxito

| Métrica | Target | Actual |
|---------|--------|--------|
| Tiempo de implementación | < X horas | — |
| Tests unitarios | ≥ X | — |
| Tests E2E | ≥ X | — |
| Cobertura | ≥80% | — |

---

## 9. Notas y Riesgos

{Dependencias, bloqueadores, decisiones pendientes}

---

**Orquestador:** Al recibir esta story, el agente ejecuta:  
`kilo run story --id {id}` → PM → Architect → Dev → QA (agente, Playwright CLI) → **visto bueno del dueño** → `done` → push/publicar (ver `AGENTS.md` § 1.2 y § 1.4).
