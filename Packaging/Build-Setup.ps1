$ErrorActionPreference = "Stop"
$WorkingDir = "C:\Users\OrgAdmin\Documents\NVLabs"
$PackagingDir = "$WorkingDir\Packaging"
$StagingDir = "$PackagingDir\Staging"

Write-Host "Cleaning Staging Directory..."
if (Test-Path $StagingDir) { Remove-Item -Recurse -Force $StagingDir }
New-Item -ItemType Directory -Force -Path "$StagingDir\Backend" | Out-Null
New-Item -ItemType Directory -Force -Path "$StagingDir\Frontend" | Out-Null

Write-Host "1. Building Backend (Self-Contained .NET 8)..."
Set-Location "$WorkingDir\src\Nexus.Gateway"
dotnet publish -c Release -r win-x64 --self-contained true -o "$StagingDir\Backend"

Write-Host "1b. Building Nexus Launcher (Self-Contained .NET 8)..."
Set-Location "$WorkingDir\src\Nexus.Launcher"
dotnet publish -c Release -r win-x64 --self-contained true -o "$StagingDir\Backend"

Write-Host "2. Building Frontend (Node.js SSR)..."
Set-Location "$WorkingDir\src\Nexus.Frontend"
npm install
npm run build
Copy-Item -Recurse -Force "$WorkingDir\src\Nexus.Frontend\dist" "$StagingDir\Frontend\"
Copy-Item -Force "$WorkingDir\src\Nexus.Frontend\package.json" "$StagingDir\Frontend\"

Write-Host "3. Downloading Frontend Dependencies (node.exe and WinSW)..."
# Download standalone Node.js binary (v20.12.2 LTS as example)
Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.12.2/win-x64/node.exe" -OutFile "$StagingDir\Frontend\node.exe"
# Download WinSW for Windows Service Wrapper
Invoke-WebRequest -Uri "https://github.com/winsw/winsw/releases/download/v2.12.0/WinSW-x64.exe" -OutFile "$StagingDir\Frontend\WinSW.exe"
# Copy WinSW config
Copy-Item -Force "$PackagingDir\WinSW.xml" "$StagingDir\Frontend\WinSW.xml"
# Copy configuration script
Copy-Item -Force "$PackagingDir\Configure-Setup.ps1" "$StagingDir\Backend\Configure-Setup.ps1"

Write-Host "4. Setting up Inno Setup Compiler..."
$InnoSetupPath = "$env:LOCALAPPDATA\Programs\Inno Setup 6\ISCC.exe"
if (-Not (Test-Path $InnoSetupPath)) {
    Write-Host "Inno Setup not found at expected path. Please install JRSoftware.InnoSetup via winget."
    exit 1
}

Write-Host "5. Compiling Windows Installer (Nexus_Setup.exe)..."
Set-Location $PackagingDir
& $InnoSetupPath "NexusSetup.iss"

Write-Host "Build Complete! Installer is located at $PackagingDir\Output\Nexus_Setup.exe"
