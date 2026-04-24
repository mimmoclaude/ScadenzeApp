# ScadenzeApp Push Notifications Implementation

## Overview

ScadenzeApp now includes **remote push notifications** for payment deadline reminders. The system works like this:

### Architecture

```
┌─────────────────────┐
│  Android Device     │
│  ├─ App (Capacitor) │
│  └─ Receives FCM    │
│     notifications   │
└──────────┬──────────┘
           │ FCM Token
           │ (registers on login)
           ▼
┌──────────────────────────┐
│  Firestore Database      │
│  ├─ /users/{email}/      │
│  │  ├─ fcmToken          │
│  │  ├─ enablePush        │
│  │  └─ notifyDays: [0,1] │
│  └─ /users/{email}/      │
│     payments/{id}        │
└──────────┬───────────────┘
           │ (Sync on login)
           │
           ▼
┌─────────────────────────────────┐
│ GitHub Actions (Cron Job)       │
│ - Runs daily at 08:00 CEST      │
│ - Fetches users from Firestore  │
│ - Checks payment deadlines      │
│ - Sends FCM notifications       │
└─────────────────────────────────┘
```

---

## Frontend Components

### 1. **src/firebaseConfig.js**
Centralized Firebase configuration and detection logic.

**Key exports:**
- `firebaseConfig`: Configuration object for Firebase initialization
- `VAPID_KEY`: Public key for Web Push (browser notifications)
- `FIREBASE_CONFIGURED`: Boolean flag - true if Firebase is set up

Users must replace placeholder values with their real Firebase project credentials.

### 2. **src/firebase.js**
Firestore database helpers for syncing user data and payments.

**Key functions:**
- `initFirebase()`: Initialize Firebase SDK (only if FIREBASE_CONFIGURED)
- `saveUserProfile(email, fcmToken, enablePush, notifyDays)`: Store user settings in Firestore
- `syncPaymentsToFirestore(email, payments)`: Upload all payments to Firestore
- `upsertPayment(email, payment)`: Add or update a single payment
- `deletePaymentFromFirestore(email, paymentId)`: Remove a payment

Firestore schema:
```
/users/{email}/
  ├─ fcmToken: string
  ├─ enablePush: boolean
  ├─ notifyDays: array [0, 1, 3, 7]
  └─ payments/{paymentId}/
     ├─ description: string
     ├─ amount: number
     ├─ dueDate: ISO string
     └─ paid: boolean
```

### 3. **src/fcm.js**
Capacitor push registration and Firebase Web Push handling.

**Key functions:**
- `registerPush({ onToken, onNotification })`: 
  - On Android: Uses `@capacitor/push-notifications` for native FCM
  - On Web: Uses Firebase Messaging API with VAPID key
  - Calls `onToken(tokenString)` when token is registered
  - Calls `onNotification(payload)` when notification arrives

### 4. **src/App.jsx** (Modified)
Integrated FCM registration and Firestore sync.

**New state:**
- `enablePush`: Boolean - whether push notifications are enabled
- `notifyDays`: Array of days in advance to notify (0=today, 1=tomorrow, 3=3 days, 7=1 week)
- `fcmToken`: The registered FCM token string

**New effects:**
- When user logs in (`userEmail` changes): Register for FCM push
  - Calls `registerPush()` from fcm.js
  - Stores `fcmToken` in state and Firestore
  - Saves user settings and current payments to Firestore

- When `notifyDays` changes: Update Firestore immediately
  - User changes notification preferences → synced to database

**New functions:**
- `handleTogglePush(enabled)`: Enable/disable notifications
- `handleSetNotifyDays(days)`: Update which days to be notified
- `syncAllToFirestore()`: Manual trigger to re-sync all payments to cloud

### 5. **src/pages/Settings.jsx** (Modified)
Added push notification configuration UI.

**New card: "🔔 Notifiche push"**
- Toggle switch to enable/disable push notifications
  - Disabled if Firebase not configured or user not logged in
