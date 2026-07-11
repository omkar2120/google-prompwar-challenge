import { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore.js';
import { fetchForecast, assessSeverity, describeWeatherCode } from '../lib/openMeteo.js';
import { chatCompletionJSON, MODELS, isGroqConfigured } from '../lib/groqClient.js';
import { buildTravelAdvisoryPrompt } from '../lib/prompts/index.js';
import LocationPicker from '../components/LocationPicker.jsx';
import AiTag from '../components/ui/AiTag.jsx';
import Button from '../components/ui/Button.jsx';
import { LoadingSkeleton, LoadingState, ErrorState } from '../components/ui/States.jsx';

const REC_STYLES = {
  go: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300',
  delay: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  avoid: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

function CityConditions({ label, loc, forecast }) {
  const desc = describeWeatherCode(forecast.current.weathercode);
  const sev = assessSeverity(forecast);
  return (
    <div className="rounded-xl border border-ink-200 p-4 dark:border-ink-700">
      <p className="text-xs font-semibold uppercase text-ink-400">{label}</p>
      <p className="font-bold">{loc.name}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-3xl" aria-hidden="true">
          {desc.emoji}
        </span>
        <div>
          <div className="text-2xl font-extrabold">{Math.round(forecast.current.temperature_2m)}°</div>
          <div className="text-xs text-ink-500">{desc.label}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-ink-500">
        Rain today: {forecast.daily.precipitation_sum?.[0] ?? 0}mm · {sev.label}
      </div>
    </div>
  );
}

CityConditions.propTypes = {
  label: PropTypes.string,
  loc: PropTypes.object,
  forecast: PropTypes.object,
};

export default function Travel() {
  const { t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const logActivity = useAppStore((s) => s.logActivity);

  const [origin, setOrigin] = useState(profile?.location || null);
  const [destination, setDestination] = useState(null);
  const [when, setWhen] = useState('');
  const [mode, setMode] = useState('car');
  const [validationError, setValidationError] = useState(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const [originFc, destFc] = await Promise.all([
        fetchForecast(origin.latitude, origin.longitude),
        fetchForecast(destination.latitude, destination.longitude),
      ]);
      const summarize = (fc, loc) => ({
        location: loc.name,
        severity: assessSeverity({ ...fc, location: loc }).label,
        today: {
          rain_sum_mm: fc.daily.precipitation_sum?.[0],
          rain_probability_max: fc.daily.precipitation_probability_max?.[0],
          wind_max_kmh: fc.daily.windspeed_10m_max?.[0],
        },
        current: fc.current,
      });
      const advisory = await chatCompletionJSON({
        model: MODELS.REASONING,
        temperature: 0.4,
        messages: [
          { role: 'system', content: buildTravelAdvisoryPrompt(language) },
          {
            role: 'user',
            content: JSON.stringify({
              origin_weather: summarize(originFc, origin),
              destination_weather: summarize(destFc, destination),
              travel_mode: mode,
              travel_time: when || 'not specified',
            }),
          },
        ],
      });
      return { advisory, originFc, destFc };
    },
    onSuccess: () => logActivity('travel', t('activity.travel')),
  });

  // Keep the button always clickable and validate on submit so the user gets
  // clear, inline feedback instead of a silently-disabled button no-op.
  const pickOrigin = (loc) => {
    setOrigin(loc);
    setValidationError(null);
  };
  const pickDestination = (loc) => {
    setDestination(loc);
    setValidationError(null);
  };

  const handleSubmit = () => {
    if (!isGroqConfigured()) {
      setValidationError(t('errors.noGroqKey'));
      return;
    }
    if (!origin) {
      setValidationError(t('travel.needOrigin'));
      return;
    }
    if (!destination) {
      setValidationError(t('travel.needDestination'));
      return;
    }
    setValidationError(null);
    mutation.mutate();
  };

  const result = mutation.data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t('travel.title')}</h1>

      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('travel.origin')}</label>
            <LocationPicker value={origin} onChange={pickOrigin} showDetect />
          </div>
          <div>
            <label className="label">{t('travel.destination')}</label>
            <LocationPicker value={destination} onChange={pickDestination} showDetect={false} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('travel.when')}</label>
            <input
              type="datetime-local"
              className="input"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{t('travel.mode')}</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="car">{t('travel.car')}</option>
              <option value="bike">{t('travel.bike')}</option>
              <option value="transit">{t('travel.transit')}</option>
              <option value="walk">{t('travel.walk')}</option>
            </select>
          </div>
        </div>
        <Button onClick={handleSubmit} loading={mutation.isPending} className="w-full">
          {t('travel.getAdvisory')}
        </Button>
        {validationError && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
            {validationError}
          </p>
        )}
        {!isGroqConfigured() && <p className="text-xs text-amber-600">{t('errors.noGroqKey')}</p>}
      </div>

      {mutation.isPending && (
        <div className="card">
          <LoadingState />
          <LoadingSkeleton lines={4} className="mt-4 opacity-50" />
        </div>
      )}
      {mutation.isError && <ErrorState message={mutation.error?.message} onRetry={() => mutation.mutate()} />}

      {result && (
        <>
          <div className="card">
            <h2 className="mb-3 font-bold">{t('travel.conditions')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <CityConditions label={t('travel.origin')} loc={origin} forecast={result.originFc} />
              <CityConditions label={t('travel.destination')} loc={destination} forecast={result.destFc} />
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-bold uppercase ${REC_STYLES[result.advisory.recommendation] || REC_STYLES.delay}`}
              >
                {t(`travel.${result.advisory.recommendation}`)}
              </span>
              <AiTag model="gpt-oss-120b" loading={mutation.isPending} onRegenerate={() => mutation.mutate()} />
            </div>
            <p className="text-sm leading-relaxed text-ink-700 dark:text-ink-300">
              {result.advisory.reasoning}
            </p>

            {result.advisory.hazards?.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-bold">⚠️ {t('travel.hazards')}</h3>
                <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-400">
                  {result.advisory.hazards.map((h, i) => (
                    <li key={i}>▸ {h}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.advisory.what_to_carry?.length > 0 && (
              <div>
                <h3 className="mb-1 text-sm font-bold">🎒 {t('travel.whatToCarry')}</h3>
                <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-400">
                  {result.advisory.what_to_carry.map((h, i) => (
                    <li key={i}>▸ {h}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.advisory.better_time_suggestion && (
              <div className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-950 dark:text-brand-200">
                🕐 {t('travel.betterTime')}: {result.advisory.better_time_suggestion}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
