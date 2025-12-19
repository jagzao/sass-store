# Frecuencia y Almacenamiento de Backups de Supabase

## Frecuencia de los Backups

### ¿Cuándo se realiza el backup?

El backup de la base de datos de Supabase se realiza **automáticamente todos los días a las 2:00 AM UTC (8:00 PM CDT)**.

Esta frecuencia está configurada en el workflow de GitHub Actions mediante la siguiente programación:

```yaml
on:
  schedule:
    # Ejecutar diariamente a las 2:00 AM UTC (8:00 PM CDT)
    - cron: "0 2 * * *"
  workflow_dispatch: # Permite ejecutar manualmente
```

### ¿Qué significa esto?

- **2:00 AM UTC**: Es la hora en la que se ejecuta el backup según el Tiempo Universal Coordinado.
- **8:00 PM CDT**: Es la hora equivalente en la Ciudad de México (UTC-6 en horario estándar, UTC-5 en horario de verano).
- **Diariamente**: El backup se realiza todos los días sin excepción.

### ¿Puedo cambiar la frecuencia?

Sí, puedes modificar la frecuencia del backup editando el archivo `.github/workflows/supabase-backup.yml` y cambiando la programación del cron:

```yaml
on:
  schedule:
    # Ejemplos de otras frecuencias:
    # Cada 6 horas: '0 */6 * * *'
    # Cada domingo a las 3 AM: '0 3 * * 0'
    # Los días 1 y 15 de cada mes: '0 2 1,15 * *'
    - cron: "0 2 * * *" # Cambia esta línea para ajustar la frecuencia
  workflow_dispatch:
```

### ¿Puedo ejecutar el backup manualmente?

Sí, el workflow está configurado para permitir ejecuciones manuales. Para ejecutarlo manualmente:

1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Selecciona el workflow **Supabase Database Backup**
3. Haz clic en **Run workflow** y luego en **Run workflow**

## Dónde se Guardan los Backups

### ¿Dónde se almacenan los archivos de backup?

Los backups de la base de datos se guardan en **tres lugares diferentes** para mayor seguridad:

#### 1. En el Repositorio de GitHub

- **Ubicación**: Carpeta `backups/` en la raíz del repositorio
- **Formato**: `backup_YYYYMMDD_HHMMSS.dump.gz`
- **Ejemplo**: `backup_20231218_020000.dump.gz`
- **Retención**: Se mantienen los últimos 7 backups (los más antiguos se eliminan automáticamente)
- **Ventaja**: Los backups están versionados junto con tu código, lo que facilita la trazabilidad

#### 2. Como Artifacts de GitHub Actions

- **Ubicación**: Sección "Artifacts" de cada ejecución del workflow
- **Acceso**: Ve a Actions → Supabase Database Backup → Selecciona una ejecución → Artifacts
- **Retención**: 30 días (configurable en el workflow)
- **Ventaja**: Fácil acceso a través de la interfaz de GitHub sin necesidad de clonar el repositorio

#### 3. En Almacenamiento Externo (Opcional)

- **Ubicación**: Amazon S3, Google Cloud Storage o cualquier otro servicio compatible
- **Configuración**: Requiere configurar los secrets de AWS en el repositorio
- **Ventaja**: Mayor seguridad y durabilidad a largo plazo

### ¿Cómo se nombran los archivos de backup?

Los archivos de backup siguen un formato estandarizado que incluye la fecha y hora de creación:

```
backup_YYYYMMDD_HHMMSS.dump.gz
```

Donde:

- `YYYY`: Año (4 dígitos)
- `MM`: Mes (2 dígitos)
- `DD`: Día (2 dígitos)
- `HH`: Hora (24 horas, 2 dígitos)
- `MM`: Minutos (2 dígitos)
- `SS`: Segundos (2 dígitos)

Ejemplo: `backup_20231218_020000.dump.gz` (Backup del 18 de diciembre de 2023 a las 02:00:00 UTC)

### ¿Cómo puedo acceder a los backups?

#### Opción 1: Desde el Repositorio

1. Clona el repositorio o actualízalo con `git pull`
2. Los backups estarán en la carpeta `backups/`
3. Cada backup es un archivo `.dump.gz` que contiene una copia completa de la base de datos

#### Opción 2: Desde GitHub Actions

1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Selecciona el workflow **Supabase Database Backup**
3. Selecciona la ejecución más reciente
4. En la sección **Artifacts**, descarga el archivo `database-backup-N`

#### Opción 3: Desde Almacenamiento Externo (si está configurado)

1. Accede a tu servicio de almacenamiento (S3, Google Cloud, etc.)
2. Navega a la carpeta donde se almacenan los backups
3. Descarga el archivo que necesites

### ¿Cómo puedo restaurar un backup específico?

1. **Identifica el backup** que necesitas restaurar (por fecha y hora)
2. **Descarga el archivo** desde cualquiera de las ubicaciones mencionadas
3. **Descomprime el archivo**: `gunzip backup_YYYYMMDD_HHMMSS.dump.gz`
4. **Restaura la base de datos** usando el script de restauración o manualmente:
   ```bash
   PGPASSWORD=tu-password pg_restore -v -h db.tu-project-ref.supabase.co -U postgres -d postgres -c backup_YYYYMMDD_HHMMSS.dump
   ```

### ¿Cuánto espacio ocupan los backups?

El tamaño de los backups depende del tamaño de tu base de datos:

- Un backup típico puede ocupar desde unos pocos MB hasta varios GB
- Los backups están comprimidos con gzip para reducir el tamaño
- El sistema automáticamente mantiene solo los últimos 7 backups en el repositorio para no ocupar demasiado espacio

### ¿Puedo ajustar la retención de backups?

Sí, puedes modificar el periodo de retención en el workflow:

```yaml
- name: Clean old backups (keep last N)
  run: |
    cd ./backups
    # Cambia el número 7 por la cantidad de backups que quieras mantener
    ls -t *.dump.gz | tail -n +8 | xargs rm -f --
```

Para los artifacts de GitHub Actions, puedes cambiar la retención:

```yaml
- name: Upload backup as artifact
  uses: actions/upload-artifact@v3
  with:
    name: database-backup-${{ github.run_number }}
    path: ./backups/
    # Cambia 30 por los días que quieras mantener los artifacts
    retention-days: 30
```
