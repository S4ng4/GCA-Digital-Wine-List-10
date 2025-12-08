#!/bin/bash
# Script per avviare il server HTTP locale

echo "🚀 Avvio del server HTTP locale..."
echo ""

# Verifica se Python 3 è installato
if command -v python3 &> /dev/null; then
    python3 server.py
elif command -v python &> /dev/null; then
    python server.py
else
    echo "❌ Errore: Python non trovato!"
    echo "💡 Installa Python 3 per utilizzare questo script."
    exit 1
fi

