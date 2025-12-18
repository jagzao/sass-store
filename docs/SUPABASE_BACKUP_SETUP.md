# Configuración de Backups Automáticos para Supabase

## Introducción

Este documento describe cómo implementar un sistema de backups automáticos para la base de datos de Supabase utilizando GitHub Actions y la CLI de Supabase. Esta solución permite realizar respaldos diarios sin depender del plan pago de Supabase.

## Requisitos Previos

1. Tener instalada la CLI de Supabase localmente para pruebas
2. Cuenta en GitHub con acceso al repositorio del proyecto
3. Credenciales de la base de datos de Supabase

## Configuración

### 1. Instalación de la CLI de Supabase

Si aún no tienes instalada la CLI de Supabase, instálala con:

```bash
npm install -g supabase
```

### 2. Obtención de Credenciales de la Base de Datos

Necesitarás las credenciales de tu base de datos de Supabase:
1. Ve a tu proyecto en Supabase Dashboard
2. Haz clic en "Settings" → "Database"
3. En la sección "Connection string", copia la URI de conexión

### 3. Configuración de Secrets en GitHub

En tu repositorio de GitHub, ve a `Settings` → `Secrets and variables` → `Actions` y añade los siguientes secrets:

```
SUPABASE_PROJECT_REF = tu-project-ref
SUPABASE_DB_PASSWORD = tu-password
SUPABASE_SERVICE_ROLE_KEY = tu-service-role-key
```

Puedes encontrar estos valores en:
- Project Ref: Settings → API → Project Reference
- Service Role Key: Settings → API → Service Role Key
- DB Password: Settings → Database → Database password (si no la tienes, puedes restablecerla)

### 4. Workflow de GitHub Actions

Crea un archivo en tu repositorio en la ruta `.github/workflows/supabase-backup.yml`:

```yaml
name: Supabase Database Backup

on:
  schedule:
    # Ejecutar diariamente a las 2:00 AM UTC (8:00 PM CDT)
    - cron: '0 2 * * *'
  workflow_dispatch: # Permite ejecutar manualmente

jobs:
  backup:
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
        
    - name: Create backup
      env:
        SUPABASE_PROJECT_REF: ${{ secrets.SUPABASE_PROJECT_REF }}
        SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
      run: |
        # Crear directorio para backups
        mkdir -p ./backups
        
        # Generar timestamp
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        
        # Realizar backup usando pg_dump
        PGPASSWORD="${{ secrets.SUPABASE_DB_PASSWORD }}" pg_dump -Fc -v -h db.${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co -U postgres -d postgres > ./backups/backup_${TIMESTAMP}.dump
        
        # Comprimir el backup
        gzip ./backups/backup_${TIMESTAMP}.dump
        
        echo "Backup creado: backup_${TIMESTAMP}.dump.gz"
        
    - name: Upload backup to repository
      uses: stefanzweifel/git-auto-commit-action@v5
      with:
        commit_message: "Add database backup $(date)"
        file_pattern: 'backups/*.dump.gz'
        
    - name: Upload backup as artifact
      uses: actions/upload-artifact@v3
      with:
        name: database-backup-${{ github.run_number }}
        path: ./backups/
        retention-days: 30
        
    - name: Clean old backups (keep last 7)
      run: |
        cd ./backups
        ls -t *.dump.gz | tail -n +8 | xargs rm -f --
        
    - name: Upload to S3 (optional)
      if: env.AWS_S3_BUCKET != ''
      uses: jakejarvis/s3-sync-action@master
      with:
        args: --acl private --follow-symlinks --delete
      env:
        AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_REGION: 'us-east-1' # opcional: especifica tu región
        SOURCE_DIR: './backups'
```

### 5. Script de Restauración

Crea un script en `scripts/restore-backup.js` para facilitar la restauración de la base de datos:

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

### 6. Script de Backup Local

Crea un script en `scripts/local-backup.sh` para realizar backups manualmente:

```bash
#!/bin/bash

# Configuración
SUPABASE_PROJECT_REF=${SUPABASE_PROJECT_REF:-"tu-project-ref"}
SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-"tu-password"}
BACKUP_DIR="./backups"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Generar timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Realizar backup
echo "Creando backup..."
PGPASSWORD=$SUPABASE_DB_PASSWORD pg_dump -Fc -v -h db.$SUPABASE_PROJECT_REF.supabase.co -U postgres -d postgres > $BACKUP_DIR/backup_$TIMESTAMP.dump

# Comprimir el backup
echo "Comprimiendo backup..."
gzip $BACKUP_DIR/backup_$TIMESTAMP.dump

echo "Backup completado: $BACKUP_DIR/backup_$TIMESTAMP.dump.gz"
```

## Uso

### Ejecutar Manualmente el Workflow

1. Ve a la pestaña "Actions" en tu repositorio de GitHub
2. Selecciona el workflow "Supabase Database Backup"
3. Haz clic en "Run workflow" y luego en "Run workflow" para ejecutarlo inmediatamente

### Restaurar un Backup

1. Descarga el archivo de backup desde la sección de artifacts de la ejecución del workflow
2. Descomprime el archivo: `gunzip backup_YYYYMMDD_HHMMSS.dump.gz`
3. Restaura la base de datos:
   ```bash
   PGPASSWORD=tu-password pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -c backup_YYYYMMDD_HHMMSS.dump
   ```

O utiliza el script de restauración:
```bash
SUPABASE_PROJECT_REF=tu-project-ref SUPABASE_DB_PASSWORD=tu-password node scripts/restore-backup.js
```

### Realizar Backup Local

```bash
SUPABASE_PROJECT_REF=tu-project-ref SUPABASE_DB_PASSWORD=tu-password bash scripts/local-backup.sh
```

## Consideraciones de Seguridad

1. **Cifrado**: Los backups no están cifrados por defecto. Si necesitas cifrarlos, puedes utilizar herramientas como GPG y modificar el workflow.

2. **Retención**: El workflow actual mantiene los últimos 7 backups en el repositorio y 30 días en los artifacts de GitHub.

3. **Almacenamiento Externo**: Para mayor seguridad, puedes modificar el workflow para subir los backups a servicios de almacenamiento externo como Amazon S3, Google Cloud Storage, o Azure Blob Storage.

## Alternativas de Almacenamiento

### Opción 1: Almacenar en Amazon S3

Añade estos secrets en GitHub:
```
AWS_S3_BUCKET = tu-bucket-name
AWS_ACCESS_KEY_ID = tu-access-key-id
AWS_SECRET_ACCESS_KEY = tu-secret-access-key
AWS_REGION = us-east-1
```

El workflow ya incluye un paso opcional para subir a S3 si el bucket está configurado.

### Opción 2: Almacenar en Google Cloud Storage

Añade este paso al workflow después de crear el backup:

```yaml
- name: Upload to Google Cloud Storage
  uses: google-github-actions/upload-cloud-storage@main
  with:
    path: './backups'
    destination: '${{ secrets.GCS_BUCKET }}/backups'
  env:
    GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
    GCLOUD_AUTH: ${{ secrets.GCLOUD_AUTH }}
```

## Monitoreo

Puedes configurar notificaciones para el workflow en caso de fallos:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    channel: '#alerts'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Conclusión

Esta solución proporciona una forma gratuita y automatizada de realizar backups diarios de tu base de datos de Supabase. Los backups se almacenan en tu repositorio de GitHub y como artifacts, permitiéndote restaurar la base de datos en caso de necesidad.

Recuerda probar el proceso de restauración regularmente para asegurar que los backups son válidos y pueden ser restaurados correctamente.