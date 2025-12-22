# 🚀 Come Avviare il Server Locale

## Metodo 1: Script Automatico (Raccomandato)

### Mac/Linux
```bash
./start_server.sh
```

Se hai problemi di permessi:
```bash
chmod +x start_server.sh
./start_server.sh
```

### Windows
```bash
start_server.bat
```

---

## Metodo 2: Python Diretto

### Con Python 3
```bash
python3 server.py
```

### Con Python (se python3 non funziona)
```bash
python server.py
```

---

## Metodo 3: Server HTTP Python Semplice

Se il server.py ha problemi, usa il server HTTP nativo di Python:

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

---

## 🌐 Aprire il Sito

Dopo aver avviato il server, apri nel browser:

### Homepage (Awwwards Design)
```
http://localhost:8000/
```
oppure
```
http://localhost:8000/index.html
```

### Wine Manager
```
http://localhost:8000/wine_manager.html
```

---

## ✅ Cosa Testare

### 1. Custom Cursor
- ✅ Muovi il mouse → Cursore dorato che segue
- ✅ Hover su bottoni → Cursore si espande (1.5x)
- ✅ Click → Cursore si riduce (0.8x)

### 2. Dark Mode
- ✅ Click sull'icona in alto a destra
- ✅ Tema cambia con animazione smooth (300ms)
- ✅ Ricarica la pagina → Preferenza salvata

### 3. Animazioni 3D
- ✅ Hover su wine cards → Tilt 3D e scale
- ✅ Hover su sidebar categories → Magnetic effect + glow
- ✅ Scroll la pagina → Staggered animations

### 4. Glassmorphism
- ✅ Guarda region info panel → Effetto vetro smerigliato
- ✅ Hover su elementi → Glassmorphism accentuato

### 5. Magnetic Buttons
- ✅ Hover su "Filter by Region" → Attrazione magnetica (30%)
- ✅ Hover su categorie sidebar → Movimento fluido

### 6. Performance
- ✅ FPS Counter (bottom-right) → Dovrebbe mostrare ~60fps
- ✅ Apri DevTools → Console per performance logs
- ✅ Animazioni → Tutte fluide senza scatti

---

## 🔧 Troubleshooting

### Porta 8000 già in uso
```bash
# Trova il processo sulla porta 8000
lsof -i :8000

# Uccidi il processo (se necessario)
kill -9 <PID>
```

Oppure usa una porta diversa:
```bash
python3 -m http.server 8080
# Poi apri http://localhost:8080/
```

