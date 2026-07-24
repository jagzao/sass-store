# Backup local Supabase + Recovery total

## Resumen

Tres scripts de PowerShell 5.1 corren en tu máquina Windows:

- `scripts/backup-supabase-full.ps1` — dump completo (roles, schema, datos, storage).
- `scripts/validate-supabase-backup.ps1` — valida el backup más reciente.
- `scripts/register-backup-task.ps1` — registra tarea diaria a las 02:00 y eventos Windows.

Destino por defecto: `C:\backups\sass-store`.

## Configuración

Crear `C:\backups\sass-store\.env.backup` (no lo subas a git):

```env
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-1-us-east-2.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
BACKUP_DIR=C:\backups\sass-store
```

> `DATABASE_URL` debe apuntar al puerto `5432` directo, **no** al pooler `6543`.

Cargar antes de correr scripts:

```powershell
Get-Content C:\backups\sass-store\.env.backup | ForEach-Object {
  if ($_ -match '^(\w+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
}
```

## Uso manual

```powershell
# Backup
.\scripts\backup-supabase-full.ps1

# Validar ultimo
.\scripts\validate-supabase-backup.ps1
```

## Tarea programada

Abrir PowerShell como **Administrador**, cargar `.env.backup` y ejecutar:

```powershell
Get-Content C:\backups\sass-store\.env.backup | ForEach-Object {
  if ($_ -match '^(\w+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
  }
}
cd C:\Dev\Zo\sass-store
.\scripts\register-backup-task.ps1
```

Esto crea `sass-store-supabase-daily-backup` en el Programador de Tareas, corriendo a las 02:00.

Errores se escriben en **Visor de eventos → Windows Logs → Application → Origen: `sass-store-backup`**.

## Estructura del backup

```text
C:\backups\sass-store\
  2026-07-23-020000\
    roles.sql
    schema.sql
    data.sql
    manifest.json
    sha256sums.txt
    storage\
      buckets.json
      manifest.json
      files\<bucket>\<path>
  LATEST -> junction al ultimo backup
```

`manifest.json` incluye:

- `projectRef`
- `timestamp`
- `files.{roles,schema,data}.size`
- `rowCounts` por tabla
- `dbVersion`, `extensions`
- resumen de Storage

## Recovery total

### 1. En PostgreSQL local (Docker o instalado)

Requisitos:

- PostgreSQL 15+ (idealmente misma versión que Supabase).
- `psql` y `pg_restore`/`psql` disponibles.

Pasos:

```powershell
$backup = "C:\backups\sass-store\2026-07-23-020000"
$localDb = "postgresql://postgres:localpass@localhost:5432/sass_store_recovery"

# 1. Crear base vacia
psql "postgresql://postgres:localpass@localhost:5432/postgres" -c "DROP DATABASE IF EXISTS sass_store_recovery; CREATE DATABASE sass_store_recovery;"

# 2. Roles (como superusuario en postgres)
psql "postgresql://postgres:localpass@localhost:5432/postgres" -f "$backup\roles.sql"

# 3. Schema
psql $localDb -f "$backup\schema.sql"

# 4. Datos
psql $localDb -f "$backup\data.sql"

# 5. Verificar counts
psql $localDb -c "SELECT schemaname, tablename, n_tup_ins FROM pg_stat_user_tables;"
```

Puntos de fricción comunes:

- Roles como `supabase_admin`, `postgres` ya existen en local; `roles.sql` fallará parcialmente. Normal.
- Extensiones como `vector` requieren `pgvector` instalado en local.
- Funciones de Supabase (`realtime`, `storage`) pueden depender de extensiones propietarias.
- Para app productiva basta con schema + datos + roles aplicativos.

### 2. En un nuevo proyecto Supabase

Supabase no permite restaurar un `pg_dump` completo desde CLI en un proyecto nuevo. Opciones:

1. **Supabase CLI `supabase db push`** — solo schema/migraciones, no datos.
2. **SQL Editor en dashboard** — pegar/cargar `schema.sql` + `data.sql` en orden.
3. **Branching / migrations** — ideal si tenés las migraciones Drizzle/Supabase al día.

Pasos prácticos:

```text
1. Crear nuevo proyecto en https://app.supabase.com
2. En SQL Editor, ejecutar roles.sql (ajustar passwords si es necesario)
3. Ejecutar schema.sql
4. Ejecutar data.sql
5. Re-crear Storage buckets y subir archivos de C:\backups\sass-store\<ts>\storage\files\
6. Revisar RLS policies, functions, triggers en SQL Editor
7. Actualizar DATABASE_URL en tu app
```

## Verificación post-recovery

```sql
SELECT count(*) FROM tenants;
SELECT count(*) FROM users;
SELECT count(*) FROM bookings;
SELECT count(*) FROM products;
SELECT count(*) FROM services;
SELECT count(*) FROM customers;
SELECT count(*) FROM orders;
SELECT count(*) FROM payments;
SELECT count(*) FROM wa_tenant_config;

-- Listar funciones, triggers, politicas
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
SELECT tgname FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace);
SELECT polname FROM pg_policies WHERE schemaname = 'public';
```

## Retención

Cada backup mantiene 30 días. El script elimina carpetas con fecha mayor a 30 días al finalizar.

## Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| `pg_dump: could not connect to server` | URL con PgBouncer 6543 | Cambiar a puerto 5432 |
| `roles.sql` vacío o pequeño | Permisos | Verificar password y que usuario sea `postgres` |
| Storage no se descarga | Falta service role key | Revisar `SUPABASE_SERVICE_ROLE_KEY` |
| Evento Windows no aparece | Sin permisos | Correr una vez como admin para crear el source |
| Error `column wt.admin_phone does not exist` | Automatización antigua | Migración `20260723204706_add_admin_phone_to_wa_tenant_config.sql` ya añade el alias |

## Migración `admin_phone`

Si alguna automatización (n8n, script externo) falla por `wt.admin_phone`, la migración añade la columna como alias bidireccional de `escalation_phone`. Para aplicar en otro entorno:

```powershell
npx tsx scripts/apply-migration-auto.ts packages/database/migrations/20260723204706_add_admin_phone_to_wa_tenant_config.sql
```

> Nota: `apply-migration-auto.ts` lee siempre `APPLY_MIGRATION_NOW.sql` en el repo root. Copiar la migración a ese nombre antes de correrlo.
