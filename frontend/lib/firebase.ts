import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Real Firebase config — values come from your Firebase project settings.
// Set these in frontend/.env.local (see .env.example).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Only initialize Auth when a real API key is present. This keeps the production
// build (static prerender of pages like /login) from crashing with
// auth/invalid-api-key when the NEXT_PUBLIC_FIREBASE_* vars aren't set yet. Once
// those vars are supplied at build time, auth initializes normally in the browser.
export const auth: Auth = firebaseConfig.apiKey
  ? getAuth(firebaseApp)
  : (undefined as unknown as Auth);
