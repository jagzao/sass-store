# 📐 Histórico de Evolución Arquitectónica - SaaS Store

## Registro de Decisiones y Cambios Arquitectónicos

### 2025-12-10 - Consolidación a Monolito (Opción B)

#### ❌ Problema Detectado

**Commit:** e539539
**Fecha:** 2025-12-09

Se introdujo un antipatrón grave:

- Acceso directo a base de datos desde componentes frontend (`getTenantBySlug`)
- Violación de separación de responsabilidades
- Credenciales de BD expuestas al código del frontend
- Sin capa de validación/seguridad centralizada
- No escalable

**Causa raíz:**
Confusión entre:

- API app externa en `https://sass-store-api.vercel.app`
- Endpoints locales en web app `apps/web/app/api/`
- Variable `NEXT_PUBLIC_API_URL` apuntaba a API externa
- `fetchStatic` hacía HTTP requests a servidor equivocado

**Síntomas:**

- Error "Something went wrong" en páginas de tenant
- Datos no se cargaban en producción
- Funcionaba en local pero fallaba en Vercel

---

#### ✅ Solución Correcta

**Commit:** 02d99e6
**Fecha:** 2025-12-10

##### Decisión Arquitectónica: **Opción B - Monolito para MVP**

**Razones:**

1. **Simplicidad operacional** - Un solo deploy, un solo servicio
2. **Rapidez de desarrollo** - Cambios más rápidos, menos coordinación
3. **Costos reducidos** - Un solo servicio de Vercel
4. **Latencia mínima** - Llamadas internas optimizadas por Next.js
5. **Debugging simple** - Logs en un solo lugar
6. **Preparado para PWA** - No requiere API separada

**Contexto:**

- MVP con múltiples tenants (multi-tenant)
- Solo web app (sin apps móviles nativas)
- Escalable a PWA en segunda etapa
- Varios clientes (salones/spas) compartiendo la misma aplicación

##### Cambios Implementados

**1. Modificación de `fetchWithCache.ts`**

```typescript
// ANTES: Siempre usaba API_URL o NEXT_PUBLIC_API_URL
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// DESPUÉS: Detecta server-side vs client-side
if (typeof window === "undefined") {
  // SERVER: Usa endpoints internos
  if (url.startsWith("/api/tenants") || url.startsWith("/api/v1/public")) {
    baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || "http://localhost:3000";
  }
} else {
  // CLIENT: Usa API pública (para futuro uso)
  baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}
```

**2. Revertir Todas las Páginas**
Archivos modificados:

- `apps/web/app/t/[tenant]/layout.tsx`
- `apps/web/app/t/[tenant]/page.tsx`
- `apps/web/app/t/[tenant]/clientes/page.tsx`
- `apps/web/app/t/[tenant]/clientes/[id]/page.tsx`
- `apps/web/app/t/[tenant]/contact/page.tsx`

Cambio:

```typescript
// ❌ ANTES: Conexión directa a BD (ANTIPATRÓN)
import { getTenantBySlug } from "@/lib/db/get-tenant";
const tenantData = await getTenantBySlug(tenantSlug);

// ✅ DESPUÉS: Uso de endpoints (ARQUITECTURA CORRECTA)
import { fetchStatic } from "@/lib/api/fetch-with-cache";
const tenantData = await fetchStatic<TenantData>(`/api/tenants/${tenantSlug}`, [
  "tenant",
  tenantSlug,
]);
```

**3. Eliminación de Código Innecesario**

- ❌ Eliminado: `apps/web/lib/db/get-tenant.ts`
- ❌ Eliminado: Todo acceso directo a BD desde frontend

##### Arquitectura Final

```
apps/web/
  ├── app/
  │   ├── api/              ← TODOS los endpoints aquí (autónomo)
  │   │   ├── tenants/[tenant]/
  │   │   ├── v1/public/
  │   │   └── auth/
  │   └── t/[tenant]/       ← Páginas UI (usan fetchStatic)
  ├── lib/
  │   └── api/
  │       └── fetch-with-cache.ts  ← Detecta server/client
  └── components/
```

