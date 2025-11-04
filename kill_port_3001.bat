@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /PID %%a /F
timeout /t 2 /nobreak > nul
echo Process killed, port should be free now
