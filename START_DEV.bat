@echo off
REM ScadenzeApp - Start Development Server

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           ScadenzeApp - Development Server                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [!] npm packages not installed!
    echo Running: npm install...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

echo [✓] Starting dev server...
echo.
echo 📍 URL: http://localhost:5173
echo.
echo 🎯 NEXT STEPS:
echo    1. Wait for server to start (2-3 seconds)
echo    2. Browser will open automatically
echo    3. If not, manually open http://localhost:5173
echo    4. Go to Settings (⚙️) tab
echo    5. Get Google Client ID from console.cloud.google.com
echo    6. Paste in app and click "Login"
echo.
echo 📚 For full setup guide, read: GETTING_STARTED.md
echo.
echo ═══════════════════════════════════════════════════════════
echo.

REM Start dev server
call npm run dev

pause
