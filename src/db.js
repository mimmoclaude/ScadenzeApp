import { openDB } from 'idb';

let db;

export async function initDB() {
  db = await openDB('ScadenzeAppDB', 2, {
    upgrade(db, oldVersion) {
      // ── v1: pagamenti e impostazioni ─────────────────────────────────────
      if (oldVersion < 1) {
        const pStore = db.createObjectStore('payments', { keyPath: 'id' });
        pStore.createIndex('dueDate', 'dueDate');
        pStore.createIndex('category', 'category');
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      // ── v2: appuntamenti ─────────────────────────────────────────────────
      if (oldVersion < 2) {
        const aStore = db.createObjectStore('appointments', { keyPath: 'id' });
        aStore.createIndex('date', 'date');
        aStore.createIndex('category', 'category');
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

// ── Appointments CRUD ────────────────────────────────────────────────────────
export async function getAppointments() {
  const db = await getDB();
  return db.getAll('appointments');
}

export async function addAppointment(appt) {
  const db = await getDB();
  appt.id = appt.id || Date.now();
  await db.add('appointments', appt);
  return appt.id;
}

export async function updateAppointment(appt) {
  const db = await getDB();
  await db.put('appointments', appt);
}

export async function deleteAppointment(id) {
  const db = await getDB();
  await db.delete('appointments', id);
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
