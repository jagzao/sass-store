# Story: STRY-019 — Higiene de secretos y observabilidad de errores

> **ID:** STRY-019
> **Estado:** analysis
> **Prioridad:** P0
> **Sprint:** S1 (puede solaparse con S2)
> **Asignado:** Security → Dev → QA
> **Creado:** 2026-05-03
> **Actualizado:** 2026-05-03

**Artefactos de sprint:** `.agents/sprint/STRY-019-secrets-observability/` con `plan.md`, `implementacion.md`, `testing-usuario.md`.

---

## 1. Narrativa

Como **administrador de plataforma**, quiero **rotar los secrets expuestos en el historial de git, eliminar archivos basura con syntaxis rota, implementar un health endpoint confiable y añadir tracking básico de errores en runtime**, para que **producción sea resistente a fugas de credenciales y detectemos incidentes antes de que los usuarios nos lo reporten**.

### Contexto

- `.env.local` actual contiene secrets reales (`CLOUDINARY_API_SECRET`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `UPSTASH_REDIS_REST_TOKEN`, `DATABASE_URL` con contraseña Supabase).
- `scripts/remove-console-logs.ts` tiene línea truncada (sintaxis rota) y bloquea tsc limpio.
- Next.js build usa `ignoreBuildErrors: true` (oculta errores type).
- Vercel timeout = 30s sin justificación documentada para rutas pesadas.
- No existe Sentry/LogRocket ni health endpoint operativo.

---

## 2. Criterios de Aceptación (Gherkin)

### CA-1: Secrets rotados

```gherkin
Dado que .env.local tuvo secrets en git historial
Cuando se revisan tokens/claves expuestos
Entonces los secrets sensibles (CLOUDINARY_API_SECRET, NEXTAUTH_SECRET, GOOGLE_CLIENT_SECRET, UPSTASH_REDIS_REST_TOKEN, DATABASE_URL si cambió) se rotan en proveedores
Y se registra en .agents/sprint/STRY-019-secrets-observability/implementacion.md qué se rotó y qué no
Y .env.local queda con placeholders o se asegura que .gitignore lo excluye definitivamente
```

### CA-2: Archivos basura depurados

```gherkin
Dado scripts/remove-console-logs.ts con error TS1128
Cuando se corrige o elimina el archivo no funcional
Entonces tsc --noEmit --incremental false pasa con 0 errores
Y no quedan scripts con sintaxis rota en scripts/
```

### CA-3: Next.js build sin ignoreBuildErrors

```gherkin
Dado next.config.js con typescript.ignoreBuildErrors = true
Cuando se quita el flag o justifica por qué debe quedar
Entonces npm run build sigue pasando sin errores
Y cualquier error de tipo queda visible y accionable
```

### CA-4: Timeout Vercel razonable

```gherkin
Dado vercel.json con maxDuration: 30
Cuando se revisan las rutas críticas (sync, pagos, reportes)
Entonces se ajusta timeout por ruta según necesidad (30s, 60s, 300s)
O se documenta justificación de 30s con plan de paginación
```

### CA-5: Error tracking básico (Sentry o LogRocket)

```gherkin
Dado que la app tiene error-boundary.tsx con TODO: Send to error tracking service
Cuando se integra Sentry (free tier) o LogRocket
Entonces las excepciones no atrapadas se reportan con contexto de tenant y usuario
Y el middleware de Next.js reporta errores 500
```

### CA-6: Middleware deprecated migrado o justificado

```gherkin
Dado que Next.js 16 deprecated middleware.ts
Cuando se propone migración a proxy o se documenta plan
Entonces el warning no aparece en build
O existe un plan con fecha en backlog para migrar
```

---

## 3. Mockups / Wireframes

- [x] No aplica

---

## 4. Contrato Técnico

### Health endpoint (también entregado en STRY-018 si se solapa)

```
GET /api/health
Response: { status, version, timestamp, checks: { database, redis } }
```

### Sentry init

```typescript
// app/global-error.tsx o error-boundary.tsx
import * as Sentry from "@sentry/nextjs";
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
```

---

## 5. Impacto Multitenancy

