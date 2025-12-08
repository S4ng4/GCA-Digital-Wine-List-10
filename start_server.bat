@echo off
REM Script per avviare il server HTTP locale su Windows

echo 🚀 Avvio del server HTTP locale...
echo.

REM Verifica se Python è installato
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Errore: Python non trovato!
    echo 💡 Installa Python per utilizzare questo script.
    pause
    exit /b 1
)

python server.py
pause

