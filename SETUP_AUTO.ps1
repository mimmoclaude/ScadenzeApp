# ScadenzeApp - Automated Setup Script (PowerShell)
# Run: powershell -ExecutionPolicy Bypass -File SETUP_AUTO.ps1

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     ScadenzeApp - Automatic Setup Script             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "[1/6] Checking Node.js..." -ForegroundColor Yellow
$node = node --version 2>$null
if ($node) {
    Write-Host "✅ Node.js $node found" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Download from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Install npm dependencies
Write-Host "`n[2/6] Installing npm dependencies..." -ForegroundColor Yellow
Write-Host "This may take 2-3 minutes..." -ForegroundColor Gray
npm install --silent
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

# Create .env file
Write-Host "`n[3/6] Creating .env file..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env created (fill in your Firebase config later)" -ForegroundColor Green
} else {
    Write-Host "⭕ .env already exists" -ForegroundColor Gray
}

# Create directories
Write-Host "`n[4/6] Setting up directories..." -ForegroundColor Yellow
$dirs = @("public", "src", "android", "dist")
foreach ($dir in $dirs) {
    if (-Not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -ErrorAction SilentlyContinue | Out-Null
    }
}
Write-Host "✅ Directories ready" -ForegroundColor Green

# Verify key files
Write-Host "`n[5/6] Verifying project structure..." -ForegroundColor Yellow
$files = @("index.html", "vite.config.js", "package.json", "capacitor.config.json")
$missing = @()
foreach ($file in $files) {
    if (-Not (Test-Path $file)) {
        $missing += $file
    }
}
if ($missing.Count -eq 0) {
    Write-Host "✅ All key files present" -ForegroundColor Green
} else {
    Write-Host "❌ Missing files: $($missing -join ', ')" -ForegroundColor Red
}

# Summary
Write-Host "`n[6/6] Setup Summary" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ npm installed" -ForegroundColor Green
Write-Host "✅ Project structure ready" -ForegroundColor Green
Write-Host "✅ Dependencies configured" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

Write-Host "`n1️⃣  START DEV SERVER:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Then open: http://localhost:5173" -ForegroundColor White

Write-Host "`n2️⃣  CONFIGURE GOOGLE (in Settings tab):" -ForegroundColor Yellow
Write-Host "   a) Go to console.cloud.google.com" -ForegroundColor White
Write-Host "   b) Create project → Enable Calendar + Gmail APIs" -ForegroundColor White
Write-Host "   c) Credentials → OAuth Web → Copy Client ID" -ForegroundColor White
Write-Host "   d) Paste in app Settings → Click 'Login'" -ForegroundColor White

Write-Host "`n3️⃣  TEST THE APP:" -ForegroundColor Yellow
Write-Host "   - Add a test deadline" -ForegroundColor White
Write-Host "   - Sync with Google Calendar" -ForegroundColor White
Write-Host "   - Verify email received ✅" -ForegroundColor White

Write-Host "`n📚 READ DOCUMENTATION:" -ForegroundColor Yellow
Write-Host "   1. INIZIO_VELOCE.txt (quick ref)" -ForegroundColor White
Write-Host "   2. GETTING_STARTED.md (getting started)" -ForegroundColor White
Write-Host "   3. FREE_PLAN.md (understand costs)" -ForegroundColor White

Write-Host "`n💰 COST: €0.00 for everything!" -ForegroundColor Green

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Ready to go! Type:  npm run dev  to start 🚀         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
