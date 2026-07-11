import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const PROFILE_KEY = 'monsoonmitra_profile';
const ALERTS_KEY = 'monsoonmitra_alerts';
const CHECKS_KEY = 'monsoonmitra_plan_checks';
const ACTIVITY_KEY = 'monsoonmitra_activity';

/**
 * Load a JSON value from localStorage safely.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Global app store: profile, language, theme, alert history, checklist state.
 * Server state (weather, AI responses) lives in React Query, not here.
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      /** @type {import('../types/index.js').HouseholdProfile|null} */
      profile: loadJSON(PROFILE_KEY, null),
      language: 'en',
      theme: 'dark',
      /** @type {import('../types/index.js').AlertRecord[]} */
      alertHistory: loadJSON(ALERTS_KEY, []),
      /** @type {Record<string, boolean>} keyed by plan item id */
      planChecks: loadJSON(CHECKS_KEY, {}),
      notificationsEnabled: false,
      alertsStatus: { lastCheckedAt: null, checking: false },

      /**
       * Current signed-in user. Either a Firebase Google user (mapped to a
       * small shape) or a local "guest" user. Null = signed out.
       * @type {{uid:string, name:string, email:string|null, photoURL:string|null, provider:'google'|'guest'}|null}
       */
      user: loadJSON('monsoonmitra_user', null),
      /** @type {{id:string, type:string, label:string, at:number}[]} */
      activity: loadJSON(ACTIVITY_KEY, []),

      /** @param {object|null} user */
      setUser: (user) => {
        if (user) localStorage.setItem('monsoonmitra_user', JSON.stringify(user));
        else localStorage.removeItem('monsoonmitra_user');
        set({ user });
      },

      /** Record an activity event for the history view. @param {string} type @param {string} label */
      logActivity: (type, label) =>
        set((s) => {
          const activity = [
            { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, label, at: Date.now() },
            ...s.activity,
          ].slice(0, 60);
          localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
          return { activity };
        }),

      clearActivity: () => {
        localStorage.setItem(ACTIVITY_KEY, JSON.stringify([]));
        set({ activity: [] });
      },

      /** @param {{lastCheckedAt?: number|null, checking?: boolean}} status */
      setAlertsStatus: (status) =>
        set((s) => ({ alertsStatus: { ...s.alertsStatus, ...status } })),

      /** @param {import('../types/index.js').HouseholdProfile} profile */
      setProfile: (profile) => {
        const withMeta = { ...profile, updatedAt: Date.now() };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(withMeta));
        set({ profile: withMeta, language: profile.language || get().language });
      },

      clearProfile: () => {
        localStorage.removeItem(PROFILE_KEY);
        set({ profile: null });
      },

      /** @param {string} language */
      setLanguage: (language) => set({ language }),

      toggleTheme: () =>
        set((s) => {
          const theme = s.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', theme === 'dark');
          return { theme };
        }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      /** @param {import('../types/index.js').AlertRecord} alert */
      addAlert: (alert) =>
        set((s) => {
          const alertHistory = [alert, ...s.alertHistory].slice(0, 50);
          localStorage.setItem(ALERTS_KEY, JSON.stringify(alertHistory));
          return { alertHistory };
        }),

      clearAlerts: () => {
        localStorage.setItem(ALERTS_KEY, JSON.stringify([]));
        set({ alertHistory: [] });
      },

      /** @param {string} id @param {boolean} checked */
      setPlanCheck: (id, checked) =>
        set((s) => {
          const planChecks = { ...s.planChecks, [id]: checked };
          localStorage.setItem(CHECKS_KEY, JSON.stringify(planChecks));
          return { planChecks };
        }),

      resetPlanChecks: () => {
        localStorage.setItem(CHECKS_KEY, JSON.stringify({}));
        set({ planChecks: {} });
      },
    }),
    {
      name: 'monsoonmitra_store',
      partialize: (s) => ({ language: s.language, theme: s.theme, notificationsEnabled: s.notificationsEnabled }),
    }
  )
);
