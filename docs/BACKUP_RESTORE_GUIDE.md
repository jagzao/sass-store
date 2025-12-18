# Guía de Restauración de Backups de Supabase

## Introducción

Este documento describe cómo restaurar la base de datos de Supabase a partir de los backups generados por el sistema automático. Es importante probar este proceso regularmente para asegurar que los backups son válidos y pueden ser restaurados correctamente.

## Script de Restauración

### Creación del Script

Crea un archivo en `scripts/restore-backup.js` con el siguiente contenido:

```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Obtener el archivo de backup más reciente
const backupDir = path.join(__dirname, '../backups');
const files = fs.readdirSync(backupDir)
  .filter(file => file.endsWith('.dump.gz'))
  .sort()
  .reverse();

if (files.length === 0) {
  console.error('No se encontraron archivos de backup');
  process.exit(1);
}

const latestBackup = files[0];
console.log(`Restaurando desde: ${latestBackup}`);

// Descomprimir el archivo
execSync(`gunzip -c ${path.join(backupDir, latestBackup)} > ${path.join(backupDir, 'restore.dump')}`);

// Restaurar la base de datos
const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF;
const supabasePassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseProjectRef || !supabasePassword) {
  console.error('Faltan variables de entorno: SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD');
  process.exit(1);
}

execSync(`PGPASSWORD=${supabasePassword} pg_restore -v -h db.${supabaseProjectRef}.supabase.co -U postgres -d postgres -c ${path.join(backupDir, 'restore.dump')}`);

console.log('Base de datos restaurada exitosamente');

// Limpiar archivo temporal
fs.unlinkSync(path.join(backupDir, 'restore.dump'));
```

### Uso del Script

Para restaurar la base de datos utilizando el script:

```bash
# Establecer las variables de entorno
export SUPABASE_PROJECT_REF=tu-project-ref
export SUPABASE_DB_PASSWORD=tu-password

# Ejecutar el script
node scripts/restore-backup.js
```

## Restauración Manual

Si prefieres realizar la restauración manualmente, sigue estos pasos:

### 1. Descargar el Backup

1. Ve a la pestaña "Actions" en tu repositorio de GitHub
2. Selecciona el workflow "Supabase Database Backup"
3. Selecciona la ejecución más reciente
4. En la sección "Artifacts", descarga el archivo `database-backup-N`

### 2. Descomprimir el Backup

```bash
# Descomprimir el archivo de backup
gunzip backup_YYYYMMDD_HHMMSS.dump.gz
```

### 3. Restaurar la Base de Datos

```bash
# Restaurar la base de datos
PGPASSWORD=tu-password pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -c backup_YYYYMMDD_HHMMSS.dump
```

## Restauración Selectiva

En algunos casos, es posible que no quieras restaurar toda la base de datos, sino solo tablas específicas. Para ello, puedes utilizar las opciones de `pg_restore`:

```bash
# Listar el contenido del backup
pg_restore -l backup_YYYYMMDD_HHMMSS.dump

# Restaurar solo una tabla específica
pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -t nombre_tabla backup_YYYYMMDD_HHMMSS.dump

# Restaurar varias tablas específicas
pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -t tabla1 -t tabla2 backup_YYYYMMDD_HHMMSS.dump
```

## Restauración en un Entorno de Pruebas

Antes de restaurar la base de datos en producción, es recomendable probar el proceso en un entorno de pruebas:

### 1. Crear un Proyecto de Prueba en Supabase

1. Crea un nuevo proyecto en Supabase para pruebas
2. Copia las credenciales del nuevo proyecto

### 2. Restaurar en el Entorno de Pruebas

```bash
# Restaurar en el entorno de pruebas
PGPASSWORD=tu-password-prueba pg_restore -v -h db.tu-project-ref-prueba.supabase.co -U postgres -d postgres -c backup_YYYYMMDD_HHMMSS.dump
```

### 3. Verificar los Datos