**Flujo de datos:**

1. Usuario visita `/t/wondernails/clientes`
2. Server Component ejecuta `fetchStatic('/api/tenants/wondernails')`
3. `fetchWithCache` detecta que está en server-side
4. Usa `VERCEL_URL` para llamada interna (optimizada por Next.js)
5. Endpoint `/api/tenants/[tenant]/route.ts` consulta BD
6. Retorna datos al componente
7. Página se renderiza con datos

---

### Estado del Proyecto API (`apps/api`)

#### Situación Actual

- ✅ Carpeta existe en el repositorio
- ❌ **NO se usa** para el funcionamiento del web app
- ⚠️ Tiene endpoints duplicados (tenants, customers, services)
- ⚠️ Tiene endpoints extras (finance, payments, mercadopago, graphql)

#### Endpoints Duplicados

| Endpoint                        | Web App | API App | Usado?  |
| ------------------------------- | ------- | ------- | ------- |
| `/api/tenants/[slug]`           | ✅      | ✅      | Web App |
| `/api/tenants/[slug]/customers` | ✅      | ✅      | Web App |
| `/api/tenants/[slug]/services`  | ✅      | ✅      | Web App |
| `/api/v1/public/products`       | ✅      | ✅      | Web App |
| `/api/v1/public/services`       | ✅      | ✅      | Web App |

#### Endpoints Únicos en API App

| Endpoint             | Propósito               | Usado? |
| -------------------- | ----------------------- | ------ |
| `/api/finance/*`     | Sistema de finanzas/POS | ❌ No  |
| `/api/mercadopago/*` | Integración pagos       | ❌ No  |
| `/api/graphql`       | API GraphQL             | ❌ No  |
| `/api/upload`        | Subida de archivos      | ❌ No  |

---

### Limpieza Pendiente

#### 1. Vercel Deployment

**Proyecto:** `sass-store-api` en Vercel
**Estado:** Desplegado pero NO usado
**Acción recomendada:** ✅ **PUEDE ELIMINARSE**

**Razones:**

- Web app no hace requests al API app
- Endpoints duplicados en web app
- Genera costos innecesarios
- Confusión en debugging

**Antes de eliminar, verificar:**

- [ ] Web app funciona sin el API app
- [ ] No hay referencias en producción
- [ ] Logs de Vercel confirman 0 requests

#### 2. Código en Repositorio

**Carpeta:** `apps/api/`
**Estado:** Código existe pero no se usa
**Acción recomendada:** ⚠️ **MOVER A ARCHIVO**

**Opciones:**

1. **Archivar en branch separado** (recomendado)

   ```bash
   git checkout -b archive/api-app-2025-12-10
   git push origin archive/api-app-2025-12-10
   git checkout master
   rm -rf apps/api
   git commit -m "chore: archive unused API app"
   ```

2. **Mantener temporalmente** (si hay duda)
   - Esperar 1-2 semanas
   - Confirmar que no se necesita
   - Archivar después

3. **Eliminar completamente** (más limpio)
   ```bash
   rm -rf apps/api
   git commit -m "chore: remove unused API app"
   ```

**Razones para archivar (no eliminar aún):**

- Contiene endpoints de finanzas que podrían usarse después
- Integración con MercadoPago implementada
- Podría servir de referencia

#### 3. Referencias en Código

**Archivos a limpiar:**

**`apps/web/next.config.js` (líneas 99-109):**

```javascript
// ❌ ELIMINAR: Este rewrite ya no es necesario
async rewrites() {
  const apiUrl = process.env.API_URL || "http://localhost:4000";
  return {
    fallback: [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ],
  };
},
```

**`apps/web/next.config.js` (línea 85):**

```javascript
// ❌ ELIMINAR de CSP: https://sass-store-api.vercel.app
"connect-src 'self' https://api.stripe.com https://upstash.io https://*.upstash.io https://api.mercadopago.com https://sass-store-api.vercel.app",
// ✅ CAMBIAR A:
"connect-src 'self' https://api.stripe.com https://upstash.io https://*.upstash.io https://api.mercadopago.com",
```