- Button selector for advance days: 0 (today), 1 (tomorrow), 3 (3 days), 7 (1 week)
  - Multiple selections allowed
- Status display: "✅ Dispositivo registrato" or "⏳ In attesa token..."
- Manual sync button: "☁️ Sincronizza scadenze su cloud"

**Fixed issues:**
- `handleExport`: Now uses `navigator.share()` on Android (Capacitor WebView), falls back to clipboard
- `handleImport`: Direct `<label>` wrapping `<input type="file">` (no JS click cascade)

---

## Backend: GitHub Actions Cron Job

### File: `.github/workflows/send-push-notifications.yml`

**Trigger**: Daily at 06:00 UTC (08:00 CEST)  
**Languages**: Bash + Node.js (pure crypto, no external packages)  
**Authentication**: Service Account JWT (Firebase Admin SDK style)

**What it does:**
1. Authenticates to Firebase using `FIREBASE_SERVICE_ACCOUNT_B64` secret
2. Queries Firestore for all users with push enabled
3. For each user:
   - Fetches their payment list
   - Filters payments within their configured `notifyDays`
   - Sends FCM notification via REST API v1
4. Logs success/failure statistics

**Required GitHub Secrets:**
- `FIREBASE_PROJECT_ID`: Your Firebase project ID (e.g., "scadenze-app-push")
- `FIREBASE_SERVICE_ACCOUNT_B64`: Base64-encoded service account JSON key

---

## CI/CD: Android APK Build

### File: `.github/workflows/build-apk.yml`

**New steps:**

1. **Inject google-services.json from Secret**
   - If `GOOGLE_SERVICES_JSON_B64` secret exists: decodes and writes to `android/app/google-services.json`
   - If not: creates placeholder JSON (allows building without Firebase, notifications disabled)

