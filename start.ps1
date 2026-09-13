# NetraSaarthi AI Clinical Suite Launcher
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      NETRASAARTHI AI CLINICAL SUITE LAUNCHER" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$WorkspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Yellow
$BackendProcess = Start-Process -FilePath "$WorkspaceRoot\backend\.venv\Scripts\python.exe" -ArgumentList "-m uvicorn backend.main:app --port 8000 --host 127.0.0.1 --reload" -WorkingDirectory $WorkspaceRoot -PassThru

Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Set-Location "$WorkspaceRoot\frontend"
try {
    npm run dev
} finally {
    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        Write-Host "`nStopping FastAPI Backend..." -ForegroundColor DarkGray
        Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
