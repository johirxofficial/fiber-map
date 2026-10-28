@echo off
setlocal
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
  set "PY=.venv\Scripts\python.exe"
) else (
  set "PY=python"
)

"%PY%" run.py %*
if errorlevel 1 (
  echo.
  echo The server stopped with an error. Press any key to close.
  pause >nul
)
endlocal
