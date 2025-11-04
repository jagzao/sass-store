@echo off
echo "--- Paso 1/4: Eliminando la carpeta node_modules (puede tardar un poco)..."
if exist node_modules rmdir /s /q node_modules

echo "--- Paso 2/4: Eliminando package-lock.json..."
if exist package-lock.json del package-lock.json

echo "--- Paso 3/4: Limpiando la cache de npm..."
npm cache clean --force

echo "--- Paso 4/4: Reinstalando todas las dependencias (esto puede tardar varios minutos)..."
call npm install

echo.
echo "--- PROCESO COMPLETADO ---"
echo.
echo "La limpieza y reinstalacion han terminado."
echo "Por favor, intenta ejecutar 'run_nightly_tests.bat' de nuevo para confirmar que los tests ahora funcionan."
pause
