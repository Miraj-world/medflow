@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ==========================================
rem MedFlow startup script
rem - Uses existing backend\.env if present
rem - Falls back to local Docker PostgreSQL if needed
rem - Installs dependencies
rem - Runs migrate + seed
rem - Starts backend + frontend
rem ==========================================

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

set "ROOT_ENV=%ROOT%\.env"
set "BACKEND_ENV=%ROOT%\backend\.env"
set "FRONTEND_ENV=%ROOT%\frontend\.env"

echo.
echo ==========================================
echo Starting MedFlow...
echo ==========================================
echo Root: %ROOT%
echo.

rem --------------------------------------------------
rem Check required tools
rem --------------------------------------------------
where npm >nul 2>nul
if errorlevel 1 (
  echo npm is required. Please install Node.js first.
  pause
  exit /b 1
)

where powershell >nul 2>nul
if errorlevel 1 (
  echo PowerShell is required for secret generation.
  pause
  exit /b 1
)

rem --------------------------------------------------
rem Decide whether to use remote DB or local DB
rem --------------------------------------------------
set "USE_REMOTE_DB="
if exist "%BACKEND_ENV%" (
  findstr /I /C:"render.com" "%BACKEND_ENV%" >nul 2>nul
  if not errorlevel 1 set "USE_REMOTE_DB=1"
)

if defined USE_REMOTE_DB (
  echo Found Render database config in backend\.env
  echo Using remote database.
) else (
  echo No Render database config found.
  echo Using local PostgreSQL with Docker.
)

rem --------------------------------------------------
rem Local DB setup only if remote DB is not configured
rem --------------------------------------------------
if not defined USE_REMOTE_DB (
  where docker >nul 2>nul
  if errorlevel 1 (
    echo Docker is required for local PostgreSQL, but it was not found.
    echo Either install Docker Desktop or place a valid Render config in backend\.env
    pause
    exit /b 1
  )

  rem Create root .env if missing
  if not exist "%ROOT_ENV%" (
    echo Creating root .env...
    for /f %%I in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "LOCAL_SECRET=%%I"
    (
      echo POSTGRES_USER=medflow_local
      echo POSTGRES_PASSWORD=!LOCAL_SECRET!
      echo POSTGRES_DB=medflow
      echo POSTGRES_PORT=5432
      echo JWT_SECRET=!LOCAL_SECRET!!LOCAL_SECRET!
    ) > "%ROOT_ENV%"
  )

  rem Load root .env
  for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT_ENV%") do (
    if not "%%A"=="" set "%%A=%%B"
  )

  rem Fill missing defaults
  if not defined POSTGRES_USER set "POSTGRES_USER=medflow_local"
  if not defined POSTGRES_PASSWORD (
    for /f %%I in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "POSTGRES_PASSWORD=%%I"
  )
  if not defined POSTGRES_DB set "POSTGRES_DB=medflow"
  if not defined POSTGRES_PORT set "POSTGRES_PORT=5432"
  if not defined JWT_SECRET (
    for /f %%I in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')"') do set "JWT_SECRET=%%I"
  )

  rem Rewrite root .env cleanly
  (
    echo POSTGRES_USER=!POSTGRES_USER!
    echo POSTGRES_PASSWORD=!POSTGRES_PASSWORD!
    echo POSTGRES_DB=!POSTGRES_DB!
    echo POSTGRES_PORT=!POSTGRES_PORT!
    echo JWT_SECRET=!JWT_SECRET!
  ) > "%ROOT_ENV%"

  rem Write backend local config
  echo Writing backend\.env for local PostgreSQL...
  (
    echo PORT=10000
    echo DATABASE_URL=postgresql://!POSTGRES_USER!:!POSTGRES_PASSWORD!@localhost:!POSTGRES_PORT!/!POSTGRES_DB!
    echo DATABASE_USE_SSL=false
    echo JWT_SECRET=!JWT_SECRET!
    echo FRONTEND_URL=http://localhost:5173
    echo CORS_ORIGINS=http://localhost:5173
    echo OPENAI_API_KEY=
  ) > "%BACKEND_ENV%"

  echo Starting local PostgreSQL with Docker...
  call docker compose up -d postgres
  if errorlevel 1 (
    echo Failed to start PostgreSQL with Docker.
    pause
    exit /b 1
  )
)

rem --------------------------------------------------
rem Always write frontend .env
rem --------------------------------------------------
echo Writing frontend\.env...
(
  echo VITE_API_URL=http://localhost:10000/api
) > "%FRONTEND_ENV%"

rem --------------------------------------------------
rem Backend setup
rem --------------------------------------------------
pushd "%ROOT%\backend"

if not exist "node_modules" (
  echo Installing backend dependencies...
  call npm install
  if errorlevel 1 (
    echo Backend npm install failed.
    popd
    pause
    exit /b 1
  )
)

echo Running backend migrations...
call npm run migrate
if errorlevel 1 (
  echo Backend migration failed.
  popd
  pause
  exit /b 1
)

echo Running backend seed...
call npm run seed
if errorlevel 1 (
  echo Backend seed failed.
  popd
  pause
  exit /b 1
)

echo Starting backend server...
start "MedFlow API" cmd /k "cd /d ""%ROOT%\backend"" && npm start"

popd

rem --------------------------------------------------
rem Frontend setup
rem --------------------------------------------------
pushd "%ROOT%\frontend"

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo Frontend npm install failed.
    popd
    pause
    exit /b 1
  )
)

echo Starting frontend server...
start "MedFlow Frontend" cmd /k "cd /d ""%ROOT%\frontend"" && npm run dev"

popd

rem --------------------------------------------------
rem Open browser
rem --------------------------------------------------
echo Opening MedFlow...
start "" http://localhost:5173/login

echo.
echo ==========================================
echo MedFlow is starting.
echo Backend:  http://localhost:10000
echo Frontend: http://localhost:5173
echo ==========================================
echo.
pause