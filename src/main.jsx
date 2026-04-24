import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initDB } from './db';
import { initFirebase } from './firebase';

// Inizializza Firebase (se configurato) - i listener push vengono gestiti in App.jsx
initFirebase();

// Inizializza IndexedDB
initDB();

// Render App
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
