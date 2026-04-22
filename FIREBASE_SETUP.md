# 🔥 Firebase Setup Dettagliato

Guida passo-passo per configurare Firebase (Web + Android).

---

## **Step 1: Crea Progetto Firebase**

1. Vai a **[firebase.google.com](https://firebase.google.com)**
2. Click **"Inizia"** (in alto destra) → **"Crea progetto"**
3. Compilare:
   ```
   Nome progetto: ScadenzeApp
   Analytics: ❌ Disattiva (non serve)
   Region: Italia
   ```
4. Click **"Crea progetto"**
5. Aspetta 1-2 minuti che carica

---

## **Step 2: Ottieni Configurazione Web**

### A. Aggiungi app Web
1. In Firebase Console (home)
2. Vedi **"Inizia aggiungendo il Firebase..."**?
   - Click l'icona **`</>`** (Web)
   - Se non vedi, click **"Aggiungi app"** → **Web**

3. Compila:
   ```
   Nickname app: ScadenzeApp-Web
   ```

4. Copia il JSON mostrato (da `const firebaseConfig = {` a `}`)

### B. Incolla in src/main.jsx

Apri file: `src/main.jsx` (linea 9-17)

Troverai:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Sostituisci completamente** con il JSON dal passo 4.

---

## **Step 3: Abilita Cloud Messaging**

### A. Attiva servizio
1. Firebase Console → **Messaggi (sinistra)**
2. Click **"Cloud Messaging"**
3. Se disattivato, click **"Abilita"**

### B. Ottieni Server API Key (facoltativo, per backend)
1. Vedi **"Impostazioni Progetto"** (in alto a destra, ⚙️)
2. Tab **"Cloud Messaging"**
3. Vedi **"Server API key"**?
   - Se no, click **"Genera"**
   - Se sì, salva da qualche parte (utile per backend later)

---

## **Step 4: Configura Accesso API**

### A. Google Sign-In per Web
Firebase usa **Google Identity Services** che **NON richiede API**.

Tutto è configurato automaticamente quando abiliti Google nel progetto.

### B. Verifica
1. Firebase Console → **Autenticazione (sinistra)**
2. Click **"Metodo di accesso"** (tab)
3. Abilita **Google** (se non lo è già)

---

## **Step 5: Setup Android App**

### A. Aggiungi app Android
1. Firebase Console (home)
2. Click **"Aggiungi app"** → **Android**

3. Compila:
   ```
   Package name: com.scadenze.app
   Nickname: ScadenzeApp-Android
   (SHA-1 fingerprint: lascia vuoto per dev)
   ```

4. Click **"Registra app"**

5. Scarica **`google-services.json`**
   - Salva nella cartella: **`android/app/`**

### B. Abilita Firebase in build.gradle

Apri: `android/build.gradle` (non app/)

In sezione `buildscript { dependencies { ... } }` aggiungi:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

Apri: `android/app/build.gradle`

Al fine del file aggiungi:
```gradle
// Firebase
apply plugin: 'com.google.gms.google-services'

dependencies {
  // ... altre dipendenze ...
  implementation 'com.google.firebase:firebase-messaging:23.3.1'
  implementation 'com.capacitorjs:capacitor-push-notifications:5.0.7'
}
```

---

## **Step 6: Test Push Notifications**

### A. Web
```bash
npm run dev
# Apri browser: http://localhost:5173
# Vai Settings → controlla che Firebase sia caricato
# Check console (F12) per errori Firebase
```

### B. Android
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## **Step 7: Invia Test Push** (da backend o console)

### Opzione A: Uso Console Firebase (facile)
```
Firebase Console → 
  Messaggi (sinistra) →
    Cloud Messaging →
      Click "Invia il primo messaggio"
      
Titolo: Test
Testo: Ciao!
Target: App Android (com.scadenze.app)
Click "Invia"

Dovrebbe arrivare notifica su telefono
```

### Opzione B: Da Node.js (backend)
```javascript
// Script di test
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'YOUR_PROJECT_ID'
});

admin.messaging().send({
  notification: {
    title: 'Test Scadenza',
    body: 'Prova notifica ScadenzeApp'
  },
  android: {
    priority: 'high'
  },
  apns: {
    headers: {
      'apns-priority': '10',
    },
  },
  tokens: ['DEVICE_TOKEN'] // da app
});
```

---

## **Troubleshooting**

### ❌ "Firebase non caricato"
```
1. Controlla src/main.jsx → firebaseConfig
2. Verifica: npm run dev (senza errori)
3. F12 → Console → cerca errori Firebase
4. Cancella localStorage
```

### ❌ "Push non funziona su Android"
```
1. Controlla google-services.json in android/app/
2. Verifica build.gradle ha firebase dependency
3. Ricompila: npx cap sync && ./gradlew assembleDebug
4. Adb logcat | grep -i firebase
```

### ❌ "Errore download google-services.json"
```
1. Firebase Console → Impostazioni Progetto
2. Sotto "Le tue app" → seleziona app Android
3. Click "Scarica google-services.json"
4. Se non vedi, aggiungi app come descritto Step 5A
```

### ❌ "Package name non trovato"
```
Assicurati che android/app/build.gradle contenga:
  applicationId "com.scadenze.app"
```

---

## **Checklist**

- [ ] Progetto Firebase creato
- [ ] firebaseConfig in src/main.jsx
- [ ] Cloud Messaging abilitato
- [ ] google-services.json in android/app/
- [ ] build.gradle aggiornati con Firebase
- [ ] App web avviata: npm run dev ✅
- [ ] App Android compilata ✅
- [ ] Notifica test ricevuta ✅

---

**Pronto per il deploy! 🚀🔥**