2. **Generate Android app icons from SVG**
   - Reads `resources/icon.svg` (Icon #9: calendar + checkmark)
   - Uses `rsvg-convert` (librsvg2-bin) + ImageMagick
   - Generates icons for: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
   - Also creates adaptive icon (foreground + background) for modern Android

3. **Inject signing configuration**
   - Creates `signingConfigs` block in build.gradle with debug keystore
   - Injects `signingConfig signingConfigs.debug` into debug buildType

4. **Conditionally apply Firebase Gradle plugin**
   - If `google-services.json` is real (not placeholder): applies `com.google.gms.google-services`
   - If placeholder: skips plugin (allows build to succeed without FCM)
   - Injects classpath into root `build.gradle` buildscript dependencies

5. **Build APK**
   - Runs `./gradlew clean && ./gradlew assembleDebug -x lint`
   - Skips lint with `-x lint` to allow placeholder JSON

6. **Upload artifact**
   - Saves APK to GitHub Actions artifacts for download
   - On tag: Also creates GitHub Release with APK

---

## User Setup Checklist

To enable push notifications, users must:

### 1. Create Firebase Project
- [ ] Go to https://console.firebase.google.com/
- [ ] Create new project: "scadenze-app-push"
- [ ] Add Web app and get `firebaseConfig`
- [ ] Generate VAPID key for Web Push

### 2. Update Frontend Config
- [ ] Edit `src/firebaseConfig.js`
- [ ] Replace placeholder values with real config

### 3. Set Up Firestore
- [ ] Enable Firestore Database
- [ ] Apply Security Rules (protect data by email)

### 4. Create Backend Service Account
- [ ] Create Service Account in Firebase Project Settings
- [ ] Download JSON key
- [ ] Convert to Base64
- [ ] Add as GitHub Secret: `FIREBASE_SERVICE_ACCOUNT_B64`

### 5. Register Android App
- [ ] Add Android app in Firebase Console
- [ ] Download `google-services.json`
- [ ] Save to `android/app/google-services.json` (or add as secret `GOOGLE_SERVICES_JSON_B64`)

### 6. Build & Deploy
- [ ] Commit changes and push to GitHub
- [ ] CI automatically builds APK with Firebase configuration
- [ ] Download APK from Actions artifacts

### 7. Install & Test
- [ ] Install APK on Android device
- [ ] Login with Google
- [ ] Enable notifications in Settings
- [ ] Wait for daily cron (08:00 CEST) or manually trigger

---

## Technical Details

### Firebase SDK Usage

**Frontend (React):**
- `firebase/app`: Initialization
- `firebase/firestore`: Real-time database sync
- `firebase/messaging`: Web Push API (browser only)

**Backend (GitHub Actions):**
- Pure Node.js with crypto built-ins
- No external Firebase packages
- Manual JWT signing for Service Account auth
- REST API v1 for FCM push sending

### Push Notification Payload

The backend sends notifications like:

```json
{
  "message": {
    "token": "FCM_TOKEN_HERE",
    "notification": {
      "title": "Scadenza in arrivo: Pagamento XYZ",
      "body": "Tra 1 giorno scade il pagamento di €250"
    },
    "data": {
      "paymentId": "payment-123",
      "dueDate": "2026-04-25",
      "deepLink": "app://payments/payment-123"
    },
    "android": {
      "priority": "high",
      "notification": {
        "sound": "default",
        "channelId": "payment_reminders"
      }
    }
  }
}
```

### Capacitor Integration

Android app uses `@capacitor/push-notifications` v5.0.7:
- `PushNotifications.requestPermissions()`: Ask user for notification access
- `PushNotifications.register()`: Register device for FCM
- `addListener('registration', callback)`: Receive FCM token
- `addListener('pushNotificationReceived', callback)`: Handle notification when app is open

---

## Known Limitations

1. **Web browser push**: Not currently implemented
   - VAPID key is prepared but no service worker
   - Desktop/PWA support could be added later

2. **Notification channels**: Android uses default channel
   - Could be customized per notification type

3. **Token refresh**: Not currently handled
   - Should refresh token every 7 days (FCM best practice)

4. **Offline sync**: Payments are synced on login only
   - Real-time sync could be added later

---

## Troubleshooting

### Build fails: "google-services.json not found"
- Add `GOOGLE_SERVICES_JSON_B64` GitHub Secret, OR
- Manually save `google-services.json` to `android/app/`

### Notifications not arriving on Android
- Check: Settings → Notifications enabled
- Check: Firestore user settings have `enablePush: true`
- Check: GitHub Actions log shows notifications sent
- Check: Device token is registered (Settings shows ✅)

### "Firebase not configured" in app
- Check: No placeholder values in `src/firebaseConfig.js`
- Check: `FIREBASE_CONFIGURED` flag is true in frontend

### Manual test notification
```bash
# Requires GitHub token and service account
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/mimmoclaude/ScadenzeApp/actions/workflows/send-push-notifications.yml/dispatches \
  -d '{"ref":"main"}'
```

---

## Files Added/Modified

**New files:**
- `src/firebaseConfig.js` - Firebase configuration
- `src/firebase.js` - Firestore database helpers
- `src/fcm.js` - Push registration (Capacitor + Web)
- `.github/workflows/send-push-notifications.yml` - Cron job for sending FCM
- `FIREBASE_SETUP_GUIDE.md` - User setup instructions
- `resources/icon.svg` - App icon #9 (calendar + checkmark)

**Modified files:**
- `src/App.jsx` - Added FCM integration
- `src/pages/Settings.jsx` - Added push configuration UI and fixed export/import
- `.github/workflows/build-apk.yml` - Added Firebase and icon generation steps

---

## Next Steps

1. ✅ Frontend: FCM registration on login
2. ✅ Frontend: Firestore data sync
3. ✅ Backend: Cron job for sending FCM notifications
4. ✅ CI/CD: Build with google-services.json
5. ⏳ User: Set up Firebase project (see FIREBASE_SETUP_GUIDE.md)
6. ⏳ User: Test on Android device

Once the APK builds successfully, users can follow the setup guide to enable push notifications!
