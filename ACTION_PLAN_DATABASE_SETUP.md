# Plan de Acción: Configuración de Base de Datos

**Estado Actual**: ⚠️ La aplicación funciona con datos MOCK (no persistentes)

---

## 🚨 Acción Inmediata Requerida

### Paso 1: Decidir el Proveedor de Base de Datos

Tienes 3 opciones principales:

#### Opción A: Supabase (🥇 Recomendado)
**Ventajas**:
- ✅ Free tier generoso (500 MB, 2 proyectos)
- ✅ Interface gráfica excelente
- ✅ Autenticación incluida
- ✅ Realtime features
- ✅ Row Level Security built-in

**Pasos**:
1. Ir a: https://supabase.com/
2. Crear cuenta (gratis)
3. Crear nuevo proyecto (toma ~2 minutos)
4. Copiar el "Connection String" (modo Pooler)
5. Pegar en `apps/web/.env.local`

**Connection String Format**:
```bash
DATABASE_URL="postgresql://postgres.PROJECT_ID:PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### Opción B: Neon (🥈 Alternativa Moderna)
**Ventajas**:
- ✅ Free tier 3 GB
- ✅ Serverless (paga solo por uso)
- ✅ Branches de base de datos (como Git)
- ✅ Muy rápido

**Pasos**:
1. Ir a: https://neon.tech/
2. Crear cuenta (gratis)
3. Crear proyecto
4. Copiar connection string
5. Pegar en `.env.local`

#### Opción C: Base de Datos Local (🔧 Solo Desarrollo)
**Para desarrollo local con Docker**:

```bash
# 1. Instalar Docker Desktop
# 2. Ejecutar:
docker run --name sassstore-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=sassstore_dev \
  -p 5432:5432 \
  -d postgres:15

# 3. Usar esta URL:
DATABASE_URL="postgresql://postgres:password@localhost:5432/sassstore_dev"
```

---

## 📋 Paso 2: Configurar Base de Datos

### Una vez que tengas el DATABASE_URL:

```bash
# 1. Editar archivo de environment
nano apps/web/.env.local

# 2. Reemplazar la línea:
DATABASE_URL=your-database-url-here

# Por tu URL real de Supabase/Neon:
DATABASE_URL="postgresql://user:pass@host:port/db"

# 3. Guardar y cerrar (Ctrl+X, Y, Enter)
```

---

## 🗄️ Paso 3: Aplicar Migraciones

### Verificar qué migraciones hay disponibles:

```bash
ls -la packages/database/migrations/
```

**Archivos actuales**:
- ✅ `0000_open_fantastic_four.sql` - Schema base (tenants, users, products, services)
- ✅ `0001_zippy_kronos.sql` - Actualizaciones del schema
- ✅ `add-rls-policies.sql` - Row Level Security v1
- ✅ `add-rls-policies-v2.sql` - Row Level Security v2 (mejorado)
- ✅ `add-financial-tables.sql` - Tablas de facturación y finanzas
- ✅ `add-tenant-configs-table.sql` - Configuraciones por tenant

### Método 1: Usando Drizzle Kit (Recomendado)

```bash
# Instalar Drizzle Kit si no está instalado
npm install -D drizzle-kit

# Generar y aplicar migraciones
npx drizzle-kit push:pg

# O si usas el script del proyecto:
npm run db:migrate
```

### Método 2: Aplicar SQLs Manualmente (Supabase UI)

Si usas Supabase:

1. Ir a: Dashboard > SQL Editor
2. Crear nueva query
3. Copiar contenido de `packages/database/migrations/0000_open_fantastic_four.sql`
4. Ejecutar (Run)
5. Repetir para cada archivo en orden:
   - 0000_open_fantastic_four.sql
   - 0001_zippy_kronos.sql
   - add-rls-policies-v2.sql (usar v2, skip v1)
   - add-financial-tables.sql
   - add-tenant-configs-table.sql

### Método 3: Usando psql (CLI)

```bash
# Si tienes psql instalado:
psql "$DATABASE_URL" -f packages/database/migrations/0000_open_fantastic_four.sql
psql "$DATABASE_URL" -f packages/database/migrations/0001_zippy_kronos.sql
psql "$DATABASE_URL" -f packages/database/migrations/add-rls-policies-v2.sql
psql "$DATABASE_URL" -f packages/database/migrations/add-financial-tables.sql
psql "$DATABASE_URL" -f packages/database/migrations/add-tenant-configs-table.sql
```

---

## 🌱 Paso 4: Seed Data (Datos Iniciales)

### Método 1: Script Automatizado

```bash
cd apps/api
npm run seed

# O desde la raíz:
npm run seed --workspace=apps/api
```

### Método 2: SQL Directo

```bash
# Aplicar seed SQL
psql "$DATABASE_URL" -f packages/database/seed.sql

