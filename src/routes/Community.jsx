import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { useCommunityReports } from '../hooks/useCommunityReports.js';
import { useCommunitySummary } from '../hooks/useCommunitySummary.js';
import { isGroqConfigured } from '../lib/groqClient.js';
import HazardMap from '../components/map/HazardMap.jsx';
import ReportForm from '../components/map/ReportForm.jsx';
import AiTag from '../components/ui/AiTag.jsx';
import { LoadingSkeleton, ErrorState } from '../components/ui/States.jsx';

// Default center: Mumbai (a canonical flood-prone Indian metro).
const DEFAULT_CENTER = [19.076, 72.8777];

export default function Community() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const logActivity = useAppStore((s) => s.logActivity);
  const { reports, isShared, addReport, loading, error } = useCommunityReports();
  const summary = useCommunitySummary(reports, language);

  const [pinned, setPinned] = useState(null);

  const submitReport = async (report) => {
    await addReport(report);
    logActivity('report', t('activity.report'));
    setPinned(null);
  };

  const center = profile?.location
    ? [profile.location.latitude, profile.location.longitude]
    : reports[0]
      ? [reports[0].lat, reports[0].lng]
      : DEFAULT_CENTER;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t('community.title')}</h1>
        <span
          className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${
            isShared
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {isShared ? `🌐 ${t('community.shared')}` : `📴 ${t('community.localOnly')}`}
        </span>
      </div>

      {/* AI situational summary */}
      <div className="card">
        <h2 className="mb-2 flex items-center gap-2 font-bold">🧭 {t('community.nearYou')}</h2>
        {!isGroqConfigured() ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">{t('errors.noGroqKey')}</p>
        ) : summary.isLoading ? (
          <LoadingSkeleton lines={2} />
        ) : summary.isError ? (
          <ErrorState message={summary.error?.message} onRetry={summary.refetch} />
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-300">{summary.data}</p>
            <div className="mt-3">
              <AiTag model="gpt-oss-20b" loading={summary.isFetching} onRegenerate={summary.refetch} />
            </div>
          </>
        )}
      </div>

      {loading && (
        <div className="card">
          <LoadingSkeleton lines={4} />
        </div>
      )}
      {error && <ErrorState message={error} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HazardMap reports={reports} center={center} pinned={pinned} onPick={setPinned} />
          {reports.length === 0 && !loading && (
            <p className="mt-2 text-center text-sm text-ink-400">{t('community.noReports')}</p>
          )}
        </div>
        <div className="card">
          <h2 className="mb-3 font-bold">{t('community.reportHazard')}</h2>
          <ReportForm pinnedLatLng={pinned} onSubmit={submitReport} onUseLocation={setPinned} />
        </div>
      </div>
    </div>
  );
}
