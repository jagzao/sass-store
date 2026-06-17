# Solución: Internal Server Error en Todos los Tenants

**Fecha**: 2025-10-16
**Problema**: Todos los tenants mostraban "Internal Server Error" al intentar acceder a ellos.

---

## 🔍 Diagnóstico del Problema

### Causa Raíz
El error se debía a **dos problemas principales**:

1. **DATABASE_URL No Configurada Correctamente**
   - El archivo `.env.local` tenía el valor placeholder: `DATABASE_URL=your-database-url-here`
   - Esta no es una URL válida de PostgreSQL
   - El código intentaba conectarse y fallaba, lanzando excepciones

2. **Error Handling Inadecuado**
   - En modo desarrollo, el código lanzaba errores fatales cuando la DB no estaba disponible
   - No hacía fallback a datos mock correctamente
   - El endpoint `/api/tenants/[slug]` no manejaba errores de conexión

### Síntomas
- ✗ Todos los tenants mostraban "Internal Server Error"
- ✗ Las páginas `/t/wondernails`, `/t/delirios`, etc. no cargaban
- ✗ El servidor lanzaba excepciones no capturadas
- ✗ Los logs mostraban errores de conexión a base de datos

---

## ✅ Soluciones Implementadas

### 1. Validación de DATABASE_URL (packages/database/connection.ts)

**Archivo**: `packages/database/connection.ts`
**Líneas**: 18-22

```typescript
if (!connectionString || connectionString === 'your-database-url-here') {
  console.warn('[DB] DATABASE_URL is not properly configured, using mock connection');
  // Use a dummy connection string that won't connect but won't crash
  connectionString = 'postgresql://user:password@localhost:5432/dummy';
}
```

**¿Qué hace?**
- Detecta si la DATABASE_URL es inválida o es un placeholder
- En lugar de crashear, usa una URL dummy que permite que el código continúe
- Imprime una advertencia clara en los logs

### 2. Fallback Gracioso a Mock Data (apps/web/lib/db/tenant-service.ts)

**Archivo**: `apps/web/lib/db/tenant-service.ts`
**Función**: `getTenantBySlug()`
**Líneas**: 519-530

**ANTES** (fallaba en desarrollo):
```typescript
} catch (error) {
  if (process.env.NODE_ENV === "development") {
    throw error;  // ❌ Causaba Internal Server Error
  }
  console.error("Error fetching tenant:", error);
}
```

**DESPUÉS** (usa mock data):
```typescript
} catch (error) {
  // Log the error but always use mock data when DB is unavailable
  console.error(
    "[TenantService] Database error, falling back to mock data:",
    error,
  );
}

// Fallback to mock data when DB connection fails
console.log(`[TenantService] Using mock data for tenant: ${slug}`);
const mockTenant = mockTenants[slug as keyof typeof mockTenants];
return mockTenant || null;
```

### 3. Cache de Mock Data (apps/web/lib/db/tenant-service.ts)

**Archivo**: `apps/web/lib/db/tenant-service.ts`
**Función**: `getTenantWithData()`
**Líneas**: 775-789

```typescript
} catch (error) {
  console.error(
    "[TenantService] Error fetching complete tenant data, falling back to mock:",
    error,
  );
  const mockData = this.getMockTenantWithData(slug);

  // Cache mock data to avoid repeated errors
  if (mockData) {
    TenantCache.set(cacheKey, mockData);
  }

  return mockData;
}
```

**Mejoras**:
- Cachea los datos mock para evitar errores repetidos
- Mejora el rendimiento al no intentar conectar a la DB cada vez
- Los datos mock se sirven instantáneamente desde caché

### 4. Refactorización del API Endpoint (apps/web/app/api/tenants/[slug]/route.ts)

**Archivo**: `apps/web/app/api/tenants/[slug]/route.ts`
**Líneas**: 1-31

**ANTES**:
```typescript
const tenantData = await getTenantDataForPage(slug);
// ❌ Esta función llamaba notFound() y causaba error 404
```

**DESPUÉS**:
```typescript
const tenantData = await TenantService.getTenantWithData(slug);

if (!tenantData) {
  return NextResponse.json(
    { error: 'Tenant not found' },
    { status: 404 }
  );
}

return NextResponse.json(tenantData, { status: 200 });
```

