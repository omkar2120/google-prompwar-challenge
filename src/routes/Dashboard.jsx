import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { useWeather } from '../hooks/useWeather.js';
import { useWeatherInterpretation } from '../hooks/useWeatherInterpretation.js';
import { assessSeverity } from '../lib/openMeteo.js';
import { isGroqConfigured } from '../lib/groqClient.js';
import CurrentConditions from '../components/weather/CurrentConditions.jsx';
import WeatherChart from '../components/weather/WeatherChart.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import AlertsPanel from '../components/AlertsPanel.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import AiTag from '../components/ui/AiTag.jsx';
import Button from '../components/ui/Button.jsx';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/ui/States.jsx';

export default function Dashboard() {
  const { t } = useTranslation();
  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const [override, setOverride] = useState(null);

  const location = override || profile?.location || null;
  const { data: forecast, isLoading, isError, error, refetch, isFetching } = useWeather(location);

  const interpretation = useWeatherInterpretation(forecast, profile, language);

  if (!location) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-extrabold">{t('dashboard.title')}</h1>
        <EmptyState icon="📍" title={t('dashboard.noProfile')} />
        <LocationPicker value={override} onChange={setOverride} />
      </div>
    );
  }

  const severity = forecast ? assessSeverity(forecast) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t('dashboard.title')}</h1>
        <div className="flex items-center gap-3">
          {severity && <RiskBadge level={severity.level} label={severity.label} />}
          <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
            {t('dashboard.refresh')}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="card">
          <LoadingSkeleton lines={5} />
        </div>
      )}
      {isError && <ErrorState message={error?.message} onRetry={refetch} />}

      {forecast && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <CurrentConditions current={forecast.current} locationName={location.name} />

            <div className="card">
              <h2 className="mb-2 flex items-center gap-2">
                💡 {t('dashboard.whyThisMatters')}
              </h2>
              {!isGroqConfigured() ? (
                <p className="text-sm text-amber-700 dark:text-amber-400">{t('errors.noGroqKey')}</p>
              ) : interpretation.isLoading ? (
                <LoadingSkeleton lines={3} />
              ) : interpretation.isError ? (
                <ErrorState message={interpretation.error?.message} onRetry={interpretation.refetch} />
              ) : (
                <>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                    {interpretation.data}
                  </p>
                  <div className="mt-3">
                    <AiTag
                      model="gpt-oss-20b"
                      loading={interpretation.isFetching}
                      onRegenerate={() => interpretation.refetch()}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 font-bold">{t('dashboard.sevenDay')}</h2>
            <WeatherChart daily={forecast.daily} />
            <p className="mt-3 text-right text-xs text-ink-500 dark:text-ink-400">
              Open-Meteo · fetched {new Date(forecast.fetchedAt).toLocaleTimeString()}
            </p>
          </div>

          <AlertsPanel />
        </>
      )}
    </div>
  );
}
