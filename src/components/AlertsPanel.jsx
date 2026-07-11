import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { requestNotificationPermission } from '../hooks/useAlertsEngine.js';
import RiskBadge from './ui/RiskBadge.jsx';
import Button from './ui/Button.jsx';

function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Alert history + notification permission control. */
export default function AlertsPanel() {
  const { t } = useTranslation();
  const { lastCheckedAt, checking } = useAppStore((s) => s.alertsStatus);
  const alertHistory = useAppStore((s) => s.alertHistory);
  const clearAlerts = useAppStore((s) => s.clearAlerts);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const enable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setNotificationsEnabled(result === 'granted');
  };

  return (
    <div className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold">
          🔔 {t('alerts.title')}
          {checking && (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          )}
        </h2>
        {permission === 'granted' && notificationsEnabled ? (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300">
            ✓ {t('alerts.enabled')}
          </span>
        ) : permission === 'denied' ? (
          <span className="text-xs text-ink-500 dark:text-ink-400">{t('alerts.denied')}</span>
        ) : (
          <Button variant="secondary" onClick={enable} className="!py-1.5 text-xs">
            {t('alerts.enable')}
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">
        {t('alerts.monitoring')}
        {lastCheckedAt ? ` · ${timeAgo(lastCheckedAt)}` : ''}
      </p>

      {alertHistory.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 p-4 text-center text-sm text-ink-500 dark:text-ink-400 dark:border-ink-700">
          {t('alerts.none')}
        </p>
      ) : (
        <>
          <ul className="space-y-2">
            {alertHistory.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl border border-ink-200 p-3 dark:border-ink-700"
              >
                <RiskBadge level={a.severity} label={a.severity} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{a.message}</p>
                  <p className="mt-0.5 text-[11px] text-ink-500 dark:text-ink-400">
                    {timeAgo(a.firedAt)} · {a.trigger}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={clearAlerts}
            className="mt-3 text-xs font-medium text-ink-500 dark:text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
          >
            {t('alerts.clear')}
          </button>
        </>
      )}
    </div>
  );
}
