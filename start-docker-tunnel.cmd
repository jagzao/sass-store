@echo off
REM Script para iniciar la aplicación SASS Store en Docker con Cloudflare Tunnel
REM Ejecutar este script en CMD como Administrador

echo === INICIANDO SASS STORE EN DOCKER CON CLOUDFLARE TUNNEL ===

REM Verificar si Docker está instalado
echo.
echo 1. Verificando instalación de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    Error: Docker no está instalado o no está en el PATH
    echo    Por favor, instala Docker desde https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
) else (
    echo    Docker encontrado
    docker --version
)

REM Verificar si Docker Compose está instalado
echo.
echo 2. Verificando instalación de Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo    Error: Docker Compose no está instalado o no está en el PATH
    echo    Por favor, instala Docker Compose
    pause
    exit /b 1
) else (
    echo    Docker Compose encontrado
    docker-compose --version
)

REM Verificar si existe el archivo .env con el token del túnel
echo.
echo 3. Verificando configuración del túnel...
if not exist ".env" (
    echo    El archivo .env no existe. Creando uno...
    set /p tunnelToken=    Por favor, ingresa el token de Cloudflare Tunnel (deja vacío para configurar después): 
    
    if "!tunnelToken!"=="" (
        echo TUNNEL_TOKEN= > .env
        echo    Archivo .env creado sin token. Por favor, edita el archivo y agrega tu token de Cloudflare Tunnel
    ) else (
        echo TUNNEL_TOKEN=!tunnelToken! > .env
        echo    Archivo .env creado con el token proporcionado
    )
) else (
    echo    Archivo .env encontrado
    findstr /b "TUNNEL_TOKEN=" .env >nul
    if %errorlevel% neq 0 (
        echo    Advertencia: No se encontró TUNNEL_TOKEN en el archivo .env
        set /p tunnelToken=    Por favor, ingresa el token de Cloudflare Tunnel (deja vacío para configurar después): 
        
        if "!tunnelToken!"=="" (
            echo TUNNEL_TOKEN= >> .env
            echo    Token no agregado. Por favor, edita el archivo .env manualmente
        ) else (
            echo TUNNEL_TOKEN=!tunnelToken! >> .env
            echo    Token agregado al archivo .env
        )
    ) else (
        echo    Token de Cloudflare Tunnel configurado correctamente
    )
)

REM Construir e iniciar los contenedores
echo.
echo 4. Construyendo e iniciando contenedores...
docker-compose down >nul 2>&1
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo    Error al iniciar los contenedores
    pause
    exit /b 1
) else (
    echo    Contenedores iniciados correctamente
)

REM Mostrar estado de los contenedores
echo.
echo 5. Verificando estado de los contenedores...
docker-compose ps

REM Mostrar logs iniciales
echo.
echo 6. Mostrando logs iniciales...
echo    Logs de la aplicación SASS Store:
docker-compose logs sass-store | findstr /n "^" | findstr /r "^[^:]*:[^:]*:[^:]*:"

echo.
echo    Logs de Cloudflare Tunnel:
docker-compose logs cloudflared | findstr /n "^" | findstr /r "^[^:]*:[^:]*:[^:]*:"

echo.
echo === CONFIGURACIÓN COMPLETADA ===
echo La aplicación debería estar disponible en:
echo    - Aplicación Web: https://app.tudominio.com (reemplaza con tu dominio)
echo    - API: https://api.tudominio.com (reemplaza con tu dominio)
echo.
echo Para ver los logs en tiempo real, ejecuta:
echo    docker-compose logs -f
echo.
echo Para detener los contenedores, ejecuta:
echo    docker-compose down
echo.
pause