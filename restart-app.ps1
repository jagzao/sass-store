# Script para reiniciar completamente la aplicación SASS Store
# Ejecutar este script en PowerShell como Administrador

Write-Host "=== REINICIANDO APLICACIÓN SASS STORE ===" -ForegroundColor Cyan

# 1. Detener todos los procesos de Node.js
Write-Host "`n1. Deteniendo procesos de Node.js..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Host "   Procesos de Node.js detenidos: $($nodeProcesses.Count)" -ForegroundColor Green
    } else {
        Write-Host "   No se encontraron procesos de Node.js en ejecución" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Error al detener procesos: $_" -ForegroundColor Red
}

# 2. Esperar a que los procesos se detengan completamente
Write-Host "`n2. Esperando a que los procesos se detengan..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 3. Limpiar caché de Next.js
Write-Host "`n3. Limpiando caché de Next.js..." -ForegroundColor Yellow
$nextFolders = @(
    "apps\web\.next",
    "apps\api\.next"
)

foreach ($folder in $nextFolders) {
    if (Test-Path $folder) {
        try {
            Remove-Item -Path $folder -Recurse -Force
            Write-Host "   Carpeta eliminada: $folder" -ForegroundColor Green
        } catch {
            Write-Host "   Error al eliminar $folder : $_" -ForegroundColor Red
        }
    } else {
        Write-Host "   Carpeta no existe: $folder" -ForegroundColor Gray
    }
}

# 4. Limpiar caché de Turbo
Write-Host "`n4. Limpiando caché de Turbo..." -ForegroundColor Yellow
if (Test-Path ".turbo") {
    try {
        Remove-Item -Path ".turbo" -Recurse -Force
        Write-Host "   Carpeta .turbo eliminada" -ForegroundColor Green
    } catch {
        Write-Host "   Error al eliminar .turbo: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   Carpeta .turbo no existe" -ForegroundColor Gray
}

# 5. Limpiar node_modules si es necesario
Write-Host "`n5. ¿Desea limpiar node_modules y reinstalar dependencias?" -ForegroundColor Yellow
$respuesta = Read-Host "   (s/N): "
if ($respuesta -eq 's' -or $respuesta -eq 'S') {
    Write-Host "   Eliminando node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        try {
            Remove-Item -Path "node_modules" -Recurse -Force
            Write-Host "   node_modules eliminado" -ForegroundColor Green
        } catch {
            Write-Host "   Error al eliminar node_modules: $_" -ForegroundColor Red
        }
    }
    
    if (Test-Path "package-lock.json") {
        try {
            Remove-Item -Path "package-lock.json" -Force
            Write-Host "   package-lock.json eliminado" -ForegroundColor Green
        } catch {
            Write-Host "   Error al eliminar package-lock.json: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "   Reinstalando dependencias..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "   Omitiendo reinstalación de dependencias" -ForegroundColor Gray
}

# 6. Iniciar la aplicación
Write-Host "`n6. Iniciando la aplicación..." -ForegroundColor Yellow
Write-Host "   Esto abrirá una nueva ventana para la aplicación" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "`n=== REINICIO COMPLETADO ===" -ForegroundColor Cyan
Write-Host "La aplicación debería iniciarse en:" -ForegroundColor White
Write-Host "   - Web: http://localhost:3001" -ForegroundColor Green
Write-Host "   - API: http://localhost:4000" -ForegroundColor Green
Write-Host "`nPresiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")