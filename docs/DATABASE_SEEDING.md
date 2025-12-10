# Database Seeding en Producción

## Problema Identificado (2024-12-10)

Se identificó que el script `postbuild` en `package.json` estaba ejecutándose en cada deploy de Vercel, causando potencialmente la pérdida de datos de tenants en producción.

## Flujo del Problema Original

1. **Vercel hace build** → ejecuta `npm run build`
2. **Después del build** → ejecuta automáticamente `postbuild` hook
3. **`postbuild-seed.js` verificaba**:
   - ✅ Si `NODE_ENV === 'production'`
   - ✅ Si existe `DATABASE_URL`
   - ❌ Si existe `VERCEL_SEED_TOKEN` → **FALLABA con exit(1)**

### Consecuencias

- Si `VERCEL_SEED_TOKEN` no estaba configurado → Build fallaba
- Si `VERCEL_SEED_TOKEN` estaba configurado → Seed se ejecutaba en cada deploy

## Solución Implementada

El script `postbuild-seed.js` ahora es **OPCIONAL**:

```javascript
if (!process.env.VERCEL_SEED_TOKEN) {
  console.log("⏭️  VERCEL_SEED_TOKEN not set, skipping seed...");
  console.log(
    "ℹ️  To enable automatic seeding, set VERCEL_SEED_TOKEN in your environment",
  );
  process.exit(0); // ← Era exit(1), ahora es exit(0)
}
```

## Comportamiento Actual

### Sin `VERCEL_SEED_TOKEN` (Recomendado para Producción)

- ✅ Build continúa exitosamente
- ⏭️ Seed se omite completamente
- 🔒 Los datos en producción NO se tocan

### Con `VERCEL_SEED_TOKEN` (Solo para inicialización)

- ✅ Build continúa
- 🌱 Seed se ejecuta
- ⚠️ **SOLO agrega datos si la tabla `tenants` está vacía**

## Protección Contra Pérdida de Datos

El script `vercel-seed-production.ts` tiene una protección incorporada:

```typescript
// Verificar si ya hay datos en la base de datos
const existingTenants = await db.select().from(tenants);

if (existingTenants.length > 0) {
  console.log(
    `✅ Found ${existingTenants.length} existing tenants, skipping seed...`,
  );
  console.log("ℹ️  If you want to reseed the database, please do it manually.");
  return { success: true, message: "Database already seeded" };
}
```

## Recomendaciones

### Para Producción (Vercel)

1. ❌ **NO configurar** `VERCEL_SEED_TOKEN` en variables de entorno de Vercel
2. ✅ Los datos se mantienen persistentes entre deploys
3. ✅ Para agregar nuevos tenants, usar la UI o API directamente

### Para Desarrollo Local

```bash
# Seed manual cuando sea necesario
npm run db:seed
```

### Para Nueva Instancia (Primera vez)

1. Configurar `VERCEL_SEED_TOKEN` temporalmente en Vercel
2. Hacer un deploy inicial
3. **REMOVER** `VERCEL_SEED_TOKEN` de Vercel inmediatamente
4. Deploys subsecuentes NO ejecutarán el seed

## Archivos Involucrados

- `package.json` (línea 69): `"postbuild": "node scripts/postbuild-seed.js"`
- `scripts/postbuild-seed.js`: Script de postbuild
- `scripts/vercel-seed-production.ts`: Lógica de seeding con protecciones
- `apps/web/lib/db/seed-data.ts`: Datos hardcodeados de seed

## Migración de Datos

Si necesitas actualizar los datos de tenants en producción:

1. **NO uses el seed automático**
2. **Usa migraciones de Drizzle**:
   ```bash
   npm run db:generate  # Genera migración desde schema
   npm run db:push      # Aplica cambios a producción
   ```

## Logs de Troubleshooting

Para verificar si el seed se ejecutó en un deploy:

1. Ve a Vercel Dashboard → Deployment
2. Busca en logs:
   - `⏭️ VERCEL_SEED_TOKEN not set, skipping seed...` → ✅ Correcto
   - `🔄 Running database seed...` → ⚠️ Seed se ejecutó

## Commit de la Fix

- Commit: `fix: make postbuild seed optional to prevent data loss`
- Fecha: 2024-12-10
- Problema resuelto: Pérdida de datos de tenants en cada deploy
