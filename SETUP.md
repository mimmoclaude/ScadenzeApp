# 🚀 Setup Completo ScadenzeApp - Android + Web

Guida **step-by-step** per convertire da file HTML a app Android nativa.

---

## **FASE 0: Prerequisiti** (20 min)

### ✅ Installa Node.js
```bash
# Scarica da: https://nodejs.org (v18+ LTS consigliato)
# Verifica:
node --version
npm --version
```

### ✅ Installa Android Studio
```bash
# Scarica da: https://developer.android.com/studio
# Durante installazione, accetta di installare Android SDK
# Configura ANDROID_HOME (vedi fine guida)
```

### ✅ Installa Java JDK
```bash
# Windows: scuotutorialdarica.oracle.com/java/technologies/downloads
# Scarica JDK 11+
# Verifica:
java -version
```

---

## **FASE 1: Setup Progetto** (10 min)

### 1️⃣ Apri terminale nella cartella progetto
```bash
cd "C:\Users\MimmoClaude\Desktop\PROGETTI CLAUDE\REMIND"
```

### 2️⃣ Installa dipendenze
```bash
npm install
# Aspetta 2-3 min, installera:
# - React, Vite
# - Capacitor (framework Android)
# - Firebase (push notifications)
# - IndexedDB per storage offline
```

### 3️⃣ Testa app web localmente
```bash
npm run dev
# Apri: http://localhost:5173
# Vedi app funzionante? ✅ Continua
```

---

## **FASE 2: Firebase Setup** (15 min)

### 1️⃣ Crea progetto Firebase
```
Vai a: https://firebase.google.com
Click "Accedi" → Account Google (o crea)
Click "Crea progetto"
  Nome: ScadenzeApp
  Abilita Analytics: ❌ (no)
  Location: Italia
Click "Crea progetto"
Aspetta caricamento...
```

### 2️⃣ Scarica configurazione Web
```
In Firebase Console →
  ⚙️ Impostazioni Progetto (in alto)
  
Vedi "Le tue app"?
Se no, click "+ Aggiungi app" → Web

Nella app web, copia JSON:
  apiKey: "xxxxx"
  authDomain: "xxxxx"
  projectId: "xxxxx"
  ...
```

### 3️⃣ Incolla in src/main.jsx
Apri file: `src/main.jsx`

Trova:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  ...
}
```

Sostituisci con dati Firebase (ctrl+c/ctrl+v dal passo 2️⃣)

### 4️⃣ Abilita Cloud Messaging (per push Android)
```
Firebase Console →
  📨 Cloud Messaging
  
Vedi "Server API key"?
Se no, click "Genera" e salva (servirà dopo)
```

---

## **FASE 3: Google OAuth Setup** (15 min)

### 1️⃣ Crea progetto Google Cloud
```
Vai a: https://console.cloud.google.com
Click "Seleziona un Progetto" (in alto)
Click "+ Nuovo Progetto"
  Nome: ScadenzeApp-Google
  Organization: (lascia vuoto)
Click "Crea"
Aspetta 1-2 min...
```

### 2️⃣ Abilita API
```
In Google Cloud Console →
  🔍 Ricerca: "Google Calendar API"
  Click risultato → Click "Abilita"
  
Ripeti per:
  - "Gmail API" → "Abilita"
```

### 3️⃣ Crea credenziale OAuth
```
Console → 🔐 Credenziali (sinistra)

Click "+ Crea Credenziale" → "ID client OAuth 2.0"

Vedi errore "Schermata di consenso"?
  Click "Configura schermata di consenso"
  Tipo utente: "Esterno"
  Click "Crea"
  Compila:
    App name: ScadenzeApp
    User support email: tua@gmail.com
    Developer contact: tua@gmail.com
  Click "Salva e continua"
  (Ignora scopes e test users)
  Click "Torna a credenziali"

Click "+ Crea Credenziale" → "ID client OAuth 2.0"
  Tipo: "Applicazione Web"
  
  Origine JavaScript autorizzata:
    http://localhost:5173
    http://localhost:3000
    http://192.168.x.x:5173 (IP locale, vedi dopo)
    
  Click "Crea"
```

### 4️⃣ Copia Client ID
```
Vedi il Client ID nel popup (termina con .apps.googleusercontent.com)
Copia e salva da qualche parte
```

---

## **FASE 4: Avvia App Web + Configura** (10 min)

### 1️⃣ Avvia server
```bash
npm run dev
# Output: http://localhost:5173
```

### 2️⃣ Apri in browser
```
Browser: http://localhost:5173
Clicca: 📋 tab "Scadenze" (vedi app)
```

### 3️⃣ Configura Google
```
Tab "⚙️ Impostazioni"
  Incolla il Client ID (da FASE 3 step 4)
  Click "🔑 Accedi con Google"
  Seleziona account Gmail
  Click "Accetta permessi"
  
Vedi "✅ Connesso come tu@gmail.com"? ✅
```

### 4️⃣ Prova funzionalità
```
Home → "+ Nuova" → Aggiungi una scadenza
  Titolo: Test
  Data: domani
  € 10
  
Click "💾 Salva"
Vedi in lista? ✅

Click "📅+📧 Google"
  Dovrebbe aggiungere a Calendar + inviare email

