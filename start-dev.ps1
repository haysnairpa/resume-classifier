# Start-dev.ps1
# PowerShell script to start both backend and frontend servers

Write-Host "Starting Resume Classification System development environment..." -ForegroundColor Cyan

# Create necessary directories if they don't exist
if (!(Test-Path -Path "$PSScriptRoot\backend\uploads")) {
    New-Item -ItemType Directory -Path "$PSScriptRoot\backend\uploads" | Out-Null
    Write-Host "Created uploads directory for backend" -ForegroundColor Green
}

# Start the backend server in a new window
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; python app.py" -WindowStyle Normal

# Wait for the backend to initialize
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start the frontend development server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot
npm run dev

Write-Host "Development servers stopped" -ForegroundColor Red