1. Accede al dashboard de Supabase del proyecto de pruebas
2. Verifica que los datos se hayan restaurado correctamente
3. Prueba la aplicación con los datos restaurados

## Solución de Problemas

### Error: "database is being accessed by other users"

Este error ocurre cuando hay conexiones activas a la base de datos. Para solucionarlo:

1. Termina todas las conexiones activas:
   ```sql
   SELECT pg_terminate_backend(pg_stat_activity.pid)
   FROM pg_stat_activity
   WHERE pg_stat_activity.datname = 'postgres'
     AND pid <> pg_backend_pid();
   ```

2. O utiliza la opción `--clean` con `--if-exists` para evitar errores:
   ```bash
   PGPASSWORD=tu-password pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres --clean --if-exists backup_YYYYMMDD_HHMMSS.dump
   ```

### Error: "permission denied for table"

Este error ocurre cuando el usuario no tiene los permisos necesarios. Asegúrate de utilizar el usuario `postgres` con la contraseña correcta.

### Error: "out of memory"

Si el backup es muy grande, puedes aumentar la memoria disponible para `pg_restore`:

```bash
# Aumentar la memoria disponible (en Linux)
export PGTZ=UTC
export PGCLIENTENCODING=UTF8
pg_restore --verbose --host=db.tu-project-ref.supabase.co --username=postgres --dbname=postgres --clean --if-exists backup_YYYYMMDD_HHMMSS.dump
```

## Automatización de Pruebas de Restauración

Para asegurar que los backups son válidos, puedes crear un workflow de GitHub Actions que realice pruebas de restauración periódicas:

```yaml
name: Test Backup Restore

on:
  schedule:
    # Ejecutar semanalmente los domingos a las 3:00 AM UTC
    - cron: '0 3 * * 0'
  workflow_dispatch:

jobs:
  test-restore:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install PostgreSQL client
      run: |
        sudo apt-get update
        sudo apt-get install -y postgresql-client
        
    - name: Download latest backup
      uses: actions/github-script@v6
      with:
        script: |
          const { workflow_runs } = await github.rest.actions.listWorkflowRuns({
            owner: context.repo.owner,
            repo: context.repo.repo,
            workflow_id: 'supabase-backup.yml',
            per_page: 1
          });
          
          if (workflow_runs.workflow_runs.length === 0) {
            core.setFailed('No se encontraron ejecuciones del workflow de backup');
            return;
          }
          
          const run = workflow_runs.workflow_runs[0];
          const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
            owner: context.repo.owner,
            repo: context.repo.repo,
            run_id: run.id
          });
          
          if (artifacts.data.artifacts.length === 0) {
            core.setFailed('No se encontraron artifacts en la última ejecución');
            return;
          }
          
          const artifact = artifacts.data.artifacts[0];
          const download = await github.rest.actions.downloadArtifact({
            owner: context.repo.owner,
            repo: context.repo.repo,
            artifact_id: artifact.id,
            archive_format: 'zip'
          });
          
          const fs = require('fs');
          fs.writeFileSync(`${process.env.GITHUB_WORKSPACE}/backup.zip`, Buffer.from(download.data));
          
    - name: Extract backup
      run: |
        unzip backup.zip -d backups
        ls -la backups/
        
    - name: Test restore (dry run)
      env:
        SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
        SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      run: |
        # Encontrar el archivo de backup más reciente
        BACKUP_FILE=$(ls -t backups/*.dump.gz | head -1)
        
        # Descomprimir el archivo
        gunzip -c $BACKUP_FILE > restore.dump
        
        # Verificar el contenido del backup (sin restaurar)
        pg_restore -l restore.dump
        
        echo "Prueba de restauración completada exitosamente"
```

## Conclusión

La restauración de backups es una parte crítica de cualquier estrategia de protección de datos. Es importante probar regularmente este proceso para asegurar que los backups son válidos y pueden ser restaurados correctamente en caso de necesidad.

Recuerda siempre probar la restauración en un entorno de pruebas antes de realizarla en producción, y documenta cualquier problema o lección aprendida durante el proceso.