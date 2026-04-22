@echo off
REM ScadenzeApp - Quick Start Script (Windows)

echo.
echo ====================================
echo   ScadenzeApp - Setup Automatico
echo ====================================
echo.

REM Controlla Node.js
echo [1/5] Verifica Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRORE: Node.js non trovato! Scarica da https://nodejs.org
    pause
    exit /b 1
)
echo     OK - Node.js installato

REM Installa dipendenze
echo [2/5] Installazione dipendenze...
call npm install
if errorlevel 1 (
    echo ERRORE: npm install fallito
    pause
    exit /b 1
)
echo     OK - Dipendenze installate

REM Copia .env.example a .env
echo [3/5] Setup configurazione...
if not exist .env (
    copy .env.example .env
    echo     OK - .env creato
) else (
    echo     OK - .env esiste
)

REM Crea cartelle necessarie
echo [4/5] Setup cartelle...
if not exist public mkdir public
if not exist src mkdir src
echo     OK - Cartelle pronte

REM Avvia dev server
echo [5/5] Avvio dev server...
echo.
echo ====================================
echo   ✅ Setup completato!
echo ====================================
echo.
echo Aprendo http://localhost:5173...
echo.
echo ISTRUZIONI:
echo   1. Vai su Settings (⚙️)
echo   2. Incolla Google Client ID
echo   3. Click "🔑 Accedi con Google"
echo.
echo Per build Android, leggi SETUP.md
echo.
pause
call npm run dev
