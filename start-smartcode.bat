@echo off
setlocal
cd /d "%~dp0backend"
if not exist ".venv\Scripts\python.exe" (
    py -3 -m venv .venv
    if errorlevel 1 goto fail
)
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto fail
echo.
echo SmartCode: http://127.0.0.1:8000
echo Press Ctrl+C to stop.
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
exit /b
:fail
echo Setup failed. Please install Python and check your internet connection.
pause
exit /b 1
