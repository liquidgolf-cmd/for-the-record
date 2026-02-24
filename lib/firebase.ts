import { initializeApp, getApps, getApp as getExistingApp } from "firebase/app";
import { getAuth, GoogleAuthProvider }  from "firebase/auth";
import { getFirestore }                 from "firebase/firestore";
import { getMessaging, isSupported }    from "firebase/messaging";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard: only initialize when env vars are present.
// Prevents failures during Next.js static generation in builds without .env.local
export const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local"
    );
  }
  return getApps().length ? getExistingApp() : initializeApp(firebaseConfig);
}

// Lazy getters — called only in browser context (inside hooks / event handlers)
export function getAuthInstance() {
  return getAuth(getFirebaseApp());
}

export function getDbInstance() {
  return getFirestore(getFirebaseApp());
}

export const googleProvider = new GoogleAuthProvider();

// FCM — browser-only
export async function getMessagingInstance() {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(getFirebaseApp());
}
