# Workflow de GitHub Actions para Backup de Supabase

## Archivo: `.github/workflows/supabase-backup.yml`

```yaml
name: Supabase Database Backup

on:
  schedule:
    # Ejecutar diariamente a las 2:00 AM UTC (8:00 PM CDT)
    - cron: "0 2 * * *"
  workflow_dispatch:
    inputs:
      reason:
        description: "Razón del backup manual"
        required: false
        default: "Backup manual"
        type: string

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Run backup script
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
        run: |
          node scripts/backup-database.js

      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: supabase-backup-${{ github.run_number }}
          path: ./backups/
          retention-days: 30

      - name: Commit and push backup
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add ./backups/
          git commit -m "Backup automático de Supabase - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
          git push

      - name: Create Release
        if: github.event_name == 'workflow_dispatch'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: backup-${{ github.run_number }}
          release_name: Database Backup ${{ github.run_number }}
          body: |
            Backup de la base de datos de Supabase

            **Fecha:** ${{ github.event_name == 'workflow_dispatch' && github.event.inputs.reason || 'Backup programado' }}
            **Run Number:** ${{ github.run_number }}

            Este backup contiene todos los datos de la base de datos necesarios para restaurar el sistema.
          draft: false
          prerelease: false

      - name: Upload backup to release
        if: github.event_name == 'workflow_dispatch'
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./backups/
          asset_name: supabase-backup-${{ github.run_number }}.sql
          asset_content_type: application/sql
```

## Configuración de Secrets en GitHub

Para que este workflow funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub:

1. `SUPABASE_URL`: La URL de tu proyecto de Supabase
2. `SUPABASE_SERVICE_ROLE_KEY`: La clave de servicio de Supabase con permisos de administrador
3. `SUPABASE_PROJECT_ID`: El ID de tu proyecto de Supabase
4. `GITHUB_TOKEN`: Se genera automáticamente, no necesitas configurarlo manualmente

## Script de Backup

Necesitarás crear un script de backup en `scripts/backup-database.js` que utilice las credenciales de Supabase para exportar la base de datos. Aquí hay un ejemplo básico:

```javascript
// scripts/backup-database.js
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Crear directorio de backups si no existe
const backupDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Configurar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para realizar el backup
async function performBackup() {
  try {
    console.log("Iniciando backup de la base de datos...");

    // Aquí iría tu lógica de backup
    // Por ejemplo, exportar todas las tablas como SQL

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    // Ejemplo de contenido del backup
    const backupContent = `-- Backup de Supabase - ${timestamp}
-- Proyecto: ${process.env.SUPABASE_PROJECT_ID}

-- Aquí irían las sentencias SQL para recrear las tablas e insertar los datos
`;

    fs.writeFileSync(backupFile, backupContent);
    console.log(`Backup completado: ${backupFile}`);

    return backupFile;
  } catch (error) {
    console.error("Error durante el backup:", error);
    process.exit(1);
  }
}

// Ejecutar backup
performBackup();
```

## Frecuencia de Backup

El workflow está configurado para ejecutarse diariamente a las 2:00 AM UTC (8:00 PM CDT). Si necesitas cambiar la frecuencia, modifica el valor del cron en la sección `on.schedule`.

## Almacenamiento de Backups

Los backups se almacenan en dos lugares:

1. Como artefactos de GitHub Actions (retención de 30 días)
2. En el repositorio, en la carpeta `./backups/`
3. Como releases (solo para backups manuales)

## Restauración de Backups

Para restaurar un backup, puedes descargar el archivo SQL desde los artefactos de GitHub Actions o desde la carpeta `./backups/` del repositorio y ejecutarlo en tu instancia de Supabase.
