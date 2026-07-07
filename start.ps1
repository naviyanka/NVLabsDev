param (
    [switch]$SkipDependencyCheck
)

$ErrorActionPreference = "Stop"

function Check-And-Install {
    if (-not $SkipDependencyCheck) {
        Write-Host "Checking for Node.js..." -ForegroundColor Cyan
        if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
            Write-Host "Node.js is missing. Installing via winget..." -ForegroundColor Yellow
            winget install OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
            Write-Host "Please close and reopen the terminal after installation, then run this script again." -ForegroundColor Red
            exit
        } else {
            Write-Host "Node.js is installed." -ForegroundColor Green
        }

        Write-Host "Checking for .NET 8 SDK..." -ForegroundColor Cyan
        $hasDotNet8 = $false
        if (Get-Command "dotnet" -ErrorAction SilentlyContinue) {
            $sdks = dotnet --list-sdks
            if ($sdks -match "^8\.") {
                $hasDotNet8 = $true
            }
        }

        if (-not $hasDotNet8) {
            Write-Host ".NET 8 SDK is missing. Installing via winget..." -ForegroundColor Yellow
            winget install Microsoft.DotNet.SDK.8 -e --accept-package-agreements --accept-source-agreements
            Write-Host "Please close and reopen the terminal after installation, then run this script again." -ForegroundColor Red
            exit
        } else {
            Write-Host ".NET 8 SDK is installed." -ForegroundColor Green
        }
    }
}

function Start-App {
    $rootDir = $PSScriptRoot

    Write-Host "Checking Frontend NPM packages..." -ForegroundColor Cyan
    if (-not (Test-Path "$rootDir\src\Nexus.Frontend\node_modules")) {
        Write-Host "Installing Frontend dependencies..." -ForegroundColor Yellow
        Push-Location "$rootDir\src\Nexus.Frontend"
        npm install
        Pop-Location
    }

    Write-Host "Starting Backend..." -ForegroundColor Cyan
    Start-Process dotnet -ArgumentList "run" -WorkingDirectory "$rootDir\src\Nexus.Gateway" -WindowStyle Normal

    Write-Host "Starting Frontend..." -ForegroundColor Cyan
    Start-Process npm.cmd -ArgumentList "run", "dev" -WorkingDirectory "$rootDir\src\Nexus.Frontend" -WindowStyle Normal

    Write-Host "Servers are booting up in separate windows!" -ForegroundColor Green
    Write-Host "Waiting 5 seconds before opening the browser..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    Start-Process "http://localhost:5173"
}

Check-And-Install
Start-App