# O en Supabase: copiar y pegar en SQL Editor
```

### Verificar que se crearon los tenants:

```bash
# Query para verificar tenants
psql "$DATABASE_URL" -c "SELECT slug, name, mode FROM tenants;"
```

**Deberías ver**:
```
     slug          |          name           |  mode
-------------------+------------------------+---------
 wondernails       | Wonder Nails Studio    | booking
 vigistudio        | Vigi Studio            | booking
 centro-tenistico  | Centro Tenístico       | booking
 delirios          | Delirios Healthy...    | catalog
 nom-nom           | Nom Nom                | catalog
 zo-system         | Zo System              | catalog
```

---

## 🧪 Paso 5: Verificar que Todo Funciona

### 1. Reiniciar el servidor

```bash
# Ctrl+C para detener el servidor actual
# Luego:
cd apps/web
npm run dev
```

### 2. Probar que los tenants cargan desde DB

Abrir el navegador y verificar que los logs muestren:

```
[TenantService] Found tenant in database: Wonder Nails Studio
```

En lugar de:

```
[TenantService] Using mock data for tenant: wondernails
```

### 3. Verificar conectividad

```bash
# Test rápido de conexión
node -e "
const { db } = require('./packages/database/connection');
(async () => {
  const result = await db.execute('SELECT NOW()');
  console.log('✅ DB Connected:', result);
})();
"
```

### 4. Probar un tenant en el navegador

```
http://localhost:3001/t/wondernails
http://localhost:3001/t/delirios
http://localhost:3001/t/nom-nom
```

---

## ✅ Checklist de Verificación

Marca cada item cuando lo completes:

### Configuración Base
- [ ] Base de datos creada (Supabase/Neon/Local)
- [ ] DATABASE_URL configurada en `.env.local`
- [ ] Migraciones aplicadas correctamente
- [ ] Seed data cargado (7 tenants)
- [ ] Servidor reiniciado y funciona

### Verificación de Funcionalidad
- [ ] Tenants cargan desde base de datos (no mock)
- [ ] Productos y servicios se muestran correctamente
- [ ] No hay errores en la consola del servidor
- [ ] Los logs muestran "Found tenant in database"
- [ ] Puedo agregar productos al carrito

### Seguridad y RLS
- [ ] RLS policies aplicadas
- [ ] Script de test RLS ejecutado: `npm run test:rls`
- [ ] No hay warnings de data leakage
- [ ] Cada tenant solo ve sus propios datos

---

## 🔍 Troubleshooting

### Problema: "connection refused"
```bash
# Verificar que el host sea correcto
# Supabase Pooler usa puerto 6543, no 5432
# Verificar firewall y que el proyecto esté activo
```

### Problema: "password authentication failed"
```bash
# Verificar que el password sea correcto
# En Supabase: Settings > Database > Reset Database Password
```

### Problema: "database does not exist"
```bash
# Verificar el nombre de la base de datos en la URL
# Supabase usa: postgres
# Neon usa: neondb
```

### Problema: Migraciones fallan con "already exists"
```bash
# Algunas tablas ya existen, puedes:
# 1. Borrar la base de datos y empezar de cero (Development only!)
# 2. Aplicar solo las migraciones faltantes manualmente
# 3. Usar: npx drizzle-kit push:pg --force
```

---

## 📱 Siguiente Nivel (Opcional)

Una vez que la DB funcione, considera configurar:

### 1. Autenticación
- [ ] NextAuth o Clerk
- [ ] Login/Register funcional
- [ ] Sessions persistentes

### 2. Pagos
- [ ] Stripe API Keys
- [ ] Webhook de Stripe
- [ ] Test mode funcional

### 3. Emails
- [ ] Resend API key
- [ ] Templates de email
- [ ] Notificaciones funcionando

### 4. Storage de Archivos
- [ ] Cloudflare R2 o S3
- [ ] Upload de imágenes de productos
- [ ] CDN configurado

---

## 🆘 ¿Necesitas Ayuda?

Si algo no funciona:

1. **Revisar logs del servidor**:
   ```bash
   # Buscar errores en la terminal donde corre npm run dev
   ```

2. **Verificar archivo de troubleshooting**:
   ```bash
   cat TROUBLESHOOTING_INTERNAL_SERVER_ERROR.md
   ```

3. **Test de conectividad**:
   ```bash
   node scripts/check-db-status.js
   ```

4. **Ver documentación completa**:
   - [Supabase Docs](https://supabase.com/docs)
   - [Drizzle ORM](https://orm.drizzle.team)
   - [Next.js 15](https://nextjs.org/docs)

---

## ⏱️ Tiempo Estimado

- **Configuración de Supabase**: 5-10 minutos
- **Aplicar migraciones**: 2-5 minutos
- **Seed data**: 1-2 minutos
- **Verificación**: 2-3 minutos

**Total: ~20 minutos** para tener todo funcionando con DB real.

---

**Última actualización**: 2025-10-16
**Prioridad**: 🚨 ALTA - Sin DB, los datos no persisten entre reinicios
