# 🍷 Wine Manager - Guida all'uso

Gestore interattivo per modificare i link delle immagini dei vini nel file `wines.json` e `wine_links.csv`.

## 🚀 Avvio Rapido

### Opzione 1: Script automatico (Raccomandato)

**Su macOS/Linux:**
```bash
./start_server.sh
```

**Su Windows:**
```cmd
start_server.bat
```

### Opzione 2: Python diretto

```bash
python3 server.py
```

### Opzione 3: Server HTTP semplice

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000
```

## 📖 Come Usare

1. **Avvia il server locale** usando uno dei metodi sopra
2. **Apri nel browser:** `http://localhost:8000/wine_manager.html`
3. I file `wine_links.csv` e `data/wines.json` verranno caricati automaticamente
4. **Modifica i link:**
   - Inserisci il nuovo URL nel campo "Nuovo Link"
   - Clicca "Aggiorna" per applicare la modifica
5. **Evidenzia righe:** Clicca "Evidenzia" per cambiare lo sfondo in verde
6. **Scarica i file aggiornati:**
   - Clicca "Scarica wines.json aggiornato" per salvare il JSON modificato
   - Clicca "Scarica wine_links.csv aggiornato" per salvare il CSV modificato

## ⚠️ Perché serve un server locale?

I browser moderni bloccano il caricamento di file locali (JSON, CSV) quando si apre un file HTML direttamente (`file://`) per motivi di sicurezza (CORS). Un server HTTP locale risolve questo problema.

## 🔧 Requisiti

- **Python 3** (già incluso nella maggior parte dei sistemi)
- Un browser moderno (Chrome, Firefox, Safari, Edge)

## 📁 File Coinvolti

- `wine_manager.html` - Interfaccia web
- `wine_links.csv` - File CSV con i link delle immagini
- `data/wines.json` - File JSON con tutti i dati dei vini
- `server.py` - Server HTTP locale
- `start_server.sh` - Script di avvio (macOS/Linux)
- `start_server.bat` - Script di avvio (Windows)

## 🎯 Funzionalità

✅ Visualizzazione di tutti i vini con immagini  
✅ Informazioni produttore e nome vino  
✅ Modifica link immagini  
✅ Aggiornamento automatico di wines.json e wine_links.csv  
✅ Pulsante evidenziazione righe (sfondo verde)  
✅ Ricerca vini  
✅ Statistiche (vini totali, link modificati)  
✅ Download file aggiornati  

## 🐛 Risoluzione Problemi

### Errore: "Porta già in uso"
```bash
# Trova il processo che usa la porta 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Oppure modifica la porta in server.py
```

### File non trovati
- Assicurati di essere nella directory corretta
- Verifica che `wine_links.csv` e `data/wines.json` esistano
- Controlla che il server sia avviato nella directory root del progetto

### Il browser non carica i file
- Verifica che stai usando `http://localhost:8000` e non `file://`
- Controlla la console del browser (F12) per errori
- Assicurati che il server sia in esecuzione

## 💡 Suggerimenti

- Usa la ricerca per trovare rapidamente un vino
- I link modificati vengono tracciati automaticamente
- Puoi evidenziare più righe contemporaneamente
- I file scaricati possono essere sostituiti direttamente ai file originali

