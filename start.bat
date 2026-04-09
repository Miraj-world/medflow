@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "LOGDIR=%ROOT%\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "TS=%%I"
if "%TS%"=="" set "TS=%DATE:~-4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "LOG=%LOGDIR%\start_%TS%.log"
set "BACKEND_OUT_LOG=%ROOT%\backend\logs\server_%TS%.out.log"
set "BACKEND_ERR_LOG=%ROOT%\backend\logs\server_%TS%.err.log"
set "BACKEND_PORT=8001"

echo ========================================== > "%LOG%"
echo Healthcare Platform - start.bat log        >> "%LOG%"
echo Timestamp: %DATE% %TIME%                   >> "%LOG%"
echo Root: "%ROOT%"                             >> "%LOG%"
echo Log Dir: "%LOGDIR%"                        >> "%LOG%"
echo Backend Out Log: "%BACKEND_OUT_LOG%"       >> "%LOG%"
echo Backend Err Log: "%BACKEND_ERR_LOG%"       >> "%LOG%"
echo ========================================== >> "%LOG%"
echo.                                           >> "%LOG%"

goto :main

:die
set "MSG=%~1"
echo.>> "%LOG%"
echo ERROR: %MSG%>> "%LOG%"
powershell -NoProfile -Command ^
  "Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.MessageBox]::Show('%MSG%','Healthcare Platform - Start Error','OK','Error') | Out-Null"
echo ERROR: %MSG%
echo Log: "%LOG%"
pause
exit /b 1

:log
echo %~1
echo %~1>> "%LOG%"
exit /b 0

:main
call :log "Starting launcher (local dev only)..."
cd /d "%ROOT%" || call :die "Could not cd to project root."

if not exist "%ROOT%\frontend" call :die "Missing frontend folder."
if not exist "%ROOT%\backend" call :die "Missing backend folder."

REM Python check (py preferred)
set "PYEXE="
where py >nul 2>nul
if not errorlevel 1 (
  set "PYEXE=py -3"
) else (
  where python >nul 2>nul
  if not errorlevel 1 set "PYEXE=python"
)
if "%PYEXE%"=="" call :die "Python not found (py/python)."

where npm >nul 2>nul
if errorlevel 1 call :die "npm not found. Install Node.js LTS."

call :log "Using Python: %PYEXE%"
call :log "Node/npm found."

call :log "[BACKEND] Enter backend folder..."
pushd "%ROOT%\backend" || call :die "Could not open backend folder."
call :log "[BACKEND] In: %CD%"
if not exist "%ROOT%\backend\logs" mkdir "%ROOT%\backend\logs"

REM Create venv if missing
if not exist ".venv" (
  call :log "[BACKEND] Creating venv..."
  %PYEXE% -m venv .venv >> "%LOG%" 2>&1
  if errorlevel 1 (
    popd
    call :die "Failed to create venv. See start_log.txt"
  )
)

if not exist ".venv\Scripts\python.exe" (
  popd
  call :die "Venv python missing. Delete backend\.venv and rerun."
)

REM Create backend .env if missing (local dev defaults)
if not exist ".env" (
  call :log "[BACKEND] Creating .env for local dev..."
  (
    echo DATABASE_URL=sqlite:///./medflow.db
    echo SECRET_KEY=change-me
    echo ENCRYPTION_KEY=
    echo CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
  ) > ".env"
)

call :log "[BACKEND] Installing deps (pip)..."
call ".venv\Scripts\python.exe" -m pip install -r requirements.txt >> "%LOG%" 2>&1
if errorlevel 1 (
  popd
  call :die "pip install failed. See start_log.txt"
)

call :log "[BACKEND] Launching uvicorn window on port %BACKEND_PORT%..."
start "Backend (FastAPI)" cmd /k "cd /d ""%ROOT%\backend"" && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port %BACKEND_PORT% >> ""%BACKEND_OUT_LOG%"" 2>> ""%BACKEND_ERR_LOG%"" || (echo BACKEND FAILED & pause)"

popd

timeout /t 2 >nul

call :log "[FRONTEND] Enter frontend folder..."
pushd "%ROOT%\frontend" || call :die "Could not open frontend folder."
call :log "[FRONTEND] In: %CD%"

if not exist "%ROOT%\frontend\package.json" (
  call :log "[FRONTEND] package.json not found at %ROOT%\frontend\package.json"
  dir "%ROOT%\frontend" >> "%LOG%" 2>&1
  popd
  call :die "package.json missing in frontend."
)

REM Create frontend .env if missing (local dev default)
if not exist ".env" (
  call :log "[FRONTEND] Creating .env for local dev..."
  echo VITE_API_URL=http://localhost:%BACKEND_PORT%> ".env"
)

if not exist "node_modules" (
  call :log "[FRONTEND] npm install..."
  call npm --prefix "%ROOT%\frontend" install >> "%LOG%" 2>&1
  if errorlevel 1 (
    popd
    call :die "npm install failed. See start_log.txt"
  )
) else if not exist "node_modules\react-select\package.json" (
  call :log "[FRONTEND] react-select missing - running npm install..."
  call npm --prefix "%ROOT%\frontend" install >> "%LOG%" 2>&1
  if errorlevel 1 (
    popd
    call :die "npm install failed. See start_log.txt"
  )
) else (
  call :log "[FRONTEND] node_modules exists (skipping install)."
)

call :log "[FRONTEND] Launching Vite window..."
start "Frontend (Vite)" cmd /k "cd /d ""%ROOT%\frontend"" && npm run dev || (echo FRONTEND FAILED & pause)"

popd

timeout /t 2 >nul
start http://localhost:5173/login

call :log "DONE - windows launched."
echo.
echo Log: "%LOG%"
pause
