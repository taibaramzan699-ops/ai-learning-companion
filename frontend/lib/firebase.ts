import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasValidConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;

if (hasValidConfig) {
  try {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
  } catch (err) {
    console.error("Firebase init failed:", err);
    firebaseApp = undefined;
    auth = undefined;
  }
} else {
  console.error(
    "Missing NEXT_PUBLIC_FIREBASE_* env vars — auth disabled until they are set at build time."
  );
}

export { firebaseApp, auth };