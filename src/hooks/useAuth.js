import { useEffect, useCallback, useState } from 'react';
import {
  subscribeAuth,
  signInWithGoogle as fbSignInWithGoogle,
  signOutUser as fbSignOut,
  isFirebaseConfigured,
} from '../lib/firebase.js';
import { useAppStore } from '../store/appStore.js';

/**
 * Map a Firebase user to our compact stored shape.
 * @param {import('firebase/auth').User} fbUser
 * @returns {{uid:string, name:string, email:string|null, photoURL:string|null, provider:'google'}}
 */
function mapUser(fbUser) {
  return {
    uid: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || null,
    photoURL: fbUser.photoURL || null,
    provider: 'google',
  };
}

/**
 * Auth hook: keeps the store's `user` in sync with Firebase auth state and
 * exposes sign-in/out. Works even without Firebase config via a local "guest".
 * @returns {{user:object|null, loading:boolean, error:string|null, isFirebaseConfigured:boolean, signInWithGoogle:()=>Promise<boolean>, continueAsGuest:()=>void, signOut:()=>Promise<void>}}
 */
export function useAuth() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(null);

  // Sync Firebase → store (only authoritative when Firebase is configured).
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = subscribeAuth((fbUser) => {
      if (fbUser) setUser(mapUser(fbUser));
      else if (useAppStore.getState().user?.provider === 'google') setUser(null);
      setLoading(false);
    });
    return unsub;
  }, [setUser]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const fbUser = await fbSignInWithGoogle();
      setUser(mapUser(fbUser));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [setUser]);

  const continueAsGuest = useCallback(() => {
    setUser({
      uid: `guest-${Date.now()}`,
      name: 'Guest',
      email: null,
      photoURL: null,
      provider: 'guest',
    });
  }, [setUser]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await fbSignOut();
    } finally {
      setUser(null);
    }
  }, [setUser]);

  return {
    user,
    loading,
    error,
    isFirebaseConfigured,
    signInWithGoogle,
    continueAsGuest,
    signOut,
  };
}
