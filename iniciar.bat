@echo off
rem Inicia la API de datos y la interfaz web. Cierra las dos ventanas para detener.
cd /d "%~dp0"
set PY=
py -3 --version >nul 2>&1 && set PY=py -3
if not defined PY python --version >nul 2>&1 && set PY=python
if not defined PY (echo Falta Python 3. Instalalo desde python.org & pause & exit /b 1)
where npm >nul 2>&1 || (echo Falta Node.js. Instalalo desde nodejs.org & pause & exit /b 1)

start "API SAPDT" cmd /k "cd /d %~dp0backend && %PY% -m sapdt.api bd\sapdt.db 8000"

cd frontend
if not exist node_modules (
  echo Instalando dependencias de la interfaz ^(la primera vez tarda unos minutos^)...
  call npm install --legacy-peer-deps --no-audit --no-fund || (echo Fallo npm install & pause & exit /b 1)
)
set VITE_DATA_SOURCE=http
set VITE_API_BASE_URL=http://127.0.0.1:8000/api
start "" /b cmd /c "timeout /t 10 >nul & start http://127.0.0.1:5199"
call npm run dev -- --host 127.0.0.1 --port 5199
pause
