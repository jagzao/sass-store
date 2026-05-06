# Implementación — STRY-019 Higiene de secretos y observabilidad

> Trazabilidad CA → código → tests.
> **Split agente/dueño:** acciones marcadas con 🤖 las ejecuta el agente autónomamente. Las marcadas 👤 requieren acceso manual del dueño a dashboards externos.

## Criterios de aceptación

| CA   | Descripción                        | Quién     | Implementación                                | Tests |
| ---- | ---------------------------------- | --------- | --------------------------------------------- | ----- |
| CA-1 | Secrets rotados                    | 👤 Dueño  | Guía paso a paso en §Fase 1                   | —     |
| CA-2 | Scripts basura depurados           | 🤖 Agente | Fix/eliminar `scripts/remove-console-logs.ts` | tsc   |
| CA-3 | Build strict sin ignoreBuildErrors | 🤖 Agente | `apps/web/next.config.js` línea 163           | build |
| CA-4 | Timeouts Vercel por ruta           | 🤖 Agente | `vercel.json` actualizado                     | —     |
| CA-5 | Error tracking (Sentry)            | 🤖 Agente | `@sentry/nextjs` instalado + init             | smoke |
| CA-6 | Middleware plan/justificación      | 🤖 Agente | Documento en implementacion.md                | —     |

---

## Fase 0 — Auditoría (agente ejecuta primero)

### 0.1 — Inventario de scripts rotos

```bash
# Verificar sintaxis rota en remove-console-logs.ts
npx tsc --noEmit scripts/remove-console-logs.ts 2>&1 | head -20

# Listar todos los scripts/*.ts que tienen errores
for f in scripts/*.ts; do
  npx tsc --noEmit "$f" 2>&1 | grep -q "error TS" && echo "ROTO: $f"
done
```

**Hallazgo conocido:** `scripts/remove-console-logs.ts` tiene `TS1128: Declaration or statement expected` en línea truncada.

### 0.2 — Inventario de secrets en historial

```bash
git log --all -p -- ".env*" | grep -E "^[+-].*(SECRET|TOKEN|PASSWORD|KEY)=" | head -30
```

**Secrets a revisar (conocidos de la US):**

- `CLOUDINARY_API_SECRET`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `UPSTASH_REDIS_REST_TOKEN`
- `DATABASE_URL` (contiene password Supabase)

**Resultado:** (rellenar durante auditoría)

### 0.3 — Verificar si `ignoreBuildErrors` bloquea errores reales

```bash
# Quitar flag temporalmente y contar errores
# (NO commitear este cambio hasta tener plan de fix)
grep -n "ignoreBuildErrors" apps/web/next.config.js
```

**Resultado esperado:** 1 ocurrencia en línea 163-164.

---

## Fase 1 — 👤 Rotación de Secrets (DUEÑO — no automatizable)

El agente prepara la lista exacta. El dueño ejecuta. El agente verifica después.

### Paso 1.1 — CLOUDINARY_API_SECRET

