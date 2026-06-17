@echo off
echo ============================================
echo 🔧 Solucionando ERR_CONNECTION_REFUSED...
echo ============================================
echo.

echo 1️⃣ Paso 1: Deteniendo procesos Node.js...
taskkill /F /IM node.exe 2>nul || echo No hay procesos Node.js corriendo
echo ✅ Procesos detenidos
echo.

echo 2️⃣ Paso 2: Eliminando node_modules...
for /d /r . %%d in (node_modules) do @if exist "%%d" rd /s /q "%%d" 2>nul
echo ✅ node_modules eliminados
echo.

echo 3️⃣ Paso 3: Limpiando cache de npm...
call npm cache clean --force
echo ✅ Cache de npm limpiado
echo.

echo 4️⃣ Paso 4: Eliminando cache de Next.js y Turbo...
for /d /r . %%d in (.next) do @if exist "%%d" rd /s /q "%%d" 2>nul
for /d /r . %%d in (.turbo) do @if exist "%%d" rd /s /q "%%d" 2>nul
if exist .turbo rd /s /q .turbo 2>nul
if exist package-lock.json del /q package-lock.json 2>nul
echo ✅ Cache de Next.js y Turbo eliminado
echo.

echo 5️⃣ Paso 5: Reinstalando dependencias (esto puede tomar 2-5 minutos)...
call npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al instalar dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias reinstaladas
echo.

echo 6️⃣ Paso 6: Verificando turbo.json...
findstr /C:"\"tasks\":" turbo.json >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  ADVERTENCIA: turbo.json usa "tasks" en lugar de "pipeline"
    echo    Para Turbo v1.x debe usar "pipeline"
    echo    Por favor corregir manualmente antes de continuar
    pause
)
echo ✅ turbo.json verificado
echo.

echo ============================================
echo ✅ Limpieza completada exitosamente
echo ============================================
echo.
echo Ahora puedes ejecutar: npm run dev
echo.
pause
