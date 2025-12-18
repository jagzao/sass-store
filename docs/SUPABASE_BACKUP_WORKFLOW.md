# Workflow de GitHub Actions para Backups de Supabase

## Archivo: .github/workflows/supabase-backup.yml

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

## Configuración de Credenciales

### ¿Dónde configurar las credenciales de Supabase?

Las credenciales de Supabase deben configurarse en **Repository secrets** (no en Environment secrets). Aquí está la diferencia:

**Repository secrets**:
- Están disponibles para todos los workflows en el repositorio
- Son específicas para el repositorio
- Se acceden con: `${{ secrets.SECRET_NAME }}`
- **Estas son las que necesitas para el workflow de backups**

**Environment secrets**:
- Están asociadas a un environment específico (Production, Staging, etc.)
- Se utilizan para despliegues y configuraciones específicas de entorno
- Se acceden con: `${{ secrets.ENVIRONMENT.SECRET_NAME }}`

### Pasos para configurar los Repository secrets:

1. Ve a tu repositorio de GitHub
2. Haz clic en **Settings**
3. En el menú de la izquierda, haz clic en **Secrets and variables**
4. Selecciona **Actions**
5. Haz clic en **New repository secret**
6. Añade los siguientes secrets:

#### Secrets necesarios:

```
SUPABASE_PROJECT_REF
```
- **Descripción**: El identificador de tu proyecto en Supabase
- **Valor**: Encuéntralo en tu dashboard de Supabase: Settings → API → Project Reference
- **Ejemplo**: `abcdefgh123456`

```
SUPABASE_DB_PASSWORD
```
- **Descripción**: La contraseña de tu base de datos de Supabase
- **Valor**: Encuéntrala en tu dashboard de Supabase: Settings → Database → Database password
- **Nota**: Si no la tienes, puedes restablecerla

#### Secretes opcionales (para almacenamiento externo):

```
AWS_S3_BUCKET
```
- **Descripción**: Nombre del bucket de S3 para almacenar los backups (opcional)
- **Valor**: Solo si quieres almacenar los backups en S3

```
AWS_ACCESS_KEY_ID
```
- **Descripción**: Access Key ID de AWS (opcional)
- **Valor**: Solo si quieres almacenar los backups en S3

```
AWS_SECRET_ACCESS_KEY
```
- **Descripción**: Secret Access Key de AWS (opcional)
- **Valor**: Solo si quieres almacenar los backups en S3

### Importante:

- **No uses Environment secrets** para este workflow, ya que los backups deben realizarse independientemente del entorno.
- **Mantén tus secrets seguras**: No compartas tus credenciales con nadie y no las expongas en el código.
- **Rotación de secrets**: Es una buena práctica rotar regularmente tus contraseñas y actualizar los secrets en GitHub.

## Uso del Workflow

### Ejecución automática:
- El workflow se ejecutará automáticamente todos los días a las 2:00 AM UTC (8:00 PM CDT).

### Ejecución manual:
1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Selecciona el workflow **Supabase Database Backup**
3. Haz clic en **Run workflow** y luego en **Run workflow** para ejecutarlo inmediatamente

### Descarga de backups:
1. Ve a la pestaña **Actions**
2. Selecciona el workflow **Supabase Database Backup**
3. Selecciona la ejecución más reciente
4. En la sección **Artifacts**, descarga el archivo `database-backup-N`

### Verificación de backups:
Los backups también se guardarán en el repositorio en la carpeta `backups/` con el formato `backup_YYYYMMDD_HHMMSS.dump.gz`.