# 🎯 Getting Started - ScadenzeApp

**Benvenuto!** Hai appena ricevuto una **app completa** (web + Android) per gestire scadenze e bollette.

## 🎉 **100% GRATUITO - Zero Costi!**

Tutto funziona con servizi **FREE**:
- ✅ Firebase Spark Plan (Gratis)
- ✅ Google APIs (Quota gratuita)
- ✅ Netlify/Vercel Hosting (Gratis)
- ✅ Android Studio (Gratis)

**→ Leggi [FREE_PLAN.md](./FREE_PLAN.md) per dettagli quote gratuite**

---

## 📁 Cosa è Stato Creato?

```
REMIND/
├── src/                    # Codice React
│   ├── App.jsx            # App principale
│   ├── db.js              # Database IndexedDB
│   ├── main.jsx           # Bootstrap
│   ├── index.css          # Stili
│   ├── components/        # Componenti UI
│   └── pages/             # Pagine (Home, Payments, etc)
│
├── android/               # Build Android (da generare)
├── public/                # Assets (manifest, service worker)
├── dist/                  # Build output (da generare)
│
├── package.json          # Dipendenze
├── vite.config.js        # Vite config
├── capacitor.config.json # Android config
│
├── README.md             # Documentazione tecnica
├── SETUP.md              # Setup step-by-step
├── FIREBASE_SETUP.md     # Firebase configuration
├── DEPLOYMENT.md         # Deploy web + Play Store
├── QUICK_START.bat       # Script automatico (Windows)
└── GETTING_STARTED.md    # Questo file
```

---

## ⚡ Avvio Rapido (5 min)

### 1️⃣ Installa dipendenze
```bash
cd "C:\Users\MimmoClaude\Desktop\PROGETTI CLAUDE\REMIND"
npm install
```

### 2️⃣ Avvia app web
```bash
npm run dev
# Apri: http://localhost:5173
```

