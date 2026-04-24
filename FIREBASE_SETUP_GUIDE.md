# Firebase Setup Guide per ScadenzeApp

Questa guida mostra come configurare Firebase Cloud Messaging (FCM) per le notifiche push remote su Android.

## Panoramica

ScadenzeApp usa **due progetti Google completamente separati**:

1. **Google Cloud Project** (già configurato)
   - Usato per: OAuth login con Google Calendar e Gmail
   - Client ID configurato in: `src/App.jsx`

2. **Firebase Project** (da creare)
   - Usato per: Cloud Messaging (FCM) per notifiche push
   - Backend: GitHub Actions cron job (daily schedule)
   - Frontend: Capacitor Push Notifications plugin

---

## Passo 1: Creare un progetto Firebase

1. Vai a https://console.firebase.google.com/
2. Clicca **"Aggiungi progetto"**
3. Nome progetto: `scadenze-app-push` (o a tua scelta)
4. Disabilita Google Analytics (non necessario)
5. Clicca **"Crea progetto"** e attendi ~2 min

---

## Passo 2: Aggiungere l'app Web a Firebase

1. Nel dashboard Firebase, clicca l'icona **`</>`** (Add app)
2. Scegli **Web**
3. Registra l'app con nickname: `ScadenzeApp Web`
4. Copia i 6 valori mostrati:
   ```javascript
   {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```

### Incolla in `src/firebaseConfig.js`

Apri `src/firebaseConfig.js` e sostituisci i placeholder con i veri valori:

```javascript
export const firebaseConfig = {
  apiKey: "AIzaSyD...",  // <-- INCOLLA QUI
  authDomain: "scadenze-app-push.firebaseapp.com",
  projectId: "scadenze-app-push",
  storageBucket: "scadenze-app-push.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd..."
};

export const VAPID_KEY = "BMrk...";  // Vedi Passo 3
```

---

## Passo 3: Generare la VAPID Key (per Web Push)

1. Nel dashboard Firebase, vai **Project Settings** (ingranaggio in alto a destra)
2. Tab **Cloud Messaging**
3. Sezione **Web configuration** → clicca **"Generate key pair"**
4. Copia la public key e incollala in `src/firebaseConfig.js`:

```javascript
export const VAPID_KEY = "BMrk1234...";
```

> **Nota**: La VAPID key è pubblica e va condivisa nel browser.

---

## Passo 4: Abilitare Cloud Firestore

1. Nel dashboard Firebase, vai **Firestore Database**
2. Clicca **"Crea database"**
3. Seleziona: **produzione** (location predefinita va bene)
4. Clicca **"Abilita"**

> I dati Firestore include: profili utenti, token FCM, preferenze notifiche, liste pagamenti sincronizzate.

---

## Passo 5: Configurare Firestore Security Rules

Sostituisci le default rules con queste (proteggono i dati per email):

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Accesso agli utenti: solo chi ha quell'email può leggere/scrivere
    match /users/{email} {
      allow read, write: if request.auth != null && request.auth.token.email == email;
    }
    // Accesso ai pagamenti: solo chi è proprietario
    match /users/{email}/payments/{paymentId} {
      allow read, write: if request.auth != null && request.auth.token.email == email;
    }
  }
}
```

1. Nel dashboard Firestore, vai **Rules**
2. Copia il codice sopra e pubblica

---

## Passo 6: Creare un Service Account per il Backend (GitHub Actions)

Il cron job di GitHub Actions ha bisogno di autenticarsi a Firebase per inviare FCM push.

### 6a: Genera un Service Account

1. Dashboard Firebase → **Project Settings** → **Service Accounts**
2. Clicca **"Genera nuova chiave privata"**
3. Download il file JSON (es. `scadenze-app-push-firebase-adminsdk.json`)

### 6b: Converti il JSON in Base64

```bash
# Su Windows PowerShell:
$json = Get-Content scadenze-app-push-firebase-adminsdk.json -Raw
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))
Set-Clipboard -Value $encoded
echo "Base64 copied to clipboard"

