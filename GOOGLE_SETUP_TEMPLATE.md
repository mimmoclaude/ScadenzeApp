# 🔐 Google OAuth Client ID - Setup Template

## 📋 Step-by-Step (10 minuti)

### 1️⃣ Vai a Google Cloud Console
```
https://console.cloud.google.com
```

### 2️⃣ Crea Nuovo Progetto
```
Click "Seleziona un Progetto" (in alto)
Click "+ Nuovo Progetto"
Nome: ScadenzeApp-Google
Click "Crea"
Aspetta 1-2 minuti...
```

### 3️⃣ Abilita API (Calendar + Gmail)
```
Ricerca in alto: "Google Calendar API"
Click risultato
Click "Abilita"

Poi ripeti per:
- "Gmail API" → "Abilita"
```

### 4️⃣ Crea OAuth Credentials
```
Sinistra: "Credenziali" (🔐)
Click "+ Crea Credenziale"
Vedi errore "Schermata di consenso"?
  → Click "Configura schermata di consenso"
  → Tipo utente: "Esterno"
  → Click "Crea"
  → Compila:
     App name: ScadenzeApp
     User support: tua@gmail.com
     Developer contact: tua@gmail.com
  → Click "Salva e continua"
  → Click "Torna a credenziali"

Click "+ Crea Credenziale" → "ID client OAuth 2.0"
Tipo: "Applicazione Web"

⚠️ IMPORTANTE - Aggiungi "Origini JavaScript autorizzate":
  http://localhost:5173
  http://localhost:3000
  http://127.0.0.1:5173

Click "Crea"
```

### 5️⃣ Copia Client ID
```
Vedi il popup con il Client ID?
Es: 123456789-abc.apps.googleusercontent.com

⭐ COPIA QUESTO ID
```

### 6️⃣ Incolla in ScadenzeApp
```
Avvia l'app: npm run dev
Apri: http://localhost:5173
Vai su "Impostazioni" (⚙️) tab
Incolla il Client ID nel campo
Click "🔑 Accedi con Google"
```

---

## 📝 Template Client ID

Quando ottieni il Client ID, compilare qua:

```
GOOGLE_CLIENT_ID=
[COPIA QUI IL TUO CLIENT ID]
Esempio: 123456789-abc.apps.googleusercontent.com
```

---

## ⚠️ Possibili Errori

### "Origine non autorizzata"
```
Soluzione:
1. Google Cloud Console
2. Credenziali
3. Clicca su OAuth 2.0 Client ID
4. Aggiungi la tua origine:
   - http://localhost:5173 (dev)
   - https://tuo-dominio.netlify.app (produzione)
5. Click "Salva"
```

### "Schermata di consenso non configurata"
```
Soluzione:
1. Credenziali → "Configura schermata di consenso"
2. Completa il form (anche se sono test)
3. Torna a credenziali
4. Ricrea OAuth Client ID
```

### "Invalid Client ID"
```
Soluzione:
1. Verifica che termini con ".apps.googleusercontent.com"
2. Ricopia dal console Google (potrebbe essere incollato male)
3. Verifica che sia per "Applicazione Web" (non mobile)
```

---

## ✅ Test che Funziona

```
1. Avvia app: npm run dev
2. Vai Impostazioni (⚙️)
3. Incolla Client ID
4. Click "🔑 Accedi con Google"
5. Seleziona il tuo account
6. Click "Accetta"
7. Vedi "✅ Connesso come tu@gmail.com"? ✅
```

---

## 🎁 Bonus: Quote Gratuite

```
Google Calendar API:
  ✅ Gratis: 1,000,000 richieste/giorno
  ✅ Sufficiente per: 10,000+ utenti

Gmail API:
  ✅ Gratis: 1,000,000 richieste/giorno
  ✅ Sufficiente per: 10,000+ utenti

Quando pagare?
  ❌ Mai! Se rimani entro quota.
```

---

**Pronto! Una volta ottenuto Client ID, l'app funziona al 100%! 🚀**
