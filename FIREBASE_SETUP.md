# Firebase Integration Guide

## 1. Install dependencies

```bash
npm install firebase
```

## 2. Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → give it a name → Continue
3. Disable Google Analytics if you don't need it → **Create project**

## 3. Enable Firestore

1. In the Firebase console sidebar → **Firestore Database** → **Create database**
2. Choose **Start in test mode** (you can lock it down later with rules)
3. Pick a region → **Enable**

## 4. Register a Web App and get your config

1. Project Overview → click the **</>** (Web) icon → Register app
2. Copy the `firebaseConfig` object shown

## 5. Add environment variables

Create a `.env` file in your project root (next to `package.json`):

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **Never commit `.env` to git.** Add it to `.gitignore`.

## 6. Drop in the new files

Copy these files from this output into your `src/` folder:

| File | Destination |
|---|---|
| `firebase.js` | `src/firebase.js` |
| `firestore.js` | `src/utils/firestore.js` |
| `App.jsx` | `src/App.jsx` (replace existing) |

## 7. Data structure in Firestore

All app data is stored as a **single document**:

```
Collection: ia-portal
Document:   appData
Fields:     { students: [...], courses: [...] }
```

Every save writes the whole document (suitable for this data volume). If your student list grows very large (1000+), consider splitting into sub-collections.

## 8. Firestore security rules (production)

Replace the test-mode rules with something like this once you're ready:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ia-portal/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Then add Firebase Authentication (Google sign-in is easiest) to restrict access.

## 9. Run the app

```bash
npm run dev
```

The app will load from Firestore on startup and save to Firestore on every change. A "Saving…" indicator appears in the top bar while writes are in flight.
