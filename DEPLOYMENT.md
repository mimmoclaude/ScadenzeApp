# 🚀 Deployment - Web + Play Store

Guida per deployare ScadenzeApp in produzione (web + Android).

---

## **Parte A: Deploy Web**

### Option 1: Netlify (Gratuito + Facile) ✅ Consigliato

```bash
# 1. Installa Netlify CLI
npm install -g netlify-cli

# 2. Build
npm run build

# 3. Login e deploy
netlify deploy --prod --dir=dist
# → Seleziona cartella: dist/
# → Copia URL deployment

# URL finale: https://your-site.netlify.app
```

**Oppure**: Connetti repo GitHub → auto-deploy ad ogni push

### Option 2: Vercel
```bash
npm install -g vercel
vercel --prod --name scadenze-app
# Segui prompts
# URL: https://scadenze-app.vercel.app
```

### Option 3: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Seleziona progetto: ScadenzeApp
# Public directory: dist

npm run build
firebase deploy
# URL: https://scadenze-app.web.app
```

---

## **Parte B: Deploy Android - Play Store**

### Step 1: Crea Keystore per firma
```bash
# Una sola volta (genera chiave privata)
keytool -genkey -v -keystore scadenze-app.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias scadenze-app

# Domande:
# First and last name: Tuo Nome
# Organization: Tuo Nome o Azienda
# City: Città
# State: Provincia
# Country code: IT
# Password: scegli password forte

# Salva scadenze-app.keystore in root progetto (BACKUP!)
```

### Step 2: Configura Android Studio

Apri `android/app/build.gradle`:

```gradle
android {
  ...
  signingConfigs {
    release {
      storeFile file("/path/to/scadenze-app.keystore")
      storePassword "TUA_PASSWORD"
      keyAlias "scadenze-app"
      keyPassword "TUA_PASSWORD"
    }
  }
  
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

### Step 3: Build APK/AAB Release

```bash
cd android

# Build AAB (Android App Bundle - per Play Store)
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab

# Oppure APK standalone
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/app-release.apk
```

### Step 4: Crea account Google Play

1. Vai a [play.google.com/apps/publish](https://play.google.com/apps/publish)
2. Iscriviti (costa $25 una volta)
3. Accetta termini

### Step 5: Carica su Google Play

1. **Google Play Console** → **"Crea app"**
2. Nome: `ScadenzeApp`
3. Abilita:
   - [ ] App
   - [ ] Prezzo: Gratis
   - [ ] Categoria: Finanza o Produttività

4. **Pubblica** → **Versione** → **Crea release**

5. Upload `app-release.aab`:
   - Click "Carica"
   - Scegli il file
   - Compila:
     ```
     Numero versione: 1.0
     Note versione: Prima versione pubblica
     ```

6. **Completa forma descrittiva**:
   - Screenshot (min 2)
   - Icona app (192x192, 512x512)
   - Descrizione
   - Categorie
   - Valutazione contenuti (ESRQ)

7. Click **"Invia per la revisione"**

Aspetta 24-48h per approvazione Google.

---

## **Parte C: Aggiornamenti Futuri**

### Web
```bash
# Fai modifiche al codice
git add .
git commit -m "Feature: ..."

# Deploy automatico (se con GitHub)
git push origin main
# Netlify/Vercel/Firebase auto-deployed

# Oppure manuale:
npm run build
netlify deploy --prod --dir=dist
```

### Android
```bash
# Aggiorna versione in android/app/build.gradle:
versionCode 2  // incrementa di 1
versionName "1.1.0"

npm run build
npx cap sync android
cd android
./gradlew bundleRelease

# Upload nuovo AAB a Google Play Console
# → Pubblica come nuovo release
```

---

## **Configurazioni Produzione**

### Environment Variables
Crea `.env.production`:
```env
VITE_FIREBASE_API_KEY=prod-key
VITE_FIREBASE_PROJECT_ID=scadenze-app-prod
VITE_ANTHROPIC_API_KEY=prod-key
```

### Android Manifest
Assicurati `AndroidManifest.xml` abbia:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

### Google OAuth URLs
Aggiungi in Google Cloud Console:
```
Authorized origins:
  https://your-site.netlify.app
  https://your-site.vercel.app
  https://scadenze-app.web.app
```

---

## **Monitoring**

### Web
- **Netlify Analytics**: dashboard.netlify.com
- **Google Analytics**: (optional, aggiungi GA4)

### Android
- **Google Play Console**: crash reports, reviews
- **Firebase Crashlytics**: (optional)

---

## **Troubleshooting Deploy**

### ❌ Build fallisce
```bash
# Cancella cache
rm -rf node_modules dist android/.gradle
npm install
npm run build
```

### ❌ APK firma fallisce
```bash
# Verifica password keystore
keytool -list -v -keystore scadenze-app.keystore
# Controlla build.gradle passwords
```

### ❌ Play Store rifiuta app
```
Cause comuni:
- Icona manca (512x512)
- Screenshot insufficienti
- Descrizione troppo breve
- Policy violations (es. non rispetta privacy)

Soluzione:
→ Google Play Console → Review feedback
→ Correggi errori
→ Riprova
```

---

## **Checklist Pre-Launch**

- [ ] Web deployato e funzionante
- [ ] Android keystore creato
- [ ] AAB compilato senza errori
- [ ] Google Play account creato
- [ ] App descrizione completa
- [ ] Privacy policy aggiunta
- [ ] Screenshot di alta qualità (min 4)
- [ ] Nessuna API key esposte
- [ ] Firebase in produzione configurato
- [ ] Test completo su dispositivo reale

---

**Pronto per il lancio! 🎉📱**