# Su macOS/Linux:
cat scadenze-app-push-firebase-adminsdk.json | base64 | pbcopy
# o
base64 -w 0 scadenze-app-push-firebase-adminsdk.json | xclip -selection clipboard
```

> **Usa solo su device locale!** Non condividere mai il file JSON o il Base64 con chiunque.

### 6c: Aggiungi il Secret a GitHub

1. Vai a **GitHub** → repository Settings → **Secrets and variables** → **Actions**
2. Clicca **"New repository secret"**
3. Name: `FIREBASE_SERVICE_ACCOUNT_B64`
4. Value: incolla il Base64 da sopra
5. Clicca **"Add secret"**

---

## Passo 7: Aggiungere l'app Android a Firebase

Per abilitare FCM su Android, Firebase richiede il file `google-services.json`.

### 7a: Registra l'app Android

1. Dashboard Firebase → **Project Settings**
2. Tab **Le tue app** → clicca **Aggiungi app** → **Android**
3. Package name: `com.scadenze.app`
4. SHA-1 fingerprint (opzionale per ora)
5. Registra

### 7b: Scarica `google-services.json`

1. Dopo la registrazione, scarica il file
2. **Salva in:** `android/app/google-services.json` (locale)
3. **Commit & push a GitHub** (il file è in .gitignore ma può essere commesso una volta)

> Oppure: aggiungi il file al `.gitignore` e usa un GitHub Secret per iniettarlo in CI (vedi Passo 8).

---

## Passo 8: Secret di github-services.json per CI (Opzionale)

Se preferisci NON committare il file sensitive, puoi aggiungerlo come secret a GitHub:

### 8a: Converti in Base64

```bash
cat android/app/google-services.json | base64 | clip  # Windows
# o
base64 -w 0 android/app/google-services.json | pbcopy  # macOS
```

### 8b: Aggiungi a GitHub Secrets

1. GitHub → Settings → Secrets → **New repository secret**
2. Name: `GOOGLE_SERVICES_JSON_B64`
3. Value: il Base64
4. Save

Il workflow CI automaticamente:
- Decodifica il secret
- Inietta il file in `android/app/google-services.json` durante la build
- Applica il plugin Gradle `com.google.gms.google-services`

---

## Passo 9: Verificare la Configurazione

Dopo aver completato i passi sopra:

### Nel frontend (React):

1. Apri l'app → **Settings**
2. Sezione **🔔 Notifiche push** deve mostrare:
   - ✅ **"Firebase configurato"** (non ⚠️ avvertimento)
   - Toggle per abilitare notifiche
   - Selezione giorni di anticipo

### Nel backend (GitHub Actions):

1. Vai a **Actions** → workflow **"send-push-notifications"**
2. Check che il primo run abbia **Status: Success**
3. Verificare che il log mostri:
   - `✅ Authenticated to Firebase`
   - `📧 Fetched X users from Firestore`
   - `📤 Sent Y FCM notifications`

---

## Passo 10: Test Manuale (Opzionale)

### Trigger il cron manualmente:

```bash
# Nel tuo PC, da cmd/PowerShell:
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/mimmoclaude/ScadenzeApp/actions/workflows/send-push-notifications.yml/dispatches \
  -d '{"ref":"main"}'
```

Sostituisci `YOUR_GITHUB_TOKEN` con un PAT da GitHub Settings.

---

## Troubleshooting

### ❌ "Firebase non configurato" nella app

**Causa**: valori placeholder in `src/firebaseConfig.js`

**Soluzione**:
1. Apri `src/firebaseConfig.js`
2. Verifica che nessun valore inizi con `YOUR_`
3. Salva e ricaricare l'app

### ❌ Notifiche non arrivano su Android

**Cause**:
1. App chiusa: FCM requires app è in foreground o ha permessi di notifica
   - Settings → App info → Notifications → abilita
2. Token non registrato: verifica in Settings che "✅ Dispositivo registrato" appaia
3. Giorni di anticipo non configurati: seleziona almeno un giorno in Settings
4. Backend cron non ha inviato: controlla GitHub Actions logs

### ❌ Build APK fails: "GOOGLE_SERVICES_JSON not found"

**Cause**:
1. Secret `GOOGLE_SERVICES_JSON_B64` non è stato aggiunto a GitHub
2. Oppure il secret è vuoto o malformato

**Soluzione**: Segui Passo 8 di nuovo

---

## Prossimi Passi

Una volta che la build APK completa con successo:

1. **Installa l'APK** su uno smartphone Android
2. **Accedi con Google** (Settings → "Accedi con Google")
3. **Abilita notifiche push** (Settings → "🔔 Notifiche push" → toggle ON)
4. **Scegli i giorni** di anticipo (0 = oggi, 1 = domani, 3 = fra 3 giorni, 7 = fra una settimana)
5. **Aspetta il cron** (esegue ogni giorno alle 08:00 CEST)
   - O triggeralo manualmente (vedi Passo 10)

Le notifiche arriveranno in background anche se l'app è chiusa! ✅

---

## Domande Frequenti

**D: Posso usare lo stesso progetto Google Cloud per OAuth e FCM?**  
R: Sì, ma è sconsigliato per motivi di sicurezza. È meglio usare due progetti separati.

**D: Cosa succede se non configuro Firebase?**  
R: L'app funziona normalmente ma senza notifiche push remote. Notifiche locali e sync Google Calendar continueranno a funzionare.

**D: Come cambio il cron job (es. ore diverse)?**  
R: Modifica `.github/workflows/send-push-notifications.yml`, riga `schedule: cron: '...'`

---

## Link Utili

- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs
- Capacitor Push Notifications: https://capacitorjs.com/docs/apis/push-notifications
- Cloud Messaging API: https://firebase.google.com/docs/cloud-messaging/migrate-v1
