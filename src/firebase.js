// ─── Firebase Init + Firestore sync ───────────────────────────────────────────
// Inizializza Firebase app + Firestore e fornisce helper per sync scadenze/token
// ──────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig, FIREBASE_CONFIGURED } from './firebaseConfig';

let fbApp = null;
let db = null;

export function initFirebase() {
  if (!FIREBASE_CONFIGURED) {
    console.warn('[Firebase] Configurazione mancante - sync disabilitata. Compila src/firebaseConfig.js');
    return null;
  }
  if (getApps().length === 0) {
    fbApp = initializeApp(firebaseConfig);
  } else {
    fbApp = getApps()[0];
  }
  db = getFirestore(fbApp);
  return fbApp;
}

export function getFirebaseApp() { return fbApp; }
export function getDb() { return db; }

// Sanitize email per usarla come docId (Firestore non accetta "/" ma accetta "@" e ".")
function emailToDocId(email) {
  return email.toLowerCase().trim().replace(/[#$\[\]\/]/g, '_');
}

// ─── Utente: salva profilo (email, fcmToken, preferenze notifiche) ────────────
export async function saveUserProfile({ email, fcmToken, enablePush, notifyDays }) {
  if (!db || !email) return;
  const userRef = doc(db, 'users', emailToDocId(email));
  const payload = {
    email,
    updatedAt: serverTimestamp(),
  };
  if (fcmToken !== undefined) payload.fcmToken = fcmToken;
  if (enablePush !== undefined) payload.enablePush = enablePush;
  if (notifyDays !== undefined) payload.notifyDays = notifyDays;
  await setDoc(userRef, payload, { merge: true });
}

// ─── Scadenze: sync completo di tutte le scadenze in Firestore ────────────────
// Strategia "replace all": cancella vecchie + scrive nuove in un batch
// (semplice e sufficiente per volumi piccoli < 500 scadenze/utente)
export async function syncPaymentsToFirestore(email, payments) {
  if (!db || !email) return;
  const batch = writeBatch(db);
  const userDocId = emailToDocId(email);
  const paymentsCol = collection(db, 'users', userDocId, 'payments');

  // Scrive tutte le scadenze (merge:false = sovrascrive)
  for (const p of payments) {
    const pRef = doc(paymentsCol, String(p.id));
    batch.set(pRef, {
      id: p.id,
      title: p.title,
      amount: p.amount,
      dueDate: p.dueDate,
      recurrence: p.recurrence,
      category: p.category,
      notes: p.notes || '',
      paid: !!p.paid,
      synced: !!p.synced,
      emailed: !!p.emailed,
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

// ─── Scadenza singola: crea/aggiorna ──────────────────────────────────────────
export async function upsertPayment(email, payment) {
  if (!db || !email) return;
  const pRef = doc(db, 'users', emailToDocId(email), 'payments', String(payment.id));
  await setDoc(pRef, {
    ...payment,
    notes: payment.notes || '',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ─── Scadenza singola: elimina ────────────────────────────────────────────────
export async function deletePaymentFromFirestore(email, paymentId) {
  if (!db || !email) return;
  const pRef = doc(db, 'users', emailToDocId(email), 'payments', String(paymentId));
  await deleteDoc(pRef);
}