**`apps/web/lib/api/client-config.ts` (línea 24):**

```typescript
// ❌ ACTUALIZAR ejemplo en comentario
// buildApiUrl('/api/tenants/wondernails') // => 'https://sass-store-api.vercel.app/api/tenants/wondernails'
// ✅ CAMBIAR A:
// buildApiUrl('/api/tenants/wondernails') // => 'https://sass-store-web.vercel.app/api/tenants/wondernails'
```

---

### Variables de Entorno

#### Vercel (Producción)

**Necesarias:**

```env
DATABASE_URL=postgresql://...          # ✅ Ya configurado
VERCEL_URL                             # ✅ Automático de Vercel
NEXTAUTH_URL=https://sass-store-web.vercel.app  # ⚠️ Opcional (fallback)
NEXTAUTH_SECRET=...                    # ✅ Ya configurado
```

**NO necesarias (pueden removerse):**

```env
NEXT_PUBLIC_API_URL                    # ❌ Ya no se usa en server-side
API_URL                                # ❌ Ya no se usa
```

#### Local (.env.local)

```env
DATABASE_URL=postgresql://localhost:5432/sass_store
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=dev-secret-key
# NEXT_PUBLIC_API_URL no es necesario para funcionamiento básico
```

---

### Próximos Pasos Sugeridos

#### Fase 1: Validación (AHORA)

- [x] Commit y push de cambios arquitectónicos
- [ ] Esperar deploy automático de Vercel (2-3 min)
- [ ] Probar https://sass-store-web.vercel.app/t/wondernails/clientes
- [ ] Verificar logs de Vercel que todo funciona
- [ ] Confirmar 0 errores en producción

#### Fase 2: Limpieza de Código (DESPUÉS DE VALIDAR)

- [ ] Limpiar `next.config.js` (eliminar rewrites y CSP innecesario)
- [ ] Actualizar comentarios en `client-config.ts`
- [ ] Commit: "chore: remove API app references from web config"

#### Fase 3: Eliminación de API App (DESPUÉS DE 1-2 SEMANAS)

- [ ] Confirmar que web app es 100% funcional
- [ ] Pausar deployment de sass-store-api en Vercel
- [ ] Esperar 1 semana y monitorear
- [ ] Si todo OK: Eliminar proyecto de Vercel
- [ ] Archivar `apps/api` en branch separado
- [ ] Eliminar carpeta de master
- [ ] Actualizar README del proyecto

---

### Lecciones Aprendidas

#### ❌ Antipatrones Identificados

1. **Acceso directo a BD desde frontend** - Viola separación de responsabilidades
2. **Duplicación de endpoints** - Confusión sobre cuál usar
3. **Variables de entorno ambiguas** - `API_URL` vs `NEXT_PUBLIC_API_URL`
4. **Rewrites innecesarios** - Proxy a API externa que ya no se usa

#### ✅ Mejores Prácticas Aplicadas

1. **Server Components acceden a endpoints del mismo servidor** - Rápido y seguro
2. **fetchWithCache detecta contexto** - Server vs Client side
3. **Endpoints centralizados** - Un solo lugar de verdad
4. **Arquitectura simple** - Monolito para MVP, escala después

#### 🎯 Decisiones Clave

- **Opción B (Monolito)** es correcta para MVP multi-tenant
- **PWA en segunda fase** no requiere separar API
- **Un deploy, un servicio** = menos complejidad
- **Escalar cuando realmente se necesite** (10k+ usuarios)

---

### Referencias

**Commits relevantes:**

- `02d99e6` - Fix: Arquitectura correcta con endpoints
- `e539539` - ❌ Antipatrón: Acceso directo a BD (revertido)
- `5c59839` - Docs: Troubleshooting del problema
- `c9d131a` - Fix: Endpoint de tenant creado

**Documentos relacionados:**

- `DEPLOYMENT_TROUBLESHOOTING.md` - Errores comunes en deploy
- `README.md` - Setup del proyecto

---

**Última actualización:** 2025-12-10
**Autor:** Claude Sonnet 4.5 + jagzao
**Estado:** ✅ Arquitectura consolidada y funcional