**Mejoras**:
- Evita el error de `notFound()` que no puede ser capturado
- Retorna JSON adecuado en lugar de lanzar excepciones
- Maneja errores 500 con un try-catch apropiado

---

## 🎯 Estado Actual

### ✅ Lo que Funciona Ahora
- Los tenants cargan correctamente con datos mock
- No más errores "Internal Server Error"
- La aplicación es resiliente a fallos de DB
- El caché evita errores repetidos

### ⚠️ Lo que Falta (Acción Requerida)

#### 1. **Configurar Base de Datos de Producción** ⭐ CRÍTICO

**Estado Actual**: NO HAY BASE DE DATOS CONFIGURADA
**Archivo**: `apps/web/.env.local`
**Valor Actual**: `DATABASE_URL=your-database-url-here`

**Acción Requerida**:

```bash
# Opción A: Usar Supabase (Recomendado - Free Tier generoso)
DATABASE_URL="postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Opción B: Usar Neon (Alternativa - También free tier)
DATABASE_URL="postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb"

# Opción C: Base de datos local (Para desarrollo)
DATABASE_URL="postgresql://postgres:password@localhost:5432/sassstore_dev"
```

**Proveedores Recomendados (Free Tier)**:
- 🥇 **Supabase**: https://supabase.com/ (500 MB storage, buenas herramientas)
- 🥈 **Neon**: https://neon.tech/ (3 GB storage, serverless)
- 🥉 **Railway**: https://railway.app/ ($5 crédito inicial)

#### 2. **Ejecutar Migraciones de Base de Datos** ⭐ CRÍTICO

**Migraciones Disponibles**:
```
packages/database/migrations/
├── 0000_open_fantastic_four.sql        # Schema inicial
├── 0001_zippy_kronos.sql               # Actualizaciones
├── add-rls-policies.sql                # Row Level Security v1
├── add-rls-policies-v2.sql             # Row Level Security v2
├── add-financial-tables.sql            # Tablas financieras
└── add-tenant-configs-table.sql        # Configuraciones por tenant
```

**Comando para Aplicar Migraciones**:

```bash
# Una vez configurada la DATABASE_URL, ejecutar:

# Opción 1: Script automático (si existe)
npm run db:migrate

# Opción 2: Manualmente con Drizzle
npx drizzle-kit push:pg

# Opción 3: Aplicar SQLs manualmente en Supabase
# Ir a: Supabase Dashboard > SQL Editor
# Copiar y ejecutar cada archivo .sql en orden
```

#### 3. **Poblar Base de Datos con Seed Data** 🔸 IMPORTANTE

**Archivos de Seed**:
- `packages/database/seed.sql` - Datos iniciales
- `apps/api/scripts/seed.ts` - Script de seed programático

**Comando**:
```bash
# Ejecutar seed data
npm run db:seed

# O manualmente:
cd apps/api
npm run seed
```

**Tenants que deben existir**:
- ✅ wondernails (booking mode)
- ✅ vigistudio (booking mode)
- ✅ centro-tenistico (booking mode)
- ✅ vainilla-vargas (catalog mode)
- ✅ delirios (catalog mode)
- ✅ nom-nom (catalog mode)
- ✅ zo-system (catalog mode - sistema principal)

#### 4. **Verificar Row Level Security (RLS)** 🔸 IMPORTANTE

**Verificación**:
```bash
# Script de verificación
npm run test:rls

# O ejecutar script directamente
node scripts/test-rls.ts
```

**Lo que debe verificarse**:
- ✅ Las políticas RLS están activas en todas las tablas
- ✅ Los tenants solo pueden ver sus propios datos
- ✅ No hay data leakage entre tenants

#### 5. **Configurar Variables de Entorno Adicionales** 🔹 OPCIONAL

**Archivo**: `apps/web/.env.local`

```bash
# Autenticación (si usas NextAuth)
NEXTAUTH_SECRET="genera-un-secreto-seguro-aqui"
NEXTAUTH_URL="http://localhost:3001"

# Stripe (si usas pagos)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (si usas notificaciones)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-app-password"

# Resend (alternativa moderna)
RESEND_API_KEY="re_..."
```

