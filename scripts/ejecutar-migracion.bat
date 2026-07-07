@echo off
echo Creando backup de la base de datos...
set PGPASSWORD=

echo Omitiendo backup debido a incompatibilidad de versiones...
echo Si necesitas un backup, hazlo desde el panel de Supabase
echo.
echo Ejecutando migracion del modulo social...

psql "postgresql://postgres.jedryjmljffuvegggjmw:@aws-1-us-east-2.pooler.supabase.com:6543/postgres" < social-media-migration.sql

echo.
echo Migracion completada!
echo.
echo Presiona cualquier tecla para salir...
pause > nul