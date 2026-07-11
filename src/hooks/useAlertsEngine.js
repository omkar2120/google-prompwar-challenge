import { useEffect, useRef, useCallback } from 'react';
import { fetchForecast, assessSeverity } from '../lib/openMeteo.js';
import { chatCompletion, MODELS, isGroqConfigured } from '../lib/groqClient.js';
import { buildAlertPrompt } from '../lib/prompts/index.js';
import { useAppStore } from '../store/appStore.js';

const POLL_INTERVAL_MS = 1000 * 60 * 20; // every 20 min while app is open

/**
 * Background alerts engine. Deterministically detects threshold crossings from
 * live Open-Meteo data, then uses the fast model ONLY to phrase the alert.
 * Fires a real browser Notification + records history.
 * @param {import('../types/index.js').GeoLocation|null} location
 * @param {string} language
 */
export function useAlertsEngine(location, language) {
  const addAlert = useAppStore((s) => s.addAlert);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setAlertsStatus = useAppStore((s) => s.setAlertsStatus);
  // Avoid re-firing the same-severity alert repeatedly in one session.
  const lastFiredLevel = useRef(null);

  const runCheck = useCallback(async () => {
    if (!location?.latitude) return;
    setAlertsStatus({ checking: true });
    try {
      const forecast = await fetchForecast(location.latitude, location.longitude);
      const severity = assessSeverity({ ...forecast, location });
      setAlertsStatus({ lastCheckedAt: Date.now() });

      const shouldFire =
        severity.level !== 'low' && severity.level !== lastFiredLevel.current;
      if (!shouldFire) return;
      lastFiredLevel.current = severity.level;

      // Phrase the alert with AI when a key is configured; otherwise fall back
      // to the deterministic label (never a fake "AI" string).
      let message = `${severity.label} expected in ${location.name}. Take precautions.`;
      if (isGroqConfigured()) {
        try {
          const aiRaw = await chatCompletion({
            model: MODELS.FAST,
            temperature: 0.5,
            maxTokens: 80,
            messages: [
              {
                role: 'system',
                content: buildAlertPrompt(language, {
                  location: location.name,
                  ...severity,
                }),
              },
              { role: 'user', content: 'Generate the alert sentence now.' },
            ],
          });
          // The model can return an empty string (e.g. reasoning-only output or
          // token truncation). Only adopt the AI phrasing when it's non-empty —
          // otherwise keep the deterministic fallback so we never fire a blank alert.
          const aiMessage = (aiRaw || '').replace(/^["']|["']$/g, '').trim();
          if (aiMessage) message = aiMessage;
        } catch {
          // keep deterministic fallback
        }
      }

      const record = {
        id: `${Date.now()}`,
        severity: severity.level,
        message,
        trigger: severity.triggers.join('; '),
        firedAt: Date.now(),
      };
      addAlert(record);

      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('MonsoonMitra Alert', { body: message, icon: '/icon.svg' });
        } catch {
          // Some browsers require ServiceWorkerRegistration.showNotification;
          // in-app banner (alert history) still captures it.
        }
      }
      return record;
    } catch {
      // Network hiccup — the next poll will retry. Don't spam errors.
    } finally {
      setAlertsStatus({ checking: false });
    }
  }, [location, language, addAlert, notificationsEnabled, setAlertsStatus]);

  useEffect(() => {
    if (!location?.latitude) return;
    runCheck();
    const id = setInterval(runCheck, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [location, runCheck]);

  return { runCheck };
}

/**
 * Request browser notification permission gracefully.
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}
