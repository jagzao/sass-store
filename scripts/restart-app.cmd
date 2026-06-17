@echo off
REM Script para reiniciar completamente la aplicación SASS Store
REM Ejecutar este script en CMD como Administrador

echo === REINICIANDO APLICACIÓN SASS STORE ===

REM 1. Detener todos los procesos de Node.js
echo.
echo 1. Deteniendo procesos de Node.js...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    Procesos de Node.js detenidos
) else (
    echo    No se encontraron procesos de Node.js en ejecucion
)

REM 2. Esperar a que los procesos se detengan completamente
echo.
echo 2. Esperando a que los procesos se detengan...
timeout /t 3 /nobreak >nul

REM 3. Limpiar caché de Next.js
echo.
echo 3. Limpiando caché de Next.js...
if exist "apps\web\.next" (
    rmdir /s /q "apps\web\.next"
    echo    Carpeta apps\web\.next eliminada
) else (
    echo    Carpeta apps\web\.next no existe
)

if exist "apps\api\.next" (
    rmdir /s /q "apps\api\.next"
    echo    Carpeta apps\api\.next eliminada
) else (
    echo    Carpeta apps\api\.next no existe
)

REM 4. Limpiar caché de Turbo
echo.
echo 4. Limpiando caché de Turbo...
if exist ".turbo" (
    rmdir /s /q ".turbo"
    echo    Carpeta .turbo eliminada
) else (
    echo    Carpeta .turbo no existe
)

REM 5. Preguntar si se desea limpiar node_modules
echo.
echo 5. ¿Desea limpiar node_modules y reinstalar dependencias?
set /p respuesta=   (s/N): 
if /i "%respuesta%"=="s" (
    echo    Eliminando node_modules...
    if exist "node_modules" (
        rmdir /s /q "node_modules"
        echo    node_modules eliminado
    )
    
    if exist "package-lock.json" (
        del /f /q "package-lock.json"
        echo    package-lock.json eliminado
    )
    
    echo    Reinstalando dependencias...
    call npm install
) else (
    echo    Omitiendo reinstalacion de dependencias
)

REM 6. Iniciar la aplicación
echo.
echo 6. Iniciando la aplicacion...
echo    Esto iniciara la aplicacion en esta ventana
call npm run dev

echo.
echo === REINICIO COMPLETADO ===
echo La aplicacion deberia iniciarse en:
echo    - Web: http://localhost:3001
echo    - API: http://localhost:4000
echo.
pause