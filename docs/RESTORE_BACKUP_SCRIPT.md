# Script de Restauración de la Base de Datos

## Archivo: scripts/restore-backup.js

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

## Script de Backup Local (Opcional)

## Archivo: scripts/local-backup.sh

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

## Uso del Script de Restauración

### 1. Crear el archivo del script

Crea un archivo llamado `restore-backup.js` en la carpeta `scripts/` de tu proyecto con el contenido que se muestra arriba.

### 2. Instalar dependencias necesarias

Asegúrate de tener instalado el cliente de PostgreSQL:
```bash
# En macOS
brew install postgresql

# En Ubuntu/Debian
sudo apt-get install postgresql-client

# En Windows
# Descargar e instalar PostgreSQL desde https://www.postgresql.org/download/windows/
```

### 3. Configurar variables de entorno

Puedes configurar las variables de entorno de varias maneras:

#### Opción A: Línea de comandos
```bash
export SUPABASE_PROJECT_REF=tu-project-ref
export SUPABASE_DB_PASSWORD=tu-password
node scripts/restore-backup.js
```

#### Opción B: Archivo .env
Crea un archivo `.env` en la raíz de tu proyecto:
```
SUPABASE_PROJECT_REF=tu-project-ref
SUPABASE_DB_PASSWORD=tu-password
```

Y modifica el script para cargar las variables desde este archivo:
```javascript
// Al principio del script
require('dotenv').config();
```

#### Opción C: Pasar como argumentos
Modifica el script para aceptar argumentos:
```javascript
const supabaseProjectRef = process.argv[2] || process.env.SUPABASE_PROJECT_REF;
const supabasePassword = process.argv[3] || process.env.SUPABASE_DB_PASSWORD;
```

Y ejecuta:
```bash
node scripts/restore-backup.js tu-project-ref tu-password
```

### 4. Ejecutar el script

```bash
# Desde la raíz del proyecto
node scripts/restore-backup.js
```

## Restauración Manual

Si prefieres no usar el script, puedes realizar la restauración manualmente:

### 1. Descargar el backup

1. Ve a la pestaña "Actions" en tu repositorio de GitHub
2. Selecciona el workflow "Supabase Database Backup"
3. Selecciona la ejecución más reciente
4. En la sección "Artifacts", descarga el archivo `database-backup-N`

### 2. Descomprimir el backup

```bash
# Descomprimir el archivo de backup
gunzip backup_YYYYMMDD_HHMMSS.dump.gz
```

### 3. Restaurar la base de datos

```bash
# Restaurar la base de datos
PGPASSWORD=tu-password pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -c backup_YYYYMMDD_HHMMSS.dump
```

## Restauración Selectiva

Si solo quieres restaurar tablas específicas:

```bash
# Listar el contenido del backup
pg_restore -l backup_YYYYMMDD_HHMMSS.dump

# Restaurar solo una tabla específica
pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -t nombre_tabla backup_YYYYMMDD_HHMMSS.dump

# Restaurar varias tablas específicas
pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -t tabla1 -t tabla2 backup_YYYYMMDD_HHMMSS.dump
```

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

## Pruebas de Restauración

Antes de restaurar en producción, es recomendable probar en un entorno de desarrollo:

1. Crea un proyecto de prueba en Supabase
2. Utiliza el script para restaurar en el proyecto de prueba
3. Verifica que los datos se hayan restaurado correctamente
4. Si todo está correcto, procede a restaurar en producción

## Automatización de Pruebas

Puedes crear un workflow de GitHub Actions que realice pruebas de restauración periódicas:

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
          // Código para descargar el último backup
          // (similar al que se muestra en el documento BACKUP_RESTORE_GUIDE.md)
          
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