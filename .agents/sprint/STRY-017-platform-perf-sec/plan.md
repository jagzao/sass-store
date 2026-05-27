# Plan � STRY-017 Plataforma: rendimiento y seguridad (ejecuci�n)

## Objetivo

Resolver los 9 cuellos de botella de rendimiento identificados en la Fase 0.
Entregar por fases, validando con Playwright CLI (headed fix headless) en cada una.

## Fases

| Fase   | Nombre                                         | Archivos clave          | Impacto                  |
| ------ | ---------------------------------------------- | ----------------------- | ------------------------ |
| Fase 1 | ISR + quitar force-dynamic en rutas tenant     | layout.tsx, page.tsx    | TTFB -80%, DB -60%       |
| Fase 2 | Memoizaci�n getTenantBySlug con unstable_cache | get-tenant.ts           | -2 queries/req           |
| Fase 3 | Pool DB: subir max en remoto                   | connection.ts           | Paralelismo              |
| Fase 4 | Paginaci�n obligatoria en API cr�ticas         | 4 API routes            | Evita degradaci�n lineal |
| Fase 5 | Paginaci�n en hooks React Query                | hooks + lib/api         | Menos payload client     |
| Fase 6 | CacheManager real en hot paths                 | cache.ts, public routes | Cache hits >80%          |
| Fase 7 | Bundle: dynamic import GSAP                    | Hero components         | -80KB JS inicial         |
| Fase 8 | Paralelizar validaciones booking POST          | bookings/route.ts       | -30% latencia escritura  |

## Reglas de pipeline

1. C�digo ? test CLI headed ? fix ? test CLI headless ? siguiente fase.
2. M�ximo 5 intentos por paso. Si persiste, reportar bloqueo.
3. Build + lint + typecheck tras cada fase.
4. E2E subset con grep STRY-017 o tenant.
5. Multitenant: validar en wondernails y centro-tenistico.

## Estado

| Fase                  | Estado      |
| --------------------- | ----------- |
| Fase 1 ISR            | in_progress |
| Fase 2 Memoizaci�n    | pending     |
| Fase 3 Pool DB        | pending     |
| Fase 4 Paginaci�n API | pending     |
| Fase 5 Paginaci�n UI  | pending     |
| Fase 6 Redis Cache    | pending     |
| Fase 7 Bundle         | pending     |
| Fase 8 Paralelismo    | pending     |
| UAT E2E               | pending     |
| Visto bueno due�o     | pending     |