### Python non trovato
Installa Python 3:
- **Mac**: `brew install python3`
- **Windows**: Scarica da [python.org](https://www.python.org/downloads/)
- **Linux**: `sudo apt install python3`

### CORS errors
Il `server.py` include già gli header CORS. Se usi il server semplice di Python, potrebbero esserci problemi con il caricamento di file JSON. In quel caso, usa `server.py`.

### Browser cache
Se non vedi le modifiche:
1. Apri DevTools (F12)
2. Click destro sul refresh → "Empty Cache and Hard Reload"
3. Oppure usa modalità incognito

---

## 🎨 Funzionalità Awwwards Attive

Quando il server è attivo, il sito ha:

### Visual Effects
- ✅ Glassmorphism con `backdrop-filter: blur(20px)`
- ✅ Glow effects oro sui premium elements
- ✅ Smooth shadows multi-layer
- ✅ Gradient backgrounds dinamici

### Interactions
- ✅ Custom cursor con `mix-blend-mode: difference`
- ✅ Magnetic buttons (30% strength)
- ✅ 3D card tilt con `perspective(1000px)`
- ✅ Parallax scrolling layers

### Performance
- ✅ 60fps garantiti (RequestAnimationFrame)
- ✅ GPU acceleration (`translateZ(0)`)
- ✅ Lazy loading immagini
- ✅ Will-change optimization

### Dark Mode
- ✅ Toggle smooth (300ms transitions)
- ✅ LocalStorage persistence
- ✅ Icon animation (scale + rotate)
- ✅ Tutti i colori via CSS custom properties

---

## 📊 Performance Monitoring

### In Modalità Sviluppo (localhost)

Il sito include monitoring automatico:

1. **FPS Counter** (bottom-right)
   - Verde: 55-60fps ✅
   - Giallo: 30-54fps ⚠️
   - Rosso: <30fps ❌

2. **Console Logs** (F12 → Console)
   - Performance metrics
   - Core Web Vitals
   - Page weight analysis
   - Loading times

3. **Chrome DevTools**
   - Performance tab → Record
   - Verifica che il frame rate sia 60fps
   - Controlla che non ci siano layout shifts

---

## 🌐 Test Cross-Browser

Testa su tutti i browser supportati:

### Chrome/Edge (Chromium)
```
Supporto completo ✅
```

### Firefox
```
Supporto completo ✅
```

### Safari
```
Supporto completo ✅
Nota: backdrop-filter richiede -webkit- prefix (già incluso)
```

---

## 🎯 Checklist Test Locale

Prima di deployare in produzione:

- [ ] Custom cursor funziona su tutti elementi interattivi
- [ ] Dark mode toggle salva preferenza
- [ ] Tutte le animazioni sono fluide (60fps)
- [ ] 3D tilt cards reagiscono al mouse
- [ ] Magnetic buttons hanno l'effetto attrazione
- [ ] Glassmorphism si vede correttamente
- [ ] Glow effects appaiono su hover
- [ ] Scroll animations triggherano correttamente
- [ ] Nessun layout shift (CLS < 0.1)
- [ ] Immagini caricano con lazy loading
- [ ] FPS counter mostra ~60fps
- [ ] Console non mostra errori
- [ ] Lighthouse Performance 90+

---

## 📱 Note Desktop-Only

**Importante**: Il sito è ottimizzato esclusivamente per desktop (1440px).

### Se Testi da Mobile/Tablet
Il sito mostrerà l'esperienza desktop scalata. Questo è intenzionale:
- ✅ Viewport fisso a 1440px
- ✅ Zero responsive code
- ✅ Zero media queries
- ✅ Esperienza desktop uniforme

Per testare correttamente:
1. Usa un desktop/laptop con schermo ≥1440px
2. Oppure usa DevTools → Device Emulation → Desktop 1440px

---

## 🚀 Next Steps Dopo il Test

### Se tutto funziona:
1. ✅ Deploy su hosting (Netlify, Vercel, GitHub Pages)
2. ✅ Configura CDN per asset statici
3. ✅ Minifica CSS/JS per produzione
4. ✅ Converti immagini in WebP
5. ✅ Abilita compressione gzip/brotli

### Se trovi problemi:
1. 📝 Controlla console per errori
2. 📊 Verifica FPS counter
3. 🔍 Usa DevTools Performance tab
4. 📖 Consulta DESIGN_SYSTEM.md per reference

---

## 💡 Tips per Testing

### Performance Testing
```bash
# Apri Chrome DevTools
# Performance tab → Record → Interact → Stop
# Verifica che il frame rate sia ~60fps costante
```

### Network Testing
```bash
# DevTools → Network tab
# Throttling → Fast 3G
# Verifica che il sito carichi in <3s
```

### Accessibility Testing
```bash
# DevTools → Lighthouse tab
# Run audit → Accessibility
# Target: 90+ score
```

---

## 📞 Supporto

### Problemi Comuni

**Q: Il server non parte**
A: Verifica che Python sia installato: `python3 --version`

**Q: Il cursore personalizzato non si vede**
A: Verifica che `modern-interactions.js` sia caricato (guarda Network tab)

**Q: Le animazioni sono scattose**
A: Controlla FPS counter. Potrebbe essere GPU/browser issue.

**Q: Dark mode non salva**
A: Verifica che localStorage sia abilitato nel browser

**Q: CORS errors**
A: Usa `python3 server.py` invece del server HTTP semplice

---

## 🎉 Enjoy Testing!

Il sito è ora pronto per essere testato in locale con tutte le funzionalità Awwwards-level attive:

- ✨ Custom cursor vivente
- 🧲 Magnetic buttons
- 🎭 3D tilt cards
- 💎 Glassmorphism perfetto
- ⚡ 60fps garantiti
- 🌓 Dark mode impeccabile

**Buon testing! 🚀**

---

*Per la documentazione completa, vedi:*
- **DESIGN_SYSTEM.md** - Design system reference
- **AWWWARDS_TRANSFORMATION.md** - Technical documentation
- **TRANSFORMATION_SUMMARY.md** - Quick summary

