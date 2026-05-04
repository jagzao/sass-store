# Plan — STRY-017 Plataforma: rendimiento y seguridad

> Fase 0 primero; el resto se prioriza según hallazgos. Actualizar checkboxes y fechas.

## Objetivo

Investigación completa del monorepo + **baseline** medible + **roadmap** de optimización (rendimiento y seguridad) con entregas en PRs pequeños, sin romper multitenancy.

## Fase 0 — Investigación (obligatoria)

| #   | Área                   | Qué revisar                                                                               | Salida                       |
| --- | ---------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| 0.1 | **DB / Supabase**      | `DATABASE_URL`, pooler vs direct, queries calientes, índices, RLS                         | Notas en `implementacion.md` |
| 0.2 | **Caché**              | `lib/cache/redis.ts`, TTL, `TenantCache`, invalidación al escribir                        | Tabla riesgos                |
| 0.3 | **Next / RSC**         | `force-dynamic`, duplicación `getTenantBySlug`/`getTenantDataForPage`, `generateMetadata` | Lista quick-wins             |
| 0.4 | **Middleware**         | `resolveTenantStrict`, BUG-001/BUG-002, APIs `/api/*` sin path tenant                     | Propuesta técnica            |
| 0.5 | **API / auth**         | `withResultHandler`, filtrado errores, rate limit, CSRF                                   | Checklist seguridad          |
| 0.6 | **Cliente**            | bundles, imágenes, polling (BUG-004), Web Vitals                                          | Lista                        |
| 0.7 | **Dependencias**       | `npm audit`, supply chain, env en Vercel                                                  | Resumen                      |
| 0.8 | **Alineación backlog** | BUG-001…004, TECH-001…007                                                                 | Mapeo ID → acción            |

## Fases 1+ (ejemplos; orden real = salida Fase 0)

1. Conexión serverless + pooler documentado y validado en preview.
2. Deduplicación lecturas tenant (p. ej. `React.cache` o capa única).
3. Invalidación Redis / tags para datos que mutan.
4. Middleware: menos fallback incorrecto en dev/E2E sin debilitar prod.
5. Headers seguridad + revisión respuestas API.
6. Reducción logs sensibles / volumen en hot paths.

## Estado

| Fase                     | Estado |
| ------------------------ | ------ |
| Fase 0 Discovery         | [ ]    |
| Fase 1 Implementación P0 | [ ]    |
| UAT / E2E STRY-017       | [ ]    |
| Visto bueno dueño        | [ ]    |

## Riesgos

- Optimizar sin baseline → no demostrable mejora.
- Caché sin tenant en key → incidente seguridad.
