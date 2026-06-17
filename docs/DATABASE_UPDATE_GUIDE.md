# 🚀 Guía de Actualización de Base de Datos

## 📋 Índice

1. [Backup Obligatorio](#backup-obligatorio)
2. [Escenario 1: Actualizar Solo Esquema](#escenario-1-actualizar-solo-esquema)
3. [Escenario 2: Reset Completo (Desarrollo)](#escenario-2-reset-completo-desarrollo)
4. [Escenario 3: Actualización de Producción](#escenario-3-actualización-de-producción)
5. [Escenario 4: Migración de Datos](#escenario-4-migración-de-datos)
6. [Verificación y Troubleshooting](#verificación-y-troubleshooting)

---

## ⚠️ Backup Obligatorio

**ANTES DE CUALQUIER CAMBIO, SIEMPRE HAZ BACKUP:**

```bash
# Backup completo de la base de datos
pg_dump "postgresql://user:password@host:port/database" > backup_$(date +%Y%m%d_%H%M%S).sql

# O usando variables de entorno
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar que el backup se creó correctamente
ls -la backup_*.sql
```

---

## 📊 Escenario 1: Actualizar Solo Esquema

**Cuando:** Has hecho cambios en `packages/database/schema.ts` y quieres aplicarlos sin afectar los datos existentes.

**Comandos:**

```bash
# 1. Generar la migración del esquema
npm run db:generate

# 2. Aplicar cambios al esquema (sin perder datos)
npm run db:push

# 3. Verificar que no hay errores
echo "Schema updated successfully"
```

**Resultado:** ✅ Esquema actualizado, ✅ Datos preservados

---

## 🔄 Escenario 2: Reset Completo (Desarrollo)

**Cuando:** Estás en desarrollo y quieres empezar desde cero con datos frescos.

**Comandos:**

```bash
# 1. Generar esquema (si hay cambios)
npm run db:generate

# 2. Aplicar esquema
npm run db:push

# 3. Poblar con datos de prueba (BORRA TODO)
npm run db:seed

# 4. Verificar
echo "Database reset complete"
```

**Resultado:** ✅ Esquema actualizado, ✅ Datos completamente nuevos

---

## 🏭 Escenario 3: Actualización de Producción

**Cuando:** Tienes una BD en producción con datos importantes que NO quieres perder.

**Comandos:**

```bash
# ⚠️ BACKUP PRIMERO ⚠️
pg_dump "$DATABASE_URL" > backup_production_$(date +%Y%m%d_%H%M%S).sql

# 1. Generar migración del esquema
npm run db:generate

# 2. Aplicar cambios de esquema de forma segura
npm run db:push

# 3. OPCIONAL: Si necesitas actualizar algunos datos específicos
# (crea un script personalizado en packages/database/updates/)
# node scripts/custom-update.js

# 4. Verificar integridad
npm run db:verify
```

**Resultado:** ✅ Esquema actualizado, ✅ Datos preservados, ✅ Backup seguro

---

## 📦 Escenario 4: Migración de Datos

**Cuando:** Necesitas migrar datos entre versiones o hacer transformaciones complejas.

**Paso 1: Crear script de migración**

```typescript
// packages/database/migrations/v1.1.0-migration.ts
import { sql } from "drizzle-orm";

export async function migrateV110(db: any) {
  // Tu lógica de migración aquí
  await db.execute(sql`
    -- Ejemplo: actualizar teléfonos
    UPDATE tenants
    SET contact = jsonb_set(contact, '{phone}', '"${NEW_PHONE}"')
    WHERE slug = 'wondernails';
  `);
}
```

**Comandos:**

```bash
# 1. Backup
pg_dump "$DATABASE_URL" > pre_migration_backup.sql

# 2. Ejecutar migración
npm run db:migrate -- v1.1.0

# 3. Verificar
npm run db:verify
```

---

## 🔍 Verificación y Troubleshooting

### Verificar Estado de la BD:

```bash
# Contar registros por tabla
echo "=== TENANTS ==="
psql "$DATABASE_URL" -c "SELECT slug, name FROM tenants ORDER BY slug;"

echo "=== STAFF COUNT ==="
psql "$DATABASE_URL" -c "SELECT t.slug, COUNT(s.id) as staff_count FROM tenants t LEFT JOIN staff s ON t.id = s.tenant_id GROUP BY t.slug ORDER BY t.slug;"

echo "=== PRODUCTS COUNT ==="
psql "$DATABASE_URL" -c "SELECT t.slug, COUNT(p.id) as products_count FROM tenants t LEFT JOIN products p ON t.id = p.tenant_id GROUP BY t.slug ORDER BY t.slug;"
```

### Comandos de Troubleshooting:

```bash
# Ver logs de errores
tail -f logs/database.log

# Verificar conexiones activas
psql "$DATABASE_URL" -c "SELECT * FROM pg_stat_activity;"

# Verificar integridad de tablas
psql "$DATABASE_URL" -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';"

# Rollback si algo sale mal
psql "$DATABASE_URL" < backup_file.sql
```

---

## 🎯 Comandos Rápidos por Situación

| Situación             | Comando                                                   | Descripción          |
| --------------------- | --------------------------------------------------------- | -------------------- |
| **Desarrollo diario** | `npm run db:push`                                         | Actualizar esquema   |
| **Reset desarrollo**  | `npm run db:seed`                                         | Datos frescos        |
| **Producción**        | `npm run db:generate && npm run db:push`                  | Actualización segura |
| **Backup**            | `pg_dump "$DATABASE_URL" > backup.sql`                    | Backup completo      |
| **Verificar**         | `psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM tenants;"` | Contar tenants       |

---

## 🚨 Checklist de Seguridad

- [ ] **Backup creado** antes de cualquier cambio
- [ ] **Entorno correcto** (no ejecutar en prod sin backup)
- [ ] **Comandos en orden** (generate → push → seed si aplica)
- [ ] **Verificación** después de cada paso
- [ ] **Rollback plan** preparado
- [ ] **Equipo notificado** para cambios en producción

---

## 📞 Soporte

Si encuentras errores:

1. **Revisa los logs** en `logs/database.log`
2. **Verifica conexión** con `psql "$DATABASE_URL" -c "SELECT 1;"`
3. **Compara schemas** entre desarrollo y producción
4. **Restaura backup** si es necesario
5. **Contacta al equipo** con detalles del error

---

**Recuerda:** 🚨 **Nunca ejecutes comandos de BD en producción sin backup y aprobación del equipo** 🚨
