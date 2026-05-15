# Implementación — STRY-017 Plataforma: rendimiento y seguridad

> Trazabilidad **hallazgo → decisión → PR → métrica**.

## Criterios de aceptación

| CA   | Descripción                             | Implementación                                 | Tests UT | Tests E2E                  |
| ---- | --------------------------------------- | ---------------------------------------------- | -------- | -------------------------- |
| CA-1 | npm audit sin high/critical sin excusa  | `npm audit --production` + fix o justificación | —        | Smoke build CI             |
| CA-2 | CSP corregida para MercadoPago          | `apps/web/next.config.js` → `generateCSP()`    | —        | Header smoke manual        |
| CA-3 | DB connection documentada y validada    | `packages/database/` + `vercel.json` env       | —        | Health endpoint DB check   |
| CA-4 | Middleware ruido reducido o justificado | `apps/web/middleware.ts` análisis              | —        | E2E sin warnings en stdout |
| CA-5 | Baseline perf documentado               | Lighthouse en dos tenants                      | —        | —                          |

---

## Fase 0 — Investigación (rellenar durante ejecución)

### 0.1 — npm audit

```bash
npm audit --production --json > /tmp/audit.json
# Listar solo high y critical:
npm audit --production 2>&1 | grep -E "high|critical"
```

| Paquete    | Versión | Severidad | CVSS | Acción |
| ---------- | ------- | --------- | ---- | ------ |
| (rellenar) |         |           |      |        |

Criterio de corte: corregir **todos** los `high` y `critical` sin excepción documentada. Los `moderate` se documentan con ticket TECH-XXX y aceptación.

---

### 0.2 — CSP (Content Security Policy)

**Problema detectado:** `apps/web/next.config.js` función `generateCSP()` incluye referencias a Stripe.js en `script-src`, `connect-src` y `frame-src`, pero el stack usa **MercadoPago** (no Stripe). Stripe fue reemplazado.

**Archivos afectados:**

