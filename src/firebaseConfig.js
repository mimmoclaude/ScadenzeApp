// ─── Firebase Configuration ───────────────────────────────────────────────────
// Configurazione del progetto Firebase DEDICATO a ScadenzeApp
// (separato dal progetto Google Cloud usato per OAuth Calendar/Gmail)
//
// Per ottenere questi valori:
//   1. Vai su https://console.firebase.google.com/
//   2. Crea progetto "scadenze-app-push" (o nome a scelta)
//   3. Aggiungi app Web → copia firebaseConfig
//   4. Sostituisci i placeholder qui sotto
//
// NOTA: questi valori NON sono segreti - sono identificatori client pubblici.
// La sicurezza è garantita dalle Firestore Security Rules.
// ──────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// VAPID key per Web Push (solo browser, non Android)
// Firebase Console → Project Settings → Cloud Messaging → Web configuration → Generate key pair
export const VAPID_KEY = "YOUR_VAPID_KEY";

// Flag: se true → skip inizializzazione Firebase (utile finché i valori sopra sono placeholder)
export const FIREBASE_CONFIGURED = !firebaseConfig.apiKey.startsWith("YOUR_");