Controlla Gmail e Google Calendar (in tab nuovi)
```

---

## **FASE 5: Build Android** (20 min)

### 1️⃣ Build web per Capacitor
```bash
npm run build
# Output: dist/ (cartella con app pronta)
```

### 2️⃣ Aggiungi Capacitor
```bash
npx cap init
# Domande:
# App name: ScadenzeApp
# App ID: com.scadenze.app
# Web dir: dist
```

### 3️⃣ Aggiungi piattaforma Android
```bash
npx cap add android
# Crea cartella android/
# Aspetta 3-4 min
```

### 4️⃣ Configura Android Studio (firebase)
```
Apri Android Studio:
  File → Open → scegli cartella "android/"
  
Se chiede "Gradle sync", click "Sync Now"

In Firebase Console:
  ⚙️ Impostazioni Progetto
  Aggiungi app → Android
  Package name: com.scadenze.app
  Nickname: ScadenzeApp-Android
  
  Per "SHA-1" (opzionale per dev):
    Apri terminale Android Studio (basso)
    Digita: ./gradlew signingReport
    Copia il SHA-1 mostrato
  
  Scarica "google-services.json"
```

### 5️⃣ Copia google-services.json
```bash
# Sposta il file scaricato a:
# android/app/google-services.json
```

### 6️⃣ Modifica Gradle
```
Apri file: android/build.gradle (non app/build.gradle)

Aggiungi in buildscript → dependencies:
  classpath 'com.google.gms:google-services:4.4.0'

Apri file: android/app/build.gradle (fine file)

Aggiungi:
  apply plugin: 'com.google.gms.google-services'
  
  dependencies {
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.capacitorjs:capacitor-push-notifications:5.0.7'
  }
```

### 7️⃣ Build APK
```bash
cd android
./gradlew assembleDebug
# Aspetta 5-10 min
# Output: app/build/outputs/apk/debug/app-debug.apk ✅
```

---

## **FASE 6: Installa su Dispositivo** (5 min)

### 1️⃣ Collega dispositivo Android
```bash
# Abilita sviluppatore:
#   Impostazioni → Info telefono
#   Tocca "Numero build" 7 volte
#   Torna a Impostazioni → Opzioni Sviluppatore
#   Abilita "Debug USB"

# Verifica connessione:
adb devices
# Dovrebbe mostrare il tuo telefono
```

### 2️⃣ Installa APK
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
# Aspetta 10-20 sec
# Output: Success ✅
```

### 3️⃣ Apri app
```
Vai su telefono
Home → Scorri app
Vedi "ScadenzeApp"? ✅ Clicca!
```

---

## **FASE 7: Configura Android** (5 min)

### 1️⃣ Abilita notifiche
```
Settings tab → Permessi push
  Se chiede, click "Abilita notifiche"
  
  Dovrebbe chiedere "Permessi"
  Click "Consenti"
```

### 2️⃣ Aggiungi scadenza
```
Scadenze tab → "+ Aggiungi"
  Titolo: Bolletta Enel
  € 80
  Data: domani
  
Click "📅+📧 Google"
  Dovrebbe funzionare (sincronizza con Google)
```

### 3️⃣ Prova notifiche
```
Vai a Google Calendar (web browser)
Vedi evento creato? ✅

Aspetta (o configura reminder a 1 min fa)
Dovrebbe arrivare notifica sul telefono
```

---

## **FASE 8: Setup Finale** (10 min)

### ✅ Ambiente Variabili
Crea file `.env` in root:
```env
# Da Firebase (se usi lettore bollette AI)
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx

# Se vuoi usare Claude Anthropic per bollette
VITE_ANTHROPIC_API_KEY=sk-xxxxx
```

### ✅ Esporta/Importa dati
```
Settings → "📥 Esporta backup JSON"
  Salva sul computer per backup
  
Puoi reimportare in futuro
```

### ✅ Genera APK Release
```bash
# Per distribuire su Play Store (dopo):
cd android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

## 🎉 Fatto! Checklist Finale

- [ ] App web funziona (http://localhost:5173)
- [ ] Firebase connesso e Cloud Messaging abilitato
- [ ] Google OAuth Client ID impostato
- [ ] App web sincronizza con Google Calendar ✅
- [ ] APK compilato e installato su telefono
- [ ] Scadenza aggiunta su telefono
- [ ] Sincronizzazione Google funziona su Android
- [ ] Notifiche push ricevute

---

## ⚙️ Variabili Ambiente (Windows)

Se `adb` o `gradle` non trovati:

### ANDROID_HOME
```
Apri: Impostazioni → Variabili Ambiente
Nuova variabile:
  Nome: ANDROID_HOME
  Valore: C:\Users\<username>\AppData\Local\Android\Sdk
  
Riavvia terminale
```

### JAVA_HOME
```
Apri: Impostazioni → Variabili Ambiente
Nuova variabile:
  Nome: JAVA_HOME
  Valore: C:\Program Files\Java\jdk-11.0.x (o dove hai installato)
  
Riavvia terminale
```

---

## 🐛 Help!

Se errore:

### "Gradle not found"
```bash
cd android
# Copia .gitignore da repo
# Riprova: ./gradlew assembleDebug
```

### "API non disponibile"
```bash
# In Google Cloud Console:
# Ricerca → Google Calendar API → Abilita
# Ricerca → Gmail API → Abilita
```

### "Firebase non connesso"
```bash
# Controlla src/main.jsx
# Verifica firebaseConfig sia corretto
# Cancella localStorage: 
#   Browser F12 → Application → Clear Storage
```

### "APK non si installa"
```bash
adb uninstall com.scadenze.app
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 📞 Supporto

Per dubbi, controlla:
1. Browser DevTools (F12) → Console → errori
2. Android Studio Logcat (basso) → cercare "error"
3. README.md sezione Troubleshooting

---

**Buon lavoro! 🚀💳**
