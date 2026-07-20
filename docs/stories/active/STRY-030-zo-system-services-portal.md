# STRY-030 — Convertir zo-system en portal real de servicios de desarrollo

> **ID:** STRY-030  
> **Estado:** analysis  
> **Prioridad:** P1  
> **Sprint:** Current  
> **Asignado:** Dev agent  
> **Creado:** 2026-07-20  
> **Actualizado:** 2026-07-20

**Artefactos de sprint:** `.agents/sprint/STRY-030-zo-system-services-portal/plan.md`

---

## 1. Narrativa

Como **dueño de Zo System**, quiero **convertir el tenant `zo-system` en un portal de servicios de desarrollo con contenido real basado en mi CV y objetivos de crecimiento**, para que **los visitantes vean una oferta profesional creíble y puedan contactar/agendar consultoría**.

### Contexto

`zo-system` es actualmente un tenant de catálogo genérico con servicios placeholder (`Tech Consultation`, `Code Review`, etc.) y proyectos ficticios (`EcoSmart Dashboard`, `FinTech Vault`). El objetivo es usar datos públicos de `interview_nail/` (CV, gigs Fiverr, plan LinkedIn) para mostrar servicios reales, casos verificables y un portal de cliente donde se pueda ver progreso de proyectos.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Activar business type development

```gherkin
Dado que el tenant zo-system existe en la base de datos
Cuando se consulta tenant_configs con category='business' y key='type'
Entonces el valor es "development"
Y la ruta /t/zo-system/development resuelve el portal de desarrollo
```

### CA-2: Landing page con servicios reales

```gherkin
Dado que un visitante navega a /t/zo-system
Cuando se renderiza la landing page
Entonces se muestran servicios alineados al perfil real (.NET 8, React, Vue, API, n8n)
Y los proyectos placeholder son reemplazados por casos verificables o personal projects públicos
```

### CA-3: Portal de cliente muestra roadmap real

```gherkin
Dado que un cliente autenticado visita /t/zo-system/development
Cuando el tenant tiene proyectos seedeados
Entonces se muestran proyectos, sprints y tareas con nombres realistas
Y se puede ver el progreso por proyecto
```

### CA-4: Seed reproducible

```gherkin
Dado que se ejecuta npm run db:seed
Cuando el seed procesa zo-system
Entonces actualiza o inserta tenant_configs sin duplicados
Y crea/actualiza servicios, productos y proyectos demo
```

### CA-5: No exponer datos confidenciales

```gherkin
Dado que se revisa el contenido publicado
Entonces no aparece información fiscal, salarial, ni nombres de contratos activos/confidenciales
```

---

## 3. Mockups / Wireframes

- No aplica. Se reutilizan componentes existentes (`ZoHero`, `ZoServices`, `ZoProjects`, `DevelopmentPortalClient`).

---

## 4. Contrato Técnico (API)

### Endpoints existentes reutilizados

```
GET /api/tenants/{tenant}/development/projects
GET /api/tenants/{tenant}/development/daily?projectId=&date=&generate=
```

No se agregan endpoints nuevos. La data demo proviene del seed.

### Response

Ver `apps/web/lib/services/development-service.ts` tipos `DevProjectWithSprints[]` y `DevDailyReportDto[]`.

---

## 5. Impacto Multitenancy

- [ ] Nueva tabla con `tenant_id` — No, tablas ya existen.
- [ ] Nueva RLS policy — No, políticas ya aplicadas.
- [x] Modifica queries existentes — Seed actualiza datos de `zo-system`.
- [x] Nuevas páginas/componentes UI — Home `zo-system` y página pública de servicios.
- [ ] Sin impacto en DB — Parcial: solo seed/config.
- [ ] **Tenant de prueba E2E:** `zo-system`.

---

## 6. Plan de Implementación

Detalle operativo en `.agents/sprint/STRY-030-zo-system-services-portal/plan.md`.

### Fase 1: DB + Seed
- Ajustar `apps/web/lib/db/seed-data.ts`.
- Agregar `tenant_configs` para `zo-system` con business type `"development"`.
- Reemplazar servicios/productos/proyectos demo por contenido real.

### Fase 2: UI pública
- Reescribir `ZoHero`, `ZoServices`, `ZoProjects` con datos del CV y gigs Fiverr, **incluyendo stack Node.js, Next.js y Python**.
- Ajustar `ZoLandingPage` para cargar servicios vía API y mostrar sección de stack/tecnologías.
- Crear/ajustar página pública de servicios `/t/zo-system/services` para mostrar los servicios reales seedeados.

### Fase 3: Customer portal
- Verificar `/t/zo-system/development` muestra proyectos seedeados.
- Agregar CTA a servicios dentro del portal.

### Fase 4: Tests + QA
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`.
- Playwright headed/headless sobre `zo-system`.
- Actualizar/crear `testing-usuario.md`.

---

## 7. Checklist de Calidad

- [ ] Tests unitarios ≥80% cobertura en lógica modificada.
- [ ] Tests E2E pasando (sin skips).
- [ ] Result Pattern en lógica nueva (no aplica; solo seed).
- [ ] `tenant_id` filtrado en todas las queries (ya existente).
- [ ] `npm run build` sin errores.
- [ ] `npm run lint` sin errores.
- [ ] `npm run typecheck` sin errores.
- [ ] Documentación actualizada (`AGENTS.md`, `AGREGAR_TENANT.md` si cambia modos).
- [ ] `testing-usuario.md` ejecutado por agente con `jagzao@gmail.com`/`admin`.
- [ ] **Visto bueno del dueño** antes de marcar `done`.

---

## 8. Métricas de Éxito

| Métrica | Target | Actual |
|---|---|---|
| Servicios reales publicados | 5 | — |
| Proyectos demo en portal | 1-2 | — |
| Tests unitarios | verdes | — |
| Tests E2E | verdes | — |
| Build + lint + typecheck | verdes | — |

---

## 9. Notas y Riesgos

- **Riesgo principal:** filtrar accidentalmente datos confidenciales del CV. Se debe auditar todo contenido público.
- **Dependencia:** migración `add-development-portal-tables.sql` ya debe estar aplicada en la DB local.
- **Impacto en tests existentes:** `zo-system` es fallback tenant; verificar auth y E2E tras cambiar servicios/landing.

---

**Orquestador:** Ejecutar plan en `.agents/sprint/STRY-030-zo-system-services-portal/plan.md` → implementación → QA → visto bueno del dueño.
