import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase.js';
import { validateReportNote } from '../lib/validation.js';

const LOCAL_KEY = 'monsoonmitra_reports_local';
const COLLECTION = 'hazard_reports';

/** Read local-only reports. */
function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Corrupt/unavailable storage — treat as "no local reports".
    return [];
  }
}

/**
 * Community hazard reports with a live Firestore listener, or a clearly-labeled
 * localStorage fallback when Firebase isn't configured.
 * @returns {{reports: import('../types/index.js').HazardReport[], isShared: boolean, addReport: Function, loading: boolean, error: string|null}}
 */
export function useCommunityReports() {
  const isShared = isFirebaseConfigured && Boolean(db);
  const [reports, setReports] = useState(() => (isShared ? [] : loadLocal()));
  const [loading, setLoading] = useState(isShared);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isShared) return;
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            type: d.type,
            note: d.note || '',
            lat: d.lat,
            lng: d.lng,
            photo: d.photo || null,
            createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : d.createdAt || Date.now(),
          };
        });
        setReports(rows);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [isShared]);

  const addReport = useCallback(
    /** @param {Omit<import('../types/index.js').HazardReport,'id'|'createdAt'>} report */
    async (report) => {
      // Enforce the note length cap at the data layer so both the shared
      // (Firestore) and local paths store sanitized, bounded text.
      const safeReport = { ...report, note: validateReportNote(report.note).value };
      if (isShared) {
        await addDoc(collection(db, COLLECTION), {
          ...safeReport,
          createdAt: serverTimestamp(),
        });
        return;
      }
      // Local-only fallback
      const next = [
        { ...safeReport, id: `${Date.now()}`, createdAt: Date.now() },
        ...loadLocal(),
      ].slice(0, 200);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      setReports(next);
    },
    [isShared]
  );

  return { reports, isShared, addReport, loading, error };
}