- [apps/web/next.config.js:25-68](apps/web/next.config.js#L25-L68) — `generateCSP()`

**Fix requerido:**

1. Eliminar `https://js.stripe.com` de `script-src` (línea ~28)
2. Eliminar `https://api.stripe.com` de `connect-src` (línea ~57)
3. Eliminar entradas de frame-src para Stripe (líneas ~62-64)
4. Agregar dominio de MercadoPago si aplica: `https://secure.mlstatic.com`, `https://www.mercadopago.com`
5. Agregar `https://sdk.mercadopago.com` a `script-src` si se carga el SDK

**Verificación:** `curl -sI http://localhost:3002/t/wondernails/ | grep -i content-security`

---

### 0.3 — Conexión DB (Supabase / Drizzle)

**Revisar:**

- `packages/database/src/index.ts` — ¿usa pooler (`pgbouncer`) o conexión directa?
- `vercel.json` / env Vercel — `DATABASE_URL` apunta a pooler (`6543`) o direct (`5432`)?

**Regla Vercel:** serverless functions **deben** usar pooler (puerto 6543) para evitar agotamiento de conexiones. Directa solo en scripts.

| Entorno     | URL esperada                     | Puerto |
| ----------- | -------------------------------- | ------ |
| Vercel prod | `*.supabase.co:6543` (pgbouncer) | 6543   |
| Local dev   | `*.supabase.co:5432` (direct)    | 5432   |

**Hallazgo:** (rellenar tras inspección)

**Acción:** Si prod usa direct, documentar cambio de `DATABASE_URL` en Vercel a la URL del pooler. No codear credenciales.

---

### 0.4 — Middleware: ruido de logs y fallback

**Síntoma conocido (de MEMORY.md):**

- P1: Ruido en logs `unknown host` en tenant middleware
- P1: Missing `x-tenant` header en requests de E2E (`/api/*` con host `127.0.0.1:3002`)

**Archivo:** `apps/web/middleware.ts`

**Análisis a hacer:**

1. Buscar `console.warn` / `console.log` en middleware → candidatos a eliminar o reducir a `debug`
2. Verificar que la resolución de tenant para `/api/*` no genera 500 silenciosos
3. Revisar `resolveTenantStrict` — ¿retorna fallback correctamente cuando host es IP?

**Fix aceptable:** documentar comportamiento como "esperado en E2E (IP host → zo-system fallback)" sin cambios en prod. Si hay log excesivo, eliminar o bajar nivel.

---

### 0.5 — API / Auth: spot-check de rutas sin auth

**Rutas a verificar:**

| Ruta                             | Auth requerida  | Estado                       |
| -------------------------------- | --------------- | ---------------------------- |
| `GET /api/finance/pos/terminals` | ✅ Sí           | (verificar)                  |
| `POST /api/finance/seed`         | ❌ Solo dev/E2E | debe estar protegida en prod |
| `POST /api/debug/seed-e2e`       | ❌ Solo dev/E2E | debe estar protegida en prod |
| `GET /api/health`                | ❌ Público      | OK                           |
| `POST /api/webhooks/mercadopago` | Firma MP        | (verificar)                  |

**Acción crítica:** `POST /api/finance/seed` y `POST /api/debug/seed-e2e` **no deben** ser accesibles en producción sin una guarda de entorno.

**Fix:** agregar guard al inicio de cada route handler de seed:

```typescript
if (process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Not available" }, { status: 403 });
}
```

---

### 0.6 — Cliente: bundles y Web Vitals

**Comandos:**

```bash
# Analizar bundle
ANALYZE=true npm run build
# Lighthouse (requiere app corriendo)
npx lighthouse http://localhost:3002/t/wondernails/ --output=json --quiet
```

**Baseline a documentar:**

| Tenant           | LCP (s) | FCP (s) | TBT (ms) | Performance score |
| ---------------- | ------- | ------- | -------- | ----------------- |
| wondernails      | (medir) | (medir) | (medir)  | (medir)           |
| centro-tenistico | (medir) | (medir) | (medir)  | (medir)           |

**Criterio mínimo para producción:** Performance score ≥ 50 en ambos tenants.

---

### 0.7 — Dependencias

```bash
npm audit --production
npm outdated | head -20
```

Revisar si algún paquete deprecated tiene alternativa activa en el ecosistema Next.js 16.

---

### 0.8 — Alineación backlog

| ID Deuda | Descripción                          | Estado STRY-017  |
| -------- | ------------------------------------ | ---------------- |
| BUG-001  | middleware fallback incorrecto en IP | Documentado §0.4 |
| BUG-002  | missing x-tenant en /api/\* E2E      | Documentado §0.4 |
| TECH-001 | ignoreBuildErrors=true               | → STRY-019       |
| TECH-002 | secrets en historial git             | → STRY-019       |
| TECH-003 | CSP referencias Stripe               | § 0.2 de esta US |

---

## Hallazgos (tabla resumen — rellenar)

| ID    | Área       | Hallazgo                                  | Severidad | Acción / PR              | Estado |
| ----- | ---------- | ----------------------------------------- | --------- | ------------------------ | ------ |
| H-001 | CSP        | Referencias Stripe en proyecto sin Stripe | High      | Fix next.config.js       | [ ]    |
| H-002 | Seeds      | /api/finance/seed sin guard NODE_ENV      | High      | Agregar guard prod       | [ ]    |
| H-003 | Seeds      | /api/debug/seed-e2e sin guard NODE_ENV    | High      | Agregar guard prod       | [ ]    |
| H-004 | DB         | Verificar pooler en Vercel env            | Medium    | Documentar o cambiar URL | [ ]    |
| H-005 | Middleware | Logs ruido en E2E (known/acceptable)      | Low       | Documentar               | [ ]    |
| H-006 | npm audit  | (rellenar tras ejecutar)                  | ?         | (rellenar)               | [ ]    |

---

## PRs vinculados

| PR  | Descripción                     | Merge |
| --- | ------------------------------- | ----- |
| —   | Fix CSP + guards seed endpoints | [ ]   |

---

## Baseline (rellenar tras medición)

- **Fecha:** 2026-05-05
- **Entorno:** local (Next.js dev) / Vercel preview cuando esté disponible
- **npm audit high/critical:** (rellenar)
- **Lighthouse perf wondernails:** (rellenar)
- **Lighthouse perf centro-tenistico:** (rellenar)

---

## Definición de listo

- [ ] Tabla H-00x completa y con severidades
- [ ] H-001 (CSP Stripe) → código corregido y verificado
- [ ] H-002/H-003 (seed guards) → protegidos con NODE_ENV check
- [ ] H-004 (DB pooler) → documentado o URL actualizada
- [ ] npm audit → 0 high/critical sin excepción documentada
- [ ] Baseline LCP/Performance en dos tenants documentado
- [ ] Lint + typecheck + build verdes tras cambios
- [ ] E2E regresión mínima: `npx playwright test --grep "wondernails|centro-tenistico"` verde
- [ ] **Visto bueno del dueño**
