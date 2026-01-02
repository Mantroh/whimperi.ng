# Installation Verification Script
# Run this to check if everything is set up correctly

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "WhatsApp-like Chat - Installation Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
    
    # Check if version is acceptable (16+)
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 16) {
        Write-Host "  ⚠ Warning: Node.js 16+ recommended, you have: $nodeVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js 16+" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "`nChecking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm installed: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    $allGood = $false
}

# Check project structure
Write-Host "`nChecking project structure..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "README.md",
    "backend\package.json",
    "backend\server.js",
    "backend\webrtc-signaling.js",
    "frontend\package.json",
    "frontend\index.html",
    "frontend\vite.config.js",
    "frontend\src\main.jsx",
    "frontend\src\App.jsx"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing: $file" -ForegroundColor Red
        $allGood = $false
    }
}

# Check backend dependencies
Write-Host "`nChecking backend dependencies..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules") {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "○ Backend dependencies not installed yet" -ForegroundColor Yellow
    Write-Host "  Run: cd backend && npm install" -ForegroundColor Cyan
}

# Check frontend dependencies
Write-Host "`nChecking frontend dependencies..." -ForegroundColor Yellow
if (Test-Path "frontend\node_modules") {
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "○ Frontend dependencies not installed yet" -ForegroundColor Yellow
    Write-Host "  Run: cd frontend && npm install" -ForegroundColor Cyan
}

# Check ports
Write-Host "`nChecking if required ports are available..." -ForegroundColor Yellow

$backendPort = 3000
$frontendPort = 5173

$backendInUse = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($backendInUse) {
    Write-Host "⚠ Port $backendPort is in use" -ForegroundColor Yellow
    Write-Host "  Backend server may not start. Close other apps using this port." -ForegroundColor Yellow
} else {
    Write-Host "✓ Port $backendPort available" -ForegroundColor Green
}

$frontendInUse = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if ($frontendInUse) {
    Write-Host "⚠ Port $frontendPort is in use" -ForegroundColor Yellow
    Write-Host "  Frontend may not start. Close other apps using this port." -ForegroundColor Yellow
} else {
    Write-Host "✓ Port $frontendPort available" -ForegroundColor Green
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Install dependencies: npm run install:all" -ForegroundColor White
    Write-Host "2. Start backend:        cd backend && npm run dev" -ForegroundColor White
    Write-Host "3. Start frontend:       cd frontend && npm run dev" -ForegroundColor White
    Write-Host "4. Open browser:         http://localhost:5173" -ForegroundColor White
} else {
    Write-Host "✗ Some checks failed" -ForegroundColor Red
    Write-Host "Please fix the issues above before proceeding." -ForegroundColor Yellow
}
Write-Host "========================================`n" -ForegroundColor Cyan
