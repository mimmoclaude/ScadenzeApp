# 💳 ScadenzeApp - Gestione Scadenze e Bollette

App web + Android nativa per tracciare scadenze, bollette e pagamenti con sincronizzazione automatica a Google Calendar e Gmail.

## 🎉 **100% GRATUITO**

- ✅ **Zero costi** per development, hosting, e deploy
- ✅ **Piano Spark Firebase** (illimitato per progetti piccoli)
- ✅ **Google APIs** (quota gratuita)
- ✅ **Hosting web** completamente gratis (Netlify/Vercel)
- ✅ **Build Android** gratis con Android Studio

👉 **Vedi [FREE_PLAN.md](./FREE_PLAN.md) per dettagli complete**

## 🚀 Features

- 📅 **Gestione scadenze** — CRUD completo, categorie, frequenze
- 🤖 **AI Lettore Bollette** — Estrazione automatica importo/scadenza da URL
- 📧 **Sincronizzazione Google** — Calendar events + email reminders
- 📱 **App Android nativa** — Capacitor wrapper + Firebase Push
- 💾 **IndexedDB offline** — Dati locali persistenti
- 🔔 **Notifiche push** — Firebase Cloud Messaging
- 📲 **PWA-ready** — Installa come app web

---

## 📦 Setup Veloce

### **1️⃣ Prerequisiti**
```bash
# Node.js 16+ e npm
node --version  # v16+ richiesto

# Java JDK 11+ (per Android)
java -version

# Android SDK (via Android Studio)
```

### **2️⃣ Clona e dipendenze**
```bash
cd ~/Desktop/PROGETTI\ CLAUDE/REMIND
npm install
```

### **3️⃣ Configura Firebase**

#### **A. Crea progetto Firebase:**
1. Vai a [firebase.google.com](https://firebase.google.com)
2. Click **"Crea progetto"** → nome: `ScadenzeApp`
3. Abilita **Analytics** (opzionale)
4. Vai a **Impostazioni progetto** → **Google Cloud Console**

#### **B. Scarica config:**
1. In Firebase Console → **Impostazioni progetto** → **App tuoi**
2. Clicca l'app **Web** (aggiungi se non esiste)
3. Copia il JSON da **Configurazione**
4. Incolla in `src/main.jsx` alle righe 9-17:
```jsx
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

#### **C. Abilita Cloud Messaging:**
1. Firebase Console → **Cloud Messaging** → **Crea chiave server**
2. Salva per dopo (servirà per backend push)

### **4️⃣ Configura Google APIs**

#### **Setup OAuth 2.0:**
1. Vai a [console.cloud.google.com](https://console.cloud.google.com)
2. **Crea progetto** → `ScadenzeApp-Google`
3. **API e servizi → Libreria**:
   - Abilita **Google Calendar API**
   - Abilita **Gmail API**
4. **Credenziali → Crea → ID client OAuth 2.0**:
   - Tipo: **Applicazione Web**
   - Origini JavaScript autorizzate: `http://localhost:3000`, `http://localhost:5173`
   - Copia il **Client ID** (termina con `.apps.googleusercontent.com`)
5. Incollalo nell'app (tab **Impostazioni** dopo avvio)

---

## 🎯 Sviluppo Web

```bash
# Avvia server Vite
npm run dev

# Apri browser: http://localhost:5173
# Vai su Settings → Incolla Google Client ID
# Accedi con Google
```

---

## 📱 Build Android

### **Step 1: Build web**
```bash
npm run build
# Output: dist/
```

### **Step 2: Aggiungi Capacitor**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications
npx cap init
# Rispondi:
# App name: ScadenzeApp
# App ID: com.scadenze.app
# Directory Web: dist
```

### **Step 3: Sync Android**
```bash
npx cap add android
npx cap sync android
```

### **Step 4: Configura Firebase per Android**

#### **A. Ottieni google-services.json:**
1. Firebase Console → **Impostazioni progetto**
2. **Aggiungi app → Android**
3. Package name: `com.scadenze.app`
4. SHA-1 fingerprint (opzionale per dev)
5. Scarica `google-services.json`
6. Copia in: `android/app/google-services.json`

#### **B. Modifica build.gradle**
Apri `android/build.gradle` e aggiungi:
```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
  }
}
```

Apri `android/app/build.gradle` (fine file) aggiungi:
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
  implementation 'com.google.firebase:firebase-messaging'
  implementation 'com.capacitorjs:capacitor-push-notifications:VERSION'
}
```

### **Step 5: Build APK**
```bash
# Dev debug APK
npx cap build android --keystorePath=... --keystoreAlias=... (opzionale)

# Se non hai keystore:
cd android
./gradlew assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk
```

### **Step 6: Installa su dispositivo**
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔧 Variabili Ambiente

Crea `.env`:
```env
VITE_ANTHROPIC_API_KEY=your-key-here  # Per lettore bollette AI
VITE_FIREBASE_API_KEY=your-key-here
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 📊 Struttura Progetto

```
REMIND/
├── src/
│   ├── main.jsx              # Bootstrap React + Firebase
│   ├── App.jsx              # Componente principale
│   ├── db.js                # IndexedDB storage
│   ├── index.css            # Stili globali
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Nav.jsx
│   │   ├── Toast.jsx
│   │   ├── LoadingOverlay.jsx
│   │   └── AddModal.jsx
│   └── pages/
│       ├── Home.jsx
│       ├── Payments.jsx
│       ├── Bills.jsx
│       └── Settings.jsx
├── public/
│   ├── manifest.json        # PWA manifest
│   └── sw.js               # Service Worker
├── android/                 # Build Android (auto-generated)
├── dist/                    # Build output (auto-generated)
├── capacitor.config.json
├── vite.config.js
├── package.json
└── README.md
```

---

## 🎨 Personalizzazione

### **Colori tema:**
Modifica in `src/App.jsx` (linea ~50):
```javascript
const CAT = {
  utilities:    { emoji:"⚡", label:"Utenze",        color:"#F59E0B" },
  // ...
};
```

### **Categorie:**
Aggiungi in `CAT` object e `REC` object

---

## 🐛 Troubleshooting

### **"Google non caricato"**
- Controlla tab Settings → Client ID impostato
- Pulisci cache browser

### **Firebase push non funziona**
- Controlla `google-services.json` in `android/app/`
- Ricompila: `npx cap sync && npx cap build android`

### **IndexedDB errori**
- Apri DevTools → Application → IndexedDB
- Cancella database e rilancia app

### **APK non installa**
```bash
# Vedi errori
adb logcat | grep -i error

# Reinstalla:
adb uninstall com.scadenze.app
adb install app-debug.apk
```

---

## 📝 License

MIT - Libero uso personale e commerciale

---

## 🤝 Support

Per problemi:
1. Controlla console DevTools (F12)
2. Verifica variabili `.env`
3. Ricompila: `npm run build && npx cap sync`

---

**Enjoy! 🚀💳**
