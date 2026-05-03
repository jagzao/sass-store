# Story: STRY-001 — POS robusto con E2E completo

> **ID:** STRY-001  
> **Estado:** done ✅ (visto bueno dueño 2026-05-03)  
> **Prioridad:** P0  
> **Sprint:** S1  
> **Asignado:** Dev  
> **Creado:** 2026-04-28  
> **Actualizado:** 2026-05-03  

**Artefactos de sprint:** `.agents/sprint/STRY-001-pos-robusto-e2e/`

---

## 1. Narrativa

Como **administrador de un tenant con punto de venta**, quiero **operar el POS de forma estable (terminales, ventas, flujos críticos) con cobertura E2E**, para que **las regresiones se detecten antes de entregar al cliente**.

### Contexto

El backlog marca esta historia como **en progreso**. El detalle de ejecución vive en `.agents/sprint/STRY-001-pos-robusto-e2e/plan.md`. La definición formal de “story completa” incluye implementación, tests, fixes, retest UT, **Playwright CLI (headed+headless) ejecutado por el agente** en todos los tenants del doc y **visto bueno explícito del dueño** (no segunda ronda de QA) antes de marcar `done` y publicar (ver `AGENTS.md` § 1.2–§ 1.4).

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Terminales POS accesibles por tenant

```gherkin
Dado un usuario autenticado con permisos de finanzas/POS en un tenant válido
Cuando solicita la lista de terminales POS
Entonces recibe un resultado coherente (lista o vacío) sin filtrar datos de otros tenants
Y el comportamiento se verifica por separado en cada tenant activo del entorno (hoy: wondernails y centro-tenistico)
```

### CA-2: Registro de venta / flujo principal POS

```gherkin
Dado un terminal POS configurado para el tenant
Cuando se ejecuta el flujo principal de venta documentado en testing-usuario.md
Entonces la operación concluye con estado esperado y datos persistidos correctamente por tenant
Y el flujo se ejecuta con éxito en wondernails y en centro-tenistico
```

### CA-3: Errores manejados sin fugas

```gherkin
Dado una petición inválida o sin permisos
Cuando se invoca la API POS
Entonces la respuesta refleja un DomainError tipado y mensaje seguro para el usuario
```

---

## 3. Mockups / Wireframes

- [x] No aplica (refuerzo de robustez + E2E sobre flujos existentes)

---

## 4. Contrato Técnico (API)

### Endpoints (referencia inicial; ajustar según implementación real)

```
GET/POST  /api/finance/pos/terminals
GET/POST  /api/finance/pos/sales
```

### DomainError Variants

- `ValidationError`, `NotFoundError`, `AuthorizationError`, `DatabaseError` — según Result Pattern en rutas tocadas.

---

## 5. Impacto Multitenancy

- [x] Modifica o valida queries existentes con aislamiento por tenant
- [x] **Tenants de prueba E2E:** `wondernails` y `centro-tenistico` (todos los activos hoy); mismos escenarios A/B por slug; credencial `jagzao@gmail.com` / `admin` — ver `testing-usuario.md`

---

## 6. Plan de Implementación

Ver **`.agents/sprint/STRY-001-pos-robusto-e2e/plan.md`** (plan vivo). Esta story replica el checklist del template; el sprint folder es la guía operativa diaria.

---

## 7. Checklist de Calidad

- [ ] Tests unitarios ≥80% en archivos nuevos/modificados de la US
- [ ] `npm run test:unit` limpio tras fixes
- [ ] Tests E2E Playwright alineados a `testing-usuario.md` y grep `STRY-001|pos` (o tag acordado)
- [ ] Result Pattern en lógica nueva o migrada en el alcance
- [ ] `npm run build`, `lint`, `typecheck` sin errores
- [ ] **Visto bueno del dueño** registrado (comentario en story o issue) sobre entrega **ya** verde por Playwright CLI + § 1.3, antes de `Estado: done`
- [ ] Tras `done`: commit, push rama/PR, publicación según proceso del equipo

---

## 8. Métricas de Éxito

| Métrica        | Target | Actual |
|----------------|--------|--------|
| E2E flujo POS  | 100% pasando en CI/local | — |
| Cobertura UT   | ≥80% archivos tocados | — |

---

## 9. Notas y Riesgos

- Alinear nombres de grep en Playwright con `testing-usuario.md` para trazabilidad STRY-001.
- No marcar `done` ni mover a `completed/` sin **visto bueno** explícito del dueño sobre trabajo ya validado por el agente (`AGENTS.md` § 1.4).

---

**Orquestador:** `kilo run story --id STRY-001` → PM → Architect → Dev → QA (agente, Playwright CLI) → **visto bueno dueño** → Done → push/publicar
