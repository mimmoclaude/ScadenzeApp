// ─── FCM / Push Notifications (Capacitor nativo + Web) ───────────────────────
// Registra il device FCM token e gestisce l'arrivo delle notifiche push.
// ──────────────────────────────────────────────────────────────────────────────

import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirebaseApp } from './firebase';
import { VAPID_KEY, FIREBASE_CONFIGURED } from './firebaseConfig';

// ─── Richiede il permesso e restituisce il device token FCM ──────────────────
// Callback: onToken(fcmToken) viene chiamata quando il token è disponibile
// Callback: onNotification(notif) quando arriva una push in foreground
export async function registerPush({ onToken, onNotification }) {
  if (!FIREBASE_CONFIGURED) {
    console.warn('[FCM] Firebase non configurato - skip registrazione push');
    return { ok: false, reason: 'not-configured' };
  }

  // ── ANDROID NATIVO ──
  if (Capacitor.isNativePlatform()) {
    try {
      const perm = await PushNotifications.checkPermissions();
      let status = perm.receive;
      if (status !== 'granted') {
        const req = await PushNotifications.requestPermissions();
        status = req.receive;
      }
      if (status !== 'granted') {
        return { ok: false, reason: 'permission-denied' };
      }

      // Rimuovi listener precedenti per evitare duplicati
      await PushNotifications.removeAllListeners();

      // Listener: token ricevuto da FCM
      await PushNotifications.addListener('registration', (token) => {
        console.log('[FCM] Device token ricevuto:', token.value.substring(0, 20) + '...');
        onToken?.(token.value);
      });

      // Listener: errore registrazione
      await PushNotifications.addListener('registrationError', (err) => {
        console.error('[FCM] Errore registrazione:', err);
      });

      // Listener: notifica ricevuta (app in foreground)
      await PushNotifications.addListener('pushNotificationReceived', (notif) => {
        console.log('[FCM] Push ricevuta (foreground):', notif);
        onNotification?.(notif);
      });

      // Listener: tap su notifica
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[FCM] Tap su notifica:', action);
      });

      // Registra con FCM
      await PushNotifications.register();
      return { ok: true, platform: 'android' };
    } catch (e) {
      console.error('[FCM native]', e);
      return { ok: false, reason: e.message };
    }
  }

  // ── WEB (browser) ──
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      return { ok: false, reason: 'browser-unsupported' };
    }
    const perm = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();
    if (perm !== 'granted') {
      return { ok: false, reason: 'permission-denied' };
    }
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const app = getFirebaseApp();
    if (!app) return { ok: false, reason: 'firebase-not-init' };
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (token) onToken?.(token);
    onMessage(messaging, (payload) => {
      console.log('[FCM web] Messaggio ricevuto:', payload);
      onNotification?.(payload);
    });
    return { ok: true, platform: 'web' };
  } catch (e) {
    console.error('[FCM web]', e);
    return { ok: false, reason: e.message };
  }
}

// ─── Rimuove tutti i listener push ───────────────────────────────────────────
export async function unregisterPush() {
  if (Capacitor.isNativePlatform()) {
    try { await PushNotifications.removeAllListeners(); } catch {}
  }
}