- [ ] Sin impacto en DB
- [ ] Tenants de prueba: n/a (cambio global de plataforma)

---

## 6. Plan de Implementación

Detalle operativo: `.agents/sprint/STRY-019-secrets-observability/plan.md`.

### Fase 0: Auditoría

- [ ] Inventario de secrets expuestos en historial: `git log -p --all -- .env.local`
- [ ] Revisión scripts/\*.ts: listar sintaxis rotos o no usados
- [ ] Revisión vercel.json timeouts y justificación

### Fase 1: Secrets

- [ ] Rotar CLOUDINARY_API_SECRET (Cloudinary dashboard)
- [ ] Rotar NEXTAUTH_SECRET (generar nuevo)
- [ ] Rotar GOOGLE_CLIENT_SECRET (Google Cloud Console)
- [ ] Rotar UPSTASH_REDIS_REST_TOKEN (Upstash dashboard)
- [ ] Actualizar Vercel env variables (`vercel env add`)
- [ ] Actualizar `.env.local` local con nuevos placeholders
- [ ] Registrar en implementacion.md qué tokens fueron rotados

### Fase 2: Archivos basura

- [ ] Corregir o eliminar `scripts/remove-console-logs.ts`
- [ ] Limpiar scripts/\*.ts que ya no se usan (lista en plan.md tras inventario)
- [ ] Verificar `tsc --noEmit` limpio

### Fase 3: Build strict

- [ ] Quitar `ignoreBuildErrors: true` en `next.config.js`
- [ ] Corregir errores TS que aparezcan
- [ ] `npm run build` → verificar pasa

### Fase 4: Observabilidad

- [ ] Crear `/api/health` (si aún no existe por STRY-018)
- [ ] Integrar Sentry `@sentry/nextjs` (DSN via env)
- [ ] Enviar errores desde `error-boundary.tsx`
- [ ] Enviar errores desde `global-error.tsx`

### Fase 5: Middleware + Vercel

- [ ] Revisar `vercel.json`: ruta por ruta timeout según necesidad
- [ ] Documentar plan migración middleware deprecated

---

## 7. Checklist de Calidad

- [ ] Secrets rotados con evidencia en implementacion.md
- [ ] tsc --noEmit 0 errores en todo el repo
- [ ] npm run build sin ignoreBuildErrors y sin errores
- [ ] Health endpoint operativo
- [ ] Sentry/LogRocket configurado y reportando errores (test manual)
- [ ] `npm run lint`, `typecheck` sin errores
- [ ] **Visto bueno del dueño** antes de `done` (especialmente la rotación de secrets requiere validación manual del usuario)

---

## 8. Métricas de Éxito

| Métrica                              | Target              | Actual                      |
| ------------------------------------ | ------------------- | --------------------------- |
| Secrets rotados                      | ≥4 tokens sensibles | 0                           |
| tsc --noEmit errores                 | 0                   | 1 (script roto)             |
| Build strict (sin ignoreBuildErrors) | ✅                  | ❌ (ignoreBuildErrors=true) |
| Health endpoint                      | ✅                  | ❌                          |
| Error tracking (Sentry)              | Configurado         | ❌                          |

---

## 9. Notas y Riesgos

- **Riesgo crítico:** La rotación de secrets requiere acceso a los dashboards del usuario (Cloudinary, Google Cloud, Upstash, Supabase). Esto NO puede hacerlo el agente autónomo. El plan debe incluir la **lista exacta de pasos** para que el usuario ejecute manualmente, y el agente verifique que el archivo local ya tiene los nuevos tokens.
- **Riesgo:** Quitar `ignoreBuildErrors: true` puede exponir decenas de errores type preexistentes. Si eso pasa, se acota el fix: arreglar errores críticos primero, documentar el resto.
- **Dependencia:** STRY-019 y STRY-018 pueden solapar en el health endpoint. El plan debe aclarar quién lo crea (recomendación: STRY-018 lo crea, STRY-019 lo consume en Sentry).

---

**Orquestador:** `Implementa STRY-019` → PM → Architect → Dev → QA bucle → **visto bueno del dueño (manual para secrets)** → `done`
