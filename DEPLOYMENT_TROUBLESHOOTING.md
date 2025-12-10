# Deployment Troubleshooting Guide

Este documento contiene hallazgos y soluciones comunes para problemas de deployment en producción.

## Tabla de Contenidos

- [Errores de Next.js 15](#errores-de-nextjs-15)
- [Errores de API Endpoints](#errores-de-api-endpoints)
- [Errores de Base de Datos](#errores-de-base-de-datos)
- [Errores de Imports](#errores-de-imports)

---

## Errores de Next.js 15

### ❌ Error: "Something went wrong" en páginas dinámicas

**Síntomas:**

- Página muestra error genérico "Something went wrong"
- Error en console: "params is not a Promise"
- Status 500 Internal Server Error

**Causa raíz:**
Next.js 15 requiere que todos los params en route handlers y páginas sean async (`Promise<T>`)

**Solución:**

```typescript
// ❌ INCORRECTO (Next.js 14)
export async function GET(
  request: NextRequest,
  { params }: { params: { tenant: string } },
) {
  const tenantSlug = params.tenant;
  // ...
}

// ✅ CORRECTO (Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: tenantSlug } = await params;
  // ...
}
```

**Archivos afectados comúnmente:**

- `apps/web/app/api/**/*.ts` - Route handlers
- `apps/api/app/api/**/*.ts` - Route handlers
- `apps/web/app/t/[tenant]/**/*.tsx` - Páginas dinámicas

**Checklist de verificación:**

- [ ] Todos los route handlers usan `Promise<>` en params
- [ ] Todos los params son awaited con `await params`
- [ ] searchParams también son awaited: `await searchParams`

---

## Errores de API Endpoints

### ❌ Error: "Tenant not found" o 404 en páginas

**Síntomas:**

- Página no carga datos del tenant
- Console muestra 404 en `/api/tenants/[tenant]`
- Error: "Invalid tenant configuration"

**Causa raíz:**
Falta el endpoint `/api/tenants/[tenant]/route.ts` en la web app

**Solución:**
Crear el endpoint en `apps/web/app/api/tenants/[tenant]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: slug } = await params;

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}
```

**Archivos afectados:**

- `apps/web/app/t/[tenant]/clientes/page.tsx`
- `apps/web/app/t/[tenant]/*/page.tsx` (todas las páginas que usan tenant)

---

### ❌ Error: 500 en endpoints de customers o services

**Síntomas:**

- POST/GET a `/api/tenants/[tenant]/customers` retorna 500
- POST/GET a `/api/tenants/[tenant]/services` retorna 500

**Causa raíz:**
Params no están usando Promise o falta await

**Solución aplicada:**

- ✅ `apps/web/app/api/tenants/[tenant]/customers/route.ts` - Fixed en commit f90822c
- ✅ `apps/web/app/api/tenants/[tenant]/services/route.ts` - Fixed en commit 625446c

---

## Errores de Base de Datos

### ❌ Error: "Tenant not found" en producción

**Síntomas:**

- Endpoint retorna 404 para tenant que debería existir
- Debug endpoint muestra: `{"error":"Tenant not found"}`

**Causa raíz:**
Base de datos de producción no tiene el tenant seeded

**Solución:**

```bash
# Ejecutar seed endpoint con token de autorización
curl -X GET "https://sass-store-web.vercel.app/api/seed-production" \
  -H "Authorization: Bearer dev-seed-token"
```

**Resultado esperado:**

```json
{
  "success": true,
  "message": "Production database seeded successfully",
  "data": {
    "tenant": {
      "id": "...",
      "slug": "wondernails",
      "name": "Wonder Nails"
    }
  }
}
```

**Documentado en commit:** 7f259dd

---

## Errores de Imports

### ❌ Error: Build failure con "Module not found"

**Síntomas:**

- Build falla en Vercel
- Error: `Can't resolve '../../../../packages/database/schema'`
- Error en imports relativos

**Causa raíz:**
Uso de imports relativos (`../`) en lugar de package aliases (`@/` o `@sass-store/`)

**Solución:**
Reemplazar todos los imports relativos:

```typescript
// ❌ INCORRECTO
import { db } from "../../../lib/db/connection";
import { tenants } from "../../../../packages/database/schema";

// ✅ CORRECTO
import { db } from "@sass-store/database";
import { tenants } from "@sass-store/database/schema";
```

**Archivos verificados en commit 625446c:**

- ✅ `apps/web/lib/stores/index.ts`
- ✅ `apps/web/components/errors/*.tsx`
- ✅ `apps/web/lib/hooks/useModernState.ts`

**Comando de verificación:**

```bash
# Buscar imports relativos problemáticos
grep -r "from ['\"]\.\./" apps/web --include="*.ts" --include="*.tsx"
grep -r "from ['\"]\.\./" apps/api --include="*.ts" --include="*.tsx"
```

---

## Checklist Pre-Deploy

Antes de hacer deploy, verificar:

### Next.js 15 Compliance

- [ ] Todos los route handlers usan `Promise<>` en params
- [ ] Todos los params/searchParams son awaited
- [ ] Páginas dinámicas usan async params

### Endpoints Necesarios

- [ ] `/api/tenants/[tenant]` existe en web app
- [ ] `/api/tenants/[tenant]/customers` usa async params
- [ ] `/api/tenants/[tenant]/services` usa async params
- [ ] Todos los endpoints PATCH/DELETE también usan async params

### Base de Datos

- [ ] Tenant existe en producción (verificar con seed endpoint)
- [ ] Migraciones aplicadas correctamente
- [ ] Conexión a DB funciona (verificar con health check)

### Imports

- [ ] No hay imports relativos (`../`)
- [ ] Todos usan package aliases (`@/` o `@sass-store/`)
- [ ] Build local pasa sin warnings

---

## Comandos Útiles

### Verificar async params

```bash
# Buscar route handlers sin Promise
grep -r "params }: { params: {" apps/web/app/api --include="*.ts"
grep -r "params }: { params: {" apps/api/app/api --include="*.ts"
```

### Verificar imports relativos

```bash
# Buscar imports problemáticos
grep -r "from ['\"]\.\./" apps/web --include="*.ts" --include="*.tsx"
```

### Seed production database

```bash
curl -k -X GET "https://sass-store-web.vercel.app/api/seed-production" \
  -H "Authorization: Bearer dev-seed-token"
```

### Test endpoints

```bash
# Test tenant endpoint
curl https://sass-store-api.vercel.app/api/tenants/wondernails

# Test services endpoint
curl https://sass-store-api.vercel.app/api/tenants/wondernails/services

# Test customers endpoint
curl https://sass-store-web.vercel.app/api/tenants/wondernails/customers
```

---

## Historial de Fixes

### 2025-12-09

- ✅ Fixed seed-production import paths (commit 7f259dd)
- ✅ Seeded production database with WonderNails tenant
- ✅ Fixed web API service endpoints with imageUrl support (commit 51473d2)
- ✅ Replaced relative imports with package aliases (commit 625446c)
- ✅ Fixed customers endpoint async params (commit f90822c)
- ✅ Created missing `/api/tenants/[tenant]` endpoint

---

## Variables de Entorno Críticas

### Web App (sass-store-web)

```env
NEXT_PUBLIC_API_URL=https://sass-store-api.vercel.app
DATABASE_URL=<supabase-connection-string>
CLOUDINARY_CLOUD_NAME=drxcxttn0
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

### API App (sass-store-api)

```env
DATABASE_URL=<supabase-connection-string>
CLOUDINARY_CLOUD_NAME=drxcxttn0
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

---

## Recursos

- [Next.js 15 Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Vercel Deployment Logs](https://vercel.com/jagzaos-projects)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Cloudinary Console](https://console.cloudinary.com/)