### 3️⃣ Configura Google
- Vai su **tab Impostazioni** (⚙️)
- Ottieni **Client ID** da [console.cloud.google.com](https://console.cloud.google.com)
  - Crea progetto → API → abilita Calendar + Gmail
  - Credenziali → OAuth → Web
  - Origini JavaScript: `http://localhost:5173`
- Incolla Client ID nell'app
- Click **"🔑 Accedi con Google"**

### 4️⃣ Prova
- Clicca **"📋 Scadenze"** → **"+ Aggiungi"**
- Riempi form (titolo, importo, data)
- Click **"💾 Salva"**
- Vedi la scadenza in lista? ✅

---

## 📚 Documentazione

Leggi questi file nell'ordine:

| File | Cosa Contiene | Tempo |
|------|---|---|
| **README.md** | Overview tecnico + features | 5 min |
| **SETUP.md** | Setup completo step-by-step | 45 min |
| **FIREBASE_SETUP.md** | Config Firebase (Web + Android) | 30 min |
| **DEPLOYMENT.md** | Deploy web + Play Store | 20 min |

---

## 🎯 Roadmap d'Uso

### Fase 1: Test Locale (Oggi)
```bash
npm install
npm run dev
# Test app web con dati demo
```

### Fase 2: Setup Firebase (Domani)
```
1. Crea progetto Firebase
2. Scarica configurazione
3. Incolla in src/main.jsx
4. Test push notifications
```

### Fase 3: Build Android (Prossimi giorni)
```bash
npm run build
npx cap add android
cd android
./gradlew assembleDebug
adb install app-debug.apk
# Test su telefono
```

### Fase 4: Deploy Produzione (Opzionale)
```bash
# Web
npm run build
netlify deploy --prod --dir=dist

# Android
# Carica su Google Play Store
```

---

## 💡 Quick Reference

### Comandi Essenziali

| Comando | Cosa fa |
|---------|---------|
| `npm run dev` | Avvia server development web |
| `npm run build` | Build web per produzione |
| `npx cap add android` | Aggiunge Android |
| `npx cap sync` | Sincronizza Android con web |
| `npm run cap:build` | Build APK direttamente |

### File Importanti da Modificare

| File | Quando | Cosa |
|------|--------|------|
| `src/main.jsx` | Setup | Incolla firebaseConfig |
| `src/App.jsx` | Customizzazione | Aggiungi funzionalità |
| `.env` | Produzione | API keys |
| `android/app/build.gradle` | Android | Versione, firma |

---

## 🔐 Setup Google OAuth

```
console.cloud.google.com →
  Nuovo Progetto: ScadenzeApp-Google
  
  Abilita API:
    ✅ Google Calendar API
    ✅ Gmail API
  
  Credenziali:
    OAuth 2.0 → Web
    Origini: http://localhost:5173, http://localhost:3000
    
  Copia Client ID
  
  Incolla nell'app → Settings → tab ⚙️
```

---

## 🔥 Setup Firebase

```
firebase.google.com →
  Nuovo Progetto: ScadenzeApp
  
  Aggiungi app Web
  Copia JSON
  Incolla in src/main.jsx (linea 9)
  
  Cloud Messaging: Abilita
  
  Aggiungi app Android (dopo)
  Scarica google-services.json
  Copia in android/app/
```

---

## 📱 Build Android - Checklist

Prima di compilare:
- [ ] npm install (tutte le dipendenze)
- [ ] npm run build (web pronto)
- [ ] npx cap add android (piattaforma aggiunta)
- [ ] google-services.json in android/app/
- [ ] build.gradle aggiornati con Firebase
- [ ] ANDROID_HOME variabile d'ambiente impostata

Poi:
```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🚀 Deployment Finale

### Web (Gratuito)
```bash
# Netlify (Consigliato)
npm run build
netlify deploy --prod --dir=dist
```

### Android (Play Store)
```bash
# Firma + AAB
./gradlew bundleRelease

# Upload a Google Play Console
# Aspetta approvazione (24-48h)
```

---

## ⚙️ Variabili Ambiente

Crea `.env` (o `.env.production`):

```env
# Firebase (da Firebase Console)
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx

# Google OAuth (da Google Cloud Console)
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com

# Claude Anthropic (opzionale, per lettore bollette)
VITE_ANTHROPIC_API_KEY=sk-xxxxx
```

---

## 🐛 Problemi Comuni

### ❌ "npm: comando non trovato"
→ Installa Node.js da nodejs.org

### ❌ "Port 5173 già in uso"
```bash
npm run dev -- --port 3001
```

### ❌ "Firebase non caricato"
→ Controlla `src/main.jsx` firebaseConfig
→ Cancella localStorage browser

### ❌ "APK compilation error"
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 📖 Dove Trovare Aiuto

| Problema | Leggi |
|----------|-------|
| Setup completo | **SETUP.md** |
| Firebase non funziona | **FIREBASE_SETUP.md** |
| Android non compila | **README.md** → Troubleshooting |
| Deploy web | **DEPLOYMENT.md** |
| Google OAuth | **SETUP.md** → Fase 3 |

---

## 🎓 Esempio Uso

1. **Home tab**
   - Vedi scadenze prossime
   - Vedi statistiche spese
   - Click "📅 Sincronizza tutto" → aggiungi a Google Calendar

2. **Scadenze tab**
   - Filtra (Tutte, In arrivo, Scadute, Pagate)
   - Click "✓ Pagato" per marcare completate
   - Click "📅+📧 Google" per sincronizzare

3. **Bollette tab**
   - Incolla URL portale (es. Enel, TIM)
   - Click "🔍 Analizza Bolletta"
   - Claude estrae importo/scadenza
   - Click "➕ Aggiungi" → importa nelle scadenze

4. **Impostazioni tab**
   - Incolla Google Client ID
   - Click "🔑 Accedi con Google"
   - Vedi statistiche
   - Esporta/importa backup

---

## ✅ Checklist Iniziale

- [ ] npm install completato
- [ ] npm run dev funziona (http://localhost:5173)
- [ ] App carica senza errori (F12 console)
- [ ] Google Client ID ottenuto
- [ ] Scadenza aggiunta e sincronizzata ✅
- [ ] Notifica Gmail ricevuta

---

## 🎉 Prossimi Step

1. **Personalizzazione**
   - Aggiungi categorie in `src/App.jsx`
   - Cambia colori tema
   - Modifica testo intro

2. **Features Aggiuntive**
   - Importa CSV (aggiungi nella pagina Bills)
   - Esporta PDF report
   - Integrazione WhatsApp notifications

3. **Deploy Produzione**
   - Netlify/Vercel per web
   - Google Play Store per Android

---

## 📞 Support Veloce

Se bloccato:

1. **Leggi il file relevante**
   - Setup issue → SETUP.md
   - Android issue → README.md
   - Firebase issue → FIREBASE_SETUP.md

2. **Controlla console browser** (F12)
   - Errori JavaScript?
   - Errori API?

3. **Controlla Google Cloud / Firebase Console**
   - Client ID corretto?
   - API abilitate?
   - Credenziali configurate?

---

## 🎯 Obiettivi

- [x] App web funzionante
- [x] Database locale (IndexedDB)
- [x] Google Calendar/Gmail integration
- [x] Firebase Cloud Messaging ready
- [x] Android Capacitor setup
- [x] Build APK ready
- [ ] Testare completo (tu!)
- [ ] Deploy web
- [ ] Deploy Play Store

---

**Buon lavoro! Divertiti a usare ScadenzeApp 🚀💳**

> Se hai domande, leggi SETUP.md o il file relevante prima di procedere.
