@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "LOG=%ROOT%\start_log.txt"

echo ========================================== > "%LOG%"
echo Healthcare Platform - start.bat log        >> "%LOG%"
echo Timestamp: %DATE% %TIME%                   >> "%LOG%"
echo Root: "%ROOT%"                             >> "%LOG%"
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
call :log "Starting launcher..."
cd /d "%ROOT%" || call :die "Could not cd to project root."

if not exist "%ROOT%\backend"  call :die "Missing backend folder."
if not exist "%ROOT%\frontend" call :die "Missing frontend folder."

REM Python check (py preferred)
set "PYEXE="
where py >nul 2>nul
if %errorlevel%==0 (
  set "PYEXE=py -3"
) else (
  where python >nul 2>nul
  if %errorlevel%==0 set "PYEXE=python"
)
if "%PYEXE%"=="" call :die "Python not found (py/python)."

where npm >nul 2>nul
if %errorlevel% neq 0 call :die "npm not found. Install Node.js LTS."

call :log "Using Python: %PYEXE%"
call :log "Node/npm found."
call :log "[BACKEND] Enter backend folder..."

pushd "%ROOT%\backend" || call :die "Could not open backend folder."
call :log "[BACKEND] In: %CD%"

REM Create venv if missing
if not exist ".venv" (
  call :log "[BACKEND] Creating venv..."
  %PYEXE% -m venv .venv >> "%LOG%" 2>&1
  if !errorlevel! neq 0 (
    popd
    call :die "Failed to create venv. See start_log.txt"
  )
)

if not exist ".venv\Scripts\python.exe" (
  popd
  call :die "Venv python missing. Delete backend\.venv and rerun."
)

call :log "[BACKEND] Installing deps (pip)..."
call ".venv\Scripts\python.exe" -m pip install -r requirements.txt >> "%LOG%" 2>&1
if !errorlevel! neq 0 (
  popd
  call :die "pip install failed. See start_log.txt"
)

call :log "[BACKEND] Launching uvicorn window..."
REM Correct START syntax: start "" cmd /k "..."
start "Backend (FastAPI)" cmd /k "cd /d ""%ROOT%\backend"" && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 || (echo BACKEND FAILED & pause)"

popd

timeout /t 2 >nul

call :log "[FRONTEND] Enter frontend folder..."
pushd "%ROOT%\frontend" || call :die "Could not open frontend folder."
call :log "[FRONTEND] In: %CD%"

if not exist "package.json" (
  popd
  call :die "package.json missing in frontend."
)

if not exist "node_modules" (
  call :log "[FRONTEND] npm install..."
  call npm install >> "%LOG%" 2>&1
  if !errorlevel! neq 0 (
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