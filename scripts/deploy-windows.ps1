<#
PowerShell deploy script for Windows Server 2022
Usage examples:
# Clone mode (when you have a remote repo):
# .\deploy-windows.ps1 -Mode clone -GitUrl "https://github.com/you/whimpering.git" -FrontendUrl "https://yourdomain.com"

# Local zip mode (if you upload a zip of the repo to the VPS):
# .\deploy-windows.ps1 -Mode local -SourceZipPath "C:\temp\whimpering.zip" -FrontendUrl "https://yourdomain.com"

Parameters:
-Mode: "clone" or "local"
-GitUrl: repo clone URL (required for clone)
-SourceZipPath: path to zip (required for local)
-AppDir: target install directory (default C:\apps\whimpering)
-Port: app port (default 3000)
-FrontendUrl: URL to allow in Socket.IO CORS
-CreateService: switch to register NSSM service (requires nssm in PATH or at C:\nssm\nssm.exe)
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('clone','local')]
    [string]$Mode,

    [string]$GitUrl,
    [string]$SourceZipPath,

    [string]$AppDir = 'C:\apps\whimpering',
    [int]$Port = 3000,
    [string]$FrontendUrl = 'https://yourdomain.com',

    [switch]$CreateService
)

function Abort($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# Ensure Node and Git available for clone mode
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Abort 'Node.js not found in PATH. Install Node.js LTS (>=16) and re-run.' }
if ($Mode -eq 'clone' -and -not (Get-Command git -ErrorAction SilentlyContinue)) { Abort 'Git not found in PATH. Install Git and re-run.' }

# Create apps folder
$appsRoot = Split-Path $AppDir -Parent
if (-not (Test-Path $appsRoot)) { New-Item -Path $appsRoot -ItemType Directory -Force | Out-Null }

# Remove existing app dir if present (ask first)
if (Test-Path $AppDir) {
    Write-Host "Directory $AppDir already exists. Backing up as ${AppDir}_bak_$(Get-Date -Format yyyyMMddHHmmss)"
    Rename-Item -Path $AppDir -NewName "${AppDir}_bak_$(Get-Date -Format yyyyMMddHHmmss)"
}

# Acquire source
if ($Mode -eq 'clone') {
    if (-not $GitUrl) { Abort 'GitUrl is required in clone mode.' }
    Write-Host "Cloning $GitUrl to $AppDir"
    git clone $GitUrl $AppDir || Abort 'Git clone failed.'
}
else {
    if (-not $SourceZipPath) { Abort 'SourceZipPath is required in local mode.' }
    if (-not (Test-Path $SourceZipPath)) { Abort "Zip file not found: $SourceZipPath" }
    Write-Host "Extracting $SourceZipPath to $AppDir"
    Expand-Archive -LiteralPath $SourceZipPath -DestinationPath $AppDir -Force || Abort 'Failed to extract zip.'
}

# Install dependencies and build
Push-Location $AppDir
try {
    Write-Host 'Installing root dependencies (if any)'
    if (Test-Path package.json) { npm install } else { Write-Host 'No root package.json found.' }

    # Frontend build
    if (Test-Path .\frontend\package.json) {
        Write-Host 'Installing frontend dependencies and building'
        Push-Location .\frontend
        npm install
        npm run build
        Pop-Location

        # Copy build into backend/dist
        $frontendDist = Join-Path $AppDir 'frontend\dist'
        $backendDist = Join-Path $AppDir 'backend\dist'
        if (Test-Path $frontendDist) {
            if (Test-Path $backendDist) { Remove-Item -Recurse -Force $backendDist }
            Write-Host "Copying frontend build to backend/dist"
            Copy-Item -Path $frontendDist -Destination $backendDist -Recurse -Force
        } else {
            Write-Host 'Warning: frontend dist not found after build.' -ForegroundColor Yellow
        }
    } else { Write-Host 'No frontend found; skipping build.' }

    # Backend install
    if (Test-Path .\backend\package.json) {
        Write-Host 'Installing backend dependencies'
        Push-Location .\backend
        npm install
        Pop-Location
    } else { Write-Host 'No backend found; nothing to install.' }

    # Set environment variables (machine-wide)
    Write-Host "Setting FRONTEND_URL=$FrontendUrl and PORT=$Port as machine environment variables"
    setx FRONTEND_URL $FrontendUrl /M | Out-Null
    setx PORT $Port /M | Out-Null

    Write-Host 'Deployment steps complete. You can start the app manually or install as a service.'

    if ($CreateService) {
        # Find nssm
        $nssm = (Get-Command nssm.exe -ErrorAction SilentlyContinue)?.Source
        if (-not $nssm -and Test-Path 'C:\nssm\nssm.exe') { $nssm = 'C:\nssm\nssm.exe' }
        if (-not $nssm) { Write-Host 'NSSM not found. Download from https://nssm.cc/download and place nssm.exe in PATH or C:\nssm' -ForegroundColor Yellow }
        else {
            $nodeExe = (Get-Command node).Source
            $serviceName = 'WhimperingChat'
            $appJs = Join-Path $AppDir 'backend\server.production.js'
            if (-not (Test-Path $appJs)) { Write-Host "Service target not found: $appJs" -ForegroundColor Red } else {
                Write-Host "Installing Windows service $serviceName using NSSM ($nssm)"
                & $nssm install $serviceName $nodeExe $appJs
                & $nssm set $serviceName AppDirectory "$AppDir\backend"
                & $nssm set $serviceName AppEnvironmentExtra "PORT=$Port;FRONTEND_URL=$FrontendUrl"
                & $nssm start $serviceName
                Write-Host "Service $serviceName installed and started."
            }
        }
    }
}
finally {
    Pop-Location
}

Write-Host 'Done.' -ForegroundColor Green
