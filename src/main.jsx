import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
// import './mockGoogle'; // Disabled - using real Google OAuth
import { initializeApp } from 'firebase/app';
import { getMessaging, onMessage } from 'firebase/messaging';
import { initDB } from './db';

// ── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Push Notifications (solo se browser supporta)
if ('serviceWorker' in navigator && 'Notification' in window) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});

  try {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Messaggio ricevuto:', payload);
      const { title, body } = payload.notification;
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192x192.png' });
      }
    });
  } catch (e) {
    console.log('Firebase Messaging non disponibile');
  }
}

// Inizializza IndexedDB
initDB();

// Render App
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
