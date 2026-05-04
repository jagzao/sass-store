# Plan de ejecución — STRY-019 Secrets + Observability

## Objetivo

Eliminar secrets expuestos, limpiar scripts basura, poner build strict, health endpoint y error tracking.

## Orden sugerido

1. **Auditoría secrets** — Inventario de tokens expuestos en historial.
2. **Rotación** — Lista exacta de pasos para el dueño (no automatizable por agente).
3. **Limpieza scripts** — Arreglar `remove-console-logs.ts`, eliminar o fixear.
4. **Build strict** — Quitar `ignoreBuildErrors`, arreglar errores TS.
5. **Health endpoint** — Crear `app/api/health/route.ts`.
6. **Observabilidad** — Integrar Sentry `@sentry/nextjs`.
7. **Middleware + Vercel** — Documentar timeout por ruta y plan migración middleware.
8. **Handoff** — Evidencia + visto bueno (especial para rotación secrets).

## Asunciones / defaults

- Si el dueño no tiene acceso inmediato a dashboards: la rotación queda como tarea manual documentada; el agente prepara la lista y el dueño la ejecuta.
- Si quitar `ignoreBuildErrors` expone >20 errores: se hace acotación (arreglar críticos, skip resto con ticket TECH-XXX).

## Estado

| Fase                    | Estado                    |
| ----------------------- | ------------------------- |
| Auditoría secrets       | [ ]                       |
| Rotación (manual dueño) | [ ]                       |
| Limpieza scripts        | [ ]                       |
| Build strict            | [ ]                       |
| Health                  | [ ]                       |
| Sentry                  | [ ]                       |
| Validación humana       | [ ] pendiente visto bueno |
