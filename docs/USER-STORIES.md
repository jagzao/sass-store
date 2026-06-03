# User Stories — Sass Store

## Índice de Stories

| ID           | Story                                   | Prioridad | Estado     | Sprint |
| ------------ | --------------------------------------- | --------- | ---------- | ------ |
| STRY-001     | POS robusto con E2E completo            | P0        | done       | S1     |
| STRY-017     | Plataforma: rendimiento + seguridad     | P0        | analysis   | S1     |
| STRY-018     | Recuperación E2E y CI Gate              | P0        | active     | S1     |
| STRY-019     | Higiene de secretos y observabilidad    | P0        | analysis   | S1/S2  |
| STRY-020     | Go-Live hardening y salida a producción | P0        | active     | S2     |
| **STRY-022** | **Quality OS compliance y dashboard**   | **P0**    | **active** | **S2** |
| STRY-023     | Sesiones deportivas (clases grupales)   | P1        | done       | S2     |
| STRY-002     | Retouch System — E2E + validación       | P0        | backlog    | S1     |
| STRY-003     | Inventory auto-deduction en POS         | P0        | backlog    | S1     |
| STRY-004     | Health Panel operativo                  | P1        | backlog    | S2     |
| STRY-005     | Reportes PDF/Excel Finance              | P1        | backlog    | S2     |
| STRY-006     | Notificaciones push/WhatsApp            | P1        | backlog    | S2     |
| STRY-007     | Sistema de reseñas/calificaciones       | P1        | backlog    | S2     |
| STRY-008     | Loyalty / puntos por compra             | P1        | backlog    | S2     |
| STRY-009     | Google Calendar 2-way sync              | P2        | backlog    | S3     |
| STRY-010     | Analytics avanzado por tenant           | P2        | backlog    | S3     |
| STRY-011     | Onboarding wizard                       | P2        | backlog    | S3     |
| STRY-012     | Multi-sucursal por tenant               | P2        | backlog    | S3     |
| STRY-013     | App móvil nativa                        | P3        | backlog    | Future |
| STRY-014     | Marketplace de templates                | P3        | backlog    | Future |
| STRY-015     | AI suggestions social media             | P3        | backlog    | Future |
| STRY-016     | Traducción multi-idioma                 | P3        | backlog    | Future |

---

## Proceso de Gestión

1. **Backlog** en `docs/stories/BACKLOG.md`
2. **Active** en `docs/stories/active/STRY-XXX-*.md`
3. **Completadas** en `docs/stories/completed/STRY-XXX-*.md`
4. **Sprint** en `.agents/sprint/STRY-XXX-*/` (`plan.md`, `implementacion.md`, `testing-usuario.md`)
5. **Orquestador:** `kilo run story --id STRY-XXX` → PM → Architect → Dev → QA → visto bueno → `done`

---

_Fuente de verdad: `docs/stories/BACKLOG.md` y `.agents/sprint/`. Actualizado: 2026-05-31._