1. Ir a [cloudinary.com/console](https://cloudinary.com/console) → Settings → Security
2. Clic en "Regenerate" junto a API Secret
3. Copiar el nuevo valor
4. Ejecutar: `vercel env add CLOUDINARY_API_SECRET production` (pegar nuevo valor)
5. También actualizar `.env.local` con el nuevo valor

### Paso 1.2 — NEXTAUTH_SECRET

1. Generar nuevo secret: `openssl rand -base64 32`
2. Copiar el output
3. Ejecutar: `vercel env add NEXTAUTH_SECRET production`
4. Actualizar `.env.local`

### Paso 1.3 — GOOGLE_CLIENT_SECRET

1. Ir a [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Seleccionar el OAuth 2.0 Client ID del proyecto
3. Clic en "Reset Secret"
4. Copiar nuevo valor
5. Ejecutar: `vercel env add GOOGLE_CLIENT_SECRET production`
6. Actualizar `.env.local`

### Paso 1.4 — UPSTASH_REDIS_REST_TOKEN

1. Ir a [console.upstash.com](https://console.upstash.com) → Base de datos → Details
2. Clic en "Reset Token" (o crear nuevo token en Access Control)
3. Copiar nuevo valor
4. Ejecutar: `vercel env add UPSTASH_REDIS_REST_TOKEN production`
5. Actualizar `.env.local`

### Verificación post-rotación (agente)

```bash
# Verificar que Vercel tiene las variables actualizadas (requiere vercel CLI autenticado)
vercel env ls production 2>/dev/null | grep -E "CLOUDINARY|NEXTAUTH|GOOGLE|UPSTASH"
# Si vercel CLI no disponible: el dueño verifica manualmente en vercel.com/dashboard → Settings → Environment Variables
```

**Registro de rotación:**

| Secret                   | Rotado | Fecha | Verificado en Vercel |
| ------------------------ | ------ | ----- | -------------------- |
| CLOUDINARY_API_SECRET    | [ ]    | —     | [ ]                  |
| NEXTAUTH_SECRET          | [ ]    | —     | [ ]                  |
| GOOGLE_CLIENT_SECRET     | [ ]    | —     | [ ]                  |
| UPSTASH_REDIS_REST_TOKEN | [ ]    | —     | [ ]                  |

---

## Fase 2 — 🤖 Archivos basura (agente)

### 2.1 — Fix scripts/remove-console-logs.ts

**Archivo:** `scripts/remove-console-logs.ts`

**Opciones (agente decide según inspección):**

- Si el script está incompleto y no se usa en ningún npm script → **eliminar**
- Si se usa (verificar en `package.json` scripts) → **corregir la sintaxis truncada**

```bash
# Verificar si se usa
grep -r "remove-console-logs" package.json packages/*/package.json apps/*/package.json
```

**Acción:** (rellenar tras inspección — probablemente eliminar si no está en package.json)

### 2.2 — Eliminar tmp-\*.js de raíz del repo

```bash
rm tmp-get-categories.js tmp-health.js tmp-list-tenants.js tmp-test-categories-api.js
```

Estos archivos son scripts de debug temporales, no deben estar en el repo.

### 2.3 — Verificar tsc limpio tras limpieza

```bash
npx tsc --noEmit --incremental false 2>&1 | grep -c "error TS"
# Objetivo: 0
```

---

## Fase 3 — 🤖 Build strict (agente)

### 3.1 — Quitar ignoreBuildErrors

**Archivo:** `apps/web/next.config.js` línea 163

**Cambio:**

```js
// Eliminar o comentar:
typescript: {
  ignoreBuildErrors: true,  // ← eliminar esta línea
},
```

**Reemplazar por:**

```js
typescript: {
  // ignoreBuildErrors eliminado en STRY-019 — build ahora es estricto
},
```

### 3.2 — Ejecutar build y corregir errores

```bash
npm run build 2>&1 | grep "Type error" | head -30
```

**Si aparecen errores:**

1. Corregir cada error de tipo — no silenciar con `as any` salvo que sea un workaround documentado
2. Si hay >10 errores preexistentes difíciles de resolver: documentar como TECH-XXX con plan de fix y usar `// @ts-expect-error TECH-XXX` solo en esos casos, con descripción
3. Re-correr build hasta 0 errores

**Criterio:** `npm run build` exitoso sin `ignoreBuildErrors`.

---

## Fase 4 — 🤖 Observabilidad / Sentry (agente)

### 4.1 — Instalar @sentry/nextjs

```bash
# En la raíz del monorepo:
cd apps/web && npx @sentry/wizard@latest -i nextjs
# O instalar manualmente:
npm install @sentry/nextjs --legacy-peer-deps
```

### 4.2 — Configurar Sentry

**Archivos a crear/modificar:**

`apps/web/sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

`apps/web/sentry.server.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
```

### 4.3 — Integrar en global-error.tsx

**Archivo:** `apps/web/app/global-error.tsx`

Agregar reporte a Sentry cuando exista DSN:

```typescript
import * as Sentry from "@sentry/nextjs";
// En el useEffect del error boundary:
useEffect(() => {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error);
  }
}, [error]);
```

### 4.4 — Variable de entorno

Agregar al `.env.local` y a Vercel:

```
NEXT_PUBLIC_SENTRY_DSN=  # dejar vacío hasta que el dueño cree proyecto en sentry.io
```

**Nota:** Si el dueño no tiene cuenta Sentry, el agente debe documentar los pasos para crear el proyecto free-tier en sentry.io y obtener el DSN. La integración queda lista pero inactiva hasta que el DSN se configure.

---

## Fase 5 — 🤖 Vercel timeouts (agente)

### 5.1 — Actualizar vercel.json

**Archivo:** `vercel.json`

**Situación actual:** todas las rutas tienen `maxDuration: 30`.

**Análisis de rutas críticas:**

| Ruta                         | Uso             | Timeout adecuado |
| ---------------------------- | --------------- | ---------------- |
| `app/api/health/**`          | Smoke / monitor | 5s               |
| `app/api/finance/pos/**`     | POS real-time   | 30s              |
| `app/api/debug/seed-e2e/**`  | Solo dev/E2E    | 30s              |
| `app/api/finance/seed/**`    | Solo dev/E2E    | 30s              |
| `app/api/webhooks/**`        | Webhooks MP     | 30s              |
| `app/api/v1/social/media/**` | Upload archivos | 60s              |

**Fix:**

```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "functions": {
    "app/api/health/**": { "maxDuration": 5 },
    "app/api/v1/social/media/**": { "maxDuration": 60 },
    "app/**/*": { "maxDuration": 30 }
  }
}
```

---

## Fase 6 — 🤖 Middleware: justificación (agente)

**Contexto:** Next.js 14+ cambia algunas APIs de middleware pero no depreca `middleware.ts` como concepto. El warning (si existe) viene de APIs específicas.

**Acciones:**

1. Ejecutar `npm run build` y capturar cualquier warning de middleware
2. Si hay warning específico, documentar la API deprecated y el plan de migración
3. Si no hay warning → documentar "no se detectó warning de middleware en build actual"

**Documentación en este archivo:**

> Resultado: (rellenar tras ejecutar build)

---

## Evidencia de validación (pipeline obligatorio)

| Paso            | Comando                               | Resultado esperado     | Resultado actual |
| --------------- | ------------------------------------- | ---------------------- | ---------------- |
| Scripts limpios | `tsc --noEmit`                        | 0 errores              | (rellenar)       |
| Build strict    | `npm run build` sin ignoreBuildErrors | Sin errores            | (rellenar)       |
| Lint            | `npm run lint`                        | 0 errors               | (rellenar)       |
| Sentry smoke    | Lanzar app + forzar error             | Log en Sentry (si DSN) | (rellenar)       |

---

## Definición de listo (checklist)

- [ ] Auditoría secrets ejecutada y documentada (§ Fase 0.2)
- [ ] Tabla de rotación completa con al menos 4 tokens → 👤 dueño
- [ ] `scripts/remove-console-logs.ts` corregido o eliminado
- [ ] `tmp-*.js` eliminados del repo
- [ ] `tsc --noEmit` → 0 errores
- [ ] `ignoreBuildErrors` removido de `next.config.js`
- [ ] `npm run build` → exitoso sin ignoreBuildErrors
- [ ] Sentry instalado y configurado (inactivo si sin DSN, pero código listo)
- [ ] `vercel.json` actualizado con timeouts por ruta
- [ ] **Visto bueno del dueño** (especialmente rotación de secrets)
