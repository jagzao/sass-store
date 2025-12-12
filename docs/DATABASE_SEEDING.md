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

## Solución Final Implementada (2024-12-10)

**El hook `postbuild` ha sido COMPLETAMENTE REMOVIDO de `package.json`.**

### Razón

A pesar de hacer el script opcional, el mecanismo de seed automático causaba confusión y riesgo de pérdida de datos. La mejor práctica es nunca ejecutar seed automáticamente en producción.

## Comportamiento Actual

### Deployments en Vercel

- ✅ Build continúa exitosamente
- ⏭️ **NO se ejecuta ningún seed automáticamente**
- 🔒 Los datos en producción están 100% protegidos
- 📝 Todos los deploys mantienen los datos existentes intactos

## Comando db:seed ELIMINADO (2024-12-11)

**El comando `npm run db:seed` ha sido COMPLETAMENTE ELIMINADO** para proteger los datos de producción.

### ⚠️ Razón de la eliminación

El script `seed.sql` ejecuta `TRUNCATE TABLE ... CASCADE` que **BORRA TODOS LOS DATOS** de:

- Tenants
- Usuarios
- Clientes
- Visitas
- Productos
- Servicios
- Personal

Este comando era **EXTREMADAMENTE PELIGROSO** si se ejecutaba accidentalmente con `DATABASE_URL` apuntando a producción.

## ⚠️ MEDIDAS DE SEGURIDAD ADICIONALES (2024-12-12)

Después de identificar pérdida de datos en producción, se tomaron medidas adicionales:

1. **✅ Archivo `seed.sql` renombrado a `seed.sql.DANGEROUS-DO-NOT-USE`**
   - Ya NO puede ser ejecutado accidentalmente
   - Conservado para referencia histórica solamente

2. **✅ Scripts destructivos eliminados completamente:**
   - ❌ `apps/api/scripts/seed.ts` - ELIMINADO
   - ❌ `apps/api/scripts/seed-custom.ts` - ELIMINADO

3. **⚠️ Scripts seguros que SÍ permanecen:**
   - ✅ `apps/web/lib/db/seed-data.ts` - SEGURO (solo hace INSERT si no existe)
   - ✅ `scripts/vercel-seed-production.ts` - SEGURO (verifica datos existentes primero)
   - ✅ `apps/web/app/system/seed/route.ts` - SEGURO (endpoint manual, no destructivo)

**NINGUNO DE ESTOS SCRIPTS SE EJECUTA AUTOMÁTICAMENTE EN DEPLOY.**

## Recomendaciones

### Para Producción (Vercel/Supabase)

1. ✅ Los datos se mantienen persistentes entre deploys
2. ✅ Para agregar nuevos tenants, usar la UI o API directamente
3. ✅ NO hay riesgo de pérdida de datos por seed automático
4. ✅ Para datos iniciales, ejecutar SQL manualmente en Supabase SQL Editor

### Para Desarrollo Local

Si necesitas seed de datos en desarrollo local:

**Opción A (Recomendada)**: Crear datos manualmente desde la UI
**Opción B**: Ejecutar el SQL directamente (SOLO en BD local):

```bash
# Asegúrate que DATABASE_URL apunte a BD LOCAL, NO Supabase
cd apps/api
npx tsx scripts/seed.ts
```

⚠️ **ADVERTENCIA**: El script `apps/api/scripts/seed.ts` sigue existiendo pero **NO está expuesto como comando npm** para evitar ejecución accidental.

### Para Nueva Instancia (Primera vez)

1. **Opción A (Recomendada)**: Crear datos manualmente usando la UI/API
2. **Opción B**: Insertar datos iniciales vía Supabase SQL Editor
3. ✅ Los datos permanecerán intactos en todos los deploys subsecuentes

## Archivos Involucrados

- `package.json`: ~~Hook `postbuild` REMOVIDO~~ (antes línea 69)
- `scripts/postbuild-seed.js`: Script de postbuild (ya no se ejecuta automáticamente)
- `scripts/vercel-seed-production.ts`: Lógica de seeding (solo ejecución manual)
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

Para verificar que el seed NO se ejecute en un deploy:

1. Ve a Vercel Dashboard → Deployment
2. Busca en logs de build:
   - ✅ NO deberías ver mensajes de seed (`🌱 Running post-build seed...`)
   - ✅ El build debe completarse sin ejecutar scripts de seed

## Historial de Fixes

1. **Primer intento** (2024-12-10):
   - Commit: `fix: make postbuild seed optional to prevent data loss`
   - Cambió el script para ser opcional con VERCEL_SEED_TOKEN

2. **Solución final** (2024-12-10):
   - Commit: `fix: remove postbuild seed hook completely to prevent data loss`
   - **REMOVIÓ completamente el hook `postbuild` de package.json**
   - Problema resuelto definitivamente: NO hay riesgo de pérdida de datos
