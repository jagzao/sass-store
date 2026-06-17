@echo off
REM Swarm CLI Helper for Windows

if "%1"=="status" goto status
if "%1"=="s" goto status
if "%1"=="start" goto start
if "%1"=="new" goto start
if "%1"=="n" goto start
if "%1"=="continue" goto continue
if "%1"=="c" goto continue
if "%1"=="resume" goto resume
if "%1"=="r" goto resume
goto help

:status
npm run swarm:status
goto end

:start
shift
npm run swarm:start %*
goto end

:continue
shift
npm run swarm:continue %*
goto end

:resume
shift
npm run swarm:resume %*
goto end

:help
echo 🐝 Swarm CLI Helper
echo.
echo Uso: swarm ^<comando^> [argumentos]
echo.
echo Comandos:
echo   status, s           Ver estado actual
echo   start, new, n       Iniciar nueva feature
echo   continue, c         Continuar sesion
echo   resume, r           Reanudar sesion pausada
echo   help, h             Mostrar esta ayuda
echo.
echo Ejemplos:
echo   swarm status
echo   swarm start "Mi Feature"
echo   swarm continue session_123 task_0
echo.
goto end

:end
