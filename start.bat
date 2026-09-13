@echo off
TITLE NetraSaarthi AI Suite Launcher
echo ==========================================================
echo       NETRASAARTHI AI CLINICAL SUITE LAUNCHER
echo ==========================================================
echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "NetraSaarthi FastAPI Backend" cmd /k "cd /d "%~dp0" && backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --host 127.0.0.1 --reload"

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
cd /d "%~dp0frontend"
npm run dev
pause
