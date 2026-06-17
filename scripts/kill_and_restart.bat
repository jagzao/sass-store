@echo off
echo ============================================
echo 🔪 Matando todos los procesos Node.js...
echo ============================================

tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /NH') do (
        echo Matando proceso %%a
        taskkill /F /PID %%a 2>NUL
    )
) else (
    echo No hay procesos Node.js corriendo
)

echo.
echo ============================================
echo 🧹 Limpiando archivos compilados...
echo ============================================

for /d /r . %%d in (.next) do @if exist "%%d" (
    echo Eliminando %%d
    rd /s /q "%%d" 2>nul
)

echo.
echo ============================================
echo ⏳ Esperando 3 segundos...
echo ============================================
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo 🚀 Iniciando servidores...
echo ============================================
start cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Proceso completado!
echo Los servidores se están iniciando en una nueva ventana...
echo.
pause