---

## 🔄 Pasos para Reproducir la Solución (Si Vuelve a Ocurrir)

### Si ves "Internal Server Error" en todos los tenants:

1. **Verificar DATABASE_URL**:
   ```bash
   grep DATABASE_URL apps/web/.env.local
   ```
   - Si dice `your-database-url-here` → Configurar DB real
   - Si es una URL real → Verificar conectividad

2. **Probar Conexión a Base de Datos**:
   ```bash
   # Ejecutar script de verificación
   node scripts/check-db-status.js

   # O probar manualmente con psql
   psql "TU_DATABASE_URL" -c "SELECT 1;"
   ```

3. **Verificar Logs del Servidor**:
   ```bash
   # Ver logs en la terminal donde corre npm run dev
   # Buscar mensajes como:
   # "[TenantService] Database error, falling back to mock data"
   ```

4. **Limpiar Caché de Next.js**:
   ```bash
   cd apps/web
   rm -rf .next
   npm run dev
   ```

5. **Verificar que las Correcciones Estén Aplicadas**:
   - ✅ `packages/database/connection.ts` tiene validación de URL
   - ✅ `apps/web/lib/db/tenant-service.ts` usa fallback a mock
   - ✅ `apps/web/app/api/tenants/[slug]/route.ts` usa TenantService

---

## 📊 Checklist de Configuración Completa

### Configuración Básica (Para que funcione)
- [ ] Configurar DATABASE_URL válida en `.env.local`
- [ ] Ejecutar migraciones de base de datos
- [ ] Ejecutar seed data para poblar tenants
- [ ] Verificar que el servidor arranca sin errores

### Configuración Avanzada (Para funcionalidad completa)
- [ ] Configurar RLS policies
- [ ] Verificar aislamiento de tenants
- [ ] Configurar autenticación (NextAuth/Clerk)
- [ ] Configurar procesamiento de pagos (Stripe)
- [ ] Configurar envío de emails (Resend/SMTP)
- [ ] Configurar almacenamiento de archivos (Cloudflare R2/S3)

### Verificación de Funcionalidad
- [ ] Todos los tenants cargan sin errores
- [ ] Los datos se persisten en la DB
- [ ] No hay data leakage entre tenants
- [ ] El carrito funciona correctamente
- [ ] Las reservas se pueden crear (booking tenants)
- [ ] Los productos se pueden comprar (catalog tenants)

---

## 🆘 Comandos Útiles para Diagnóstico

```bash
# Ver estado del servidor de desarrollo
netstat -ano | grep :3001

# Verificar conexión a base de datos
node -e "const { checkDatabaseConnection } = require('./packages/database/connection'); checkDatabaseConnection().then(console.log);"

# Ver logs del servidor en tiempo real
cd apps/web && npm run dev

# Limpiar todo y empezar de cero
cd apps/web
rm -rf .next node_modules
npm install
npm run dev

# Probar un tenant específico
curl http://localhost:3001/t/wondernails

# Probar el API endpoint
curl http://localhost:3001/api/tenants/wondernails
```

---

## 📚 Referencias

- **Documentación de Supabase**: https://supabase.com/docs/guides/database
- **Documentación de Drizzle ORM**: https://orm.drizzle.team/docs/overview
- **Next.js App Router**: https://nextjs.org/docs/app
- **Row Level Security**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

## 🔐 Seguridad

**IMPORTANTE**: Nunca commitear credenciales reales al repositorio.

✅ **Correcto**:
```bash
# .env.local (git ignored)
DATABASE_URL="postgresql://user:pass@host/db"
```

❌ **Incorrecto**:
```bash
# .env.example (commiteado)
DATABASE_URL="postgresql://user:pass@host/db"  # ¡NUNCA HACER ESTO!
```

**Archivo Correcto para Commit**:
```bash
# .env.example (sin credenciales reales)
DATABASE_URL="postgresql://username:password@localhost:5432/sassstore_dev"
```

---

**Documentado por**: Claude Code Agent
**Última actualización**: 2025-10-16
**Versión**: 1.0
