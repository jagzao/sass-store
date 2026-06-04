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

| Fase                 | Estado |
| -------------------- | ------ |
| Fase 1 ISR           | done   |
| Fase 2 Memoizacin    | done   |
| Fase 3 Pool DB       | done   |
| Fase 4 Paginacin API | done   |
| Fase 5 Paginacin UI  | done   |
| Fase 6 CacheManager  | done   |
| Fase 7 Bundle        | done   |
| Fase 8 Paralelismo   | done   |

## Validacion completa

| Paso         | Resultado                             |
| ------------ | ------------------------------------- |
| Build        | 220s, 0 errores                       |
| Lint         | 0 errores (26 warnings preexistentes) |
| Typecheck    | 0 errores                             |
| Unit tests   | 487/487 (35 archivos, 12.56s)         |
| E2E headed   | 69/69 (2.1m, 0 regresiones visuales)  |
| E2E headless | 69/69 (2.8m, 0 fallos funcionales)    |

Commits: `3bb457f`, `fca6540`
| UAT E2E | pending |
| Visto bueno due�o | pending |
