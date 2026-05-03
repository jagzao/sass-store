# Backlog de User Stories — Sass Store

> Ficha técnica central de requerimientos.  
> Cada feature se convierte en un archivo `.md` en `active/` y se mueve a `completed/` al cerrarse.

---

## Estado Actual del Backlog

| ID | Story | Prioridad | Estado | Sprint | Owner |
|----|-------|-----------|--------|--------|-------|
| STRY-001 | POS robusto con E2E completo | P0 | done | S1 | Dev → [`completed/STRY-001-pos-robusto-e2e.md`](completed/STRY-001-pos-robusto-e2e.md) · [sprint](../../.agents/sprint/STRY-001-pos-robusto-e2e/) |
| STRY-002 | Retouch System — E2E + validación | P0 | backlog | S1 | Dev |
| STRY-002 | Retouch System — E2E + validación | P0 | backlog | S1 | Dev |
| STRY-003 | Inventory auto-deduction en POS | P0 | backlog | S1 | Dev |
| STRY-004 | Health Panel operativo | P1 | backlog | S2 | Dev |
| STRY-005 | Reportes PDF/Excel Finance | P1 | backlog | S2 | Dev |
| STRY-006 | Notificaciones push/WhatsApp | P1 | backlog | S2 | Dev |
| STRY-007 | Sistema de reseñas/calificaciones | P1 | backlog | S2 | Dev |
| STRY-008 | Loyalty / puntos por compra | P1 | backlog | S2 | Dev |
| STRY-009 | Google Calendar 2-way sync | P2 | backlog | S3 | Dev |
| STRY-010 | Analytics avanzado por tenant | P2 | backlog | S3 | Dev |
| STRY-011 | Onboarding wizard | P2 | backlog | S3 | Dev |
| STRY-012 | Multi-sucursal por tenant | P2 | backlog | S3 | Dev |
| STRY-013 | App móvil nativa | P3 | backlog | Future | Dev |
| STRY-014 | Marketplace de templates | P3 | backlog | Future | Dev |
| STRY-015 | AI suggestions social media | P3 | backlog | Future | Dev |
| STRY-016 | Traducción multi-idioma | P3 | backlog | Future | Dev |

---

## Bugs Activos (en stories de deuda técnica)

| ID | Bug | Prioridad |
|----|-----|-----------|
| BUG-001 | `Unknown host 'localhost:3001'` fallback noise | P1 |
| BUG-002 | `Missing x-tenant header` en requests inválidos | P1 |
| BUG-003 | 404 logos `/logos/*.png` | P2 |
| BUG-004 | Polling excesivo session + carrito | P2 |

---

## Deuda Técnica (stories de refactor)

| ID | Deuda | Prioridad |
|----|-------|-----------|
| TECH-001 | Migrar ~1,275 try/catch a Result Pattern | P1 |
| TECH-002 | Estandarizar logging por dominio | P1 |
| TECH-003 | Migrar 12 archivos `.test.ts` legacy a `.spec.ts` | P1 |
| TECH-004 | Docker Postgres local para tests | P1 |
| TECH-005 | Middleware Next.js deprecated | P2 |
| TECH-006 | Structured logging tenant-aware | P2 |
| TECH-007 | Audit trail con event sourcing | P3 |

---

## Proceso: Cómo crear una nueva story

1. Copiar `docs/stories/_template.md`
2. Renombrar a `STRY-XXX-{nombre-corto}.md`
3. Llenar secciones 1-5 (PM define)
4. Mover a `docs/stories/active/`
5. `kilo run story --id STRY-XXX` → orquestador ejecuta cadena
6. Al completar el DoD (incl. § 1.3 + Playwright CLI por el agente y § 1.2 **visto bueno** del dueño; ver `AGENTS.md` § 1.4), mover a `docs/stories/completed/`, luego push y publicar

---

*Actualizado: 2026-05-03*
