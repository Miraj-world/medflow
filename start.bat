@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

where docker >nul 2>nul || (echo Docker is required for local PostgreSQL. & pause & exit /b 1)
where npm >nul 2>nul || (echo npm is required. Install Node.js first. & pause & exit /b 1)

if not exist "%ROOT%\.env" (
  for /f %%I in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "LOCAL_SECRET=%%I"
  (
    echo POSTGRES_USER=medflow_local
    echo POSTGRES_PASSWORD=%LOCAL_SECRET%
    echo POSTGRES_DB=medflow
    echo POSTGRES_PORT=5432
    echo JWT_SECRET=%LOCAL_SECRET%%LOCAL_SECRET%
  ) > "%ROOT%\.env"
)

for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT%\.env") do (
  if not "%%A"=="" set "%%A=%%B"
)

if "%POSTGRES_PASSWORD%"=="" (
  for /f %%I in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "POSTGRES_PASSWORD=%%I"
)

if "%JWT_SECRET%"=="" (
  for /f %%I in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"') do set "JWT_SECRET=%%I"
)

(
  echo POSTGRES_USER=%POSTGRES_USER%
  echo POSTGRES_PASSWORD=%POSTGRES_PASSWORD%
  echo POSTGRES_DB=%POSTGRES_DB%
  echo POSTGRES_PORT=%POSTGRES_PORT%
  echo JWT_SECRET=%JWT_SECRET%
) > "%ROOT%\.env"

set "KEEP_REMOTE_BACKEND_ENV="
if exist "%ROOT%\backend\.env" (
  findstr /C:"render.com" "%ROOT%\backend\.env" >nul 2>nul
  if not errorlevel 1 set "KEEP_REMOTE_BACKEND_ENV=1"
)

if not defined KEEP_REMOTE_BACKEND_ENV (
  (
    echo PORT=10000
    echo DATABASE_URL=postgresql://%POSTGRES_USER%:%POSTGRES_PASSWORD%@localhost:%POSTGRES_PORT%/%POSTGRES_DB%
    echo DATABASE_USE_SSL=false
    echo JWT_SECRET=%JWT_SECRET%
    echo FRONTEND_URL=http://localhost:5173
    echo CORS_ORIGINS=http://localhost:5173
  ) > "%ROOT%\backend\.env"
) else (
  echo Preserving existing Render backend database configuration.
)

(
  echo VITE_API_URL=http://localhost:10000/api
) > "%ROOT%\frontend\.env"

call docker compose up -d postgres

pushd "%ROOT%\backend"
if not exist "node_modules" call npm install
call npm run migrate
call npm run seed
start "MedFlow API" cmd /k "cd /d ""%ROOT%\backend"" && npm start"
popd

pushd "%ROOT%\frontend"
if not exist "node_modules" call npm install
start "MedFlow Frontend" cmd /k "cd /d ""%ROOT%\frontend"" && npm run dev"
popd

start http://localhost:5173/login
echo MedFlow local environment is starting.
pause
