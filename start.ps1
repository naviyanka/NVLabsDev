param (
    [switch]$SkipDependencyCheck,
    [switch]$Headless
)

$ErrorActionPreference = "Stop"

function Write-Banner {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor DarkCyan
    Write-Host "                NEXUS PLATFORM LAUNCHER                   " -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor DarkCyan
    Write-Host ""
}

function Check-Dependencies {
    if (-not $SkipDependencyCheck) {
        Write-Host "[1/5] Checking environment dependencies..." -ForegroundColor Cyan
        
        if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
            Write-Host "  [X] Node.js is missing. Installing via winget..." -ForegroundColor Yellow
            winget install OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
            Write-Host "  ! Please restart terminal after installation and re-run start.ps1" -ForegroundColor Red
            exit 1
        } else {
            $nodeVer = node --version
            Write-Host "  [OK] Node.js $nodeVer detected" -ForegroundColor Green
        }

        $hasDotNet8 = $false
        if (Get-Command "dotnet" -ErrorAction SilentlyContinue) {
            $sdks = dotnet --list-sdks
            if ($sdks -match "^8\.") {
                $hasDotNet8 = $true
            }
        }

        if (-not $hasDotNet8) {
            Write-Host "  [X] .NET 8 SDK is missing. Installing via winget..." -ForegroundColor Yellow
            winget install Microsoft.DotNet.SDK.8 -e --accept-package-agreements --accept-source-agreements
            Write-Host "  ! Please restart terminal after installation and re-run start.ps1" -ForegroundColor Red
            exit 1
        } else {
            Write-Host "  [OK] .NET 8 SDK detected" -ForegroundColor Green
        }
    }
}

function Stop-ExistingProcesses {
    Write-Host "[2/5] Cleaning up existing NEXUS processes..." -ForegroundColor Cyan

    # Terminate existing Nexus executables
    $namedProcesses = Get-Process -Name "Nexus.Gateway", "Nexus.Launcher" -ErrorAction SilentlyContinue
    foreach ($proc in $namedProcesses) {
        Write-Host "  Terminating $($proc.ProcessName) (PID $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }

    # Terminate processes holding ports 5010 (Backend) and 3000 / 5173 (Frontend)
    $ports = @(5010, 3000, 5173)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $ownerId = $conn.OwningProcess
            if ($ownerId -gt 0 -and $ownerId -ne $PID) {
                $proc = Get-Process -Id $ownerId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Freeing port $port held by $($proc.ProcessName) (PID $ownerId)..." -ForegroundColor Yellow
                    Stop-Process -Id $ownerId -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    
    Start-Sleep -Seconds 1
}

function Start-Services {
    $rootDir = $PSScriptRoot

    Write-Host "[3/5] Verifying Frontend NPM packages..." -ForegroundColor Cyan
    if (-not (Test-Path "$rootDir\src\Nexus.Frontend\node_modules")) {
        Write-Host "  Installing Node dependencies..." -ForegroundColor Yellow
        Push-Location "$rootDir\src\Nexus.Frontend"
        npm install
        Pop-Location
    } else {
        Write-Host "  [OK] Frontend node_modules verified" -ForegroundColor Green
    }

    Write-Host "[4/5] Building & Launching Services..." -ForegroundColor Cyan

    # 1. Start Backend Gateway Service (runs on http://localhost:5010 without opening browser)
    Write-Host "  Starting Backend Gateway (http://localhost:5010)..." -ForegroundColor Yellow
    $backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$rootDir\src\Nexus.Gateway`"; `$env:DEV='1'; dotnet run" -WindowStyle Normal -PassThru

    # 2. Start Frontend Dev Server (runs on http://localhost:3000)
    Write-Host "  Starting Frontend UI Server (http://localhost:3000)..." -ForegroundColor Yellow
    $frontendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location `"$rootDir\src\Nexus.Frontend`"; npm run dev" -WindowStyle Normal -PassThru

    # Wait 4 seconds for services to initialize
    Write-Host "  Waiting 4s for backend & frontend boot..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 4

    # Launch browser ONLY for Frontend UI (http://localhost:3000)
    Write-Host "[5/5] Launching NEXUS Web Application..." -ForegroundColor Cyan
    if (-not $Headless) {
        Write-Host "  Opening Frontend UI in default browser -> http://localhost:3000" -ForegroundColor Green
        Start-Process "http://localhost:3000"
    } else {
        Write-Host "  Headless flag passed. Skipping browser launch." -ForegroundColor DarkGray
    }

    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "  NEXUS PLATFORM IS ONLINE!" -ForegroundColor Green
    Write-Host "  Frontend Application: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend API Gateway:  http://localhost:5010/api/health" -ForegroundColor DarkGray
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host ""
}

Write-Banner
Check-Dependencies
Stop-ExistingProcesses
Start-Services
