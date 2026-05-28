# STRY-021 — Security & Performance Hardening

## Metadata

| Campo         | Valor                                                   |
| ------------- | ------------------------------------------------------- |
| **ID**        | STRY-021                                                |
| **Título**    | Security & Performance Hardening — auditoría exhaustiva |
| **Auditor**   | Claude Sonnet 4.6 (análisis estático, 2026-05-28)       |
| **Ejecutor**  | Agente de codificación (NO el auditor)                  |
| **Prioridad** | P0 — bloquea producción                                 |
| **Rama**      | `fix/stry-021-security-perf-hardening`                  |

---

## Contexto

Auditoría exhaustiva de seguridad y rendimiento ejecutada el 2026-05-28 sobre el
commit `fca6540`. Se encontraron **10 vulnerabilidades de seguridad** (3 críticas,
5 altas, 2 medias) y **8 problemas de rendimiento** (3 críticos, 3 altos, 2 medios)
que explican directamente por qué la app es lenta e insegura.

> **REGLA DE ORO:** El agente codificador NO evalúa si los hallazgos son válidos
> — eso ya fue hecho por el auditor. El agente solo implementa los fixes exactamente
> como se describen, corre el pipeline de validación, y reporta el resultado.

---

## Hallazgos que cubre esta US

### 🔴 Bloque A — Eliminación de endpoints de debug peligrosos (SEC-001, SEC-002, SEC-003)

| ID      | Endpoint                       | Problema                                               |
| ------- | ------------------------------ | ------------------------------------------------------ |
| SEC-001 | `GET /api/diagnose/user-check` | Credential oracle: email+password en URL, sin auth     |
| SEC-002 | `GET /api/debug/auth-check`    | Email y contraseña hardcodeados, stack traces públicos |
| SEC-003 | `POST /api/debug/seed-e2e`     | Email real del owner + contraseña "admin" hardcodeados |

### 🔴 Bloque B — Middleware y arquitectura multi-tenant (SEC-004, SEC-005, SEC-006)

| ID      | Archivo         | Problema                                                      |
| ------- | --------------- | ------------------------------------------------------------- |
| SEC-004 | `middleware.ts` | `/api/*` excluido del matcher — bypasea CSRF, origin, tenant  |
| SEC-005 | `middleware.ts` | Tenant ID = slug (no UUID) — RLS y validaciones rotas         |
| SEC-006 | `middleware.ts` | `x-internal-request: true` es falseable por cualquier cliente |

### 🔴 Bloque C — Seguridad de integraciones externas (SEC-007, SEC-008)

| ID      | Archivo                             | Problema                                  |
| ------- | ----------------------------------- | ----------------------------------------- |
| SEC-007 | `app/api/whatsapp/webhook/route.ts` | Sin verificación HMAC-SHA256 de Meta      |
| SEC-008 | `app/api/upload/route.ts`           | Sin autenticación ni validación de tenant |

### 🟡 Bloque D — CSP y endpoints de diagnóstico (SEC-009, SEC-010)

| ID      | Archivo                     | Problema                                               |
| ------- | --------------------------- | ------------------------------------------------------ |
| SEC-009 | múltiples `/api/diagnose/*` | Exponen host, port, DB params, stack traces en staging |
| SEC-010 | `next.config.js`            | CSP con `unsafe-inline` en producción por MercadoPago  |

### ⚡ Bloque E — Rendimiento en hot paths (PERF-001, PERF-002)

| ID       | Archivo                    | Problema                                               |
| -------- | -------------------------- | ------------------------------------------------------ |
| PERF-001 | `middleware.ts`            | `verifyAuthToken()` + posible DB query en CADA request |
| PERF-002 | `lib/db/tenant-service.ts` | 19 `console.warn` por cada `getTenantWithData()` call  |

### ⚡ Bloque F — Infraestructura de caché y rate limiting (PERF-003, PERF-004)

| ID       | Archivo                        | Problema                                              |
| -------- | ------------------------------ | ----------------------------------------------------- |
| PERF-003 | `tenant-service.ts` + cached   | Triple capa de caché con invalidación descoordinada   |
| PERF-004 | `lib/security/rate-limiter.ts` | Map en memoria — inútil en serverless/multi-instancia |

### ⚡ Bloque G — Miscellaneous rendimiento (PERF-005 a PERF-008)

| ID       | Archivo                     | Problema                                                    |
| -------- | --------------------------- | ----------------------------------------------------------- |
| PERF-005 | múltiples `route.ts`        | `force-dynamic` innecesario en 20 rutas — deshabilita caché |
| PERF-006 | `lib/db/connection.ts`      | Health check abre nueva conexión TCP en cada llamada        |
| PERF-007 | `whatsapp/webhook/route.ts` | Log completo del body (PII) en cada mensaje entrante        |
| PERF-008 | `app/api/upload/route.ts`   | Devuelve base64 en respuesta HTTP cuando falla Cloudinary   |

---

## Fases de implementación

| Fase | Nombre                            | Bloques | Tiempo estimado |
| ---- | --------------------------------- | ------- | --------------- |
| 1    | Nuke endpoints de debug           | A       | 45 min          |
| 2    | Fix middleware tenant + seguridad | B       | 3 h             |
| 3    | Integraciones externas seguras    | C       | 2 h             |
| 4    | CSP + diagnose hardening          | D       | 1.5 h           |
| 5    | Performance hot paths             | E       | 2 h             |
| 6    | Caché + rate limiting distribuido | F       | 2.5 h           |
| 7    | force-dynamic + misc perf         | G       | 1.5 h           |

**Total estimado: ~13h de codificación**

---

## Reglas del pipeline (obligatorias por fase)

```
1. npm run lint          → 0 errores
2. npm run typecheck     → 0 errores
3. npm run build         → build exitoso
4. npm run test:unit     → 0 fallos
5. npm run test:e2e:subset -- --grep "STRY-021"  → 0 fallos
```

Si cualquier paso falla → **corregir antes de pasar a la siguiente fase**.
Máx 5 intentos por fase. Si persiste → reportar bloqueo documentado.

---

## Estado de fases

| Fase                          | Estado |
| ----------------------------- | ------ |
| Fase 1 — Nuke debug endpoints | ✓ done |
| Fase 2 — Middleware hardening | ✓ done |
| Fase 3 — Integraciones        | ✓ done |
| Fase 4 — CSP + Diagnose       | ✓ done |
| Fase 5 — Performance hot path | ✓ done |
| Fase 6 — Caché + Rate limit   | ✓ done |
| Fase 7 — Misc perf            | ✓ done |
| E2E: 11/11 passed             | ✓ done |
| Build                         | ✓ done |
| Lint + TypeCheck              | ✓ done |
