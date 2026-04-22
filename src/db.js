import { openDB } from 'idb';

let db;

export async function initDB() {
  db = await openDB('ScadenzeAppDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('payments')) {
        const store = db.createObjectStore('payments', { keyPath: 'id' });
        store.createIndex('dueDate', 'dueDate');
        store.createIndex('category', 'category');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
  return db;
}

export async function getDB() {
  if (!db) await initDB();
  return db;
}

// ── Payments CRUD ────────────────────────────────────────────────────────────
export async function getPayments() {
  const db = await getDB();
  return db.getAll('payments');
}

export async function addPayment(payment) {
  const db = await getDB();
  payment.id = payment.id || Date.now();
  await db.add('payments', payment);
  return payment.id;
}

export async function updatePayment(payment) {
  const db = await getDB();
  await db.put('payments', payment);
}

export async function deletePayment(id) {
  const db = await getDB();
  await db.delete('payments', id);
}

export async function deleteAllPayments() {
  const db = await getDB();
  await db.clear('payments');
}

// ── Settings ─────────────────────────────────────────────────────────────────
export async function getSetting(key, defaultValue = null) {
  const db = await getDB();
  const result = await db.get('settings', key);
  return result?.value ?? defaultValue;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function deleteSetting(key) {
  const db = await getDB();
  await db.delete('settings', key);
}

// ── Batch operations ─────────────────────────────────────────────────────────
export async function importPayments(payments) {
  const db = await getDB();
  const tx = db.transaction('payments', 'readwrite');
  for (const p of payments) {
    p.id = p.id || Date.now();
    await tx.store.put(p);
  }
  await tx.done;
}

export async function exportPayments() {
  const payments = await getPayments();
  const settings = {
    gClientId: await getSetting('gClientId'),
    userEmail: await getSetting('userEmail'),
    notifEmail: await getSetting('notifEmail'),
  };
  return { payments, settings, exportDate: new Date().toISOString() };
}

export async function importData(data) {
  await deleteAllPayments();
  await importPayments(data.payments);
  for (const [key, value] of Object.entries(data.settings)) {
    if (value) await setSetting(key, value);
  }
}
