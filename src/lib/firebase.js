// Firebase powers two things: (1) Google sign-in (Auth) and (2) realtime
// community hazard reports (Firestore). If Firebase env vars are absent, the
// app transparently falls back to a "guest / local-only" mode so every feature
// still works on this device — we never falsely claim device-local data is
// shared community data, and Google sign-in surfaces a clear setup message.

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** @returns {boolean} Whether Firebase is fully configured. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let db = null;
let auth = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.error('Firebase init failed, falling back to guest/local mode:', err);
  }
}

/**
 * Subscribe to auth state changes. Returns an unsubscribe fn (no-op if Firebase
 * isn't configured).
 * @param {(user: import('firebase/auth').User|null) => void} cb
 * @returns {() => void}
 */
export function subscribeAuth(cb) {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

/**
 * Trigger Google sign-in via popup.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    throw new Error(
      'Google sign-in needs Firebase config. Add your VITE_FIREBASE_* keys to .env and enable the Google provider in the Firebase console.'
    );
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/** Sign the current user out. */
export async function signOutUser() {
  if (auth) await signOut(auth);
}

export { db, auth };
