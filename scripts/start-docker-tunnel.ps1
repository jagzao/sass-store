# Script para iniciar la aplicación SASS Store en Docker con Cloudflare Tunnel
# Ejecutar este script en PowerShell como Administrador

Write-Host "=== INICIANDO SASS STORE EN DOCKER CON CLOUDFLARE TUNNEL ===" -ForegroundColor Cyan

# Verificar si Docker está instalado
Write-Host "`n1. Verificando instalación de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "   Error: Docker no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Por favor, instala Docker desde https://www.docker.com/products/docker-desktop" -ForegroundColor White
    exit 1
}

# Verificar si Docker Compose está instalado
Write-Host "`n2. Verificando instalación de Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "   Docker Compose encontrado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "   Error: Docker Compose no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "   Por favor, instala Docker Compose" -ForegroundColor White
    exit 1
}

# Verificar si existe el archivo .env con el token del túnel
Write-Host "`n3. Verificando configuración del túnel..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "   El archivo .env no existe. Creando uno..." -ForegroundColor Yellow
    $tunnelToken = Read-Host "   Por favor, ingresa el token de Cloudflare Tunnel (deja vacío para configurar después):"
    
    if ($tunnelToken) {
        "TUNNEL_TOKEN=$tunnelToken" | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "   Archivo .env creado con el token proporcionado" -ForegroundColor Green
    } else {
        "TUNNEL_TOKEN=" | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "   Archivo .env creado sin token. Por favor, edita el archivo y agrega tu token de Cloudflare Tunnel" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Archivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content ".env"
    $hasToken = $false
    foreach ($line in $envContent) {
        if ($line -match "TUNNEL_TOKEN=.+" -and $line -ne "TUNNEL_TOKEN=") {
            $hasToken = $true
            break
        }
    }
    
    if (-not $hasToken) {
        Write-Host "   Advertencia: No se encontró un token de Cloudflare Tunnel válido en el archivo .env" -ForegroundColor Yellow
        $tunnelToken = Read-Host "   Por favor, ingresa el token de Cloudflare Tunnel (deja vacío para configurar después):"
        
        if ($tunnelToken) {
            (Get-Content ".env") | ForEach-Object { $_ -replace "TUNNEL_TOKEN=.*", "TUNNEL_TOKEN=$tunnelToken" } | Set-Content ".env"
            Write-Host "   Token actualizado en el archivo .env" -ForegroundColor Green
        }
    } else {
        Write-Host "   Token de Cloudflare Tunnel configurado correctamente" -ForegroundColor Green
    }
}

# Construir e iniciar los contenedores
Write-Host "`n4. Construyendo e iniciando contenedores..." -ForegroundColor Yellow
try {
    docker-compose down 2>$null
    docker-compose up --build -d
    Write-Host "   Contenedores iniciados correctamente" -ForegroundColor Green
} catch {
    Write-Host "   Error al iniciar los contenedores: $_" -ForegroundColor Red
    exit 1
}

# Mostrar estado de los contenedores
Write-Host "`n5. Verificando estado de los contenedores..." -ForegroundColor Yellow
try {
    $containers = docker-compose ps
    Write-Host "   Estado de los contenedores:" -ForegroundColor White
    Write-Host $containers
} catch {
    Write-Host "   Error al verificar el estado de los contenedores: $_" -ForegroundColor Red
}

# Mostrar logs iniciales
Write-Host "`n6. Mostrando logs iniciales..." -ForegroundColor Yellow
Write-Host "   Logs de la aplicación SASS Store:" -ForegroundColor White
docker-compose logs sass-store | Select-Object -Last 20

Write-Host "`n   Logs de Cloudflare Tunnel:" -ForegroundColor White
docker-compose logs cloudflared | Select-Object -Last 10

Write-Host "`n=== CONFIGURACIÓN COMPLETADA ===" -ForegroundColor Cyan
Write-Host "La aplicación debería estar disponible en:" -ForegroundColor White
Write-Host "   - Aplicación Web: https://app.tudominio.com (reemplaza con tu dominio)" -ForegroundColor Green
Write-Host "   - API: https://api.tudominio.com (reemplaza con tu dominio)" -ForegroundColor Green
Write-Host "`nPara ver los logs en tiempo real, ejecuta:" -ForegroundColor White
Write-Host "   docker-compose logs -f" -ForegroundColor Gray
Write-Host "`nPara detener los contenedores, ejecuta:" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Gray
Write-Host "`nPresiona cualquier tecla para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")